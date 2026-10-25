import socket
import json
import time
import uuid

from PyQt6.QtCore import QThread, pyqtSignal


class BotConnection(QThread):
    """Фоновый поток, держащий TCP-соединение с одним FarmAgent."""

    state_received      = pyqtSignal(str, dict)      # botId, state
    event_received      = pyqtSignal(str, dict)      # botId, event
    config_changed      = pyqtSignal(str, str, object)  # botId, key, value
    ack_received        = pyqtSignal(str, str)       # botId, cmd_id
    connection_lost     = pyqtSignal(str)            # botId
    connection_restored = pyqtSignal(str)            # botId

    def __init__(self, bot_id: str, host: str, port: int, parent=None):
        super().__init__(parent)
        self.bot_id = bot_id
        self.host = host
        self.port = port
        self._socket: socket.socket | None = None
        self._running = True
        self._connected = False
        self._last_state: dict = {}
        self._buffer = b""

    # ------------------------------------------------------------------ API

    @property
    def last_state(self) -> dict:
        return self._last_state

    @property
    def connected(self) -> bool:
        return self._connected

    def stop(self):
        self._running = False
        if self._socket:
            try:
                self._socket.shutdown(socket.SHUT_RDWR)
            except OSError:
                pass
            try:
                self._socket.close()
            except OSError:
                pass

    def send(self, obj: dict) -> bool:
        if not self._connected or not self._socket:
            return False
        try:
            data = (json.dumps(obj, ensure_ascii=False) + "\n").encode("utf-8")
            self._socket.sendall(data)
            return True
        except OSError:
            self._connected = False
            return False

    def send_command(self, action: str, **extra) -> bool:
        cmd = {
            "type": "command",
            "id": str(uuid.uuid4()),
            "action": action,
        }
        cmd.update(extra)
        return self.send(cmd)

    def ping(self):
        self.send({"type": "ping", "id": str(uuid.uuid4())})

    # --------------------------------------------------------------- thread

    def run(self):
        while self._running:
            try:
                self._socket = socket.create_connection(
                    (self.host, self.port), timeout=5
                )
                self._socket.settimeout(None)
                self._socket.setsockopt(socket.IPPROTO_TCP, socket.TCP_NODELAY, 1)
                self._connected = True
                self._buffer = b""
                self.connection_restored.emit(self.bot_id)
                self._read_loop()
            except (ConnectionRefusedError, OSError, socket.timeout):
                pass
            finally:
                was_connected = self._connected
                self._connected = False
                if was_connected:
                    self.connection_lost.emit(self.bot_id)

            # ждём перед реконнектом (но проверяем флаг остановки)
            for _ in range(int(5 / 0.1)):
                if not self._running:
                    return
                time.sleep(0.1)

    def _read_loop(self):
        try:
            while self._running:
                chunk = self._socket.recv(8192)
                if not chunk:
                    return
                self._buffer += chunk
                while b"\n" in self._buffer:
                    line, self._buffer = self._buffer.split(b"\n", 1)
                    line = line.strip()
                    if not line:
                        continue
                    try:
                        msg = json.loads(line.decode("utf-8"))
                    except (json.JSONDecodeError, UnicodeDecodeError):
                        continue
                    self._handle(msg)
        except (OSError, socket.timeout):
            return

    def _handle(self, msg: dict):
        mtype = msg.get("type")

        if mtype == "state":
            self._last_state = msg
            self.state_received.emit(self.bot_id, msg)

        elif mtype == "event":
            self.event_received.emit(self.bot_id, msg)

        elif mtype == "config_changed":
            self.config_changed.emit(
                self.bot_id,
                msg.get("key", ""),
                msg.get("value")
            )

        elif mtype == "ack":
            self.ack_received.emit(self.bot_id, msg.get("id", ""))

        elif mtype == "pong":
            pass  # можно логировать latency, если надо
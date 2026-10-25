import json
import socket
import time
import winsound
from pathlib import Path

from PyQt6.QtCore import Qt, QTimer
from PyQt6.QtGui import QColor, QFont
from PyQt6.QtWidgets import (
    QMainWindow, QWidget, QVBoxLayout, QHBoxLayout,
    QTableWidget, QTableWidgetItem, QSplitter, QTabWidget,
    QTextEdit, QPushButton, QMessageBox, QHeaderView,
)

from .bot_connection import BotConnection
from .control_panel import ControlPanel
from .ban_log import BanLogWidget
from .notifier import Notifier
from .stats_tab import StatsTab
from .web_graph import WebGraph
from .protocol import BASE_AGENT_PORT, STATE_TIMEOUT_SEC

DEFAULT_CONFIG = {
    "mainAccount": "MyMain",
    "autoPauseAllOnDanger": False,
    "autoScanOnStart": True,
    "autoScanPortStart": 25580,
    "autoScanPortEnd": 25600,
    "host": "127.0.0.1",
    "bots": [],
}

class MainWindow(QMainWindow):
    COLUMNS = ["Bot ID", "Ник", "Ур.", "HP", "Еда", "Хор.Книги", "Мусор", "Действие", "Статус"]

    def __init__(self, config_path: str = "config.json"):
        super().__init__()
        self.setWindowTitle("Farm+ Hub")
        self.resize(1300, 800)

        self.config_path = Path(config_path)
        self.config = self._load_config()

        self.main_account = self.config.get("mainAccount", "MyMain")
        self.bots: dict[str, BotConnection] = {}
        self.last_seen: dict[str, float] = {}
        
        self.web_graph = WebGraph() # Инициализация графа

        self.notifier = Notifier()
        self.notifier.terminate_requested.connect(self.terminate_bot)

        self._build_ui()
        self._connect_all_bots()

        self.watchdog = QTimer(self)
        self.watchdog.timeout.connect(self._check_stale_bots)
        self.watchdog.start(3000)

        if self.config.get("autoScanOnStart", True):
            QTimer.singleShot(2000, self._auto_scan)

    def _load_config(self) -> dict:
        if not self.config_path.exists():
            self.config_path.write_text(
                json.dumps(DEFAULT_CONFIG, indent=2, ensure_ascii=False),
                encoding="utf-8"
            )
            return dict(DEFAULT_CONFIG)
        try:
            data = json.loads(self.config_path.read_text(encoding="utf-8"))
            for k, v in DEFAULT_CONFIG.items():
                data.setdefault(k, v)
            return data
        except (json.JSONDecodeError, OSError) as e:
            print(f"[MainWindow] Ошибка чтения конфига: {e}")
            return dict(DEFAULT_CONFIG)

    def _build_ui(self):
        central = QWidget()
        self.setCentralWidget(central)
        root = QVBoxLayout(central)

        split = QSplitter(Qt.Orientation.Horizontal)

        left = QWidget()
        ll = QVBoxLayout(left)

        self.table = QTableWidget(0, len(self.COLUMNS))
        self.table.setHorizontalHeaderLabels(self.COLUMNS)
        self.table.horizontalHeader().setSectionResizeMode(QHeaderView.ResizeMode.Stretch)
        self.table.setSelectionBehavior(QTableWidget.SelectionBehavior.SelectRows)
        self.table.setEditTriggers(QTableWidget.EditTrigger.NoEditTriggers)
        self.table.setAlternatingRowColors(True)
        self.table.cellDoubleClicked.connect(self._on_row_double_click)
        ll.addWidget(self.table)

        btns = QHBoxLayout()
        b_start     = QPushButton("▶ Старт всех")
        b_stop      = QPushButton("⏸ Стоп всех")
        b_transfer  = QPushButton("💎 Опыт всем")
        b_graph     = QPushButton("📈 График в браузере") # НОВАЯ КНОПКА
        b_graph.setStyleSheet("background: #2196F3; color: white; font-weight: bold;")
        b_scan      = QPushButton("🔍 Найти ботов")
        b_terminate = QPushButton("☠ Терминировать")
        b_terminate.setStyleSheet("QPushButton{color:#c00;font-weight:bold;}")

        b_start.clicked.connect(lambda: self._broadcast("start_attack"))
        b_stop.clicked.connect(lambda: self._broadcast("stop_attack"))
        b_transfer.clicked.connect(self._broadcast_transfer_all)
        b_graph.clicked.connect(self._open_web_graph)
        b_scan.clicked.connect(self._auto_scan)
        b_terminate.clicked.connect(self._terminate_selected)

        btns.addWidget(b_start)
        btns.addWidget(b_stop)
        btns.addWidget(b_transfer)
        btns.addWidget(b_graph)
        btns.addWidget(b_scan)
        btns.addStretch()
        btns.addWidget(b_terminate)
        ll.addLayout(btns)

        split.addWidget(left)

        self.control = ControlPanel()
        self.control.set_main_account(self.main_account)
        self.control.command_requested.connect(self._on_command)
        self.control.terminate_requested.connect(self.terminate_bot)
        split.addWidget(self.control)
        split.setSizes([860, 440])

        root.addWidget(split, stretch=3)

        self.tabs = QTabWidget()

        self.log_view = QTextEdit()
        self.log_view.setReadOnly(True)
        self.log_view.setFont(QFont("Consolas", 9))
        self.tabs.addTab(self.log_view, "Логи")

        self.stats_tab = StatsTab()
        self.tabs.addTab(self.stats_tab, "📊 Статистика")

        self.ban_log = BanLogWidget()
        self.tabs.addTab(self.ban_log, "Инциденты")

        info = QTextEdit()
        info.setReadOnly(True)
        info.setPlainText(
            f"Основной аккаунт: {self.main_account}\n"
            f"Auto-scan on start: {self.config.get('autoScanOnStart', True)}\n"
            f"Диапазон скана: {self.config.get('autoScanPortStart')}–"
            f"{self.config.get('autoScanPortEnd')}\n"
            f"Хост: {self.config.get('host', '127.0.0.1')}\n"
            f"\nФайл конфига: {self.config_path.resolve()}"
        )
        self.tabs.addTab(info, "Инфо")

        root.addWidget(self.tabs, stretch=2)

    def _open_web_graph(self):
        # Берем бота, который выбран в таблице
        row = self.table.currentRow()
        if row < 0:
            QMessageBox.information(self, "Инфо", "Выбери бота в таблице, чтобы посмотреть его график.")
            return
        
        bot_id = self.table.item(row, 0).text()
        self.web_graph.open_graph(bot_id)
        self._log(f"📈 Открыт график для {bot_id} в браузере")

    def _connect_all_bots(self):
        for bot in self.config.get("bots", []):
            bot_id = bot.get("id")
            host = bot.get("host", self.config.get("host", "127.0.0.1"))
            port = bot.get("port")
            if not bot_id or not port: continue
            self._add_bot(bot_id, host, port)

    def _add_bot(self, bot_id: str, host: str, port: int):
        if bot_id in self.bots: return
        conn = BotConnection(bot_id, host, port, self)
        conn.state_received.connect(self._on_state)
        conn.event_received.connect(self._on_event)
        conn.config_changed.connect(self._on_config_changed)
        conn.connection_lost.connect(lambda bid: self._log(f"⚠ {bid}: соединение потеряно"))
        conn.connection_restored.connect(lambda bid: self._log(f"✔ {bid}: соединение восстановлено"))
        conn.ack_received.connect(lambda bid, cid: self._log(f"✓ {bid}: команда {cid[:8]}… выполнена"))
        conn.start()
        self.bots[bot_id] = conn
        self._log(f"→ Подключаюсь к {bot_id} ({host}:{port})")

    def _auto_scan(self):
        host = self.config.get("host", "127.0.0.1")
        ps = int(self.config.get("autoScanPortStart", 25580))
        pe = int(self.config.get("autoScanPortEnd", 25600))

        self._log(f"🔍 Сканирую {host}:{ps}–{pe}…")
        found = self._scan_ports(host, ps, pe)

        if not found:
            self._log("🔍 Активных агентов не найдено")
            return

        added = 0
        for port in found:
            bot_id = f"bot_{port}"
            if bot_id in self.bots: continue
            self._add_bot(bot_id, host, port)
            self._log(f"🔍 Найден агент на {host}:{port} → {bot_id}")
            added += 1

        if added: self._log(f"🔍 Добавлено ботов: {added}")

    @staticmethod
    def _scan_ports(host: str, port_start: int, port_end: int) -> list:
        found = []
        for port in range(port_start, port_end + 1):
            try:
                s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                s.settimeout(0.15)
                s.connect((host, port))
                s.close()
                found.append(port)
            except (OSError, socket.timeout): continue
        return found

    def _ensure_row(self, bot_id: str) -> int:
        for r in range(self.table.rowCount()):
            if self.table.item(r, 0).text() == bot_id: return r
        r = self.table.rowCount()
        self.table.insertRow(r)
        self.table.setItem(r, 0, QTableWidgetItem(bot_id))
        for c in range(1, len(self.COLUMNS)):
            self.table.setItem(r, c, QTableWidgetItem("—"))
        return r

    def _find_row(self, bot_id: str) -> int:
        for r in range(self.table.rowCount()):
            if self.table.item(r, 0).text() == bot_id: return r
        return -1

    def _on_state(self, bot_id: str, state: dict):
        self.last_seen[bot_id] = time.time()
        r = self._ensure_row(bot_id)

        stats = state.get("stats", {}) or {}
        counters = stats.get("counters", {}) or {}
        current_books = state.get("current_books", {}) or {}

        books_good = counters.get("books_good", 0)
        books_trash = counters.get("books_trash", 0)
        
        # Обновляем данные для графика
        self.web_graph.update_history(bot_id, books_good, books_trash, current_books)

        cols = {
            1: state.get("username", "—"),
            2: str(state.get("level", 0)),
            3: f"{state.get('hp', 0):.1f}",
            4: str(state.get("food", 0)),
            5: str(books_good),
            6: str(books_trash),
            7: state.get("current_action", "IDLE"),
            8: self._status_text(state),
        }
        for c, v in cols.items():
            item = self.table.item(r, c)
            if item is None:
                item = QTableWidgetItem()
                self.table.setItem(r, c, item)
            item.setText(v)

        good_item = self.table.item(r, 5)
        if good_item and books_good > 0:
            good_item.setForeground(QColor("#44dd44"))
        else:
            good_item.setForeground(QColor("#ffffff"))

        trash_item = self.table.item(r, 6)
        if trash_item:
            trash_item.setForeground(QColor("#ff4444"))

        status_item = self.table.item(r, 8)
        status = cols[8]
        color = "#44dd44"
        if "🔴" in status: color = "#ff4444"
        elif "🟠" in status: color = "#ff9900"
        elif "🟡" in status: color = "#dddd00"
        elif "⚫" in status: color = "#888888"
        status_item.setForeground(QColor(color))

        self.stats_tab.on_state(bot_id, state)
        self.control.on_state(bot_id, state)

    def _on_row_double_click(self, row: int, _col: int):
        bot_id = self.table.item(row, 0).text()
        conn = self.bots.get(bot_id)
        if conn:
            self.control.select_bot(bot_id, conn.last_state)
            self._log(f"→ Выбран бот {bot_id}")

    @staticmethod
    def _status_text(s: dict) -> str:
        hp = s.get("hp", 20)
        food = s.get("food", 20)
        if hp < 8: return "🟠 НИЗКОЕ HP"
        if food < 10: return "🟡 ГОЛОДЕН"
        return "🟢 OK"

    def _on_command(self, bot_id: str, action: str, extra: dict):
        conn = self.bots.get(bot_id)
        if not conn: return
        if not conn.connected:
            self._log(f"⚠ {bot_id}: нет соединения, команда '{action}' пропущена")
            return
        conn.send_command(action, **extra)
        self._log(f"→ {bot_id}: {action} {extra if extra else ''}")

    def _broadcast(self, action: str, **extra):
        sent = 0
        for conn in self.bots.values():
            if conn.connected and conn.send_command(action, **extra):
                sent += 1
        self._log(f"HUB: '{action}' → {sent} ботов")

    def _broadcast_transfer_all(self):
        count = 0
        for bot_id, conn in self.bots.items():
            if not conn.connected: continue
            lvl = conn.last_state.get("level", 0)
            threshold = conn.last_state.get("expThreshold", 50)
            if lvl >= threshold:
                amount = max(1, lvl - 5)
                conn.send_command("transfer_exp", target=self.main_account, amount=amount)
                self._log(f"HUB: {bot_id} → передача {amount} опыта")
                count += 1
        if count == 0: self._log("HUB: некому передавать (уровень ниже порога)")

    def _terminate_selected(self):
        row = self.table.currentRow()
        if row < 0:
            QMessageBox.information(self, "Инфо", "Выбери бота в таблице")
            return
        bot_id = self.table.item(row, 0).text()
        r = QMessageBox.warning(
            self, "Подтверждение", f"Терминировать бота {bot_id}?",
            QMessageBox.StandardButton.Yes | QMessageBox.StandardButton.No
        )
        if r == QMessageBox.StandardButton.Yes:
            self.terminate_bot(bot_id)

    def _on_event(self, bot_id: str, event: dict):
        lvl = event.get("level", "info")
        msg = event.get("msg", "")
        prefix = {"info": "ℹ", "warn": "⚠", "error": "✖", "danger": "🚨"}
        tag = prefix.get(lvl, "•")
        self._log(f"{tag} {bot_id}: {msg}")

        if lvl in ("error", "danger"):
            try: winsound.Beep(1000, 500)
            except Exception: pass

        if lvl == "danger":
            self.ban_log.add_incident(bot_id, msg, category="danger")
            self.notifier.show_ban_alert(bot_id, msg)
            if self.config.get("autoPauseAllOnDanger", False):
                self._broadcast("stop_attack")
                self._log("HUB: автопауза всех ботов (danger)")
        elif lvl == "error":
            self.ban_log.add_incident(bot_id, msg, category="error")

    def _on_config_changed(self, bot_id: str, key: str, value):
        self._log(f"⚙ {bot_id}: {key} = {value}")
        self.control.on_config_changed(bot_id, key, value)

    def terminate_bot(self, bot_id: str):
        conn = self.bots.get(bot_id)
        if not conn: return
        if conn.connected:
            conn.send_command("terminate")
            self._log(f"☠ HUB: отправлена терминация {bot_id}")
        else:
            self._log(f"☠ {bot_id}: соединения нет, удаляю из списка")
        QTimer.singleShot(2500, lambda: self._remove_bot_row(bot_id))

    def _remove_bot_row(self, bot_id: str):
        r = self._find_row(bot_id)
        if r >= 0: self.table.removeRow(r)
        conn = self.bots.pop(bot_id, None)
        if conn:
            conn.stop()
            conn.wait(1500)
        self.notifier.clear(bot_id)
        self.stats_tab.remove_bot(bot_id)
        if self.control._bot_id == bot_id: self.control.clear()
        self._log(f"☠ HUB: {bot_id} удалён из списка")

    def _check_stale_bots(self):
        now = time.time()
        for bot_id, last in list(self.last_seen.items()):
            if now - last > STATE_TIMEOUT_SEC:
                r = self._find_row(bot_id)
                if r >= 0:
                    item = self.table.item(r, 8)
                    if item and "НЕТ ДАННЫХ" not in item.text():
                        item.setText("⚫ НЕТ ДАННЫХ")
                        item.setForeground(QColor("#888888"))
                        self._log(f"⚠ {bot_id}: нет state >{STATE_TIMEOUT_SEC}с")

    def _log(self, text: str):
        ts = time.strftime("%H:%M:%S")
        self.log_view.append(f"[{ts}] {text}")

    def closeEvent(self, event):
        for conn in self.bots.values():
            conn.stop()
        for conn in self.bots.values():
            if not conn.wait(2000):
                conn.terminate()
                conn.wait(500)
        event.accept()
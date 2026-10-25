"""
Windows toast с кнопкой «Терминировать бота».

Использует windows-toasts (WinRT API).
Кнопка активируется через InteractableWindowsToaster — работает,
пока Python-процесс жив.
"""

from PyQt6.QtCore import QObject, pyqtSignal

try:
    from windows_toasts import (
        InteractableWindowsToaster, Toast, ToastButton,
        ToastDuration, ToastScenario,
    )
    TOASTS_AVAILABLE = True
except ImportError:
    TOASTS_AVAILABLE = False


class Notifier(QObject):
    terminate_requested = pyqtSignal(str)  # botId

    def __init__(self, parent=None):
        super().__init__(parent)
        self._toaster = None
        self._active_toasts: dict[str, Toast] = {}

        if TOASTS_AVAILABLE:
            try:
                self._toaster = InteractableWindowsToaster("FarmPlus")
            except Exception as e:
                print(f"[Notifier] Не удалось создать тостер: {e}")
                self._toaster = None

    def show_ban_alert(self, bot_id: str, reason: str):
        if not self._toaster:
            print(f"[TOAST-FALLBACK] {bot_id}: {reason}")
            return

        reason_trunc = reason[:200]

        toast = Toast(
            text_fields=[
                "🚨 FARM+ ВНИМАНИЕ",
                f"Бот {bot_id} под угрозой бана!",
                reason_trunc,
            ],
            scenario=ToastScenario.Urgent,
            duration=ToastDuration.Long,
        )

        toast.AddAction(ToastButton(
            content="☠ Терминировать бота",
            arguments=f"terminate:{bot_id}",
        ))
        toast.AddAction(ToastButton(
            content="Игнор",
            arguments=f"ignore:{bot_id}",
        ))

        def on_activated(args: str):
            if args.startswith("terminate:"):
                self.terminate_requested.emit(bot_id)

        toast.on_activated = on_activated
        self._active_toasts[bot_id] = toast

        try:
            self._toaster.show_toast(toast)
        except Exception as e:
            print(f"[Notifier] Ошибка показа toast: {e}")

    def clear(self, bot_id: str):
        self._active_toasts.pop(bot_id, None)
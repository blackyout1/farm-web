from datetime import datetime

from PyQt6.QtWidgets import (
    QWidget, QVBoxLayout, QHBoxLayout, QListWidget,
    QListWidgetItem, QPushButton, QFileDialog, QMessageBox
)


class BanLogWidget(QWidget):
    """Вкладка истории инцидентов (баны, заходы модераторов и т.п.)."""

    def __init__(self, parent=None):
        super().__init__(parent)
        layout = QVBoxLayout(self)

        self.list = QListWidget()
        layout.addWidget(self.list)

        btn_row = QHBoxLayout()
        btn_save = QPushButton("💾 Сохранить в файл")
        btn_save.clicked.connect(self._save_to_file)
        btn_clear = QPushButton("🗑 Очистить")
        btn_clear.clicked.connect(self._clear)
        btn_row.addStretch()
        btn_row.addWidget(btn_save)
        btn_row.addWidget(btn_clear)
        layout.addLayout(btn_row)

    def add_incident(self, bot_id: str, msg: str, category: str = "danger"):
        ts = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        text = f"[{ts}] [{category.upper()}] {bot_id} — {msg}"
        item = QListWidgetItem(text)
        self.list.insertItem(0, item)

    def _save_to_file(self):
        path, _ = QFileDialog.getSaveFileName(
            self, "Сохранить историю инцидентов",
            "farmplus_incidents.txt", "Text files (*.txt)"
        )
        if not path:
            return
        try:
            with open(path, "w", encoding="utf-8") as f:
                for i in range(self.list.count()):
                    f.write(self.list.item(i).text() + "\n")
            QMessageBox.information(self, "Готово",
                                    f"Сохранено {self.list.count()} записей")
        except OSError as e:
            QMessageBox.critical(self, "Ошибка", str(e))

    def _clear(self):
        r = QMessageBox.question(
            self, "Подтверждение",
            "Очистить всю историю инцидентов?"
        )
        if r == QMessageBox.StandardButton.Yes:
            self.list.clear()
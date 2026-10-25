from PyQt6.QtCore import Qt
from PyQt6.QtGui import QColor, QFont
from PyQt6.QtWidgets import (
    QWidget, QVBoxLayout, QHBoxLayout, QLabel, QComboBox,
    QTableWidget, QTableWidgetItem, QHeaderView, QTabWidget, QFrame
)


class StatsTab(QWidget):
    """Вкладка статистики: сводка по зачарованиям и текущие книги."""

    def __init__(self, parent=None):
        super().__init__(parent)
        self._states: dict[str, dict] = {}
        self._build_ui()

    def _build_ui(self):
        root = QVBoxLayout(self)
        root.setSpacing(10)

        # Селектор бота
        top = QHBoxLayout()
        top.addWidget(QLabel("Бот:"))
        self.bot_selector = QComboBox()
        self.bot_selector.setMinimumWidth(220)
        self.bot_selector.currentTextChanged.connect(self._on_bot_changed)
        top.addWidget(self.bot_selector)
        top.addStretch()

        self.summary_label = QLabel("Время работы: —")
        self.summary_label.setFont(QFont("Segoe UI", 10))
        top.addWidget(self.summary_label)
        root.addLayout(top)

        # Блок краткой статистики
        stats_frame = QFrame()
        stats_frame.setStyleSheet("background: #2b2b2b; border-radius: 5px; padding: 5px;")
        stats_layout = QHBoxLayout(stats_frame)
        
        self.lbl_good = QLabel("✅ Ценных: 0")
        self.lbl_good.setStyleSheet("color: #4CAF50; font-weight: bold; font-size: 14px;")
        
        self.lbl_trash = QLabel("❌ Мусора: 0")
        self.lbl_trash.setStyleSheet("color: #F44336; font-weight: bold; font-size: 14px;")
        
        self.lbl_enchants = QLabel("✨ Зачаровано всего: 0")
        self.lbl_enchants.setStyleSheet("color: #2196F3; font-weight: bold; font-size: 14px;")
        
        stats_layout.addWidget(self.lbl_good)
        stats_layout.addWidget(self.lbl_trash)
        stats_layout.addWidget(self.lbl_enchants)
        stats_layout.addStretch()
        root.addWidget(stats_frame)

        # Вкладки с таблицами
        self.tables = QTabWidget()

        # Вкладка 1: Текущие ценные книги
        self.table_books = self._make_table(["Название книги", "Количество"])
        self.tables.addTab(self.table_books, "📚 Ценные книги (Сейчас)")

        # Вкладка 2: Убийства (для фарм-бота, если используется)
        self.table_kills = self._make_table(["Моб", "Убито"])
        self.tables.addTab(self.table_kills, "⚔️ Убийства")

        root.addWidget(self.tables)

    @staticmethod
    def _make_table(headers: list) -> QTableWidget:
        t = QTableWidget(0, len(headers))
        t.setHorizontalHeaderLabels(headers)
        t.horizontalHeader().setSectionResizeMode(QHeaderView.ResizeMode.Stretch)
        t.setEditTriggers(QTableWidget.EditTrigger.NoEditTriggers)
        t.setSelectionBehavior(QTableWidget.SelectionBehavior.SelectRows)
        t.setAlternatingRowColors(True)
        return t

    def on_state(self, bot_id: str, state: dict):
        self._states[bot_id] = state

        if self.bot_selector.findText(bot_id) < 0:
            self.bot_selector.addItem(bot_id)
            if self.bot_selector.count() == 1:
                self.bot_selector.setCurrentIndex(0)

        if self.bot_selector.currentText() == bot_id:
            self._refresh(bot_id)

    def remove_bot(self, bot_id: str):
        self._states.pop(bot_id, None)
        idx = self.bot_selector.findText(bot_id)
        if idx >= 0:
            self.bot_selector.removeItem(idx)

    def _on_bot_changed(self, bot_id: str):
        if bot_id:
            self._refresh(bot_id)

    def _refresh(self, bot_id: str):
        state = self._states.get(bot_id) or {}
        stats = state.get("stats", {}) or {}
        counters = stats.get("counters", {}) or {}
        kills = stats.get("kills", {}) or {}
        current_books = state.get("current_books", {}) or {}

        # Сводка
        good_total = counters.get("books_good", 0)
        trash_total = counters.get("books_trash", 0)
        enchanted_total = good_total + trash_total
        
        self.lbl_good.setText(f"✅ Ценных: {good_total}")
        self.lbl_trash.setText(f"❌ Мусора: {trash_total}")
        self.lbl_enchants.setText(f"✨ Зачаровано всего: {enchanted_total}")

        uptime = stats.get("uptime", 0)
        h, rem = divmod(int(uptime), 3600)
        m, s = divmod(rem, 60)
        self.summary_label.setText(f"Время работы: {h:02d}:{m:02d}:{s:02d}")

        # Текущие ценные книги в инвентаре
        self.table_books.setRowCount(0)
        for name, count in current_books.items():
            row = self.table_books.rowCount()
            self.table_books.insertRow(row)
            
            item_name = QTableWidgetItem(name)
            item_count = QTableWidgetItem(str(count))
            item_count.setTextAlignment(Qt.AlignmentFlag.AlignRight | Qt.AlignmentFlag.AlignVCenter)
            
            # Подсвечиваем самые дорогие
            lower_name = name.lower()
            if "mending" in lower_name or "починка" in lower_name:
                item_name.setForeground(QColor("#4CAF50")) # Зеленый
            elif "efficiency" in lower_name and ("v" in lower_name or "5" in lower_name):
                item_name.setForeground(QColor("#00BCD4")) # Голубой
                
            self.table_books.setItem(row, 0, item_name)
            self.table_books.setItem(row, 1, item_count)

        # Убийства
        self.table_kills.setRowCount(0)
        for mob, count in sorted(kills.items(), key=lambda kv: -kv[1]):
            row = self.table_kills.rowCount()
            self.table_kills.insertRow(row)
            self.table_kills.setItem(row, 0, QTableWidgetItem(mob))
            self.table_kills.setItem(row, 1, QTableWidgetItem(str(count)))
from PyQt6.QtCore import pyqtSignal, Qt
from PyQt6.QtGui import QFont
from PyQt6.QtWidgets import (
    QWidget, QVBoxLayout, QHBoxLayout, QLabel, QCheckBox,
    QSpinBox, QPushButton, QGroupBox, QMessageBox, QFrame, QTabWidget, QLineEdit, QComboBox
)
from .whitelist_dialog import WhitelistDialog

class ControlPanel(QWidget):
    command_requested = pyqtSignal(str, str, dict)
    terminate_requested = pyqtSignal(str)

    def __init__(self, parent=None):
        super().__init__(parent)
        self._bot_id = None
        self._main_account = "MyMain"
        self._building = False
        self._current_whitelist = ""
        self._build_ui()
        self._set_enabled(False)

    def _build_ui(self):
        layout = QVBoxLayout(self)
        layout.setSpacing(8)

        self.title = QLabel("Бот не выбран")
        f = QFont(); f.setBold(True); f.setPointSize(11)
        self.title.setFont(f)
        layout.addWidget(self.title)

        self.status_label = QLabel("Статус: Ожидание")
        self.status_label.setStyleSheet("color: #888; font-style: italic;")
        layout.addWidget(self.status_label)

        self.tabs = QTabWidget()
        
        # ================= ВКЛАДКА ФАРМ =================
        farm_tab = QWidget()
        fl = QVBoxLayout(farm_tab)
        
        self.cb_attack = QCheckBox("Авто-атака")
        self.cb_invis = QCheckBox("Авто-инвиз")
        self.cb_food = QCheckBox("Авто-еда")
        self.cb_exp = QCheckBox("Передача опыта")
        for cb in (self.cb_attack, self.cb_invis, self.cb_food, self.cb_exp):
            fl.addWidget(cb)
            cb.toggled.connect(self._on_module_toggle)
            
        row_food = QHBoxLayout()
        row_food.addWidget(QLabel("Порог еды:"))
        self.sp_food = QSpinBox(); self.sp_food.setRange(1, 20)
        self.sp_food.valueChanged.connect(lambda v: self._send_config("foodThreshold", v))
        row_food.addWidget(self.sp_food); row_food.addStretch()
        fl.addLayout(row_food)
        fl.addStretch()
        self.tabs.addTab(farm_tab, "⚔️ Фарм")

        # ================= ВКЛАДКА ЗАЧАРОВАНИЕ =================
        ench_tab = QWidget()
        el = QVBoxLayout(ench_tab)
        
        self.cb_enchant = QCheckBox("Авто-зачарование")
        self.cb_enchant.toggled.connect(self._on_module_toggle)
        el.addWidget(self.cb_enchant)

        # НОВАЯ ГАЛОЧКА АВТО-СОРТИРОВКИ
        self.cb_auto_sort = QCheckBox("Авто-сортировка (фоновая)")
        self.cb_auto_sort.toggled.connect(self._on_module_toggle)
        el.addWidget(self.cb_auto_sort)

        self.resource_label = QLabel("📦 Лазурит: — | Книги: — | Опыт: —")
        self.resource_label.setStyleSheet("color: #aaa; font-weight: bold;")
        el.addWidget(self.resource_label)

        row_ench_lvl = QHBoxLayout()
        row_ench_lvl.addWidget(QLabel("Кнопка зачарования:"))
        self.cb_ench_lvl = QComboBox()
        self.cb_ench_lvl.addItems(["Максимальный (30)", "Средний (20)", "Минимальный (10)"])
        self.cb_ench_lvl.currentIndexChanged.connect(lambda idx: self._send_config("enchant_button_index", idx))
        row_ench_lvl.addWidget(self.cb_ench_lvl)
        row_ench_lvl.addStretch()
        el.addLayout(row_ench_lvl)

        row_an = QHBoxLayout()
        row_an.addWidget(QLabel("Анархия (Фарм):"))
        self.tf_an_farm = QLineEdit(); self.tf_an_farm.setPlaceholderText("1")
        self.tf_an_farm.editingFinished.connect(lambda: self._send_config("anarchy_farm", self.tf_an_farm.text()))
        row_an.addWidget(self.tf_an_farm)
        
        row_an.addWidget(QLabel("Мусор:"))
        self.tf_an_trash = QLineEdit(); self.tf_an_trash.setPlaceholderText("2")
        self.tf_an_trash.editingFinished.connect(lambda: self._send_config("anarchy_trash", self.tf_an_trash.text()))
        row_an.addWidget(self.tf_an_trash)
        el.addLayout(row_an)

        row_trash = QHBoxLayout()
        row_trash.addWidget(QLabel("Лимит мусора:"))
        self.sp_trash = QSpinBox(); self.sp_trash.setRange(5, 35)
        self.sp_trash.valueChanged.connect(lambda v: self._send_config("trash_limit", v))
        row_trash.addWidget(self.sp_trash); row_trash.addStretch()
        el.addLayout(row_trash)

        self.btn_whitelist = QPushButton("⚙ Настроить список зачарований (Поиск)")
        self.btn_whitelist.setStyleSheet("padding: 8px; font-weight: bold; background: #333; color: white;")
        self.btn_whitelist.clicked.connect(self._open_whitelist_dialog)
        el.addWidget(self.btn_whitelist)
        
        self.lbl_whitelist_status = QLabel("Активных порогов: 0 | Мусор: 0/20")
        self.lbl_whitelist_status.setStyleSheet("color: #aaa;")
        el.addWidget(self.lbl_whitelist_status)

        el.addStretch()
        self.tabs.addTab(ench_tab, "✨ Зачарование")

        layout.addWidget(self.tabs)

        line = QFrame(); line.setFrameShape(QFrame.Shape.HLine); layout.addWidget(line)

        self.btn_terminate = QPushButton("☠ ТЕРМИНИРОВАТЬ БОТА")
        self.btn_terminate.setStyleSheet(
            "QPushButton{background:#8B0000;color:white;font-weight:bold;padding:8px;}"
            "QPushButton:hover{background:#B22222;}"
            "QPushButton:disabled{background:#444;color:#888;}"
        )
        self.btn_terminate.clicked.connect(self._on_terminate)
        layout.addWidget(self.btn_terminate)

    def _open_whitelist_dialog(self):
        if not self._bot_id: return
        dialog = WhitelistDialog(self._current_whitelist, self)
        if dialog.exec():
            new_wl = dialog.get_result_string()
            self._current_whitelist = new_wl
            self._send_config("enchant_whitelist", new_wl)
            self._update_status_label()

    def set_main_account(self, nick: str):
        self._main_account = nick

    def select_bot(self, bot_id: str, state: dict):
        self._bot_id = bot_id
        self.title.setText(f"Бот: {bot_id}")
        self._set_enabled(True)
        self._apply_state(state)

    def on_state(self, bot_id: str, state: dict):
        if bot_id != self._bot_id: return
        action = state.get("current_action", "IDLE")
        self.status_label.setText(f"Статус: {action}")
        self._apply_state(state, full=False)

    def on_config_changed(self, bot_id: str, key: str, value):
        if bot_id != self._bot_id: return
        self._building = True
        try:
            mapping = {
                "module_attack": self.cb_attack,
                "module_invis": self.cb_invis,
                "module_food": self.cb_food,
                "module_exp": self.cb_exp,
                "module_enchant": self.cb_enchant,
                "module_auto_sort": self.cb_auto_sort # НОВОЕ
            }
            if key in mapping:
                cb = mapping[key]; cb.blockSignals(True); cb.setChecked(bool(value)); cb.blockSignals(False)
            elif key == "foodThreshold":
                self.sp_food.blockSignals(True); self.sp_food.setValue(int(value)); self.sp_food.blockSignals(False)
            elif key == "trash_limit":
                self.sp_trash.blockSignals(True); self.sp_trash.setValue(int(value)); self.sp_trash.blockSignals(False)
                self._update_status_label()
            elif key == "anarchy_farm":
                self.tf_an_farm.setText(str(value))
            elif key == "anarchy_trash":
                self.tf_an_trash.setText(str(value))
            elif key == "enchant_whitelist":
                self._current_whitelist = str(value)
                self._update_status_label()
            elif key == "enchant_button_index":
                self.cb_ench_lvl.blockSignals(True)
                self.cb_ench_lvl.setCurrentIndex(int(value))
                self.cb_ench_lvl.blockSignals(False)
        finally:
            self._building = False

    def clear(self):
        self._bot_id = None
        self.title.setText("Бот не выбран")
        self._set_enabled(False)

    def _update_status_label(self):
        count = len(self._current_whitelist.split(',')) if self._current_whitelist else 0
        self.lbl_whitelist_status.setText(f"Активных порогов: {count}")

    def _apply_state(self, state: dict, full: bool = True):
        if not state: return
        self._building = True
        try:
            modules = state.get("modules", [])
            for cb, name in [(self.cb_attack, "attack"), (self.cb_invis, "invis"), (self.cb_food, "food"), (self.cb_exp, "exp"), (self.cb_enchant, "enchant"), (self.cb_auto_sort, "auto_sort")]:
                cb.blockSignals(True)
                cb.setChecked(name in modules)
                cb.blockSignals(False)

            if "lapis" in state and "books" in state:
                self.resource_label.setText(f"📦 Лазурит: {state['lapis']} | Книги: {state['books']} | Опыт: {state.get('level', 0)}")

            if "trashCount" in state:
                trash = state['trashCount']
                limit = state.get('trash_limit', 20)
                count = len(self._current_whitelist.split(',')) if self._current_whitelist else 0
                self.lbl_whitelist_status.setText(f"Активных порогов: {count} | Мусор: {trash}/{limit}")

            if "enchant_button_index" in state:
                self.cb_ench_lvl.blockSignals(True)
                self.cb_ench_lvl.setCurrentIndex(int(state['enchant_button_index']))
                self.cb_ench_lvl.blockSignals(False)
        finally:
            self._building = False

    def _set_enabled(self, on: bool):
        for w in self.findChildren(QWidget):
            w.setEnabled(on)
        self.title.setEnabled(True)

    def _send_config(self, key: str, value):
        if not self._bot_id or self._building: return
        self.command_requested.emit(self._bot_id, "set_config", {"key": key, "value": str(value)})

    def _on_module_toggle(self):
        if self._building or not self._bot_id: return
        sender = self.sender()
        mapping = [
            (self.cb_attack, "attack"), 
            (self.cb_invis, "invis"), 
            (self.cb_food, "food"), 
            (self.cb_exp, "exp"), 
            (self.cb_enchant, "enchant"),
            (self.cb_auto_sort, "auto_sort") # НОВОЕ
        ]
        for cb, name in mapping:
            if cb is sender:
                action = "module_on" if cb.isChecked() else "module_off"
                self.command_requested.emit(self._bot_id, action, {"module": name})
                return

    def _on_terminate(self):
        if not self._bot_id: return
        r = QMessageBox.warning(
            self, "Подтверждение", f"Точно терминировать бота {self._bot_id}?",
            QMessageBox.StandardButton.Yes | QMessageBox.StandardButton.No
        )
        if r == QMessageBox.StandardButton.Yes:
            self.terminate_requested.emit(self._bot_id)
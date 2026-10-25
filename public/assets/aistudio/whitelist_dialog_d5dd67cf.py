from PyQt6.QtWidgets import (
    QDialog, QVBoxLayout, QHBoxLayout, QLineEdit, 
    QTableWidget, QTableWidgetItem, QSpinBox, QPushButton, QHeaderView, QInputDialog
)
from PyQt6.QtCore import Qt

class WhitelistDialog(QDialog):
    # Словарь переводов ванильных зачарований
    ENCHANT_TRANSLATIONS = {
        "minecraft:mending": "Починка",
        "minecraft:efficiency": "Эффективность",
        "minecraft:fortune": "Фортуна",
        "minecraft:unbreaking": "Прочность",
        "minecraft:sharpness": "Острота",
        "minecraft:protection": "Защита",
        "minecraft:silk_touch": "Шелковое касание",
        "minecraft:looting": "Добыча",
        "minecraft:power": "Сила",
        "minecraft:infinity": "Бесконечность",
        "minecraft:feather_falling": "Невесомость",
        "minecraft:respiration": "Подводное дыхание",
        "minecraft:aqua_affinity": "Подводник",
        "minecraft:depth_strider": "Подводная ходьба",
        "minecraft:fire_protection": "Огнеупорность",
        "minecraft:blast_protection": "Взрывоустойчивость",
        "minecraft:projectile_protection": "Защита от снарядов",
        "minecraft:thorns": "Шипы",
        "minecraft:smite": "Небесная кара",
        "minecraft:bane_of_arthropods": "Бич членистоногих",
        "minecraft:knockback": "Отдача",
        "minecraft:fire_aspect": "Заговор огня",
        "minecraft:sweeping_edge": "Разящий клинок",
        "minecraft:punch": "Откидывание",
        "minecraft:flame": "Воспламеняющая стрела",
        "minecraft:loyalty": "Верность",
        "minecraft:impaling": "Пронзатель",
        "minecraft:riptide": "Тягун",
        "minecraft:channeling": "Громоотвод",
        "minecraft:multishot": "Тройной выстрел",
        "minecraft:quick_charge": "Быстрая зарядка",
        "minecraft:piercing": "Пронизывающая стрела",
        "minecraft:frost_walker": "Ледоход",
        "minecraft:soul_speed": "Скорость души",
        "minecraft:swift_sneak": "Быстрый шаг"
    }

    def __init__(self, current_whitelist_str, parent=None):
        super().__init__(parent)
        self.setWindowTitle("Настройка Whitelist (Уровни)")
        self.resize(650, 700)
        
        self.whitelist = {}
        if current_whitelist_str:
            for item in current_whitelist_str.split(","):
                parts = item.strip().split(":")
                if len(parts) >= 3:
                    self.whitelist[f"{parts[0]}:{parts[1]}"] = int(parts[2])
                elif len(parts) == 2:
                    self.whitelist[parts[0]] = int(parts[1])
                elif len(parts) == 1 and parts[0]:
                    self.whitelist[parts[0]] = 1

        self._build_ui()
        self._refresh_table()

    def _build_ui(self):
        layout = QVBoxLayout(self)

        search_layout = QHBoxLayout()
        self.search_bar = QLineEdit()
        self.search_bar.setPlaceholderText("Поиск (на русском или ID)...")
        self.search_bar.textChanged.connect(self._refresh_table)
        search_layout.addWidget(self.search_bar)
        
        btn_add_custom = QPushButton("➕ Добавить кастомное")
        btn_add_custom.clicked.connect(self._add_custom_prompt)
        search_layout.addWidget(btn_add_custom)
        
        layout.addLayout(search_layout)

        self.table = QTableWidget(0, 3)
        self.table.setHorizontalHeaderLabels(["Зачарование", "Мин. уровень", "Статус"])
        self.table.horizontalHeader().setSectionResizeMode(0, QHeaderView.ResizeMode.Stretch)
        self.table.setColumnWidth(1, 100)
        self.table.setColumnWidth(2, 80)
        self.table.verticalHeader().setVisible(False)
        layout.addWidget(self.table)

        btns = QHBoxLayout()
        btn_save = QPushButton("Сохранить")
        btn_save.setStyleSheet("background: #2e7d32; color: white; padding: 8px; font-weight: bold;")
        btn_save.clicked.connect(self.accept)
        btn_cancel = QPushButton("Отмена")
        btn_cancel.clicked.connect(self.reject)
        btns.addStretch()
        btns.addWidget(btn_save)
        btns.addWidget(btn_cancel)
        layout.addLayout(btns)

    def _get_display_name(self, ench_id):
        """Возвращает 'Русское имя (id)' или просто id, если перевода нет"""
        ru_name = self.ENCHANT_TRANSLATIONS.get(ench_id)
        if ru_name:
            return f"{ru_name} ({ench_id})"
        return ench_id

    def _refresh_table(self):
        search_text = self.search_bar.text().lower()
        
        all_enchants = set(list(self.ENCHANT_TRANSLATIONS.keys()) + list(self.whitelist.keys()))
        
        # Фильтруем по русскому названию или ID
        filtered = []
        for e in all_enchants:
            ru_name = self.ENCHANT_TRANSLATIONS.get(e, "").lower()
            if search_text in e.lower() or search_text in ru_name:
                filtered.append(e)
                
        filtered.sort(key=lambda x: self.ENCHANT_TRANSLATIONS.get(x, x))

        self.table.setRowCount(0)
        for ench in filtered:
            row = self.table.rowCount()
            self.table.insertRow(row)
            
            display_name = self._get_display_name(ench)
            item_name = QTableWidgetItem(display_name)
            item_name.setFlags(Qt.ItemFlag.ItemIsEnabled)
            self.table.setItem(row, 0, item_name)
            
            spin = QSpinBox()
            spin.setRange(1, 10)
            spin.setValue(self.whitelist.get(ench, 1))
            spin.valueChanged.connect(lambda val, e=ench: self._on_level_changed(e, val))
            self.table.setCellWidget(row, 1, spin)
            
            btn_state = QPushButton()
            is_active = ench in self.whitelist
            btn_state.setText("ВКЛ" if is_active else "ВЫКЛ")
            btn_state.setStyleSheet(f"background: {'#2e7d32' if is_active else '#c62828'}; color: white; font-weight: bold;")
            btn_state.clicked.connect(lambda _, e=ench, b=btn_state: self._toggle_enchant(e, b))
            self.table.setCellWidget(row, 2, btn_state)

    def _on_level_changed(self, ench, level):
        if ench in self.whitelist:
            self.whitelist[ench] = level

    def _toggle_enchant(self, ench, btn):
        if ench in self.whitelist:
            del self.whitelist[ench]
            btn.setText("ВЫКЛ")
            btn.setStyleSheet("background: #c62828; color: white; font-weight: bold;")
        else:
            self.whitelist[ench] = 1
            btn.setText("ВКЛ")
            btn.setStyleSheet("background: #2e7d32; color: white; font-weight: bold;")
            self._refresh_table()

    def _add_custom_prompt(self):
        text, ok = QInputDialog.getText(self, "Кастомное зачарование", "Введи название (как в Lore) или ID:")
        if ok and text.strip():
            name = text.strip().lower()
            if name not in self.whitelist:
                self.whitelist[name] = 1
                self._refresh_table()

    def get_result_string(self):
        result = []
        for ench, level in self.whitelist.items():
            result.append(f"{ench}:{level}")
        return ",".join(result)
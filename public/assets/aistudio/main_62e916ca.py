import sys
from PyQt6.QtWidgets import QApplication
from PyQt6.QtGui import QFont

from hub.main_window import MainWindow


def main():
    app = QApplication(sys.argv)
    app.setApplicationName("Farm+ Hub")
    app.setStyle("Fusion")
    app.setFont(QFont("Segoe UI", 9))

    win = MainWindow("config.json")
    win.show()

    sys.exit(app.exec())


if __name__ == "__main__":
    main()
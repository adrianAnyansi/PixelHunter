import sys
# from PySide6.QtWidgets import QApplication
# from PySide6.QtQuick import QQuickView
from PyQt6.QtGui import QGuiApplication
from PyQt6.QtQml import QQmlApplicationEngine

if __name__ == "__main__":
    # app = QApplication()
    # view = QQuickView()
    
    app = QGuiApplication(sys.argv)

    engine = QQmlApplicationEngine()
    engine.quit.connect(app.quit)
    engine.load('view.qml')

    # view.setSource("view.qml")
    # view.show()
    sys.exit(app.exec())
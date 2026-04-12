# -*- coding: utf-8 -*-
"""
CV Analyzer -- Manager
Interface PySide6 pour gerer le serveur FastAPI, l'installation et la configuration.
"""

import sys
import os
import subprocess
import threading
import webbrowser
import shutil
import signal
import time
import json
import logging
from pathlib import Path
from datetime import datetime

from PySide6.QtWidgets import (
    QApplication, QMainWindow, QWidget, QTabWidget,
    QVBoxLayout, QHBoxLayout, QGridLayout, QLabel,
    QPushButton, QSpinBox, QTextEdit, QProgressBar,
    QGroupBox, QCheckBox, QFrame, QMessageBox,
    QSplitter, QFileDialog
)
from PySide6.QtCore import Qt, QTimer, QThread, Signal, QProcess, QSize
from PySide6.QtGui import QFont, QColor, QIcon, QPalette, QTextCursor


# ---------------------------------------------------------------------------
# Constantes
# ---------------------------------------------------------------------------
APP_NAME = "CV Analyzer"
APP_VERSION = "1.0.0"
BASE_DIR = Path(__file__).resolve().parent
VENV_DIR = BASE_DIR / "venv"
PYTHON_EXE = VENV_DIR / "Scripts" / "python.exe"
PIP_EXE = VENV_DIR / "Scripts" / "pip.exe"
REQUIREMENTS_FILE = BASE_DIR / "requirements.txt"
MAIN_FILE = BASE_DIR / "main.py"
UPLOADS_DIR = BASE_DIR / "uploads"
OUTPUTS_DIR = BASE_DIR / "outputs"
LOGS_DIR = BASE_DIR / "logs"
LOG_FILE = LOGS_DIR / "cv_analyzer.log"

DEFAULT_PORT = 8500

# Couleurs
COLOR_GREEN = "#4CAF50"
COLOR_GREEN_BG = "#C8E6C9"
COLOR_RED = "#F44336"
COLOR_RED_BG = "#FFCDD2"
COLOR_ORANGE = "#FF9800"
COLOR_ORANGE_BG = "#FFE0B2"
COLOR_BLUE = "#2196F3"
COLOR_BLUE_BG = "#BBDEFB"
COLOR_DARK_RED = "#8B0000"
COLOR_DARK_RED_BG = "#8B0000"
COLOR_GRAY_BG = "#F5F5F5"
COLOR_CARD_BORDER = "#E0E0E0"


# ---------------------------------------------------------------------------
# Thread Worker pour les taches longues
# ---------------------------------------------------------------------------
class WorkerThread(QThread):
    output_signal = Signal(str)
    finished_signal = Signal(bool, str)
    progress_signal = Signal(int)

    def __init__(self, commands, cwd=None):
        super().__init__()
        self.commands = commands
        self.cwd = cwd or str(BASE_DIR)
        self._cancelled = False

    def run(self):
        try:
            for i, cmd in enumerate(self.commands):
                if self._cancelled:
                    self.finished_signal.emit(False, "Annule par l'utilisateur.")
                    return

                self.output_signal.emit(f"\n>>> {cmd}\n")
                progress = int((i / len(self.commands)) * 100)
                self.progress_signal.emit(progress)

                process = subprocess.Popen(
                    cmd, shell=True, cwd=self.cwd,
                    stdout=subprocess.PIPE, stderr=subprocess.STDOUT,
                    text=True, encoding="utf-8", errors="replace",
                    creationflags=subprocess.CREATE_NO_WINDOW if sys.platform == "win32" else 0
                )

                for line in process.stdout:
                    if self._cancelled:
                        process.kill()
                        self.finished_signal.emit(False, "Annule.")
                        return
                    self.output_signal.emit(line)

                process.wait()
                if process.returncode != 0:
                    self.finished_signal.emit(False, f"Erreur a la commande : {cmd}")
                    return

            self.progress_signal.emit(100)
            self.finished_signal.emit(True, "Termine avec succes.")
        except Exception as e:
            self.finished_signal.emit(False, str(e))

    def cancel(self):
        self._cancelled = True


# ---------------------------------------------------------------------------
# Widget Carte de statut
# ---------------------------------------------------------------------------
class StatusCard(QFrame):
    """Carte coloree pour afficher une valeur de statut."""

    def __init__(self, title, value="--", bg_color="#FFFFFF", text_color="#333333"):
        super().__init__()
        self.setFrameShape(QFrame.StyledPanel)
        self.setStyleSheet(f"""
            QFrame {{
                background-color: {bg_color};
                border: 1px solid {COLOR_CARD_BORDER};
                border-radius: 8px;
                padding: 10px;
            }}
        """)
        self.setMinimumHeight(100)

        layout = QVBoxLayout(self)
        layout.setAlignment(Qt.AlignCenter)

        self.title_label = QLabel(title)
        self.title_label.setAlignment(Qt.AlignCenter)
        self.title_label.setStyleSheet("color: #666; font-size: 12px; border: none;")
        layout.addWidget(self.title_label)

        self.value_label = QLabel(str(value))
        self.value_label.setAlignment(Qt.AlignCenter)
        self.value_label.setStyleSheet(f"color: {text_color}; font-size: 22px; font-weight: bold; border: none;")
        layout.addWidget(self.value_label)

    def set_value(self, value, text_color=None):
        self.value_label.setText(str(value))
        if text_color:
            self.value_label.setStyleSheet(
                f"color: {text_color}; font-size: 22px; font-weight: bold; border: none;"
            )


# ---------------------------------------------------------------------------
# Fenetre principale
# ---------------------------------------------------------------------------
class ManagerWindow(QMainWindow):

    def __init__(self):
        super().__init__()

        self.server_process = None
        self.current_port = DEFAULT_PORT
        self.worker = None
        self._server_log_file = None

        self.setWindowTitle(f"{APP_NAME} -- Manager")
        self.setMinimumSize(750, 550)
        self.resize(800, 600)

        # Widget central
        central = QWidget()
        self.setCentralWidget(central)
        main_layout = QVBoxLayout(central)
        main_layout.setContentsMargins(16, 12, 16, 12)
        main_layout.setSpacing(10)

        # Header
        header_layout = QHBoxLayout()
        title_label = QLabel(f"  {APP_NAME}")
        title_label.setStyleSheet("font-size: 20px; font-weight: bold; color: #333;")
        header_layout.addWidget(title_label)

        header_layout.addStretch()

        self.status_indicator = QLabel("  Serveur arrete")
        self.status_indicator.setStyleSheet("color: #999; font-size: 13px;")
        header_layout.addWidget(self.status_indicator)

        main_layout.addLayout(header_layout)

        # Tabs
        self.tabs = QTabWidget()
        self.tabs.setStyleSheet("""
            QTabWidget::pane { border: 1px solid #ddd; border-radius: 4px; }
            QTabBar::tab {
                padding: 8px 20px;
                margin-right: 2px;
                border: 1px solid #ddd;
                border-bottom: none;
                border-top-left-radius: 6px;
                border-top-right-radius: 6px;
                background: #f8f8f8;
            }
            QTabBar::tab:selected {
                background: white;
                font-weight: bold;
                color: #D32F2F;
            }
        """)

        self.tabs.addTab(self._build_server_tab(), "Serveur")
        self.tabs.addTab(self._build_install_tab(), "Installation")
        self.tabs.addTab(self._build_ocr_tab(), "OCR")
        self.tabs.addTab(self._build_port_tab(), "Port")
        self.tabs.addTab(self._build_logs_tab(), "Logs")

        main_layout.addWidget(self.tabs)

        # Timer de mise a jour
        self.update_timer = QTimer()
        self.update_timer.timeout.connect(self._refresh_status)
        self.update_timer.start(3000)

        self._refresh_status()

    # =====================================================================
    # TAB 1 : Serveur
    # =====================================================================
    def _build_server_tab(self):
        widget = QWidget()
        layout = QVBoxLayout(widget)
        layout.setSpacing(12)

        # Cartes de statut
        cards_layout = QHBoxLayout()
        cards_layout.setSpacing(10)

        self.card_status = StatusCard("Statut", "Arrete", COLOR_GRAY_BG, "#999")
        self.card_port = StatusCard("Port", str(self.current_port), COLOR_GREEN_BG, COLOR_GREEN)
        self.card_url = StatusCard("URL", f"localhost:{self.current_port}", "#FFFFFF", "#333")
        self.card_cvs = StatusCard("CVs traites", "0", COLOR_DARK_RED_BG, "#FFFFFF")

        cards_layout.addWidget(self.card_status)
        cards_layout.addWidget(self.card_port)
        cards_layout.addWidget(self.card_url)
        cards_layout.addWidget(self.card_cvs)

        layout.addLayout(cards_layout)

        # Boutons de controle
        btn_layout = QHBoxLayout()
        btn_layout.setSpacing(8)

        self.btn_start = QPushButton("  Demarrer")
        self.btn_start.setStyleSheet(self._btn_style(COLOR_GREEN, "#FFF"))
        self.btn_start.setMinimumHeight(42)
        self.btn_start.clicked.connect(self._start_server)
        btn_layout.addWidget(self.btn_start)

        self.btn_stop = QPushButton("  Arreter")
        self.btn_stop.setStyleSheet(self._btn_style(COLOR_RED, "#FFF"))
        self.btn_stop.setMinimumHeight(42)
        self.btn_stop.clicked.connect(self._stop_server)
        btn_layout.addWidget(self.btn_stop)

        self.btn_restart = QPushButton("  Redemarrer")
        self.btn_restart.setStyleSheet(self._btn_style(COLOR_ORANGE, "#FFF"))
        self.btn_restart.setMinimumHeight(42)
        self.btn_restart.clicked.connect(self._restart_server)
        btn_layout.addWidget(self.btn_restart)

        self.btn_browser = QPushButton("  Navigateur")
        self.btn_browser.setStyleSheet(self._btn_style(COLOR_BLUE, "#FFF"))
        self.btn_browser.setMinimumHeight(42)
        self.btn_browser.clicked.connect(self._open_browser)
        btn_layout.addWidget(self.btn_browser)

        layout.addLayout(btn_layout)

        # Port selector
        port_layout = QHBoxLayout()
        port_layout.addStretch()
        port_label = QLabel("Port :")
        port_label.setStyleSheet("font-size: 13px;")
        port_layout.addWidget(port_label)

        self.port_spin = QSpinBox()
        self.port_spin.setRange(1024, 65535)
        self.port_spin.setValue(self.current_port)
        self.port_spin.setFixedWidth(100)
        self.port_spin.valueChanged.connect(self._on_port_changed)
        port_layout.addWidget(self.port_spin)
        port_layout.addStretch()

        layout.addLayout(port_layout)
        layout.addStretch()

        return widget

    # =====================================================================
    # TAB 2 : Installation
    # =====================================================================
    def _build_install_tab(self):
        widget = QWidget()
        layout = QVBoxLayout(widget)
        layout.setSpacing(10)

        # Checklist
        checks_group = QGroupBox("Composants requis")
        checks_layout = QVBoxLayout(checks_group)

        self.check_python = QCheckBox("Python 3.11+")
        self.check_python.setEnabled(False)
        self.check_venv = QCheckBox("Environnement virtuel (venv)")
        self.check_venv.setEnabled(False)
        self.check_deps = QCheckBox("Dependances Python (requirements.txt)")
        self.check_deps.setEnabled(False)
        self.check_tesseract = QCheckBox("Tesseract OCR")
        self.check_tesseract.setEnabled(False)
        self.check_spacy = QCheckBox("Modele spaCy francais")
        self.check_spacy.setEnabled(False)

        for cb in [self.check_python, self.check_venv, self.check_deps,
                    self.check_tesseract, self.check_spacy]:
            checks_layout.addWidget(cb)

        layout.addWidget(checks_group)

        # Boutons
        btns = QHBoxLayout()

        self.btn_check = QPushButton("Verifier")
        self.btn_check.setStyleSheet(self._btn_style(COLOR_BLUE, "#FFF"))
        self.btn_check.setMinimumHeight(38)
        self.btn_check.clicked.connect(self._check_installation)
        btns.addWidget(self.btn_check)

        self.btn_install = QPushButton("Installer tout")
        self.btn_install.setStyleSheet(self._btn_style(COLOR_GREEN, "#FFF"))
        self.btn_install.setMinimumHeight(38)
        self.btn_install.clicked.connect(self._run_installation)
        btns.addWidget(self.btn_install)

        layout.addLayout(btns)

        # Progress
        self.install_progress = QProgressBar()
        self.install_progress.setVisible(False)
        layout.addWidget(self.install_progress)

        # Console d'installation
        self.install_console = QTextEdit()
        self.install_console.setReadOnly(True)
        self.install_console.setStyleSheet("""
            QTextEdit {
                background-color: #1e1e1e;
                color: #d4d4d4;
                font-family: Consolas, 'Courier New', monospace;
                font-size: 11px;
                border: 1px solid #333;
                border-radius: 4px;
                padding: 8px;
            }
        """)
        layout.addWidget(self.install_console)

        return widget

    # =====================================================================
    # TAB 3 : OCR
    # =====================================================================
    def _build_ocr_tab(self):
        widget = QWidget()
        layout = QVBoxLayout(widget)
        layout.setSpacing(10)

        # Moteurs OCR
        engines_group = QGroupBox("Moteurs OCR disponibles")
        engines_layout = QVBoxLayout(engines_group)

        self.ocr_tesseract_status = QLabel("Tesseract : verification...")
        self.ocr_easyocr_status = QLabel("EasyOCR : verification...")
        self.ocr_paddleocr_status = QLabel("PaddleOCR : verification...")

        for lbl in [self.ocr_tesseract_status, self.ocr_easyocr_status, self.ocr_paddleocr_status]:
            lbl.setStyleSheet("font-size: 13px; padding: 6px;")
            engines_layout.addWidget(lbl)

        layout.addWidget(engines_group)

        # Configuration OCR
        config_group = QGroupBox("Configuration")
        config_layout = QGridLayout(config_group)

        config_layout.addWidget(QLabel("Seuil de confiance (%) :"), 0, 0)
        self.ocr_threshold_spin = QSpinBox()
        self.ocr_threshold_spin.setRange(10, 100)
        self.ocr_threshold_spin.setValue(70)
        config_layout.addWidget(self.ocr_threshold_spin, 0, 1)

        config_layout.addWidget(QLabel("Timeout par page (s) :"), 1, 0)
        self.ocr_timeout_spin = QSpinBox()
        self.ocr_timeout_spin.setRange(10, 600)
        self.ocr_timeout_spin.setValue(120)
        config_layout.addWidget(self.ocr_timeout_spin, 1, 1)

        layout.addWidget(config_group)

        # Bouton de test
        self.btn_test_ocr = QPushButton("Tester les moteurs OCR")
        self.btn_test_ocr.setStyleSheet(self._btn_style(COLOR_ORANGE, "#FFF"))
        self.btn_test_ocr.setMinimumHeight(38)
        self.btn_test_ocr.clicked.connect(self._test_ocr_engines)
        layout.addWidget(self.btn_test_ocr)

        # Bouton test avec image
        self.btn_test_image = QPushButton("Tester avec une image...")
        self.btn_test_image.setStyleSheet(self._btn_style(COLOR_BLUE, "#FFF"))
        self.btn_test_image.setMinimumHeight(38)
        self.btn_test_image.clicked.connect(self._test_ocr_with_image)
        layout.addWidget(self.btn_test_image)

        # Console de resultat OCR
        self.ocr_console = QTextEdit()
        self.ocr_console.setReadOnly(True)
        self.ocr_console.setPlaceholderText("Les resultats du test OCR s'afficheront ici...")
        self.ocr_console.setStyleSheet("""
            QTextEdit {
                background-color: #1e1e1e;
                color: #d4d4d4;
                font-family: Consolas, 'Courier New', monospace;
                font-size: 11px;
                border: 1px solid #333;
                border-radius: 4px;
                padding: 8px;
            }
        """)
        self.ocr_console.setMaximumHeight(200)
        layout.addWidget(self.ocr_console)

        layout.addStretch()
        return widget

    # =====================================================================
    # TAB 4 : Port
    # =====================================================================
    def _build_port_tab(self):
        widget = QWidget()
        layout = QVBoxLayout(widget)
        layout.setSpacing(10)

        port_group = QGroupBox("Configuration reseau")
        port_layout = QGridLayout(port_group)

        port_layout.addWidget(QLabel("Port du serveur :"), 0, 0)
        self.port_config_spin = QSpinBox()
        self.port_config_spin.setRange(1024, 65535)
        self.port_config_spin.setValue(self.current_port)
        self.port_config_spin.valueChanged.connect(self._on_port_config_changed)
        port_layout.addWidget(self.port_config_spin, 0, 1)

        port_layout.addWidget(QLabel("Hote :"), 1, 0)
        self.host_label = QLabel("0.0.0.0 (toutes interfaces)")
        self.host_label.setStyleSheet("color: #666;")
        port_layout.addWidget(self.host_label, 1, 1)

        port_layout.addWidget(QLabel("URL d'acces :"), 2, 0)
        self.url_display = QLabel(f"http://localhost:{self.current_port}")
        self.url_display.setStyleSheet("color: #2196F3; font-weight: bold;")
        port_layout.addWidget(self.url_display, 2, 1)

        layout.addWidget(port_group)

        # Infos
        info_group = QGroupBox("Informations")
        info_layout = QVBoxLayout(info_group)
        info_layout.addWidget(QLabel("Taille max upload : 20 MB"))
        info_layout.addWidget(QLabel("Formats supportes : PDF, DOCX, DOC, ODT, RTF, TXT, PNG, JPG, TIFF, BMP, WEBP"))

        layout.addWidget(info_group)
        layout.addStretch()

        return widget

    # =====================================================================
    # TAB 5 : Logs
    # =====================================================================
    def _build_logs_tab(self):
        widget = QWidget()
        layout = QVBoxLayout(widget)

        # Boutons
        btns = QHBoxLayout()

        btn_refresh = QPushButton("Rafraichir")
        btn_refresh.setStyleSheet(self._btn_style(COLOR_BLUE, "#FFF"))
        btn_refresh.clicked.connect(self._load_logs)
        btns.addWidget(btn_refresh)

        btn_clear = QPushButton("Effacer les logs")
        btn_clear.setStyleSheet(self._btn_style(COLOR_RED, "#FFF"))
        btn_clear.clicked.connect(self._clear_logs)
        btns.addWidget(btn_clear)

        btn_open_folder = QPushButton("Ouvrir le dossier")
        btn_open_folder.setStyleSheet(self._btn_style("#666", "#FFF"))
        btn_open_folder.clicked.connect(lambda: os.startfile(str(LOGS_DIR)) if LOGS_DIR.exists() else None)
        btns.addWidget(btn_open_folder)

        layout.addLayout(btns)

        # Console logs
        self.logs_console = QTextEdit()
        self.logs_console.setReadOnly(True)
        self.logs_console.setStyleSheet("""
            QTextEdit {
                background-color: #1e1e1e;
                color: #d4d4d4;
                font-family: Consolas, 'Courier New', monospace;
                font-size: 11px;
                border: 1px solid #333;
                border-radius: 4px;
                padding: 8px;
            }
        """)
        layout.addWidget(self.logs_console)

        return widget

    # =====================================================================
    # Actions Serveur
    # =====================================================================
    def _start_server(self):
        if self.server_process and self.server_process.poll() is None:
            QMessageBox.information(self, "Info", "Le serveur est deja en cours d'execution.")
            return

        python = str(PYTHON_EXE) if PYTHON_EXE.exists() else sys.executable
        cmd = [
            python, "-m", "uvicorn", "main:app",
            "--host", "0.0.0.0",
            "--port", str(self.current_port),
        ]

        # Fichier log pour capturer la sortie du serveur
        server_log = BASE_DIR / "logs" / "server_output.log"
        server_log.parent.mkdir(parents=True, exist_ok=True)

        try:
            self._server_log_file = open(server_log, "w", encoding="utf-8")
            self.server_process = subprocess.Popen(
                cmd,
                cwd=str(BASE_DIR),
                stdout=self._server_log_file,
                stderr=subprocess.STDOUT,
                creationflags=subprocess.CREATE_NO_WINDOW if sys.platform == "win32" else 0
            )
            self._log_to_install_console(f"Serveur lance sur le port {self.current_port}...")
            self._log_to_install_console(f"PID : {self.server_process.pid}")
            self._log_to_install_console(f"Log : {server_log}")

            # Verifier apres 3 secondes si le processus tourne encore
            QTimer.singleShot(3000, self._check_server_startup)

        except Exception as e:
            QMessageBox.critical(self, "Erreur", f"Impossible de demarrer le serveur :\n{e}")

    def _check_server_startup(self):
        """Verifie si le serveur a demarre correctement."""
        if self.server_process is None:
            return

        returncode = self.server_process.poll()
        if returncode is not None:
            # Le processus s'est arrete -- lire le log d'erreur
            self._log_to_install_console(f"\n[ERREUR] Le serveur s'est arrete (code {returncode})")
            log_path = BASE_DIR / "logs" / "server_output.log"
            if log_path.exists():
                try:
                    content = log_path.read_text(encoding="utf-8", errors="replace")
                    self._log_to_install_console("--- Sortie du serveur ---")
                    # Afficher les 30 dernieres lignes
                    lines = content.strip().split("\n")
                    for line in lines[-30:]:
                        self._log_to_install_console(line)
                    self._log_to_install_console("--- Fin ---")
                except Exception:
                    pass

            self.server_process = None
            self._refresh_status()

            # Basculer sur l'onglet Installation pour voir l'erreur
            self.tabs.setCurrentIndex(1)
            QMessageBox.warning(
                self, "Erreur de demarrage",
                "Le serveur s'est arrete immediatement.\n"
                "Voir l'onglet 'Installation' pour les details.\n\n"
                "Causes possibles :\n"
                "- Dependance manquante (lancer 'Installer tout')\n"
                "- Port deja utilise\n"
                "- Erreur dans le code"
            )
        else:
            # Processus tourne, verifier si le serveur repond
            ok = self._http_health_check()
            if ok:
                self._log_to_install_console(f"[OK] Serveur actif sur http://localhost:{self.current_port}")
            else:
                self._log_to_install_console("[ATTENTION] Processus en cours mais le serveur ne repond pas encore...")
                self._log_to_install_console("           Attendre quelques secondes et reessayer 'Navigateur'.")
            self._refresh_status()

    def _stop_server(self):
        # Fermer le fichier log du serveur
        if self._server_log_file:
            try:
                self._server_log_file.close()
            except Exception:
                pass
            self._server_log_file = None

        if self.server_process and self.server_process.poll() is None:
            if sys.platform == "win32":
                subprocess.run(
                    f"taskkill /F /T /PID {self.server_process.pid}",
                    shell=True, capture_output=True,
                    creationflags=subprocess.CREATE_NO_WINDOW
                )
            else:
                os.killpg(os.getpgid(self.server_process.pid), signal.SIGTERM)
            self.server_process = None
            self._log_to_install_console("Serveur arrete.")
        else:
            self.server_process = None

        self._refresh_status()

    def _restart_server(self):
        self._stop_server()
        QTimer.singleShot(1500, self._start_server)

    def _open_browser(self):
        webbrowser.open(f"http://localhost:{self.current_port}")

    def _on_port_changed(self, value):
        self.current_port = value
        self.card_port.set_value(str(value), COLOR_GREEN)
        self.card_url.set_value(f"localhost:{value}")
        self.port_config_spin.setValue(value)
        self.url_display.setText(f"http://localhost:{value}")

    def _on_port_config_changed(self, value):
        self.port_spin.setValue(value)

    # =====================================================================
    # Actions Installation
    # =====================================================================
    def _check_installation(self):
        self.install_console.clear()
        self._log_to_install_console("=== Verification de l'installation ===\n")

        # Python
        try:
            result = subprocess.run(
                [sys.executable, "--version"],
                capture_output=True, text=True,
                creationflags=subprocess.CREATE_NO_WINDOW if sys.platform == "win32" else 0
            )
            ver = result.stdout.strip()
            self.check_python.setChecked(True)
            self._log_to_install_console(f"[OK] {ver}")
        except Exception:
            self.check_python.setChecked(False)
            self._log_to_install_console("[ERREUR] Python non trouve")

        # Venv
        venv_ok = VENV_DIR.exists() and PYTHON_EXE.exists()
        self.check_venv.setChecked(venv_ok)
        self._log_to_install_console(
            f"[OK] Environnement virtuel trouve" if venv_ok
            else "[--] Environnement virtuel absent"
        )

        # Requirements
        deps_ok = REQUIREMENTS_FILE.exists()
        self.check_deps.setChecked(deps_ok)
        self._log_to_install_console(
            f"[OK] requirements.txt present" if deps_ok
            else "[--] requirements.txt manquant"
        )

        # Tesseract
        tess_path = self._find_tesseract_path()
        if tess_path:
            try:
                result = subprocess.run(
                    [tess_path, "--version"],
                    capture_output=True, text=True,
                    creationflags=subprocess.CREATE_NO_WINDOW if sys.platform == "win32" else 0
                )
                self.check_tesseract.setChecked(True)
                ver = result.stdout.split("\n")[0] if result.stdout else "installe"
                self._log_to_install_console(f"[OK] Tesseract : {ver}")
                self._log_to_install_console(f"     Chemin : {tess_path}")
            except Exception as e:
                self.check_tesseract.setChecked(False)
                self._log_to_install_console(f"[ERREUR] Tesseract : {e}")
        else:
            self.check_tesseract.setChecked(False)
            self._log_to_install_console("[--] Tesseract non trouve")
            self._log_to_install_console("     Telecharger : https://github.com/UB-Mannheim/tesseract/wiki")

        # spaCy
        self.check_spacy.setChecked(False)
        self._log_to_install_console("\n[INFO] Cliquer 'Installer tout' pour configurer l'environnement complet.")

    def _run_installation(self):
        python_sys = sys.executable

        commands = []

        # 1. Creer venv si absent
        if not VENV_DIR.exists():
            commands.append(f'"{python_sys}" -m venv "{VENV_DIR}"')

        pip = str(PIP_EXE)
        python_venv = str(PYTHON_EXE)

        # 2. Upgrade pip
        commands.append(f'"{python_venv}" -m pip install --upgrade pip')

        # 3. Installer les dependances
        if REQUIREMENTS_FILE.exists():
            commands.append(f'"{pip}" install -r "{REQUIREMENTS_FILE}"')

        # 4. Modele spaCy
        commands.append(f'"{python_venv}" -m spacy download fr_core_news_sm')

        self.install_progress.setVisible(True)
        self.install_progress.setValue(0)
        self.install_console.clear()
        self._log_to_install_console("=== Installation en cours ===\n")

        self.btn_install.setEnabled(False)
        self.worker = WorkerThread(commands, cwd=str(BASE_DIR))
        self.worker.output_signal.connect(self._log_to_install_console)
        self.worker.progress_signal.connect(self.install_progress.setValue)
        self.worker.finished_signal.connect(self._on_install_finished)
        self.worker.start()

    def _on_install_finished(self, success, message):
        self.btn_install.setEnabled(True)
        if success:
            self._log_to_install_console(f"\n[OK] {message}")
            self.install_progress.setValue(100)
            self._check_installation()
        else:
            self._log_to_install_console(f"\n[ERREUR] {message}")

    # =====================================================================
    # Actions OCR
    # =====================================================================
    def _test_ocr_engines(self):
        def _check():
            # Tesseract
            tess_path = self._find_tesseract_path()
            if tess_path:
                try:
                    result = subprocess.run(
                        [tess_path, "--version"],
                        capture_output=True, text=True,
                        creationflags=subprocess.CREATE_NO_WINDOW if sys.platform == "win32" else 0
                    )
                    ver = result.stdout.split("\n")[0] if result.stdout else "installe"
                    self.ocr_tesseract_status.setText(f"Tesseract : {ver}  [OK]")
                    self.ocr_tesseract_status.setStyleSheet("font-size: 13px; padding: 6px; color: green;")
                except Exception:
                    self.ocr_tesseract_status.setText("Tesseract : ERREUR")
                    self.ocr_tesseract_status.setStyleSheet("font-size: 13px; padding: 6px; color: red;")
            else:
                self.ocr_tesseract_status.setText("Tesseract : NON TROUVE")
                self.ocr_tesseract_status.setStyleSheet("font-size: 13px; padding: 6px; color: red;")

            # EasyOCR
            python = str(PYTHON_EXE) if PYTHON_EXE.exists() else sys.executable
            try:
                r = subprocess.run(
                    [python, "-c", "import easyocr; print('OK')"],
                    capture_output=True, text=True, timeout=10,
                    creationflags=subprocess.CREATE_NO_WINDOW if sys.platform == "win32" else 0
                )
                if "OK" in r.stdout:
                    self.ocr_easyocr_status.setText("EasyOCR : installe  [OK]")
                    self.ocr_easyocr_status.setStyleSheet("font-size: 13px; padding: 6px; color: green;")
                else:
                    raise ImportError()
            except Exception:
                self.ocr_easyocr_status.setText("EasyOCR : NON INSTALLE")
                self.ocr_easyocr_status.setStyleSheet("font-size: 13px; padding: 6px; color: orange;")

            # PaddleOCR
            try:
                r = subprocess.run(
                    [python, "-c", "from paddleocr import PaddleOCR; print('OK')"],
                    capture_output=True, text=True, timeout=15,
                    creationflags=subprocess.CREATE_NO_WINDOW if sys.platform == "win32" else 0
                )
                if "OK" in r.stdout:
                    self.ocr_paddleocr_status.setText("PaddleOCR : installe  [OK]")
                    self.ocr_paddleocr_status.setStyleSheet("font-size: 13px; padding: 6px; color: green;")
                else:
                    raise ImportError()
            except Exception:
                self.ocr_paddleocr_status.setText("PaddleOCR : NON INSTALLE (optionnel)")
                self.ocr_paddleocr_status.setStyleSheet("font-size: 13px; padding: 6px; color: orange;")

        threading.Thread(target=_check, daemon=True).start()

    def _test_ocr_with_image(self):
        """Tester l'OCR sur une image selectionnee par l'utilisateur."""
        file_path, _ = QFileDialog.getOpenFileName(
            self, "Choisir une image a tester",
            "", "Images (*.png *.jpg *.jpeg *.bmp *.tiff *.webp);;Tous (*.*)"
        )
        if not file_path:
            return

        self.ocr_console.clear()
        self.ocr_console.append(f"Image : {file_path}\n")
        self.ocr_console.append("Lancement du pre-traitement + OCR...\n")
        self.btn_test_image.setEnabled(False)

        def _run_test():
            python = str(PYTHON_EXE) if PYTHON_EXE.exists() else sys.executable
            script = f"""
import sys, json, time
sys.path.insert(0, r"{BASE_DIR}")
from modules.image_preprocessor import ImagePreprocessor
from modules.ocr_engine import OCREngine

preprocessor = ImagePreprocessor()
ocr = OCREngine()

image_path = r"{file_path}"
t0 = time.perf_counter()

# Pre-traitement
processed, meta = preprocessor.process(image_path)
preprocess_ms = meta.get("processing_time_ms", 0)

# OCR
result = ocr.extract(processed)
total_ms = int((time.perf_counter() - t0) * 1000)

output = {{
    "moteur": result.get("engine_used", "aucun"),
    "confiance": result.get("confidence", 0),
    "langue": result.get("language_detected", "?"),
    "mots": result.get("word_count", 0),
    "pretraitement_ms": preprocess_ms,
    "ocr_ms": result.get("processing_time_ms", 0),
    "total_ms": total_ms,
    "etapes": [s["name"] for s in meta.get("steps_applied", [])],
    "moteurs_essayes": result.get("engines_tried", []),
}}
print("===JSON===")
print(json.dumps(output, ensure_ascii=False))
print("===TEXT===")
print(result.get("text", ""))
"""
            try:
                proc = subprocess.run(
                    [python, "-c", script],
                    capture_output=True, text=True, timeout=180,
                    encoding="utf-8", errors="replace",
                    cwd=str(BASE_DIR),
                    creationflags=subprocess.CREATE_NO_WINDOW if sys.platform == "win32" else 0
                )

                output = proc.stdout
                if "===JSON===" in output and "===TEXT===" in output:
                    json_part = output.split("===JSON===")[1].split("===TEXT===")[0].strip()
                    text_part = output.split("===TEXT===")[1].strip()

                    try:
                        info = json.loads(json_part)
                        self.ocr_console.append(f"Moteur utilise   : {info['moteur']}")
                        self.ocr_console.append(f"Confiance        : {info['confiance']}%")
                        self.ocr_console.append(f"Langue detectee  : {info['langue']}")
                        self.ocr_console.append(f"Mots extraits    : {info['mots']}")
                        self.ocr_console.append(f"Pre-traitement   : {info['pretraitement_ms']} ms")
                        self.ocr_console.append(f"OCR              : {info['ocr_ms']} ms")
                        self.ocr_console.append(f"Total            : {info['total_ms']} ms")
                        self.ocr_console.append(f"Etapes           : {', '.join(info['etapes'])}")
                        self.ocr_console.append(f"Moteurs essayes  : {', '.join(info['moteurs_essayes'])}")
                        self.ocr_console.append(f"\n--- Texte extrait ---\n")
                        self.ocr_console.append(text_part[:2000])
                        if len(text_part) > 2000:
                            self.ocr_console.append(f"\n... ({len(text_part)} caracteres au total)")
                    except json.JSONDecodeError:
                        self.ocr_console.append(output)
                else:
                    self.ocr_console.append(output)

                if proc.stderr:
                    # Filtrer les warnings non critiques
                    stderr_lines = [l for l in proc.stderr.split("\n")
                                    if l.strip() and "WARNING" not in l.upper()]
                    if stderr_lines:
                        self.ocr_console.append(f"\n[STDERR]\n{''.join(stderr_lines[:10])}")

            except subprocess.TimeoutExpired:
                self.ocr_console.append("[ERREUR] Timeout (180s). Image trop volumineuse ?")
            except Exception as e:
                self.ocr_console.append(f"[ERREUR] {e}")
            finally:
                self.btn_test_image.setEnabled(True)

        threading.Thread(target=_run_test, daemon=True).start()

    # =====================================================================
    # Actions Logs
    # =====================================================================
    def _load_logs(self):
        self.logs_console.clear()
        if LOG_FILE.exists():
            try:
                with open(LOG_FILE, "r", encoding="utf-8") as f:
                    content = f.read()
                # Limiter a 500 dernières lignes
                lines = content.split("\n")
                if len(lines) > 500:
                    lines = lines[-500:]
                self.logs_console.setPlainText("\n".join(lines))
                cursor = self.logs_console.textCursor()
                cursor.movePosition(QTextCursor.End)
                self.logs_console.setTextCursor(cursor)
            except Exception as e:
                self.logs_console.setPlainText(f"Erreur lecture logs : {e}")
        else:
            self.logs_console.setPlainText("Aucun fichier de log trouve.")

    def _clear_logs(self):
        if LOG_FILE.exists():
            try:
                open(LOG_FILE, "w").close()
                self.logs_console.clear()
                self.logs_console.setPlainText("Logs effaces.")
            except Exception as e:
                QMessageBox.warning(self, "Erreur", f"Impossible d'effacer les logs : {e}")

    # =====================================================================
    # Utilitaires
    # =====================================================================
    def _find_tesseract_path(self) -> str:
        """Cherche Tesseract dans le PATH et les emplacements courants Windows."""
        found = shutil.which("tesseract")
        if found:
            return found

        if sys.platform != "win32":
            return ""

        # Fichier config ecrit par l'installateur
        tess_config = BASE_DIR / "tesseract_path.txt"
        if tess_config.exists():
            try:
                path = tess_config.read_text(encoding="utf-8").strip()
                if os.path.isfile(path):
                    return path
            except Exception:
                pass

        candidates = [
            r"C:\Program Files\Tesseract-OCR\tesseract.exe",
            r"C:\Program Files (x86)\Tesseract-OCR\tesseract.exe",
            r"C:\Tesseract-OCR\tesseract.exe",
            os.path.expandvars(r"%LOCALAPPDATA%\Tesseract-OCR\tesseract.exe"),
            os.path.expandvars(r"%LOCALAPPDATA%\Programs\Tesseract-OCR\tesseract.exe"),
        ]

        for path in candidates:
            if os.path.isfile(path):
                return path

        return ""

    def _refresh_status(self):
        """Met a jour l'indicateur de statut serveur."""
        is_running = False

        # 1. Verifier si le processus tourne
        process_alive = self.server_process and self.server_process.poll() is None

        # 2. Verifier si le serveur repond reellement via HTTP
        if process_alive:
            is_running = self._http_health_check()
            if not is_running:
                # Processus tourne mais ne repond pas encore (demarrage en cours)
                is_running = True  # On fait confiance au processus

        if is_running:
            self.status_indicator.setText(f"  Serveur actif :{self.current_port}")
            self.status_indicator.setStyleSheet("color: #4CAF50; font-size: 13px; font-weight: bold;")
            self.card_status.set_value("Actif", COLOR_GREEN)
        else:
            self.status_indicator.setText("  Serveur arrete")
            self.status_indicator.setStyleSheet("color: #999; font-size: 13px;")
            self.card_status.set_value("Arrete", "#999")

        # Compter les CVs dans uploads
        count = 0
        uploads = BASE_DIR / "uploads"
        if uploads.exists():
            count = len([d for d in uploads.iterdir() if d.is_dir()])
        self.card_cvs.set_value(str(count))

    def _http_health_check(self) -> bool:
        """Verifie si le serveur repond sur le port configure."""
        import urllib.request
        try:
            url = f"http://localhost:{self.current_port}/api/history"
            req = urllib.request.Request(url, method="GET")
            with urllib.request.urlopen(req, timeout=2) as resp:
                return resp.status == 200
        except Exception:
            return False

    def _log_to_install_console(self, text):
        self.install_console.append(text.rstrip())

    def _btn_style(self, bg, fg):
        return f"""
            QPushButton {{
                background-color: {bg};
                color: {fg};
                border: none;
                border-radius: 6px;
                padding: 8px 16px;
                font-size: 13px;
                font-weight: bold;
            }}
            QPushButton:hover {{ opacity: 0.9; }}
            QPushButton:pressed {{ opacity: 0.7; }}
            QPushButton:disabled {{ background-color: #ccc; color: #888; }}
        """

    def closeEvent(self, event):
        """Fermeture propre."""
        if self.server_process and self.server_process.poll() is None:
            reply = QMessageBox.question(
                self, "Quitter",
                "Le serveur est en cours d'execution.\nArreter le serveur et quitter ?",
                QMessageBox.Yes | QMessageBox.No
            )
            if reply == QMessageBox.Yes:
                self._stop_server()
                event.accept()
            else:
                event.ignore()
        else:
            event.accept()


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
def main():
    app = QApplication(sys.argv)
    app.setStyle("Fusion")

    # Palette claire
    palette = QPalette()
    palette.setColor(QPalette.Window, QColor("#FAFAFA"))
    palette.setColor(QPalette.WindowText, QColor("#333333"))
    palette.setColor(QPalette.Base, QColor("#FFFFFF"))
    palette.setColor(QPalette.AlternateBase, QColor("#F5F5F5"))
    palette.setColor(QPalette.Button, QColor("#F0F0F0"))
    palette.setColor(QPalette.ButtonText, QColor("#333333"))
    app.setPalette(palette)

    window = ManagerWindow()
    window.show()
    sys.exit(app.exec())


if __name__ == "__main__":
    main()

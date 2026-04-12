# -*- coding: utf-8 -*-
"""
CV Analyzer -- Installateur
Interface PySide6 pour installer et configurer l'application.
Lancer avec : python installer.py
"""

import sys
import os
import subprocess
import threading
import webbrowser
import shutil
from pathlib import Path

from PySide6.QtWidgets import (
    QApplication, QMainWindow, QWidget, QTabWidget,
    QVBoxLayout, QHBoxLayout, QGridLayout, QLabel,
    QPushButton, QSpinBox, QTextEdit, QProgressBar,
    QGroupBox, QFrame, QMessageBox, QSizePolicy,
    QSpacerItem
)
from PySide6.QtCore import Qt, QTimer, Signal, QThread
from PySide6.QtGui import QFont, QColor, QPalette, QTextCursor


# ---------------------------------------------------------------------------
# Constantes
# ---------------------------------------------------------------------------
APP_NAME = "CV Analyzer"
APP_VERSION = "1.0.0"
BASE_DIR = Path(__file__).resolve().parent
VENV_DIR = BASE_DIR / "venv"
PYTHON_VENV = VENV_DIR / "Scripts" / "python.exe"
PIP_VENV = VENV_DIR / "Scripts" / "pip.exe"
REQUIREMENTS = BASE_DIR / "requirements.txt"

# Couleurs
C_BG       = "#FAFAFA"
C_GREEN    = "#4CAF50"
C_GREEN_BG = "#C8E6C9"
C_RED      = "#E53935"
C_RED_BG   = "#FFCDD2"
C_ORANGE   = "#FB8C00"
C_ORANGE_BG= "#FFE0B2"
C_BLUE     = "#1E88E5"
C_BLUE_BG  = "#BBDEFB"
C_DARK_RED = "#8B0000"
C_GRAY     = "#9E9E9E"
C_GRAY_BG  = "#F5F5F5"
C_BORDER   = "#E0E0E0"
C_TAB_SEL  = "#C62828"
C_CONSOLE_BG = "#1E1E1E"
C_CONSOLE_FG = "#D4D4D4"


# ---------------------------------------------------------------------------
# Worker Thread
# ---------------------------------------------------------------------------
class InstallWorker(QThread):
    """Execute une liste de commandes en arriere-plan."""
    log = Signal(str)
    step_done = Signal(int, bool, str)   # step_index, success, message
    finished = Signal(bool, str)
    progress = Signal(int)

    def __init__(self, steps):
        """
        steps : list of dict
            {"label": str, "commands": [str], "check": callable|None}
        """
        super().__init__()
        self.steps = steps
        self._cancelled = False

    def run(self):
        total = len(self.steps)
        for i, step in enumerate(self.steps):
            if self._cancelled:
                self.finished.emit(False, "Installation annulee.")
                return

            label = step["label"]
            self.log.emit(f"\n{'='*60}")
            self.log.emit(f"  ETAPE {i+1}/{total} : {label}")
            self.log.emit(f"{'='*60}\n")
            self.progress.emit(int((i / total) * 100))

            success = True
            for cmd in step.get("commands", []):
                if self._cancelled:
                    self.finished.emit(False, "Annule.")
                    return

                self.log.emit(f">>> {cmd}\n")
                try:
                    proc = subprocess.Popen(
                        cmd, shell=True, cwd=str(BASE_DIR),
                        stdout=subprocess.PIPE, stderr=subprocess.STDOUT,
                        text=True, encoding="utf-8", errors="replace",
                        creationflags=subprocess.CREATE_NO_WINDOW if sys.platform == "win32" else 0
                    )
                    for line in proc.stdout:
                        self.log.emit(line.rstrip())
                    proc.wait()
                    if proc.returncode != 0:
                        success = False
                        self.log.emit(f"\n[ERREUR] Code retour : {proc.returncode}")
                        break
                except Exception as e:
                    success = False
                    self.log.emit(f"\n[ERREUR] {e}")
                    break

            self.step_done.emit(i, success, label)

            if not success and step.get("critical", True):
                self.finished.emit(False, f"Echec a l'etape : {label}")
                return

        self.progress.emit(100)
        self.finished.emit(True, "Installation terminee avec succes !")

    def cancel(self):
        self._cancelled = True


# ---------------------------------------------------------------------------
# Carte de statut
# ---------------------------------------------------------------------------
class StatusCard(QFrame):
    """Carte coloree pour afficher un statut."""

    def __init__(self, title, value="--", bg="#FFFFFF", fg="#333333", parent=None):
        super().__init__(parent)
        self.setFrameShape(QFrame.StyledPanel)
        self.setMinimumHeight(90)
        self.setMinimumWidth(120)
        self._bg = bg
        self._fg = fg
        self._apply_style()

        layout = QVBoxLayout(self)
        layout.setAlignment(Qt.AlignCenter)
        layout.setContentsMargins(10, 8, 10, 8)
        layout.setSpacing(4)

        self.title_label = QLabel(title)
        self.title_label.setAlignment(Qt.AlignCenter)
        self.title_label.setStyleSheet("color: #666; font-size: 11px; border: none; background: transparent;")
        layout.addWidget(self.title_label)

        self.value_label = QLabel(str(value))
        self.value_label.setAlignment(Qt.AlignCenter)
        self.value_label.setStyleSheet(f"color: {fg}; font-size: 20px; font-weight: bold; border: none; background: transparent;")
        layout.addWidget(self.value_label)

    def _apply_style(self):
        self.setStyleSheet(f"""
            QFrame {{
                background-color: {self._bg};
                border: 1px solid {C_BORDER};
                border-radius: 8px;
            }}
        """)

    def set_value(self, value, fg=None, bg=None):
        self.value_label.setText(str(value))
        if fg:
            self._fg = fg
            self.value_label.setStyleSheet(f"color: {fg}; font-size: 20px; font-weight: bold; border: none; background: transparent;")
        if bg:
            self._bg = bg
            self._apply_style()


# ---------------------------------------------------------------------------
# Indicateur d'etape
# ---------------------------------------------------------------------------
class StepIndicator(QFrame):
    """Ligne d'etape avec indicateur colore."""

    def __init__(self, number, label, parent=None):
        super().__init__(parent)
        layout = QHBoxLayout(self)
        layout.setContentsMargins(8, 4, 8, 4)
        layout.setSpacing(10)

        self.dot = QLabel()
        self.dot.setFixedSize(24, 24)
        self.dot.setAlignment(Qt.AlignCenter)
        self.dot.setStyleSheet(f"""
            background-color: {C_GRAY_BG};
            border: 2px solid {C_BORDER};
            border-radius: 12px;
            font-size: 11px; font-weight: bold; color: #999;
        """)
        self.dot.setText(str(number))
        layout.addWidget(self.dot)

        self.label = QLabel(label)
        self.label.setStyleSheet("font-size: 13px; color: #555;")
        layout.addWidget(self.label)

        layout.addStretch()

        self.status_label = QLabel("En attente")
        self.status_label.setStyleSheet("font-size: 11px; color: #999;")
        layout.addWidget(self.status_label)

    def set_running(self):
        self.dot.setStyleSheet(f"""
            background-color: {C_ORANGE_BG};
            border: 2px solid {C_ORANGE};
            border-radius: 12px;
            font-size: 11px; font-weight: bold; color: {C_ORANGE};
        """)
        self.status_label.setText("En cours...")
        self.status_label.setStyleSheet(f"font-size: 11px; color: {C_ORANGE}; font-weight: bold;")

    def set_success(self):
        self.dot.setStyleSheet(f"""
            background-color: {C_GREEN_BG};
            border: 2px solid {C_GREEN};
            border-radius: 12px;
            font-size: 11px; font-weight: bold; color: {C_GREEN};
        """)
        self.dot.setText("OK")
        self.status_label.setText("Termine")
        self.status_label.setStyleSheet(f"font-size: 11px; color: {C_GREEN}; font-weight: bold;")

    def set_error(self):
        self.dot.setStyleSheet(f"""
            background-color: {C_RED_BG};
            border: 2px solid {C_RED};
            border-radius: 12px;
            font-size: 11px; font-weight: bold; color: {C_RED};
        """)
        self.dot.setText("!!")
        self.status_label.setText("Erreur")
        self.status_label.setStyleSheet(f"font-size: 11px; color: {C_RED}; font-weight: bold;")

    def set_skipped(self):
        self.status_label.setText("Ignore")
        self.status_label.setStyleSheet("font-size: 11px; color: #999;")


# ---------------------------------------------------------------------------
# Fenetre Installateur
# ---------------------------------------------------------------------------
class InstallerWindow(QMainWindow):

    def __init__(self):
        super().__init__()
        self.worker = None
        self.setWindowTitle(f"{APP_NAME} -- Installateur")
        self.setMinimumSize(780, 620)
        self.resize(820, 660)

        central = QWidget()
        self.setCentralWidget(central)
        main_layout = QVBoxLayout(central)
        main_layout.setContentsMargins(16, 12, 16, 12)
        main_layout.setSpacing(8)

        # === HEADER ===
        header = QHBoxLayout()
        title = QLabel(f"  {APP_NAME}")
        title.setStyleSheet("font-size: 22px; font-weight: bold; color: #333;")
        header.addWidget(title)
        header.addStretch()
        self.header_status = QLabel("Pret a installer")
        self.header_status.setStyleSheet("font-size: 13px; color: #999;")
        header.addWidget(self.header_status)
        main_layout.addLayout(header)

        # === TABS ===
        self.tabs = QTabWidget()
        self.tabs.setStyleSheet(f"""
            QTabWidget::pane {{ border: 1px solid #ddd; border-radius: 4px; background: white; }}
            QTabBar::tab {{
                padding: 8px 22px; margin-right: 2px;
                border: 1px solid #ddd; border-bottom: none;
                border-top-left-radius: 6px; border-top-right-radius: 6px;
                background: #f8f8f8; font-size: 13px;
            }}
            QTabBar::tab:selected {{
                background: white; font-weight: bold; color: {C_TAB_SEL};
            }}
        """)

        self.tabs.addTab(self._build_tab_install(), "  Installation")
        self.tabs.addTab(self._build_tab_status(), "  Verification")
        self.tabs.addTab(self._build_tab_config(), "  Configuration")
        self.tabs.addTab(self._build_tab_console(), "  Console")

        main_layout.addWidget(self.tabs)

        # === FOOTER ===
        footer = QHBoxLayout()
        footer.setSpacing(8)

        self.btn_install = QPushButton("  Installer tout")
        self.btn_install.setStyleSheet(self._btn_style(C_GREEN, "#FFF"))
        self.btn_install.setMinimumHeight(44)
        self.btn_install.setMinimumWidth(180)
        self.btn_install.clicked.connect(self._run_full_install)
        footer.addWidget(self.btn_install)

        self.btn_verify = QPushButton("  Verifier")
        self.btn_verify.setStyleSheet(self._btn_style(C_BLUE, "#FFF"))
        self.btn_verify.setMinimumHeight(44)
        self.btn_verify.clicked.connect(self._run_verification)
        footer.addWidget(self.btn_verify)

        self.btn_cancel = QPushButton("  Annuler")
        self.btn_cancel.setStyleSheet(self._btn_style(C_RED, "#FFF"))
        self.btn_cancel.setMinimumHeight(44)
        self.btn_cancel.setEnabled(False)
        self.btn_cancel.clicked.connect(self._cancel_install)
        footer.addWidget(self.btn_cancel)

        footer.addStretch()

        self.btn_launch = QPushButton("  Lancer le Manager")
        self.btn_launch.setStyleSheet(self._btn_style(C_ORANGE, "#FFF"))
        self.btn_launch.setMinimumHeight(44)
        self.btn_launch.setMinimumWidth(200)
        self.btn_launch.setEnabled(False)
        self.btn_launch.clicked.connect(self._launch_manager)
        footer.addWidget(self.btn_launch)

        main_layout.addLayout(footer)

        # Progress bar
        self.progress = QProgressBar()
        self.progress.setFixedHeight(6)
        self.progress.setTextVisible(False)
        self.progress.setStyleSheet(f"""
            QProgressBar {{ background: #eee; border: none; border-radius: 3px; }}
            QProgressBar::chunk {{ background: {C_GREEN}; border-radius: 3px; }}
        """)
        main_layout.addWidget(self.progress)

        # Init
        QTimer.singleShot(500, self._run_verification)

    # =====================================================================
    # TAB 1 : Installation
    # =====================================================================
    def _build_tab_install(self):
        widget = QWidget()
        layout = QVBoxLayout(widget)
        layout.setSpacing(6)
        layout.setContentsMargins(12, 12, 12, 12)

        # Cartes de statut
        cards = QHBoxLayout()
        cards.setSpacing(10)
        self.card_python   = StatusCard("Python",     "--", C_GRAY_BG, C_GRAY)
        self.card_venv     = StatusCard("Venv",       "--", C_GRAY_BG, C_GRAY)
        self.card_deps     = StatusCard("Dependances","--", C_GRAY_BG, C_GRAY)
        self.card_tesseract= StatusCard("Tesseract",  "--", C_GRAY_BG, C_GRAY)
        cards.addWidget(self.card_python)
        cards.addWidget(self.card_venv)
        cards.addWidget(self.card_deps)
        cards.addWidget(self.card_tesseract)
        layout.addLayout(cards)

        # Etapes
        steps_group = QGroupBox("Etapes d'installation")
        steps_group.setStyleSheet("QGroupBox { font-weight: bold; font-size: 13px; }")
        steps_layout = QVBoxLayout(steps_group)
        steps_layout.setSpacing(2)

        self.steps_ui = []
        step_labels = [
            "Verification de Python",
            "Creation de l'environnement virtuel",
            "Mise a jour de pip",
            "Installation des dependances (requirements.txt)",
            "Telechargement du modele spaCy francais",
            "Verification de Tesseract OCR",
            "Creation des dossiers",
        ]
        for i, label in enumerate(step_labels):
            si = StepIndicator(i + 1, label)
            steps_layout.addWidget(si)
            self.steps_ui.append(si)

        layout.addWidget(steps_group)
        layout.addStretch()

        return widget

    # =====================================================================
    # TAB 2 : Verification
    # =====================================================================
    def _build_tab_status(self):
        widget = QWidget()
        layout = QVBoxLayout(widget)
        layout.setContentsMargins(12, 12, 12, 12)

        self.verify_text = QTextEdit()
        self.verify_text.setReadOnly(True)
        self.verify_text.setStyleSheet(f"""
            QTextEdit {{
                background-color: {C_CONSOLE_BG}; color: {C_CONSOLE_FG};
                font-family: Consolas, 'Courier New', monospace; font-size: 12px;
                border: 1px solid #333; border-radius: 6px; padding: 10px;
            }}
        """)
        layout.addWidget(self.verify_text)

        return widget

    # =====================================================================
    # TAB 3 : Configuration
    # =====================================================================
    def _build_tab_config(self):
        widget = QWidget()
        layout = QVBoxLayout(widget)
        layout.setContentsMargins(12, 12, 12, 12)
        layout.setSpacing(10)

        # Port
        net_group = QGroupBox("Configuration reseau")
        net_layout = QGridLayout(net_group)

        net_layout.addWidget(QLabel("Port du serveur :"), 0, 0)
        self.port_spin = QSpinBox()
        self.port_spin.setRange(1024, 65535)
        self.port_spin.setValue(8500)
        self.port_spin.setFixedWidth(120)
        net_layout.addWidget(self.port_spin, 0, 1)

        net_layout.addWidget(QLabel("URL d'acces :"), 1, 0)
        self.url_label = QLabel("http://localhost:8500")
        self.url_label.setStyleSheet(f"color: {C_BLUE}; font-weight: bold;")
        net_layout.addWidget(self.url_label, 1, 1)
        self.port_spin.valueChanged.connect(lambda v: self.url_label.setText(f"http://localhost:{v}"))

        layout.addWidget(net_group)

        # Infos
        info_group = QGroupBox("Informations projet")
        info_layout = QVBoxLayout(info_group)
        info_layout.addWidget(QLabel(f"Version : {APP_VERSION}"))
        info_layout.addWidget(QLabel(f"Repertoire : {BASE_DIR}"))
        info_layout.addWidget(QLabel("Taille max upload : 20 Mo"))
        info_layout.addWidget(QLabel("Formats : PDF, DOCX, DOC, ODT, RTF, TXT, PNG, JPG, TIFF, BMP, WEBP"))
        info_layout.addWidget(QLabel("OCR : Tesseract (recommande) + EasyOCR + PaddleOCR (optionnel)"))
        info_layout.addWidget(QLabel("Export : DOCX, HTML, PDF (3 templates)"))
        layout.addWidget(info_group)

        # Liens
        links_group = QGroupBox("Liens utiles")
        links_layout = QVBoxLayout(links_group)

        btn_tesseract = QPushButton("Telecharger Tesseract OCR")
        btn_tesseract.setStyleSheet(self._btn_style(C_BLUE, "#FFF"))
        btn_tesseract.clicked.connect(lambda: webbrowser.open("https://github.com/UB-Mannheim/tesseract/wiki"))
        links_layout.addWidget(btn_tesseract)

        btn_libreoffice = QPushButton("Telecharger LibreOffice (optionnel)")
        btn_libreoffice.setStyleSheet(self._btn_style("#666", "#FFF"))
        btn_libreoffice.clicked.connect(lambda: webbrowser.open("https://www.libreoffice.org/download/download/"))
        links_layout.addWidget(btn_libreoffice)

        layout.addWidget(links_group)
        layout.addStretch()

        return widget

    # =====================================================================
    # TAB 4 : Console
    # =====================================================================
    def _build_tab_console(self):
        widget = QWidget()
        layout = QVBoxLayout(widget)
        layout.setContentsMargins(12, 12, 12, 12)

        self.console = QTextEdit()
        self.console.setReadOnly(True)
        self.console.setStyleSheet(f"""
            QTextEdit {{
                background-color: {C_CONSOLE_BG}; color: {C_CONSOLE_FG};
                font-family: Consolas, 'Courier New', monospace; font-size: 11px;
                border: 1px solid #333; border-radius: 6px; padding: 10px;
            }}
        """)
        layout.addWidget(self.console)

        # Boutons console
        btns = QHBoxLayout()
        btn_clear = QPushButton("Effacer")
        btn_clear.setStyleSheet(self._btn_style("#666", "#FFF"))
        btn_clear.clicked.connect(self.console.clear)
        btns.addWidget(btn_clear)

        btn_open_dir = QPushButton("Ouvrir le dossier projet")
        btn_open_dir.setStyleSheet(self._btn_style(C_BLUE, "#FFF"))
        btn_open_dir.clicked.connect(lambda: os.startfile(str(BASE_DIR)) if sys.platform == "win32" else None)
        btns.addWidget(btn_open_dir)

        btns.addStretch()
        layout.addLayout(btns)

        return widget

    # =====================================================================
    # Verification
    # =====================================================================
    def _run_verification(self):
        self.verify_text.clear()
        self._vlog("=" * 50)
        self._vlog("  VERIFICATION DE L'ENVIRONNEMENT")
        self._vlog("=" * 50)
        self._vlog("")

        # Python
        try:
            r = subprocess.run(
                [sys.executable, "--version"],
                capture_output=True, text=True,
                creationflags=subprocess.CREATE_NO_WINDOW if sys.platform == "win32" else 0
            )
            ver = r.stdout.strip() or r.stderr.strip()
            self._vlog(f"[OK] {ver}")
            self.card_python.set_value("OK", C_GREEN, C_GREEN_BG)
        except Exception as e:
            self._vlog(f"[ERREUR] Python : {e}")
            self.card_python.set_value("Absent", C_RED, C_RED_BG)

        # Venv
        if VENV_DIR.exists() and PYTHON_VENV.exists():
            self._vlog(f"[OK] Environnement virtuel : {VENV_DIR}")
            self.card_venv.set_value("OK", C_GREEN, C_GREEN_BG)
        else:
            self._vlog("[--] Environnement virtuel : non cree")
            self.card_venv.set_value("Absent", C_ORANGE, C_ORANGE_BG)

        # Deps
        if REQUIREMENTS.exists():
            # Verifier si les deps sont installees
            if PYTHON_VENV.exists():
                try:
                    r = subprocess.run(
                        [str(PYTHON_VENV), "-c", "import fastapi, uvicorn; print('OK')"],
                        capture_output=True, text=True, timeout=10,
                        creationflags=subprocess.CREATE_NO_WINDOW if sys.platform == "win32" else 0
                    )
                    if "OK" in r.stdout:
                        self._vlog("[OK] Dependances Python installees")
                        self.card_deps.set_value("OK", C_GREEN, C_GREEN_BG)
                    else:
                        self._vlog("[--] Dependances Python : incompletes")
                        self.card_deps.set_value("Partiel", C_ORANGE, C_ORANGE_BG)
                except Exception:
                    self._vlog("[--] Dependances Python : non verifiables")
                    self.card_deps.set_value("?", C_ORANGE, C_ORANGE_BG)
            else:
                self._vlog("[--] Dependances : venv requis d'abord")
                self.card_deps.set_value("Attente", C_GRAY, C_GRAY_BG)
        else:
            self._vlog("[ERREUR] requirements.txt manquant !")
            self.card_deps.set_value("Erreur", C_RED, C_RED_BG)

        # Tesseract
        tess_path = self._find_tesseract()
        if tess_path:
            try:
                r = subprocess.run(
                    [tess_path, "--version"],
                    capture_output=True, text=True,
                    creationflags=subprocess.CREATE_NO_WINDOW if sys.platform == "win32" else 0
                )
                ver_line = r.stdout.split("\n")[0] if r.stdout else "installe"
                self._vlog(f"[OK] Tesseract : {ver_line}")
                self._vlog(f"     Chemin : {tess_path}")
                self.card_tesseract.set_value("OK", C_GREEN, C_GREEN_BG)
                # Configurer pytesseract dans le venv
                self._configure_tesseract(tess_path)
            except Exception as e:
                self._vlog(f"[ERREUR] Tesseract trouve mais erreur : {e}")
                self.card_tesseract.set_value("Erreur", C_RED, C_RED_BG)
        else:
            self._vlog("[--] Tesseract : NON TROUVE")
            self._vlog("     Cherche dans : PATH, Program Files, Program Files (x86)")
            self._vlog("     Telecharger : https://github.com/UB-Mannheim/tesseract/wiki")
            self._vlog("     (L'application fonctionnera avec EasyOCR comme alternative)")
            self.card_tesseract.set_value("Absent", C_ORANGE, C_ORANGE_BG)

        # Dossiers
        self._vlog("")
        dirs_ok = True
        for d in ["uploads", "outputs", "logs", "db"]:
            p = BASE_DIR / d
            if p.exists():
                self._vlog(f"[OK] Dossier {d}/")
            else:
                self._vlog(f"[--] Dossier {d}/ : sera cree")
                dirs_ok = False

        # spaCy
        self._vlog("")
        if PYTHON_VENV.exists():
            try:
                r = subprocess.run(
                    [str(PYTHON_VENV), "-c", "import spacy; spacy.load('fr_core_news_sm'); print('OK')"],
                    capture_output=True, text=True, timeout=15,
                    creationflags=subprocess.CREATE_NO_WINDOW if sys.platform == "win32" else 0
                )
                if "OK" in r.stdout:
                    self._vlog("[OK] Modele spaCy francais installe")
                else:
                    self._vlog("[--] Modele spaCy francais : non installe")
            except Exception:
                self._vlog("[--] spaCy : non verifiable")

        # OCR engines detail
        self._vlog("")
        if PYTHON_VENV.exists():
            for module, name in [("easyocr", "EasyOCR"), ("paddleocr", "PaddleOCR")]:
                try:
                    r = subprocess.run(
                        [str(PYTHON_VENV), "-c", f"import {module}; print('OK')"],
                        capture_output=True, text=True, timeout=10,
                        creationflags=subprocess.CREATE_NO_WINDOW if sys.platform == "win32" else 0
                    )
                    if "OK" in r.stdout:
                        self._vlog(f"[OK] {name} installe")
                    else:
                        self._vlog(f"[--] {name} : non installe (optionnel)")
                except Exception:
                    self._vlog(f"[--] {name} : non installe (optionnel)")

        # Bilan
        self._vlog("")
        self._vlog("=" * 50)

        # Activer le bouton lancer si deps OK
        can_launch = (
            PYTHON_VENV.exists() and
            (BASE_DIR / "main.py").exists()
        )
        self.btn_launch.setEnabled(can_launch)
        if can_launch:
            self.header_status.setText("Pret -- Lancer le Manager")
            self.header_status.setStyleSheet(f"font-size: 13px; color: {C_GREEN}; font-weight: bold;")

    def _vlog(self, text):
        self.verify_text.append(text)

    # =====================================================================
    # Installation complete
    # =====================================================================
    def _run_full_install(self):
        python_sys = sys.executable

        steps = [
            {
                "label": "Verification de Python",
                "commands": [f'"{python_sys}" --version'],
            },
            {
                "label": "Creation de l'environnement virtuel",
                "commands": [] if VENV_DIR.exists() else [f'"{python_sys}" -m venv "{VENV_DIR}"'],
            },
            {
                "label": "Mise a jour de pip",
                "commands": [f'"{PYTHON_VENV}" -m pip install --upgrade pip'],
            },
            {
                "label": "Installation des dependances",
                "commands": [f'"{PIP_VENV}" install -r "{REQUIREMENTS}"'] if REQUIREMENTS.exists() else [],
            },
            {
                "label": "Modele spaCy francais",
                "commands": [f'"{PYTHON_VENV}" -m spacy download fr_core_news_sm'],
                "critical": False,
            },
            {
                "label": "Verification de Tesseract OCR",
                "commands": [f'"{self._find_tesseract() or "tesseract"}" --version'],
                "critical": False,
            },
            {
                "label": "Creation des dossiers",
                "commands": [],  # On les cree manuellement
            },
        ]

        # Creer les dossiers dans l'etape 7
        for d in ["uploads", "outputs", "logs", "db"]:
            (BASE_DIR / d).mkdir(parents=True, exist_ok=True)

        # Reset UI
        for si in self.steps_ui:
            si.dot.setText(str(self.steps_ui.index(si) + 1))
            si.dot.setStyleSheet(f"background-color: {C_GRAY_BG}; border: 2px solid {C_BORDER}; border-radius: 12px; font-size: 11px; font-weight: bold; color: #999;")
            si.status_label.setText("En attente")
            si.status_label.setStyleSheet("font-size: 11px; color: #999;")

        self.console.clear()
        self.progress.setValue(0)
        self.btn_install.setEnabled(False)
        self.btn_verify.setEnabled(False)
        self.btn_cancel.setEnabled(True)
        self.btn_launch.setEnabled(False)
        self.header_status.setText("Installation en cours...")
        self.header_status.setStyleSheet(f"font-size: 13px; color: {C_ORANGE}; font-weight: bold;")
        self.tabs.setCurrentIndex(0)

        self.worker = InstallWorker(steps)
        self.worker.log.connect(self._on_log)
        self.worker.step_done.connect(self._on_step_done)
        self.worker.progress.connect(self.progress.setValue)
        self.worker.finished.connect(self._on_install_finished)
        self.worker.start()

    def _on_log(self, text):
        self.console.append(text)
        cursor = self.console.textCursor()
        cursor.movePosition(QTextCursor.End)
        self.console.setTextCursor(cursor)

    def _on_step_done(self, index, success, label):
        if index < len(self.steps_ui):
            if success:
                self.steps_ui[index].set_success()
            else:
                self.steps_ui[index].set_error()

        # Marquer l'etape suivante comme en cours
        if success and index + 1 < len(self.steps_ui):
            self.steps_ui[index + 1].set_running()

    def _on_install_finished(self, success, message):
        self.btn_install.setEnabled(True)
        self.btn_verify.setEnabled(True)
        self.btn_cancel.setEnabled(False)

        if success:
            self.progress.setValue(100)
            self.header_status.setText("Installation terminee !")
            self.header_status.setStyleSheet(f"font-size: 13px; color: {C_GREEN}; font-weight: bold;")
            self._on_log(f"\n{'='*60}")
            self._on_log(f"  INSTALLATION TERMINEE AVEC SUCCES")
            self._on_log(f"{'='*60}")

            # Marquer la derniere etape
            if self.steps_ui:
                self.steps_ui[-1].set_success()

            QMessageBox.information(
                self, "Installation terminee",
                "L'installation est terminee.\n\n"
                "Cliquez sur 'Lancer le Manager' pour demarrer."
            )
        else:
            self.header_status.setText("Installation echouee")
            self.header_status.setStyleSheet(f"font-size: 13px; color: {C_RED}; font-weight: bold;")
            self._on_log(f"\n[ERREUR] {message}")
            QMessageBox.warning(self, "Erreur", f"Installation echouee :\n{message}")

        # Re-verifier
        QTimer.singleShot(500, self._run_verification)

    def _cancel_install(self):
        if self.worker:
            self.worker.cancel()
            self.btn_cancel.setEnabled(False)

    # =====================================================================
    # Lancement
    # =====================================================================
    def _launch_manager(self):
        manager_path = BASE_DIR / "manager.py"
        if not manager_path.exists():
            QMessageBox.warning(self, "Erreur", "Fichier manager.py introuvable.")
            return

        python = str(PYTHON_VENV) if PYTHON_VENV.exists() else sys.executable

        try:
            subprocess.Popen(
                [python, str(manager_path)],
                cwd=str(BASE_DIR),
                creationflags=subprocess.CREATE_NO_WINDOW | subprocess.DETACHED_PROCESS if sys.platform == "win32" else 0
            )
            QTimer.singleShot(1000, self.close)
        except Exception as e:
            QMessageBox.critical(self, "Erreur", f"Impossible de lancer le Manager :\n{e}")

    # =====================================================================
    # Utilitaires
    # =====================================================================

    def _find_tesseract(self) -> str:
        """
        Cherche l'executable Tesseract dans le PATH et les emplacements courants.
        Retourne le chemin complet ou une chaine vide.
        """
        # 1. Chercher dans le PATH systeme
        found = shutil.which("tesseract")
        if found:
            return found

        if sys.platform != "win32":
            return ""

        # 2. Chercher dans les emplacements Windows courants
        candidates = [
            r"C:\Program Files\Tesseract-OCR\tesseract.exe",
            r"C:\Program Files (x86)\Tesseract-OCR\tesseract.exe",
            r"C:\Tesseract-OCR\tesseract.exe",
            os.path.expandvars(r"%LOCALAPPDATA%\Tesseract-OCR\tesseract.exe"),
            os.path.expandvars(r"%LOCALAPPDATA%\Programs\Tesseract-OCR\tesseract.exe"),
            os.path.expandvars(r"%ProgramFiles%\Tesseract-OCR\tesseract.exe"),
        ]

        # 3. Chercher aussi via variable d'environnement custom
        env_path = os.environ.get("TESSERACT_PATH", "")
        if env_path:
            candidates.insert(0, env_path)

        # 4. Chercher dans le registre Windows
        try:
            import winreg
            for hive in [winreg.HKEY_LOCAL_MACHINE, winreg.HKEY_CURRENT_USER]:
                try:
                    key = winreg.OpenKey(hive, r"SOFTWARE\Tesseract-OCR")
                    install_dir, _ = winreg.QueryValueEx(key, "InstallDir")
                    winreg.CloseKey(key)
                    if install_dir:
                        candidates.insert(0, os.path.join(install_dir, "tesseract.exe"))
                except (FileNotFoundError, OSError):
                    pass
        except ImportError:
            pass

        for path in candidates:
            if os.path.isfile(path):
                return path

        return ""

    def _configure_tesseract(self, tess_path: str):
        """
        Configure pytesseract pour utiliser le bon chemin Tesseract.
        Ecrit un fichier tesseract_config.py et met a jour config.py.
        """
        if not tess_path:
            return

        # Ecrire le chemin dans un fichier de config dedie
        config_file = BASE_DIR / "tesseract_path.txt"
        try:
            with open(config_file, "w", encoding="utf-8") as f:
                f.write(tess_path)
        except Exception:
            pass

        # Mettre a jour config.py : remplacer la ligne TESSERACT_CMD
        config_py = BASE_DIR / "config.py"
        if config_py.exists():
            try:
                content = config_py.read_text(encoding="utf-8")
                # Remplacer la ligne TESSERACT_CMD
                import re
                escaped_path = tess_path.replace("\\", "\\\\")
                new_line = f'TESSERACT_CMD = r"{tess_path}"'
                if "TESSERACT_CMD" in content:
                    content = re.sub(
                        r'TESSERACT_CMD\s*=\s*.*',
                        new_line,
                        content
                    )
                    config_py.write_text(content, encoding="utf-8")
            except Exception:
                pass

    def _btn_style(self, bg, fg):
        return f"""
            QPushButton {{
                background-color: {bg}; color: {fg};
                border: none; border-radius: 6px;
                padding: 8px 18px; font-size: 13px; font-weight: bold;
            }}
            QPushButton:hover {{ opacity: 0.85; }}
            QPushButton:pressed {{ opacity: 0.7; }}
            QPushButton:disabled {{ background-color: #ccc; color: #888; }}
        """

    def closeEvent(self, event):
        if self.worker and self.worker.isRunning():
            reply = QMessageBox.question(
                self, "Quitter",
                "Une installation est en cours.\nArreter et quitter ?",
                QMessageBox.Yes | QMessageBox.No
            )
            if reply == QMessageBox.Yes:
                self.worker.cancel()
                self.worker.wait(3000)
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

    palette = QPalette()
    palette.setColor(QPalette.Window, QColor(C_BG))
    palette.setColor(QPalette.WindowText, QColor("#333333"))
    palette.setColor(QPalette.Base, QColor("#FFFFFF"))
    palette.setColor(QPalette.AlternateBase, QColor("#F5F5F5"))
    palette.setColor(QPalette.Button, QColor("#F0F0F0"))
    palette.setColor(QPalette.ButtonText, QColor("#333333"))
    app.setPalette(palette)

    window = InstallerWindow()
    window.show()
    sys.exit(app.exec())


if __name__ == "__main__":
    main()

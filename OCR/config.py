# -*- coding: utf-8 -*-
"""
CV Analyzer - Configuration centrale
"""

import os
from pathlib import Path

# -- Chemins ------------------------------------------------------------------
BASE_DIR = Path(__file__).resolve().parent
UPLOADS_DIR = BASE_DIR / "uploads"
OUTPUTS_DIR = BASE_DIR / "outputs"
TEMPLATES_DIR = BASE_DIR / "templates"
STATIC_DIR = BASE_DIR / "static"
DB_DIR = BASE_DIR / "db"
LOGS_DIR = BASE_DIR / "logs"

# Creation automatique des dossiers
for d in [UPLOADS_DIR, OUTPUTS_DIR, DB_DIR, LOGS_DIR]:
    d.mkdir(parents=True, exist_ok=True)

# -- Serveur ------------------------------------------------------------------
DEFAULT_HOST = "0.0.0.0"
DEFAULT_PORT = 8500
APP_TITLE = "CV Analyzer"
APP_VERSION = "1.0.0"

# -- Upload -------------------------------------------------------------------
MAX_UPLOAD_SIZE_MB = 20
ALLOWED_EXTENSIONS = {
    ".pdf", ".docx", ".doc", ".odt", ".rtf", ".txt",
    ".png", ".jpg", ".jpeg", ".webp", ".bmp", ".tiff", ".tif"
}

IMAGE_EXTENSIONS = {".png", ".jpg", ".jpeg", ".webp", ".bmp", ".tiff", ".tif"}
PDF_EXTENSIONS = {".pdf"}
DOC_EXTENSIONS = {".docx", ".doc", ".odt", ".rtf"}
TEXT_EXTENSIONS = {".txt"}

# -- OCR ----------------------------------------------------------------------
OCR_TIMEOUT_PER_PAGE = 120  # secondes
OCR_CONFIDENCE_THRESHOLD = 70.0  # pourcentage minimum
OCR_LANGUAGES = ["fr", "en", "ar"]


def _find_tesseract() -> str:
    """Auto-detecte le chemin Tesseract sur le systeme."""
    import shutil as _shutil

    # 1. Fichier de config ecrit par l'installateur
    _tess_config = BASE_DIR / "tesseract_path.txt"
    if _tess_config.exists():
        _path = _tess_config.read_text(encoding="utf-8").strip()
        if os.path.isfile(_path):
            return _path

    # 2. PATH systeme
    _found = _shutil.which("tesseract")
    if _found:
        return _found

    # 3. Emplacements Windows courants
    if os.name == "nt":
        for _candidate in [
            r"C:\Program Files\Tesseract-OCR\tesseract.exe",
            r"C:\Program Files (x86)\Tesseract-OCR\tesseract.exe",
            r"C:\Tesseract-OCR\tesseract.exe",
            os.path.expandvars(r"%LOCALAPPDATA%\Tesseract-OCR\tesseract.exe"),
            os.path.expandvars(r"%LOCALAPPDATA%\Programs\Tesseract-OCR\tesseract.exe"),
        ]:
            if os.path.isfile(_candidate):
                return _candidate

    return ""


TESSERACT_CMD = _find_tesseract()

# -- Pre-traitement image -----------------------------------------------------
TARGET_DPI = 300
MIN_DPI_THRESHOLD = 200

# -- Export --------------------------------------------------------------------
EXPORT_FORMATS = ["docx", "html", "pdf"]
CV_TEMPLATES = ["classic", "modern", "minimal"]

# -- Base de donnees -----------------------------------------------------------
DATABASE_URL = f"sqlite:///{DB_DIR / 'history.db'}"

# -- Logging -------------------------------------------------------------------
LOG_FILE = LOGS_DIR / "cv_analyzer.log"
LOG_FORMAT = "%(asctime)s | %(levelname)-8s | %(name)s | %(message)s"
LOG_DATE_FORMAT = "%Y-%m-%d %H:%M:%S"

# -*- coding: utf-8 -*-
"""
CV Analyzer - Module de detection de format et routage
Detecte le type de fichier et determine la strategie d'extraction appropriee.
"""

import os
import struct
import logging
from pathlib import Path
from typing import Dict, Optional

import config

logger = logging.getLogger("cv_analyzer.file_handler")


# Signatures binaires (magic bytes) pour detection fiable
MAGIC_SIGNATURES = {
    b"%PDF":                          "pdf",
    b"\x50\x4b\x03\x04":             "zip_based",   # DOCX, XLSX, ODP, etc.
    b"\xd0\xcf\x11\xe0":             "ole_compound", # DOC, XLS, PPT (ancien format)
    b"\x89PNG":                       "png",
    b"\xff\xd8\xff":                  "jpg",
    b"GIF87a":                        "gif",
    b"GIF89a":                        "gif",
    b"RIFF":                          "webp_candidate",
    b"BM":                            "bmp",
    b"II\x2a\x00":                    "tiff",
    b"MM\x00\x2a":                    "tiff",
    b"{\\rtf":                        "rtf",
}


class FileHandler:
    """Detecte le format d'un fichier et determine la strategie d'extraction."""

    def detect(self, file_path: Path) -> Dict:
        """
        Analyse un fichier et retourne ses informations.

        Returns:
            dict avec : extension, mime_type, category, is_image, is_scanned_pdf,
                        file_size_mb, magic_type
        """
        file_path = Path(file_path)

        if not file_path.exists():
            raise FileNotFoundError(f"Fichier introuvable : {file_path}")

        ext = file_path.suffix.lower()
        size_bytes = file_path.stat().st_size
        size_mb = round(size_bytes / (1024 * 1024), 2)

        # Detection par magic bytes
        magic_type = self._detect_magic(file_path)

        # Determiner la categorie
        category = self._categorize(ext, magic_type)

        # Pour les PDFs, verifier si scanne ou texte natif
        is_scanned_pdf = False
        pdf_page_count = 0
        if category == "pdf":
            is_scanned_pdf, pdf_page_count = self._check_pdf_type(file_path)

        info = {
            "extension": ext,
            "category": category,
            "magic_type": magic_type,
            "is_image": category == "image",
            "is_scanned_pdf": is_scanned_pdf,
            "pdf_page_count": pdf_page_count,
            "file_size_mb": size_mb,
        }

        logger.info(f"Detection : {file_path.name} -> {category} (magic={magic_type}, scanned={is_scanned_pdf})")
        return info

    def get_strategy(self, file_info: Dict) -> Dict:
        """
        Determine la strategie d'extraction en fonction du type de fichier.

        Returns:
            dict avec : method, ocr_needed, parser, preprocessing, fallback
        """
        category = file_info["category"]

        strategies = {
            "image": {
                "method": "ocr_direct",
                "ocr_needed": True,
                "parser": None,
                "preprocessing": [
                    "grayscale", "binarize", "deskew", "denoise", "upscale_dpi"
                ],
                "ocr_cascade": ["tesseract", "easyocr", "paddleocr"],
                "fallback": "enhanced_preprocessing_then_retry"
            },
            "pdf": self._pdf_strategy(file_info),
            "docx": {
                "method": "direct_parse",
                "ocr_needed": False,
                "parser": "python-docx",
                "preprocessing": [],
                "ocr_cascade": [],
                "fallback": None
            },
            "doc": {
                "method": "convert_then_parse",
                "ocr_needed": False,
                "parser": "libreoffice_convert_to_docx",
                "preprocessing": [],
                "ocr_cascade": [],
                "fallback": "antiword"
            },
            "odt": {
                "method": "convert_then_parse",
                "ocr_needed": False,
                "parser": "libreoffice_convert_to_docx",
                "preprocessing": [],
                "ocr_cascade": [],
                "fallback": None
            },
            "rtf": {
                "method": "direct_parse",
                "ocr_needed": False,
                "parser": "striprtf",
                "preprocessing": [],
                "ocr_cascade": [],
                "fallback": "libreoffice_convert"
            },
            "txt": {
                "method": "direct_read",
                "ocr_needed": False,
                "parser": "text_heuristics",
                "preprocessing": [],
                "ocr_cascade": [],
                "fallback": None
            },
        }

        strategy = strategies.get(category, {
            "method": "unknown",
            "ocr_needed": False,
            "parser": None,
            "preprocessing": [],
            "ocr_cascade": [],
            "fallback": None
        })

        logger.info(f"Strategie : {category} -> {strategy['method']}")
        return strategy

    # -------------------------------------------------------------------------
    # Methodes internes
    # -------------------------------------------------------------------------

    def _detect_magic(self, file_path: Path) -> Optional[str]:
        """Detecte le type reel via les magic bytes."""
        try:
            with open(file_path, "rb") as f:
                header = f.read(16)

            for signature, file_type in MAGIC_SIGNATURES.items():
                if header[:len(signature)] == signature:
                    # Cas special : ZIP-based -> verifier si DOCX/ODT
                    if file_type == "zip_based":
                        return self._identify_zip_based(file_path)
                    # Cas special : WEBP (RIFF + WEBP)
                    if file_type == "webp_candidate":
                        if len(header) >= 12 and header[8:12] == b"WEBP":
                            return "webp"
                        return "unknown_riff"
                    return file_type

            return None
        except Exception as e:
            logger.warning(f"Erreur detection magic bytes : {e}")
            return None

    def _identify_zip_based(self, file_path: Path) -> str:
        """Identifie le type precis d'un fichier ZIP-based (DOCX, ODT, etc.)."""
        try:
            import zipfile
            with zipfile.ZipFile(file_path, "r") as zf:
                names = zf.namelist()
                if "word/document.xml" in names:
                    return "docx"
                elif "content.xml" in names and "mimetype" in names:
                    return "odt"
                elif "xl/workbook.xml" in names:
                    return "xlsx"
                elif "ppt/presentation.xml" in names:
                    return "pptx"
                return "zip_unknown"
        except Exception:
            return "zip_corrupted"

    def _categorize(self, ext: str, magic_type: Optional[str]) -> str:
        """Determine la categorie du fichier."""
        # Priorite aux magic bytes si disponibles
        if magic_type in ("png", "jpg", "gif", "webp", "bmp", "tiff"):
            return "image"
        if magic_type == "pdf":
            return "pdf"
        if magic_type == "docx":
            return "docx"
        if magic_type == "odt":
            return "odt"
        if magic_type == "ole_compound" and ext == ".doc":
            return "doc"
        if magic_type == "rtf":
            return "rtf"

        # Fallback sur l'extension
        if ext in config.IMAGE_EXTENSIONS:
            return "image"
        if ext in config.PDF_EXTENSIONS:
            return "pdf"
        if ext == ".docx":
            return "docx"
        if ext == ".doc":
            return "doc"
        if ext == ".odt":
            return "odt"
        if ext == ".rtf":
            return "rtf"
        if ext in config.TEXT_EXTENSIONS:
            return "txt"

        return "unknown"

    def _check_pdf_type(self, file_path: Path) -> tuple:
        """
        Verifie si un PDF est texte natif ou scanne.
        Returns: (is_scanned, page_count)
        """
        try:
            import pdfplumber
            text_total = 0
            page_count = 0

            with pdfplumber.open(file_path) as pdf:
                page_count = len(pdf.pages)
                for page in pdf.pages:
                    text = page.extract_text() or ""
                    text_total += len(text.strip())

            # Heuristique : si moins de 50 caracteres par page en moyenne -> scanne
            avg_chars = text_total / max(page_count, 1)
            is_scanned = avg_chars < 50

            logger.info(f"PDF : {page_count} pages, {text_total} chars total, avg={avg_chars:.0f}/page, scanned={is_scanned}")
            return is_scanned, page_count

        except ImportError:
            logger.warning("pdfplumber non installe - impossible de verifier le type PDF")
            return False, 0
        except Exception as e:
            logger.warning(f"Erreur analyse PDF : {e}")
            return True, 0  # En cas de doute, considerer comme scanne

    def _pdf_strategy(self, file_info: Dict) -> Dict:
        """Strategie specifique pour les PDFs."""
        if file_info.get("is_scanned_pdf"):
            return {
                "method": "pdf_ocr",
                "ocr_needed": True,
                "parser": "pymupdf_to_images",
                "preprocessing": [
                    "grayscale", "binarize", "deskew", "denoise", "upscale_dpi"
                ],
                "ocr_cascade": ["tesseract", "easyocr", "paddleocr"],
                "fallback": "enhanced_preprocessing_then_retry"
            }
        else:
            return {
                "method": "pdf_text_extract",
                "ocr_needed": False,
                "parser": "pdfplumber",
                "preprocessing": [],
                "ocr_cascade": [],
                "fallback": "pymupdf"
            }

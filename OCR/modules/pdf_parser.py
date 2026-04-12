# -*- coding: utf-8 -*-
"""
CV Analyzer - Parser PDF
Extraction de texte depuis les PDFs (natif, scanne, mixte).
"""

import time
import logging
from pathlib import Path
from typing import Optional

import numpy as np

logger = logging.getLogger("cv_analyzer.pdf_parser")


class PDFParser:
    """Extraction de contenu depuis les fichiers PDF."""

    def __init__(self, ocr_engine=None, image_preprocessor=None, dpi: int = 300):
        self.ocr_engine = ocr_engine
        self.image_preprocessor = image_preprocessor
        self.dpi = dpi

    def extract(self, pdf_path: Path, force_ocr: bool = False) -> dict:
        """
        Extrait le contenu d'un fichier PDF.

        Args:
            pdf_path: chemin vers le PDF
            force_ocr: forcer l'OCR meme si du texte natif est present

        Returns:
            dict avec text, pages, page_count, is_scanned, tables, metadata, etc.
        """
        t0 = time.perf_counter()
        pdf_path = Path(pdf_path)

        if not pdf_path.exists():
            raise FileNotFoundError(f"PDF introuvable : {pdf_path}")

        result = {
            "text": "",
            "pages": [],
            "page_count": 0,
            "is_scanned": False,
            "has_images": False,
            "tables": [],
            "metadata": {},
            "processing_time_ms": 0,
            "warnings": []
        }

        # Extraire les metadonnees
        result["metadata"] = self._extract_metadata(pdf_path)

        if force_ocr:
            # Tout passer en OCR
            result = self._extract_ocr_all(pdf_path, result)
        else:
            # Mode auto : detecter page par page
            result = self._extract_auto(pdf_path, result)

        # Assembler le texte complet
        result["text"] = "\n\n".join(
            p["text"] for p in result["pages"] if p["text"].strip()
        )
        result["processing_time_ms"] = int((time.perf_counter() - t0) * 1000)

        logger.info(
            f"PDF extrait : {pdf_path.name}, {result['page_count']} pages, "
            f"scanned={result['is_scanned']}, {len(result['text'])} chars, "
            f"{result['processing_time_ms']} ms"
        )

        return result

    # -----------------------------------------------------------------
    # Extraction automatique (page par page)
    # -----------------------------------------------------------------

    def _extract_auto(self, pdf_path: Path, result: dict) -> dict:
        """Extraction page par page : texte natif si possible, OCR sinon."""
        try:
            import pdfplumber
        except ImportError:
            result["warnings"].append("pdfplumber non installe, fallback OCR total")
            return self._extract_ocr_all(pdf_path, result)

        scanned_pages = 0

        try:
            with pdfplumber.open(pdf_path) as pdf:
                result["page_count"] = len(pdf.pages)

                for i, page in enumerate(pdf.pages):
                    page_num = i + 1

                    # Tenter l'extraction texte natif
                    text = ""
                    try:
                        text = page.extract_text() or ""
                    except Exception as e:
                        logger.warning(f"Page {page_num} : extraction texte echouee : {e}")

                    # Si suffisamment de texte -> texte natif
                    if len(text.strip()) >= 50:
                        result["pages"].append({
                            "page_num": page_num,
                            "text": text.strip(),
                            "method": "text_native",
                            "confidence": 100.0
                        })

                        # Extraire les tableaux
                        try:
                            tables = page.extract_tables()
                            if tables:
                                for table in tables:
                                    result["tables"].append({
                                        "page": page_num,
                                        "data": table
                                    })
                        except Exception:
                            pass

                    else:
                        # Page scannee -> OCR
                        scanned_pages += 1
                        ocr_result = self._ocr_page(pdf_path, i)
                        result["pages"].append({
                            "page_num": page_num,
                            "text": ocr_result.get("text", ""),
                            "method": f"ocr_{ocr_result.get('engine_used', 'unknown')}",
                            "confidence": ocr_result.get("confidence", 0.0)
                        })

        except Exception as e:
            logger.error(f"Erreur pdfplumber : {e}")
            result["warnings"].append(f"Erreur pdfplumber : {e}")
            return self._extract_ocr_all(pdf_path, result)

        result["is_scanned"] = scanned_pages > 0
        result["has_images"] = scanned_pages > 0

        return result

    # -----------------------------------------------------------------
    # Extraction OCR totale
    # -----------------------------------------------------------------

    def _extract_ocr_all(self, pdf_path: Path, result: dict) -> dict:
        """Convertir toutes les pages en images et OCR."""
        try:
            import fitz  # PyMuPDF
        except ImportError:
            result["warnings"].append("PyMuPDF non installe, impossible de convertir le PDF en images")
            return result

        try:
            doc = fitz.open(str(pdf_path))
            result["page_count"] = len(doc)
            result["is_scanned"] = True

            for i in range(len(doc)):
                ocr_result = self._ocr_page(pdf_path, i)
                result["pages"].append({
                    "page_num": i + 1,
                    "text": ocr_result.get("text", ""),
                    "method": f"ocr_{ocr_result.get('engine_used', 'unknown')}",
                    "confidence": ocr_result.get("confidence", 0.0)
                })

            doc.close()

        except Exception as e:
            logger.error(f"Erreur OCR total : {e}")
            result["warnings"].append(f"Erreur OCR : {e}")

        return result

    # -----------------------------------------------------------------
    # OCR d'une seule page
    # -----------------------------------------------------------------

    def _ocr_page(self, pdf_path: Path, page_index: int) -> dict:
        """Convertit une page PDF en image puis lance l'OCR."""
        if not self.ocr_engine:
            return {"text": "", "confidence": 0.0, "engine_used": None,
                    "error": "Aucun moteur OCR configure"}

        try:
            import fitz
        except ImportError:
            return {"text": "", "confidence": 0.0, "engine_used": None,
                    "error": "PyMuPDF requis pour l'OCR de PDFs"}

        try:
            doc = fitz.open(str(pdf_path))
            page = doc[page_index]

            # Convertir en image haute resolution
            zoom = self.dpi / 72.0
            matrix = fitz.Matrix(zoom, zoom)
            pixmap = page.get_pixmap(matrix=matrix)

            # Convertir en numpy array
            img_data = pixmap.tobytes("png")
            import cv2
            arr = np.frombuffer(img_data, dtype=np.uint8)
            image = cv2.imdecode(arr, cv2.IMREAD_COLOR)

            doc.close()

            if image is None:
                return {"text": "", "confidence": 0.0, "engine_used": None,
                        "error": "Conversion page en image echouee"}

            # Pre-traitement
            if self.image_preprocessor:
                image, preprocess_meta = self.image_preprocessor.process(image)

            # OCR
            ocr_result = self.ocr_engine.extract(image)
            return ocr_result

        except Exception as e:
            logger.error(f"OCR page {page_index + 1} echoue : {e}")
            return {"text": "", "confidence": 0.0, "engine_used": None,
                    "error": str(e)}

    # -----------------------------------------------------------------
    # Metadonnees
    # -----------------------------------------------------------------

    def _extract_metadata(self, pdf_path: Path) -> dict:
        """Extrait les metadonnees du PDF."""
        meta = {}

        # Essayer PyMuPDF d'abord (plus riche)
        try:
            import fitz
            doc = fitz.open(str(pdf_path))
            raw_meta = doc.metadata or {}
            meta = {
                "title": raw_meta.get("title", ""),
                "author": raw_meta.get("author", ""),
                "subject": raw_meta.get("subject", ""),
                "creator": raw_meta.get("creator", ""),
                "producer": raw_meta.get("producer", ""),
                "creation_date": raw_meta.get("creationDate", ""),
                "modification_date": raw_meta.get("modDate", ""),
                "page_count": len(doc),
            }
            doc.close()
            return meta
        except ImportError:
            pass

        # Fallback pdfplumber
        try:
            import pdfplumber
            with pdfplumber.open(pdf_path) as pdf:
                info = pdf.metadata or {}
                meta = {
                    "title": info.get("Title", ""),
                    "author": info.get("Author", ""),
                    "creator": info.get("Creator", ""),
                    "producer": info.get("Producer", ""),
                    "page_count": len(pdf.pages),
                }
        except Exception as e:
            logger.warning(f"Extraction metadonnees echouee : {e}")

        return meta

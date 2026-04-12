# -*- coding: utf-8 -*-
"""
CV Analyzer - Moteur OCR multi-strategie
Cascade automatique : Tesseract -> EasyOCR -> PaddleOCR
"""

import time
import logging
from typing import Optional

import numpy as np

logger = logging.getLogger("cv_analyzer.ocr_engine")


class OCREngine:
    """Extraction de texte via OCR avec cascade automatique."""

    def __init__(self, confidence_threshold: float = 70.0, timeout: int = 120):
        self.confidence_threshold = confidence_threshold
        self.timeout = timeout
        self._easyocr_reader = None
        self._paddleocr_engine = None
        self.available_engines = self._detect_engines()

    # -----------------------------------------------------------------
    # Detection des moteurs disponibles
    # -----------------------------------------------------------------

    def _detect_engines(self) -> dict:
        """Detecte quels moteurs OCR sont installes."""
        engines = {}

        # Tesseract
        try:
            import pytesseract
            # Configurer le chemin auto-detecte
            try:
                import config as _cfg
                if _cfg.TESSERACT_CMD:
                    pytesseract.pytesseract.tesseract_cmd = _cfg.TESSERACT_CMD
            except Exception:
                pass
            ver = pytesseract.get_tesseract_version()
            engines["tesseract"] = {"available": True, "version": str(ver)}
            logger.info(f"Tesseract detecte : v{ver}")
        except Exception as e:
            engines["tesseract"] = {"available": False, "error": str(e)}
            logger.info(f"Tesseract non disponible : {e}")

        # EasyOCR
        try:
            import easyocr
            engines["easyocr"] = {"available": True, "version": getattr(easyocr, "__version__", "installed")}
            logger.info("EasyOCR detecte")
        except ImportError:
            engines["easyocr"] = {"available": False, "error": "non installe"}
            logger.info("EasyOCR non disponible")

        # PaddleOCR
        try:
            from paddleocr import PaddleOCR
            engines["paddleocr"] = {"available": True, "version": "installed"}
            logger.info("PaddleOCR detecte")
        except ImportError:
            engines["paddleocr"] = {"available": False, "error": "non installe"}
            logger.info("PaddleOCR non disponible")

        return engines

    # -----------------------------------------------------------------
    # API publique
    # -----------------------------------------------------------------

    def extract(self, image: np.ndarray, languages: list = None,
                force_engine: str = None) -> dict:
        """
        Extrait le texte d'une image via OCR.

        Args:
            image: image en np.ndarray (gris ou couleur)
            languages: langues cibles (defaut: ["fr", "en"])
            force_engine: forcer un moteur specifique (None = cascade auto)

        Returns:
            dict avec text, confidence, engine_used, etc.
        """
        if languages is None:
            languages = ["fr", "en"]

        t0 = time.perf_counter()

        # Mode force
        if force_engine:
            result = self._run_engine(force_engine, image, languages)
            result["processing_time_ms"] = int((time.perf_counter() - t0) * 1000)
            result["engines_tried"] = [force_engine]
            return result

        # Mode cascade
        cascade_order = ["tesseract", "easyocr", "paddleocr"]
        engines_tried = []
        best_result = None

        for engine_name in cascade_order:
            if not self.available_engines.get(engine_name, {}).get("available", False):
                logger.debug(f"Cascade : {engine_name} non disponible, passage au suivant")
                continue

            engines_tried.append(engine_name)
            logger.info(f"Cascade OCR : essai de {engine_name}...")

            try:
                result = self._run_engine(engine_name, image, languages)
            except Exception as e:
                logger.warning(f"Cascade : {engine_name} a echoue : {e}")
                continue

            confidence = result.get("confidence", 0.0)
            logger.info(f"Cascade : {engine_name} -> confiance {confidence:.1f}%")

            # Si confiance suffisante, on s'arrete
            if confidence >= self.confidence_threshold:
                result["engines_tried"] = engines_tried
                result["processing_time_ms"] = int((time.perf_counter() - t0) * 1000)
                return result

            # Sinon garder le meilleur resultat
            if best_result is None or confidence > best_result.get("confidence", 0.0):
                best_result = result

        # Aucun moteur n'a atteint le seuil : retourner le meilleur
        if best_result:
            best_result["engines_tried"] = engines_tried
            best_result["processing_time_ms"] = int((time.perf_counter() - t0) * 1000)
            logger.info(
                f"Cascade terminee : meilleur = {best_result['engine_used']} "
                f"({best_result['confidence']:.1f}%)"
            )
            return best_result

        # Aucun moteur disponible
        return {
            "text": "",
            "confidence": 0.0,
            "engine_used": None,
            "engines_tried": engines_tried,
            "language_detected": "",
            "word_count": 0,
            "processing_time_ms": int((time.perf_counter() - t0) * 1000),
            "raw_results": {},
            "error": "Aucun moteur OCR disponible. Installer Tesseract, EasyOCR ou PaddleOCR."
        }

    # -----------------------------------------------------------------
    # Moteurs individuels
    # -----------------------------------------------------------------

    def _run_engine(self, engine_name: str, image: np.ndarray, languages: list) -> dict:
        """Route vers le bon moteur."""
        handlers = {
            "tesseract": self._run_tesseract,
            "easyocr": self._run_easyocr,
            "paddleocr": self._run_paddleocr,
        }
        handler = handlers.get(engine_name)
        if handler is None:
            raise ValueError(f"Moteur OCR inconnu : {engine_name}")
        return handler(image, languages)

    def _run_tesseract(self, image: np.ndarray, languages: list) -> dict:
        """Extraction via Tesseract."""
        import pytesseract

        # Construire la chaine de langues Tesseract
        lang_map = {"fr": "fra", "en": "eng", "ar": "ara"}
        tess_langs = "+".join(lang_map.get(l, l) for l in languages)

        # Extraire avec donnees detaillees
        config = "--oem 3 --psm 6"
        try:
            data = pytesseract.image_to_data(image, lang=tess_langs, config=config,
                                              output_type=pytesseract.Output.DICT)
        except Exception as e:
            # Fallback sans langues specifiques
            logger.warning(f"Tesseract avec '{tess_langs}' echoue, essai avec 'eng' : {e}")
            data = pytesseract.image_to_data(image, lang="eng", config=config,
                                              output_type=pytesseract.Output.DICT)

        # Construire le texte et calculer la confiance
        words = []
        confidences = []
        for i, text in enumerate(data["text"]):
            text = text.strip()
            conf = int(data["conf"][i])
            if text and conf > 0:
                words.append(text)
                confidences.append(conf)

        full_text = " ".join(words)

        # Confiance moyenne ponderee
        avg_confidence = 0.0
        if confidences:
            avg_confidence = sum(confidences) / len(confidences)

        # Detection de langue simple
        detected_lang = self._guess_language(full_text)

        return {
            "text": full_text,
            "confidence": round(avg_confidence, 1),
            "engine_used": "tesseract",
            "language_detected": detected_lang,
            "word_count": len(words),
            "raw_results": {
                "word_count_raw": len(data["text"]),
                "words_above_threshold": len(confidences),
                "config": config,
                "lang": tess_langs,
            }
        }

    def _run_easyocr(self, image: np.ndarray, languages: list) -> dict:
        """Extraction via EasyOCR."""
        import easyocr

        # Cache du reader
        lang_key = tuple(sorted(languages))
        if self._easyocr_reader is None:
            logger.info(f"Initialisation EasyOCR reader ({languages})...")
            # EasyOCR utilise directement les codes ISO 639-1
            self._easyocr_reader = easyocr.Reader(list(languages), gpu=False, verbose=False)

        results = self._easyocr_reader.readtext(image, detail=1)

        texts = []
        confidences = []
        for bbox, text, conf in results:
            text = text.strip()
            if text:
                texts.append(text)
                confidences.append(conf * 100)  # Normaliser en %

        full_text = " ".join(texts)
        avg_confidence = sum(confidences) / len(confidences) if confidences else 0.0
        detected_lang = self._guess_language(full_text)

        return {
            "text": full_text,
            "confidence": round(avg_confidence, 1),
            "engine_used": "easyocr",
            "language_detected": detected_lang,
            "word_count": len(texts),
            "raw_results": {
                "detections": len(results),
                "languages_requested": languages,
            }
        }

    def _run_paddleocr(self, image: np.ndarray, languages: list) -> dict:
        """Extraction via PaddleOCR."""
        from paddleocr import PaddleOCR

        # Mapper les langues
        paddle_lang = "fr"
        if "ar" in languages:
            paddle_lang = "ar"
        elif "en" in languages and "fr" not in languages:
            paddle_lang = "en"

        if self._paddleocr_engine is None:
            logger.info(f"Initialisation PaddleOCR ({paddle_lang})...")
            self._paddleocr_engine = PaddleOCR(
                use_angle_cls=True, lang=paddle_lang,
                show_log=False, use_gpu=False
            )

        results = self._paddleocr_engine.ocr(image, cls=True)

        texts = []
        confidences = []

        if results and results[0]:
            for line in results[0]:
                if line and len(line) >= 2:
                    text = line[1][0].strip() if line[1] else ""
                    conf = line[1][1] * 100 if line[1] and len(line[1]) > 1 else 0.0
                    if text:
                        texts.append(text)
                        confidences.append(conf)

        full_text = " ".join(texts)
        avg_confidence = sum(confidences) / len(confidences) if confidences else 0.0
        detected_lang = self._guess_language(full_text)

        return {
            "text": full_text,
            "confidence": round(avg_confidence, 1),
            "engine_used": "paddleocr",
            "language_detected": detected_lang,
            "word_count": len(texts),
            "raw_results": {
                "detections": len(texts),
                "paddle_lang": paddle_lang,
            }
        }

    # -----------------------------------------------------------------
    # Utilitaires
    # -----------------------------------------------------------------

    def _guess_language(self, text: str) -> str:
        """Heuristique simple de detection de langue."""
        if not text:
            return "unknown"

        # Compter les caracteres arabes
        arabic_count = sum(1 for c in text if '\u0600' <= c <= '\u06FF')
        latin_count = sum(1 for c in text if 'a' <= c.lower() <= 'z')

        if arabic_count > latin_count:
            return "ar"

        # Heuristique FR vs EN : mots frequents
        text_lower = text.lower()
        fr_markers = ["le", "la", "les", "de", "des", "du", "un", "une", "et", "en", "est",
                       "pour", "dans", "avec", "sur", "par", "qui", "que", "ce", "au"]
        en_markers = ["the", "is", "and", "of", "to", "in", "for", "with", "on", "at",
                       "by", "this", "that", "from", "an", "are", "was"]

        words = text_lower.split()
        fr_score = sum(1 for w in words if w in fr_markers)
        en_score = sum(1 for w in words if w in en_markers)

        if fr_score > en_score:
            return "fr"
        elif en_score > fr_score:
            return "en"

        return "fr"  # Defaut : francais

# -*- coding: utf-8 -*-
"""
CV Analyzer - OCR intelligent avec analyse de layout
Detecte les colonnes, inverse les fonds sombres, trie spatialement les blocs de texte.
Utilise EasyOCR avec bounding boxes pour comprendre la structure spatiale du CV.
"""

import time
import logging
import re
from typing import List, Dict, Tuple, Optional
from pathlib import Path

import cv2
import numpy as np

logger = logging.getLogger("cv_analyzer.smart_ocr")


class SmartOCR:
    """Extraction OCR intelligente avec analyse spatiale du layout."""

    def __init__(self, languages: list = None, confidence_threshold: float = 30.0):
        self.languages = languages or ["fr", "en"]
        self.confidence_threshold = confidence_threshold
        self._reader = None

    # -----------------------------------------------------------------
    # API publique
    # -----------------------------------------------------------------

    def extract(self, image_input, raw_image=None) -> dict:
        """
        Extraction intelligente d'un CV image.

        Args:
            image_input: chemin (str/Path) ou np.ndarray
            raw_image: image originale non pre-traitee (pour inversion fond sombre)

        Returns:
            dict avec text, columns, sections, metadata, confidence
        """
        t0 = time.perf_counter()

        # Charger l'image
        if isinstance(image_input, (str, Path)):
            image = self._load_image(Path(image_input))
        elif isinstance(image_input, np.ndarray):
            image = image_input.copy()
        else:
            raise ValueError(f"Type non supporte : {type(image_input)}")

        if raw_image is None:
            raw_image = image.copy()

        h_img, w_img = image.shape[:2]

        # ---------------------------------------------------------------
        # ETAPE 1 : OCR multi-passes sur l'image complete
        # ---------------------------------------------------------------
        logger.info(f"SmartOCR : image {w_img}x{h_img}")

        # Pass 1 : image originale
        blocks_original = self._ocr_with_boxes(image)
        logger.info(f"  Pass 1 (original) : {len(blocks_original)} blocs")

        # Pass 2 : image avec inversion des zones sombres
        inverted = self._invert_dark_regions(raw_image)
        blocks_inverted = self._ocr_with_boxes(inverted)
        logger.info(f"  Pass 2 (inverted) : {len(blocks_inverted)} blocs")

        # Pass 3 : image en niveaux de gris avec binarisation agressive
        gray_binary = self._aggressive_binarize(raw_image)
        blocks_binary = self._ocr_with_boxes(gray_binary)
        logger.info(f"  Pass 3 (binary) : {len(blocks_binary)} blocs")

        # Fusionner les resultats (dedup par position)
        all_blocks = self._merge_blocks(blocks_original, blocks_inverted, blocks_binary)
        logger.info(f"  Fusion : {len(all_blocks)} blocs uniques")

        # ---------------------------------------------------------------
        # ETAPE 2 : Analyse spatiale -- detection des colonnes
        # ---------------------------------------------------------------
        columns = self._detect_columns(all_blocks, w_img)
        logger.info(f"  Colonnes detectees : {len(columns)}")

        # ---------------------------------------------------------------
        # ETAPE 3 : Tri et reconstruction du texte par colonne
        # ---------------------------------------------------------------
        structured_text = self._reconstruct_text(columns, w_img)

        # ---------------------------------------------------------------
        # ETAPE 4 : Nettoyage du texte
        # ---------------------------------------------------------------
        cleaned_text = self._clean_text(structured_text)

        # Confiance moyenne
        confidences = [b["confidence"] for b in all_blocks if b["confidence"] > 0]
        avg_conf = sum(confidences) / len(confidences) if confidences else 0.0

        elapsed = int((time.perf_counter() - t0) * 1000)

        result = {
            "text": cleaned_text,
            "confidence": round(avg_conf, 1),
            "engine_used": "smart_ocr (easyocr + layout)",
            "language_detected": self._detect_language(cleaned_text),
            "word_count": len(cleaned_text.split()),
            "processing_time_ms": elapsed,
            "blocks_count": len(all_blocks),
            "columns_count": len(columns),
            "passes": {
                "original": len(blocks_original),
                "inverted": len(blocks_inverted),
                "binary": len(blocks_binary),
                "merged": len(all_blocks),
            },
            "engines_tried": ["smart_ocr"],
        }

        logger.info(
            f"SmartOCR termine : {len(all_blocks)} blocs, {len(columns)} colonnes, "
            f"{avg_conf:.0f}% confiance, {elapsed} ms"
        )

        return result

    # -----------------------------------------------------------------
    # OCR avec bounding boxes
    # -----------------------------------------------------------------

    def _get_reader(self):
        """Initialise EasyOCR reader (cache)."""
        if self._reader is None:
            import easyocr
            logger.info(f"Initialisation EasyOCR ({self.languages})...")
            self._reader = easyocr.Reader(self.languages, gpu=False, verbose=False)
        return self._reader

    def _ocr_with_boxes(self, image: np.ndarray) -> List[dict]:
        """
        OCR avec positions spatiales.
        Retourne une liste de blocs : {text, bbox, confidence, cx, cy}
        """
        reader = self._get_reader()

        try:
            results = reader.readtext(image, detail=1, paragraph=False)
        except Exception as e:
            logger.warning(f"EasyOCR echoue : {e}")
            return []

        blocks = []
        for bbox, text, conf in results:
            text = text.strip()
            if not text or conf < self.confidence_threshold / 100.0:
                continue

            # bbox = [[x1,y1],[x2,y2],[x3,y3],[x4,y4]]
            xs = [p[0] for p in bbox]
            ys = [p[1] for p in bbox]
            x_min, x_max = min(xs), max(xs)
            y_min, y_max = min(ys), max(ys)

            blocks.append({
                "text": text,
                "bbox": {"x1": int(x_min), "y1": int(y_min),
                         "x2": int(x_max), "y2": int(y_max)},
                "confidence": conf * 100,
                "cx": (x_min + x_max) / 2,
                "cy": (y_min + y_max) / 2,
                "width": x_max - x_min,
                "height": y_max - y_min,
            })

        return blocks

    # -----------------------------------------------------------------
    # Pre-traitements specialises
    # -----------------------------------------------------------------

    def _invert_dark_regions(self, image: np.ndarray) -> np.ndarray:
        """
        Detecte les zones sombres et inverse le contraste localement.
        Crucial pour lire le texte blanc sur fond sombre (header, sidebar).
        """
        if len(image.shape) == 2:
            gray = image
        else:
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

        # Seuillage pour trouver les zones sombres (< 100 de luminosite)
        _, dark_mask = cv2.threshold(gray, 100, 255, cv2.THRESH_BINARY_INV)

        # Dilater le masque pour couvrir des regions entieres
        kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (50, 50))
        dark_regions = cv2.dilate(dark_mask, kernel, iterations=2)

        # Eroder pour nettoyer
        kernel_small = cv2.getStructuringElement(cv2.MORPH_RECT, (20, 20))
        dark_regions = cv2.erode(dark_regions, kernel_small, iterations=1)

        # Creer une copie et inverser uniquement les zones sombres
        if len(image.shape) == 3:
            result = image.copy()
            mask_3ch = cv2.cvtColor(dark_regions, cv2.COLOR_GRAY2BGR)
            inverted = cv2.bitwise_not(image)
            result = np.where(mask_3ch == 255, inverted, result)
        else:
            result = gray.copy()
            inverted = cv2.bitwise_not(gray)
            result = np.where(dark_regions == 255, inverted, result)

        return result

    def _aggressive_binarize(self, image: np.ndarray) -> np.ndarray:
        """
        Binarisation agressive pour maximiser le contraste texte/fond.
        """
        if len(image.shape) == 3:
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        else:
            gray = image.copy()

        # CLAHE pour ameliorer le contraste local
        clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8))
        enhanced = clahe.apply(gray)

        # Binarisation adaptative
        binary = cv2.adaptiveThreshold(
            enhanced, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
            cv2.THRESH_BINARY, 21, 10
        )

        return binary

    # -----------------------------------------------------------------
    # Fusion et deduplication
    # -----------------------------------------------------------------

    def _merge_blocks(self, *block_lists) -> List[dict]:
        """
        Fusionne les resultats de plusieurs passes OCR.
        Deduplique par proximite spatiale, garde le meilleur score.
        """
        all_blocks = []
        for blocks in block_lists:
            all_blocks.extend(blocks)

        if not all_blocks:
            return []

        # Trier par confiance decroissante
        all_blocks.sort(key=lambda b: b["confidence"], reverse=True)

        merged = []
        used = [False] * len(all_blocks)

        for i, block in enumerate(all_blocks):
            if used[i]:
                continue

            used[i] = True
            best = block

            # Chercher les doublons proches
            for j in range(i + 1, len(all_blocks)):
                if used[j]:
                    continue

                other = all_blocks[j]

                # Meme position approximative (chevauchement > 50%)
                if self._boxes_overlap(block["bbox"], other["bbox"], threshold=0.5):
                    used[j] = True
                    # Garder celui avec le texte le plus long a confiance comparable
                    if len(other["text"]) > len(best["text"]) and other["confidence"] > best["confidence"] * 0.8:
                        best = other

            merged.append(best)

        # Filtrer les blocs qui sont du bruit (tres courts, faible confiance)
        merged = [b for b in merged if self._is_valid_block(b)]

        return merged

    def _boxes_overlap(self, b1: dict, b2: dict, threshold: float = 0.5) -> bool:
        """Verifie si deux bounding boxes se chevauchent significativement."""
        x_overlap = max(0, min(b1["x2"], b2["x2"]) - max(b1["x1"], b2["x1"]))
        y_overlap = max(0, min(b1["y2"], b2["y2"]) - max(b1["y1"], b2["y1"]))
        overlap_area = x_overlap * y_overlap

        area1 = (b1["x2"] - b1["x1"]) * (b1["y2"] - b1["y1"])
        area2 = (b2["x2"] - b2["x1"]) * (b2["y2"] - b2["y1"])
        min_area = min(area1, area2)

        if min_area <= 0:
            return False

        return (overlap_area / min_area) > threshold

    def _is_valid_block(self, block: dict) -> bool:
        """Filtre les blocs qui sont du bruit OCR."""
        text = block["text"].strip()

        # Trop court
        if len(text) < 2:
            return False

        # Que des symboles/ponctuation
        if re.match(r'^[\s\W\d_]+$', text) and len(text) < 4:
            return False

        # Caracteres arabes isoles (bruit des icones)
        arabic_count = sum(1 for c in text if '\u0600' <= c <= '\u06FF')
        latin_count = sum(1 for c in text if c.isalpha() and not ('\u0600' <= c <= '\u06FF'))
        if arabic_count > 0 and latin_count == 0 and len(text) < 10:
            return False

        # Symboles graphiques isoles
        if text in ['©', '=', 'ms', '||', '|', '--', '~', '^', '#']:
            return False

        return True

    # -----------------------------------------------------------------
    # Analyse spatiale : detection de colonnes
    # -----------------------------------------------------------------

    def _detect_columns(self, blocks: List[dict], img_width: int) -> List[List[dict]]:
        """
        Detecte les colonnes du CV par analyse des positions horizontales.
        Un CV typique a 1 ou 2 colonnes (sidebar + corps).
        """
        if not blocks:
            return []

        # Analyser la distribution horizontale des centres
        cx_values = [b["cx"] for b in blocks]

        if not cx_values:
            return [blocks]

        # Heuristique : si les blocs sont concentres au milieu, une seule colonne
        # Sinon, chercher la frontiere entre sidebar et corps

        # Methode : histogramme des positions X
        mid_x = img_width / 2
        left_blocks = [b for b in blocks if b["cx"] < mid_x * 0.65]
        right_blocks = [b for b in blocks if b["cx"] >= mid_x * 0.65]

        # Verifier si c'est vraiment 2 colonnes (au moins 20% de blocs de chaque cote)
        total = len(blocks)
        if len(left_blocks) > total * 0.15 and len(right_blocks) > total * 0.15:
            # Trouver la frontiere precise
            separator_x = self._find_column_separator(blocks, img_width)

            left = [b for b in blocks if b["cx"] < separator_x]
            right = [b for b in blocks if b["cx"] >= separator_x]

            # Detecter le header (blocs tout en haut qui couvrent toute la largeur)
            header_blocks = []
            min_y = min(b["bbox"]["y1"] for b in blocks)
            header_threshold = min_y + img_width * 0.15  # ~15% du haut

            header = []
            left_final = []
            right_final = []

            for b in blocks:
                if b["bbox"]["y1"] < header_threshold and b["width"] > img_width * 0.3:
                    header.append(b)
                elif b["cx"] < separator_x:
                    left_final.append(b)
                else:
                    right_final.append(b)

            columns = []
            if header:
                columns.append(("header", header))
            if left_final:
                columns.append(("sidebar", left_final))
            if right_final:
                columns.append(("main", right_final))

            return columns
        else:
            # Une seule colonne
            return [("single", blocks)]

    def _find_column_separator(self, blocks: List[dict], img_width: int) -> float:
        """Trouve la position X optimale pour separer les colonnes."""
        # Creer un histogramme des gaps horizontaux
        sorted_by_x = sorted(blocks, key=lambda b: b["cx"])

        best_gap = 0
        best_x = img_width * 0.35  # defaut : 35%

        for i in range(1, len(sorted_by_x)):
            gap = sorted_by_x[i]["bbox"]["x1"] - sorted_by_x[i - 1]["bbox"]["x2"]
            cx_mid = (sorted_by_x[i]["cx"] + sorted_by_x[i - 1]["cx"]) / 2

            # La frontiere doit etre entre 25% et 50% de la largeur
            if img_width * 0.2 < cx_mid < img_width * 0.55:
                if gap > best_gap:
                    best_gap = gap
                    best_x = cx_mid

        return best_x

    # -----------------------------------------------------------------
    # Reconstruction du texte structure
    # -----------------------------------------------------------------

    def _reconstruct_text(self, columns: list, img_width: int) -> str:
        """
        Reconstruit le texte en respectant l'ordre de lecture :
        1. Header (haut, pleine largeur)
        2. Sidebar (colonne gauche) -- section par section
        3. Corps (colonne droite) -- section par section
        """
        parts = []

        for col_name, blocks in columns:
            # Trier par position Y (haut en bas)
            sorted_blocks = sorted(blocks, key=lambda b: b["bbox"]["y1"])

            # Grouper les blocs proches en lignes
            lines = self._group_into_lines(sorted_blocks)

            # Ajouter un separateur entre les colonnes
            if col_name == "sidebar":
                parts.append("\n--- SIDEBAR ---\n")
            elif col_name == "main":
                parts.append("\n--- CORPS PRINCIPAL ---\n")
            elif col_name == "header":
                parts.append("--- EN-TETE ---\n")

            for line_blocks in lines:
                # Trier les blocs de la ligne par X (gauche a droite)
                line_blocks.sort(key=lambda b: b["bbox"]["x1"])
                line_text = " ".join(b["text"] for b in line_blocks)
                parts.append(line_text)

        return "\n".join(parts)

    def _group_into_lines(self, blocks: List[dict]) -> List[List[dict]]:
        """
        Groupe les blocs qui sont sur la meme ligne (Y similaire).
        """
        if not blocks:
            return []

        lines = []
        current_line = [blocks[0]]
        current_y = blocks[0]["cy"]

        for block in blocks[1:]:
            # Meme ligne si la difference Y est < hauteur moyenne
            avg_height = np.mean([b["height"] for b in current_line])
            y_threshold = max(avg_height * 0.6, 15)

            if abs(block["cy"] - current_y) < y_threshold:
                current_line.append(block)
            else:
                lines.append(current_line)
                current_line = [block]
                current_y = block["cy"]

        if current_line:
            lines.append(current_line)

        return lines

    # -----------------------------------------------------------------
    # Nettoyage du texte
    # -----------------------------------------------------------------

    def _clean_text(self, text: str) -> str:
        """Nettoie le texte OCR brut."""
        lines = text.split("\n")
        cleaned = []

        for line in lines:
            line = line.strip()
            if not line:
                cleaned.append("")
                continue

            # Retirer les caracteres arabes isoles (bruit des icones SVG)
            line = re.sub(r'[\u0600-\u06FF]{1,3}(?:\s|$)', '', line)

            # Retirer les symboles de bruit courants
            line = re.sub(r'^[©®™•\-=_~|]+$', '', line)

            # Retirer les sequences de symboles isoles
            line = re.sub(r'\s[©®™•|=~_]\s', ' ', line)

            # Normaliser les espaces
            line = re.sub(r'\s{2,}', ' ', line)

            line = line.strip()
            if line:
                cleaned.append(line)

        # Retirer les lignes vides consecutives (max 1)
        result = []
        prev_empty = False
        for line in cleaned:
            if not line:
                if not prev_empty:
                    result.append("")
                prev_empty = True
            else:
                result.append(line)
                prev_empty = False

        return "\n".join(result).strip()

    # -----------------------------------------------------------------
    # Utilitaires
    # -----------------------------------------------------------------

    def _load_image(self, path: Path) -> np.ndarray:
        """Charge une image depuis un fichier."""
        with open(path, "rb") as f:
            data = f.read()
        arr = np.frombuffer(data, dtype=np.uint8)
        image = cv2.imdecode(arr, cv2.IMREAD_COLOR)
        if image is None:
            raise ValueError(f"Impossible de lire l'image : {path}")
        return image

    def _detect_language(self, text: str) -> str:
        """Detection de langue simple."""
        if not text:
            return "unknown"
        words = text.lower().split()
        fr = sum(1 for w in words if w in {"le", "la", "les", "de", "des", "du", "un", "une", "et", "en", "est", "pour", "dans", "avec"})
        en = sum(1 for w in words if w in {"the", "is", "and", "of", "to", "in", "for", "with", "on", "at", "by", "this"})
        if fr > en:
            return "fr"
        if en > fr:
            return "en"
        return "fr"

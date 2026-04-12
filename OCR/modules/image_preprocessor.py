# -*- coding: utf-8 -*-
"""
CV Analyzer - Pre-traitement d'images pour OCR
Pipeline configurable de traitements OpenCV.
"""

import time
import math
import logging
from pathlib import Path
from typing import Optional

import cv2
import numpy as np

logger = logging.getLogger("cv_analyzer.image_preprocessor")

# Ordre par defaut des traitements
DEFAULT_STEPS = ["grayscale", "denoise", "deskew", "binarize", "upscale_dpi"]

# Dimensions de reference pour estimation DPI (A4 en mm)
A4_WIDTH_MM = 210
A4_HEIGHT_MM = 297
INCH_TO_MM = 25.4


class ImagePreprocessor:
    """Pipeline de pre-traitement d'images avant OCR."""

    def __init__(self, target_dpi: int = 300, min_dpi_threshold: int = 200):
        self.target_dpi = target_dpi
        self.min_dpi_threshold = min_dpi_threshold

        self._step_handlers = {
            "grayscale":        self._step_grayscale,
            "denoise":          self._step_denoise,
            "deskew":           self._step_deskew,
            "binarize":         self._step_binarize,
            "upscale_dpi":      self._step_upscale_dpi,
            "remove_borders":   self._step_remove_borders,
            "enhance_contrast": self._step_enhance_contrast,
            "sharpen":          self._step_sharpen,
        }

    # -----------------------------------------------------------------
    # API publique
    # -----------------------------------------------------------------

    def process(self, image_input, steps: list = None) -> tuple:
        """
        Applique une sequence de pre-traitements.

        Args:
            image_input: chemin (str/Path) ou np.ndarray deja charge
            steps: liste ordonnee de traitements. Defaut: DEFAULT_STEPS

        Returns:
            (image_processed: np.ndarray, metadata: dict)
        """
        t0 = time.perf_counter()

        if steps is None:
            steps = list(DEFAULT_STEPS)

        # Charger l'image
        if isinstance(image_input, (str, Path)):
            image = self._load_image(Path(image_input))
            source = str(image_input)
        elif isinstance(image_input, np.ndarray):
            image = image_input.copy()
            source = "ndarray"
        else:
            raise ValueError(f"Type d'entree non supporte : {type(image_input)}")

        original_h, original_w = image.shape[:2]
        metadata = {
            "source": source,
            "original_size": {"width": original_w, "height": original_h},
            "original_channels": len(image.shape) if len(image.shape) == 2 else image.shape[2],
            "steps_applied": [],
            "steps_skipped": [],
            "skew_angle": 0.0,
            "dpi_estimated": self._estimate_dpi(original_w, original_h),
        }

        # Appliquer chaque etape
        for step_name in steps:
            handler = self._step_handlers.get(step_name)
            if handler is None:
                logger.warning(f"Etape inconnue ignoree : {step_name}")
                metadata["steps_skipped"].append(step_name)
                continue

            t_step = time.perf_counter()
            try:
                image, step_info = handler(image, metadata)
                elapsed_ms = int((time.perf_counter() - t_step) * 1000)
                metadata["steps_applied"].append({
                    "name": step_name,
                    "duration_ms": elapsed_ms,
                    "info": step_info,
                })
                logger.debug(f"Etape '{step_name}' : {elapsed_ms} ms")
            except Exception as e:
                logger.warning(f"Etape '{step_name}' echouee : {e}")
                metadata["steps_skipped"].append(step_name)

        processed_h, processed_w = image.shape[:2]
        metadata["processed_size"] = {"width": processed_w, "height": processed_h}
        metadata["processing_time_ms"] = int((time.perf_counter() - t0) * 1000)

        logger.info(
            f"Pre-traitement termine : {len(metadata['steps_applied'])} etapes, "
            f"{metadata['processing_time_ms']} ms, "
            f"{original_w}x{original_h} -> {processed_w}x{processed_h}"
        )

        return image, metadata

    def process_from_bytes(self, image_bytes: bytes, steps: list = None) -> tuple:
        """Pre-traiter une image depuis des bytes bruts."""
        arr = np.frombuffer(image_bytes, dtype=np.uint8)
        image = cv2.imdecode(arr, cv2.IMREAD_COLOR)
        if image is None:
            raise ValueError("Impossible de decoder les bytes en image.")
        return self.process(image, steps)

    # -----------------------------------------------------------------
    # Chargement
    # -----------------------------------------------------------------

    def _load_image(self, path: Path) -> np.ndarray:
        """Charge une image depuis un fichier."""
        if not path.exists():
            raise FileNotFoundError(f"Image introuvable : {path}")

        # Lire en bytes pour gerer les chemins unicode (Windows)
        with open(path, "rb") as f:
            data = f.read()

        arr = np.frombuffer(data, dtype=np.uint8)
        image = cv2.imdecode(arr, cv2.IMREAD_COLOR)

        if image is None:
            raise ValueError(f"Impossible de lire l'image : {path}")

        logger.debug(f"Image chargee : {path.name} ({image.shape[1]}x{image.shape[0]})")
        return image

    # -----------------------------------------------------------------
    # Etapes de traitement
    # -----------------------------------------------------------------

    def _step_grayscale(self, image: np.ndarray, metadata: dict) -> tuple:
        """Conversion en niveaux de gris."""
        if len(image.shape) == 2:
            return image, {"status": "deja_en_gris"}

        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        return gray, {"status": "converti"}

    def _step_denoise(self, image: np.ndarray, metadata: dict) -> tuple:
        """Debruitage."""
        if len(image.shape) == 2:
            denoised = cv2.fastNlMeansDenoising(image, None, h=10, templateWindowSize=7, searchWindowSize=21)
        else:
            denoised = cv2.fastNlMeansDenoisingColored(image, None, h=10, hForColorComponents=10)

        return denoised, {"h": 10}

    def _step_deskew(self, image: np.ndarray, metadata: dict) -> tuple:
        """Correction d'inclinaison."""
        # Travailler sur une version grise
        if len(image.shape) == 3:
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        else:
            gray = image.copy()

        # Detection d'angle via les contours
        angle = self._detect_skew_angle(gray)
        metadata["skew_angle"] = round(angle, 2)

        # Ne corriger que si l'angle est significatif mais pas aberrant
        if abs(angle) < 0.5 or abs(angle) > 15.0:
            return image, {"angle": round(angle, 2), "corrected": False, "reason": "angle hors limites"}

        # Rotation
        h, w = image.shape[:2]
        center = (w // 2, h // 2)
        matrix = cv2.getRotationMatrix2D(center, angle, 1.0)

        # Calculer la nouvelle taille pour ne rien couper
        cos_val = abs(matrix[0, 0])
        sin_val = abs(matrix[0, 1])
        new_w = int(h * sin_val + w * cos_val)
        new_h = int(h * cos_val + w * sin_val)
        matrix[0, 2] += (new_w - w) / 2
        matrix[1, 2] += (new_h - h) / 2

        bg_color = 255 if len(image.shape) == 2 else (255, 255, 255)
        rotated = cv2.warpAffine(image, matrix, (new_w, new_h),
                                  flags=cv2.INTER_CUBIC, borderValue=bg_color)

        return rotated, {"angle": round(angle, 2), "corrected": True}

    def _step_binarize(self, image: np.ndarray, metadata: dict) -> tuple:
        """Binarisation adaptative."""
        if len(image.shape) == 3:
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        else:
            gray = image.copy()

        # Essayer Otsu d'abord
        try:
            _, binary = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
            method = "otsu"
        except Exception:
            # Fallback : seuillage adaptatif
            binary = cv2.adaptiveThreshold(
                gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 11, 2
            )
            method = "adaptive_gaussian"

        return binary, {"method": method}

    def _step_upscale_dpi(self, image: np.ndarray, metadata: dict) -> tuple:
        """Redimensionnement si DPI insuffisant."""
        estimated_dpi = metadata.get("dpi_estimated", 0)

        if estimated_dpi >= self.min_dpi_threshold:
            return image, {"status": "dpi_suffisant", "dpi": estimated_dpi}

        if estimated_dpi <= 0:
            # Impossible d'estimer, upscale x1.5 par securite
            scale = 1.5
        else:
            scale = self.target_dpi / estimated_dpi

        # Limiter le facteur d'echelle
        scale = min(scale, 4.0)

        h, w = image.shape[:2]
        new_w = int(w * scale)
        new_h = int(h * scale)
        upscaled = cv2.resize(image, (new_w, new_h), interpolation=cv2.INTER_CUBIC)

        new_dpi = int(estimated_dpi * scale) if estimated_dpi > 0 else self.target_dpi
        metadata["dpi_estimated"] = new_dpi

        return upscaled, {"scale": round(scale, 2), "new_dpi": new_dpi}

    def _step_remove_borders(self, image: np.ndarray, metadata: dict) -> tuple:
        """Detection et suppression des bordures noires/grises."""
        if len(image.shape) == 3:
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        else:
            gray = image.copy()

        h, w = gray.shape
        threshold = 200  # pixels plus sombres que ca = bordure potentielle

        # Analyser les marges
        top, bottom, left, right = 0, h, 0, w

        # Haut
        for i in range(min(h // 4, 100)):
            if np.mean(gray[i, :]) > threshold:
                top = i
                break

        # Bas
        for i in range(h - 1, max(h - h // 4, h - 100), -1):
            if np.mean(gray[i, :]) > threshold:
                bottom = i + 1
                break

        # Gauche
        for j in range(min(w // 4, 100)):
            if np.mean(gray[:, j]) > threshold:
                left = j
                break

        # Droite
        for j in range(w - 1, max(w - w // 4, w - 100), -1):
            if np.mean(gray[:, j]) > threshold:
                right = j + 1
                break

        # Verifier que le crop est sense (au moins 50% de l'image)
        crop_w = right - left
        crop_h = bottom - top
        if crop_w < w * 0.5 or crop_h < h * 0.5:
            return image, {"status": "crop_trop_agressif", "skipped": True}

        cropped = image[top:bottom, left:right]
        return cropped, {
            "crop": {"top": top, "bottom": bottom, "left": left, "right": right},
            "removed_pixels": {"top": top, "bottom": h - bottom, "left": left, "right": w - right},
        }

    def _step_enhance_contrast(self, image: np.ndarray, metadata: dict) -> tuple:
        """CLAHE - amelioration adaptative du contraste."""
        if len(image.shape) == 3:
            lab = cv2.cvtColor(image, cv2.COLOR_BGR2LAB)
            l_channel = lab[:, :, 0]
            clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
            lab[:, :, 0] = clahe.apply(l_channel)
            enhanced = cv2.cvtColor(lab, cv2.COLOR_LAB2BGR)
        else:
            clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
            enhanced = clahe.apply(image)

        return enhanced, {"clip_limit": 2.0, "tile_grid": "8x8"}

    def _step_sharpen(self, image: np.ndarray, metadata: dict) -> tuple:
        """Filtre de nettete (unsharp mask)."""
        blurred = cv2.GaussianBlur(image, (0, 0), 3)
        sharpened = cv2.addWeighted(image, 1.5, blurred, -0.5, 0)
        return sharpened, {"alpha": 1.5, "beta": -0.5}

    # -----------------------------------------------------------------
    # Utilitaires
    # -----------------------------------------------------------------

    def _detect_skew_angle(self, gray: np.ndarray) -> float:
        """Detecte l'angle d'inclinaison du texte."""
        # Methode : projection de profil via Hough lines
        edges = cv2.Canny(gray, 50, 150, apertureSize=3)
        lines = cv2.HoughLinesP(edges, 1, np.pi / 180, threshold=100,
                                 minLineLength=gray.shape[1] // 4, maxLineGap=10)

        if lines is None or len(lines) == 0:
            # Fallback : minAreaRect sur les contours
            return self._detect_skew_minarea(gray)

        angles = []
        for line in lines:
            x1, y1, x2, y2 = line[0]
            if x2 - x1 == 0:
                continue
            angle = math.degrees(math.atan2(y2 - y1, x2 - x1))
            # Ne garder que les lignes quasi-horizontales
            if abs(angle) < 20:
                angles.append(angle)

        if not angles:
            return 0.0

        # Median pour robustesse
        return float(np.median(angles))

    def _detect_skew_minarea(self, gray: np.ndarray) -> float:
        """Fallback : detection d'angle via minAreaRect."""
        _, thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
        coords = np.column_stack(np.where(thresh > 0))

        if len(coords) < 100:
            return 0.0

        rect = cv2.minAreaRect(coords)
        angle = rect[-1]

        if angle < -45:
            angle = 90 + angle
        elif angle > 45:
            angle = angle - 90

        return angle

    def _estimate_dpi(self, width: int, height: int) -> int:
        """Estime le DPI en supposant un format A4 ou Letter."""
        # Supposer format A4
        dpi_w = width / (A4_WIDTH_MM / INCH_TO_MM)
        dpi_h = height / (A4_HEIGHT_MM / INCH_TO_MM)
        dpi = int(min(dpi_w, dpi_h))

        # Verifier si format paysage
        if width > height:
            dpi_w = width / (A4_HEIGHT_MM / INCH_TO_MM)
            dpi_h = height / (A4_WIDTH_MM / INCH_TO_MM)
            dpi = int(min(dpi_w, dpi_h))

        return max(dpi, 72)  # minimum 72 DPI

# -*- coding: utf-8 -*-
"""
CV Analyzer - Application FastAPI principale
"""

import uuid
import shutil
import zipfile
import logging
from pathlib import Path
from datetime import datetime

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse, FileResponse, JSONResponse
from fastapi.templating import Jinja2Templates
from starlette.requests import Request

import config
from modules.file_handler import FileHandler
from modules.image_preprocessor import ImagePreprocessor
from modules.ocr_engine import OCREngine
from modules.pdf_parser import PDFParser
from modules.docx_parser import DocumentParser
from modules.cv_structurer import CVStructurer
from modules.export_docx import DOCXExporter
from modules.export_html import HTMLExporter
from modules.export_pdf import PDFExporter
from modules.database import Database
from modules.smart_ocr import SmartOCR

# -- Logging ------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format=config.LOG_FORMAT,
    datefmt=config.LOG_DATE_FORMAT,
    handlers=[
        logging.FileHandler(config.LOG_FILE, encoding="utf-8"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger("cv_analyzer")

# -- App ----------------------------------------------------------------------
app = FastAPI(
    title=config.APP_TITLE,
    version=config.APP_VERSION,
    description="Analyseur de CV avec OCR multi-strategie et export multi-format",
    debug=True
)

# -- Middleware d'erreurs detaillees ----------------------------------------
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import PlainTextResponse
import traceback

class DebugMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        try:
            response = await call_next(request)
            return response
        except Exception as e:
            tb = traceback.format_exc()
            logger.error(f"ERREUR NON GEREE : {e}\n{tb}")
            return PlainTextResponse(
                f"ERREUR SERVEUR\n\n{type(e).__name__}: {e}\n\n{tb}",
                status_code=500
            )

app.add_middleware(DebugMiddleware)

# -- Montage static (seulement si le dossier existe) -----------------------
if config.STATIC_DIR.exists():
    app.mount("/static", StaticFiles(directory=str(config.STATIC_DIR)), name="static")

templates = Jinja2Templates(directory=str(config.TEMPLATES_DIR))

# -- Init modules (resilient) ----------------------------------------------
file_handler = FileHandler()

try:
    image_preprocessor = ImagePreprocessor(
        target_dpi=config.TARGET_DPI,
        min_dpi_threshold=config.MIN_DPI_THRESHOLD
    )
except Exception as e:
    logger.warning(f"ImagePreprocessor non disponible : {e}")
    image_preprocessor = None

try:
    ocr_engine = OCREngine(
        confidence_threshold=config.OCR_CONFIDENCE_THRESHOLD,
        timeout=config.OCR_TIMEOUT_PER_PAGE
    )
except Exception as e:
    logger.warning(f"OCREngine non disponible : {e}")
    ocr_engine = None

pdf_parser = PDFParser(
    ocr_engine=ocr_engine,
    image_preprocessor=image_preprocessor,
    dpi=config.TARGET_DPI
)
doc_parser = DocumentParser()

try:
    cv_structurer = CVStructurer()
except Exception as e:
    logger.warning(f"CVStructurer init partiel : {e}")
    cv_structurer = CVStructurer.__new__(CVStructurer)
    cv_structurer.text_extractor = __import__('modules.text_extractor', fromlist=['TextExtractor']).TextExtractor()
    cv_structurer.nlp = None

docx_exporter = DOCXExporter()
html_exporter = HTMLExporter()

try:
    pdf_exporter = PDFExporter()
except Exception as e:
    logger.warning(f"PDFExporter non disponible : {e}")
    pdf_exporter = None

db = Database()

try:
    smart_ocr = SmartOCR(languages=config.OCR_LANGUAGES[:2])
except Exception as e:
    logger.warning(f"SmartOCR non disponible : {e}")
    smart_ocr = None

# -- Stockage hybride : memoire + SQLite pour persistance ----------------
cv_store = db.load_all_to_store()

logger.info(f"=== CV Analyzer demarre ===")
logger.info(f"  TEMPLATES_DIR : {config.TEMPLATES_DIR}")
logger.info(f"  index.html existe : {(config.TEMPLATES_DIR / 'index.html').exists()}")
logger.info(f"  Modules OK : file_handler, doc_parser, docx_exporter, html_exporter")
logger.info(f"  SmartOCR : {'OK (layout-aware, multi-passes)' if smart_ocr else 'NON DISPONIBLE'}")
logger.info(f"  OCR classique : {'OK' if ocr_engine else 'NON DISPONIBLE'}")
logger.info(f"  PDF export : {'OK' if pdf_exporter else 'NON DISPONIBLE'}")


# =============================================================================
# ROUTES - Pages
# =============================================================================

@app.get("/", response_class=HTMLResponse)
async def index():
    """Page principale"""
    try:
        index_path = config.TEMPLATES_DIR / "index.html"
        if not index_path.exists():
            return HTMLResponse(
                content=f"<h1>Erreur</h1><p>Fichier introuvable : {index_path}</p>"
                        f"<p>TEMPLATES_DIR = {config.TEMPLATES_DIR}</p>"
                        f"<p>Fichiers presents : {list(config.TEMPLATES_DIR.glob('*'))}</p>",
                status_code=500
            )
        content = index_path.read_text(encoding="utf-8")
        return HTMLResponse(content=content)
    except Exception as e:
        tb = traceback.format_exc()
        logger.error(f"Erreur page index : {e}\n{tb}")
        return HTMLResponse(
            content=f"<h1>Erreur index.html</h1><pre>{tb}</pre>",
            status_code=500
        )


@app.get("/debug", response_class=HTMLResponse)
async def debug_page():
    """Page de diagnostic"""
    import platform
    lines = [
        "<html><body style='font-family:monospace;padding:20px'>",
        "<h1>CV Analyzer - Debug</h1>",
        f"<p>Python : {platform.python_version()}</p>",
        f"<p>OS : {platform.system()} {platform.release()}</p>",
        f"<p>BASE_DIR : {config.BASE_DIR}</p>",
        f"<p>TEMPLATES_DIR : {config.TEMPLATES_DIR}</p>",
        f"<p>UPLOADS_DIR : {config.UPLOADS_DIR}</p>",
        f"<p>OUTPUTS_DIR : {config.OUTPUTS_DIR}</p>",
        "<h2>Fichiers templates/</h2><ul>",
    ]
    if config.TEMPLATES_DIR.exists():
        for f in sorted(config.TEMPLATES_DIR.iterdir()):
            lines.append(f"<li>{f.name} ({f.stat().st_size} octets)</li>")
    else:
        lines.append(f"<li>DOSSIER INTROUVABLE : {config.TEMPLATES_DIR}</li>")
    lines.append("</ul>")

    lines.append("<h2>Modules</h2><ul>")
    modules_status = {
        "file_handler": file_handler is not None,
        "image_preprocessor": image_preprocessor is not None,
        "ocr_engine": ocr_engine is not None,
        "pdf_parser": pdf_parser is not None,
        "doc_parser": doc_parser is not None,
        "cv_structurer": cv_structurer is not None,
        "docx_exporter": docx_exporter is not None,
        "html_exporter": html_exporter is not None,
        "pdf_exporter": pdf_exporter is not None,
        "smart_ocr": smart_ocr is not None,
        "database": db is not None,
    }
    for name, ok in modules_status.items():
        color = "green" if ok else "red"
        lines.append(f"<li style='color:{color}'>{name} : {'OK' if ok else 'ERREUR'}</li>")
    lines.append("</ul>")

    lines.append(f"<h2>Tesseract</h2><p>{config.TESSERACT_CMD or 'NON TROUVE'}</p>")
    lines.append(f"<h2>CVs en memoire</h2><p>{len(cv_store)}</p>")

    # Test lecture index.html
    lines.append("<h2>Test index.html</h2>")
    idx = config.TEMPLATES_DIR / "index.html"
    if idx.exists():
        try:
            content = idx.read_text(encoding="utf-8")
            lines.append(f"<p style='color:green'>Lecture OK - {len(content)} caracteres</p>")
            lines.append(f"<p>Premiers 200 chars : <code>{content[:200]}</code></p>")
        except Exception as e:
            lines.append(f"<p style='color:red'>Erreur lecture : {e}</p>")
    else:
        lines.append(f"<p style='color:red'>FICHIER INTROUVABLE</p>")

    lines.append("<h2>Logs recents</h2><pre>")
    if config.LOG_FILE.exists():
        try:
            log_lines = config.LOG_FILE.read_text(encoding="utf-8", errors="replace").split("\n")
            lines.append("\n".join(log_lines[-20:]))
        except Exception:
            lines.append("Erreur lecture logs")
    lines.append("</pre>")

    lines.append("</body></html>")
    return HTMLResponse(content="\n".join(lines))


# =============================================================================
# ROUTES - API Upload
# =============================================================================

@app.post("/api/upload")
async def upload_file(file: UploadFile = File(...)):
    """Upload un fichier CV et retourne un file_id"""

    # Verifier l'extension
    ext = Path(file.filename).suffix.lower()
    if ext not in config.ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail={
                "status": "error",
                "code": "UNSUPPORTED_FORMAT",
                "message": f"Format '{ext}' non supporte.",
                "suggestions": [
                    f"Formats acceptes : {', '.join(sorted(config.ALLOWED_EXTENSIONS))}"
                ]
            }
        )

    # Verifier la taille
    content = await file.read()
    size_mb = len(content) / (1024 * 1024)
    if size_mb > config.MAX_UPLOAD_SIZE_MB:
        raise HTTPException(
            status_code=413,
            detail={
                "status": "error",
                "code": "FILE_TOO_LARGE",
                "message": f"Fichier trop volumineux ({size_mb:.1f} MB). Limite : {config.MAX_UPLOAD_SIZE_MB} MB.",
                "suggestions": ["Compresser le fichier ou reduire la resolution des images."]
            }
        )

    # Sauvegarder
    file_id = str(uuid.uuid4())[:12]
    save_dir = config.UPLOADS_DIR / file_id
    save_dir.mkdir(parents=True, exist_ok=True)
    save_path = save_dir / file.filename

    with open(save_path, "wb") as f:
        f.write(content)

    # Detecter le type
    file_info = file_handler.detect(save_path)

    # Stocker les metadonnees
    cv_store[file_id] = {
        "file_id": file_id,
        "original_filename": file.filename,
        "file_path": str(save_path),
        "file_info": file_info,
        "uploaded_at": datetime.now().isoformat(),
        "status": "uploaded",
        "cv_data": None
    }

    logger.info(f"Fichier uploade : {file.filename} -> {file_id} ({file_info['category']})")
    db.save(file_id, cv_store[file_id])

    return {
        "status": "success",
        "file_id": file_id,
        "filename": file.filename,
        "file_info": file_info
    }


# =============================================================================
# ROUTES - API Analyse
# =============================================================================

@app.post("/api/analyze/{file_id}")
async def analyze_cv(file_id: str, force_ocr: bool = False, ocr_engine_name: str = None):
    """Lancer l'extraction du texte brut depuis le CV."""
    if file_id not in cv_store:
        raise HTTPException(status_code=404, detail="Fichier non trouve.")

    entry = cv_store[file_id]
    file_info = entry["file_info"]
    file_path = Path(entry["file_path"])
    category = file_info["category"]
    strategy = file_handler.get_strategy(file_info)

    logger.info(f"Analyse lancee : {entry['original_filename']} ({category})")
    entry["status"] = "analyzing"

    try:
        extraction = {}

        # -- Images -> SmartOCR (layout-aware) avec fallback OCR classique
        if category == "image":
            import cv2
            import numpy as np

            # Charger l'image
            image = None
            with open(file_path, "rb") as f:
                data = f.read()
            arr = np.frombuffer(data, dtype=np.uint8)
            image = cv2.imdecode(arr, cv2.IMREAD_COLOR)

            if image is None:
                raise ValueError("Impossible de lire l'image.")

            raw_image = image.copy()

            # Strategie 1 : SmartOCR (layout-aware, multi-passes, inversion fond sombre)
            if smart_ocr and not ocr_engine_name:
                logger.info("Utilisation SmartOCR (layout-aware)")
                ocr_result = smart_ocr.extract(image, raw_image=raw_image)

                extraction = {
                    "text": ocr_result.get("text", ""),
                    "pages": [{
                        "page_num": 1,
                        "text": ocr_result.get("text", ""),
                        "method": "smart_ocr",
                        "confidence": ocr_result.get("confidence", 0.0)
                    }],
                    "page_count": 1,
                    "ocr_result": ocr_result,
                }

            # Strategie 2 : OCR classique (fallback ou moteur force)
            else:
                logger.info(f"Utilisation OCR classique (engine={ocr_engine_name or 'cascade'})")
                if image_preprocessor:
                    processed, preprocess_meta = image_preprocessor.process(image)
                else:
                    processed = image
                    preprocess_meta = {}

                if ocr_engine:
                    ocr_result = ocr_engine.extract(
                        processed,
                        languages=config.OCR_LANGUAGES,
                        force_engine=ocr_engine_name
                    )
                else:
                    ocr_result = {"text": "", "confidence": 0, "engine_used": "none"}

                extraction = {
                    "text": ocr_result.get("text", ""),
                    "pages": [{
                        "page_num": 1,
                        "text": ocr_result.get("text", ""),
                        "method": f"ocr_{ocr_result.get('engine_used', 'unknown')}",
                        "confidence": ocr_result.get("confidence", 0.0)
                    }],
                    "page_count": 1,
                    "ocr_result": ocr_result,
                    "preprocessing": preprocess_meta,
                }

        # -- PDFs
        elif category == "pdf":
            extraction = pdf_parser.extract(file_path, force_ocr=force_ocr)

        # -- Documents texte (DOCX, DOC, ODT, RTF, TXT)
        elif category in ("docx", "doc", "odt", "rtf", "txt"):
            extraction = doc_parser.extract(file_path)

        else:
            raise ValueError(f"Categorie non supportee : {category}")

        # -- Structuration intelligente (Phase 3) --
        raw_text = extraction.get("text", "")
        ext_meta = {
            "source_format": category,
            "ocr_engine_used": "",
            "ocr_confidence": 0.0,
            "extraction_duration_ms": extraction.get("processing_time_ms", 0),
            "page_count": extraction.get("page_count", 1),
        }

        # Recuperer les infos OCR si disponibles
        if extraction.get("ocr_result"):
            ext_meta["ocr_engine_used"] = extraction["ocr_result"].get("engine_used", "")
            ext_meta["ocr_confidence"] = extraction["ocr_result"].get("confidence", 0.0)
        elif extraction.get("pages"):
            confs = [p.get("confidence", 0) for p in extraction["pages"] if p.get("confidence", 0) > 0]
            if confs:
                ext_meta["ocr_confidence"] = sum(confs) / len(confs)
                methods = [p.get("method", "") for p in extraction["pages"]]
                ocr_methods = [m for m in methods if m.startswith("ocr_")]
                if ocr_methods:
                    ext_meta["ocr_engine_used"] = ocr_methods[0].replace("ocr_", "")

        cv_data = cv_structurer.structure(raw_text, ext_meta)

        # Mettre a jour le store
        entry["status"] = "structured"
        entry["extraction"] = extraction
        entry["cv_data"] = cv_data
        entry["strategy_used"] = strategy
        db.save(file_id, entry)

        logger.info(
            f"Analyse terminee : {entry['original_filename']}, "
            f"{len(raw_text)} chars, "
            f"completude {cv_data['extraction_metadata']['completeness_score']}%"
        )

        return {
            "status": "success",
            "file_id": file_id,
            "filename": entry["original_filename"],
            "category": category,
            "strategy": strategy,
            "extraction": extraction,
            "cv_data": cv_data,
        }

    except Exception as e:
        logger.error(f"Erreur analyse {file_id} : {e}", exc_info=True)
        entry["status"] = "error"
        entry["error"] = str(e)
        raise HTTPException(
            status_code=500,
            detail={
                "status": "error",
                "code": "EXTRACTION_FAILED",
                "message": str(e),
                "suggestions": [
                    "Verifier que le fichier n'est pas corrompu.",
                    "Essayer un autre format si possible.",
                    "Verifier que les moteurs OCR sont installes (onglet OCR du Manager)."
                ]
            }
        )


@app.post("/api/reanalyze/{file_id}")
async def reanalyze_cv(file_id: str, engine: str = None, force_ocr: bool = True):
    """Re-analyser un CV avec un moteur OCR specifique."""
    return await analyze_cv(file_id, force_ocr=force_ocr, ocr_engine_name=engine)


@app.get("/api/cv/{file_id}")
async def get_cv(file_id: str):
    """Recuperer les donnees structurees d'un CV"""
    if file_id not in cv_store:
        raise HTTPException(status_code=404, detail="Fichier non trouve.")
    return cv_store[file_id]


@app.get("/api/cv/{file_id}/structured")
async def get_cv_structured(file_id: str):
    """Recuperer uniquement le JSON structure du CV."""
    if file_id not in cv_store:
        raise HTTPException(status_code=404, detail="Fichier non trouve.")
    cv_data = cv_store[file_id].get("cv_data")
    if not cv_data:
        raise HTTPException(status_code=400, detail="CV pas encore analyse. Lancer /api/analyze/ d'abord.")
    return {"status": "success", "file_id": file_id, "cv_data": cv_data}


@app.put("/api/cv/{file_id}")
async def update_cv(file_id: str, request: Request):
    """Mettre a jour les champs du CV (corrections utilisateur)."""
    if file_id not in cv_store:
        raise HTTPException(status_code=404, detail="Fichier non trouve.")

    entry = cv_store[file_id]
    if not entry.get("cv_data"):
        raise HTTPException(status_code=400, detail="CV pas encore analyse.")

    updates = await request.json()
    cv_data = entry["cv_data"]

    # Merge recursif des mises a jour
    _deep_merge(cv_data, updates)

    # Recalculer la completude
    filled, total = cv_structurer._compute_completeness(cv_data)
    cv_data["extraction_metadata"]["fields_filled"] = filled
    cv_data["extraction_metadata"]["fields_total"] = total
    cv_data["extraction_metadata"]["completeness_score"] = round(filled / max(total, 1) * 100, 1)

    entry["status"] = "edited"
    db.update_cv_data(file_id, cv_data)
    db.update_status(file_id, "edited")
    logger.info(f"CV {file_id} mis a jour, completude {cv_data['extraction_metadata']['completeness_score']}%")

    return {"status": "success", "file_id": file_id, "cv_data": cv_data}


def _deep_merge(base: dict, updates: dict):
    """Merge recursif : les valeurs de updates ecrasent celles de base."""
    for key, value in updates.items():
        if key in base and isinstance(base[key], dict) and isinstance(value, dict):
            _deep_merge(base[key], value)
        else:
            base[key] = value


@app.delete("/api/cv/{file_id}")
async def delete_cv(file_id: str):
    """Supprimer un CV et ses fichiers"""
    if file_id not in cv_store:
        raise HTTPException(status_code=404, detail="Fichier non trouve.")

    # Supprimer les fichiers
    upload_dir = config.UPLOADS_DIR / file_id
    output_dir = config.OUTPUTS_DIR / file_id
    if upload_dir.exists():
        shutil.rmtree(upload_dir)
    if output_dir.exists():
        shutil.rmtree(output_dir)

    del cv_store[file_id]
    db.delete(file_id)
    logger.info(f"CV supprime : {file_id}")

    return {"status": "success", "message": f"CV {file_id} supprime."}


@app.get("/api/history")
async def get_history():
    """Liste des CVs uploades"""
    items = []
    for fid, data in cv_store.items():
        items.append({
            "file_id": fid,
            "filename": data["original_filename"],
            "uploaded_at": data["uploaded_at"],
            "status": data["status"],
            "category": data["file_info"]["category"]
        })
    return {"status": "success", "count": len(items), "items": items}


@app.get("/api/ocr-engines")
async def get_ocr_engines():
    """Liste des moteurs OCR disponibles"""
    engines = []

    try:
        import pytesseract
        pytesseract.get_tesseract_version()
        engines.append({"name": "tesseract", "available": True, "version": str(pytesseract.get_tesseract_version())})
    except Exception:
        engines.append({"name": "tesseract", "available": False, "version": None})

    try:
        import easyocr
        engines.append({"name": "easyocr", "available": True, "version": easyocr.__version__ if hasattr(easyocr, '__version__') else "installed"})
    except ImportError:
        engines.append({"name": "easyocr", "available": False, "version": None})

    try:
        from paddleocr import PaddleOCR
        engines.append({"name": "paddleocr", "available": True, "version": "installed"})
    except ImportError:
        engines.append({"name": "paddleocr", "available": False, "version": None})

    return {"status": "success", "engines": engines}


# =============================================================================
# ROUTES - Export
# =============================================================================

@app.post("/api/export/{file_id}")
async def export_cv(file_id: str, format: str = "docx", template: str = "classic"):
    """Exporter le CV dans le format choisi."""
    if file_id not in cv_store:
        raise HTTPException(status_code=404, detail="Fichier non trouve.")
    if format not in config.EXPORT_FORMATS:
        raise HTTPException(status_code=400, detail=f"Format invalide. Choix : {config.EXPORT_FORMATS}")
    if template not in config.CV_TEMPLATES:
        raise HTTPException(status_code=400, detail=f"Template invalide. Choix : {config.CV_TEMPLATES}")

    entry = cv_store[file_id]
    cv_data = entry.get("cv_data")
    if not cv_data:
        raise HTTPException(status_code=400, detail="CV pas encore analyse. Lancer /api/analyze/ d'abord.")

    # Dossier de sortie par file_id
    output_dir = config.OUTPUTS_DIR / file_id
    output_dir.mkdir(parents=True, exist_ok=True)

    name = cv_data.get("personal_info", {}).get("full_name", "cv") or "cv"
    name = "".join(c for c in name if c.isalnum() or c in (" ", "-", "_")).strip() or "cv"

    try:
        if format == "docx":
            output_path = output_dir / f"{name}_{template}.docx"
            docx_exporter.export(cv_data, template, output_path)
        elif format == "html":
            output_path = output_dir / f"{name}_{template}.html"
            html_exporter.export(cv_data, template, output_path)
        elif format == "pdf":
            output_path = output_dir / f"{name}_{template}.pdf"
            pdf_exporter.export(cv_data, template, output_path)
        else:
            raise ValueError(f"Format non supporte : {format}")

        # Stocker les chemins d'export
        if "exports" not in entry:
            entry["exports"] = {}
        entry["exports"][f"{format}_{template}"] = str(output_path)
        db.update_exports(file_id, entry["exports"])

        logger.info(f"Export {format}/{template} : {output_path}")

        return {
            "status": "success",
            "file_id": file_id,
            "format": format,
            "template": template,
            "download_url": f"/api/export/{file_id}/download/{format}?template={template}",
        }

    except Exception as e:
        logger.error(f"Erreur export {format}/{template} : {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail={
                "status": "error",
                "code": "EXPORT_FAILED",
                "message": str(e),
                "suggestions": [
                    "Verifier que les dependances d'export sont installees.",
                    "Pour le PDF, installer weasyprint ou xhtml2pdf."
                ]
            }
        )


@app.get("/api/export/{file_id}/download/{format}")
async def download_export(file_id: str, format: str, template: str = "classic"):
    """Telecharger un fichier exporte."""
    if file_id not in cv_store:
        raise HTTPException(status_code=404, detail="Fichier non trouve.")

    entry = cv_store[file_id]
    exports = entry.get("exports", {})
    key = f"{format}_{template}"

    if key not in exports:
        raise HTTPException(status_code=404, detail=f"Export {format}/{template} non genere.")

    file_path = Path(exports[key])
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Fichier exporte introuvable.")

    mime_types = {
        "docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "html": "text/html",
        "pdf": "application/pdf",
    }

    return FileResponse(
        path=str(file_path),
        filename=file_path.name,
        media_type=mime_types.get(format, "application/octet-stream"),
    )


@app.get("/api/preview/{file_id}/{template}")
async def preview_export(file_id: str, template: str = "classic"):
    """Preview HTML du CV pour affichage dans le navigateur."""
    if file_id not in cv_store:
        raise HTTPException(status_code=404, detail="Fichier non trouve.")

    cv_data = cv_store[file_id].get("cv_data")
    if not cv_data:
        raise HTTPException(status_code=400, detail="CV pas encore analyse.")

    if template not in config.CV_TEMPLATES:
        template = "classic"

    html = html_exporter.render_html(cv_data, template)
    return HTMLResponse(content=html)


@app.post("/api/export/{file_id}/all")
async def export_all(file_id: str, template: str = "classic"):
    """Exporter le CV dans les 3 formats et creer un ZIP."""
    if file_id not in cv_store:
        raise HTTPException(status_code=404, detail="Fichier non trouve.")

    entry = cv_store[file_id]
    cv_data = entry.get("cv_data")
    if not cv_data:
        raise HTTPException(status_code=400, detail="CV pas encore analyse.")

    if template not in config.CV_TEMPLATES:
        template = "classic"

    output_dir = config.OUTPUTS_DIR / file_id
    output_dir.mkdir(parents=True, exist_ok=True)

    name = cv_data.get("personal_info", {}).get("full_name", "cv") or "cv"
    name = "".join(c for c in name if c.isalnum() or c in (" ", "-", "_")).strip() or "cv"

    generated = []
    errors = []

    # DOCX
    try:
        p = output_dir / f"{name}_{template}.docx"
        docx_exporter.export(cv_data, template, p)
        generated.append(p)
    except Exception as e:
        errors.append(f"DOCX: {e}")

    # HTML
    try:
        p = output_dir / f"{name}_{template}.html"
        html_exporter.export(cv_data, template, p)
        generated.append(p)
    except Exception as e:
        errors.append(f"HTML: {e}")

    # PDF
    try:
        p = output_dir / f"{name}_{template}.pdf"
        pdf_exporter.export(cv_data, template, p)
        generated.append(p)
    except Exception as e:
        errors.append(f"PDF: {e}")

    if not generated:
        raise HTTPException(status_code=500, detail=f"Aucun export reussi. Erreurs : {errors}")

    # Creer le ZIP
    zip_path = output_dir / f"{name}_{template}_all.zip"
    with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zf:
        for fp in generated:
            zf.write(fp, fp.name)

    logger.info(f"ZIP multi-export : {zip_path} ({len(generated)} fichiers)")

    return FileResponse(
        path=str(zip_path),
        filename=zip_path.name,
        media_type="application/zip",
    )


# =============================================================================
# Demarrage
# =============================================================================

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host=config.DEFAULT_HOST, port=config.DEFAULT_PORT, reload=True)

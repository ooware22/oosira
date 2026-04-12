# -*- coding: utf-8 -*-
"""
CV Analyzer - Export PDF
Genere des PDFs via WeasyPrint (prioritaire) ou xhtml2pdf (fallback).
"""

import logging
from pathlib import Path

import config
from modules.export_html import HTMLExporter

logger = logging.getLogger("cv_analyzer.export_pdf")


class PDFExporter:
    """Genere des fichiers PDF a partir du JSON CV."""

    def __init__(self):
        self.html_exporter = HTMLExporter()
        self._engine = self._detect_engine()

    def _detect_engine(self) -> str:
        """Detecte le moteur PDF disponible."""
        try:
            import weasyprint
            logger.info("Moteur PDF : WeasyPrint")
            return "weasyprint"
        except ImportError:
            pass

        try:
            import xhtml2pdf.pisa
            logger.info("Moteur PDF : xhtml2pdf")
            return "xhtml2pdf"
        except ImportError:
            pass

        logger.warning("Aucun moteur PDF disponible (weasyprint ou xhtml2pdf)")
        return "none"

    def export(self, cv_data: dict, template: str = "classic",
               output_path: Path = None) -> Path:
        """Genere un fichier PDF."""
        if self._engine == "none":
            raise RuntimeError(
                "Aucun moteur PDF installe. "
                "Installer weasyprint ou xhtml2pdf via pip."
            )

        if output_path is None:
            name = cv_data.get("personal_info", {}).get("full_name", "cv") or "cv"
            name = "".join(c for c in name if c.isalnum() or c in (" ", "-", "_")).strip()
            output_path = config.OUTPUTS_DIR / f"{name}_{template}.pdf"

        output_path.parent.mkdir(parents=True, exist_ok=True)

        # Generer le HTML d'abord
        html_content = self.html_exporter.render_html(cv_data, template)

        if self._engine == "weasyprint":
            self._export_weasyprint(html_content, output_path)
        elif self._engine == "xhtml2pdf":
            self._export_xhtml2pdf(html_content, output_path)

        logger.info(f"PDF exporte : {output_path} (engine={self._engine}, template={template})")
        return output_path

    def _export_weasyprint(self, html: str, output_path: Path):
        """Export via WeasyPrint."""
        import weasyprint
        doc = weasyprint.HTML(string=html)
        doc.write_pdf(str(output_path))

    def _export_xhtml2pdf(self, html: str, output_path: Path):
        """Export via xhtml2pdf."""
        from xhtml2pdf import pisa

        with open(output_path, "wb") as f:
            result = pisa.CreatePDF(html.encode("utf-8"), dest=f, encoding="utf-8")

        if result.err:
            logger.warning(f"xhtml2pdf : {result.err} erreur(s)")

    @property
    def engine_name(self) -> str:
        return self._engine

    @property
    def is_available(self) -> bool:
        return self._engine != "none"

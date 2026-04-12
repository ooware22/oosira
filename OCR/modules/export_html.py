# -*- coding: utf-8 -*-
"""
CV Analyzer - Export HTML
Genere des fichiers HTML standalone avec 3 templates.
"""

import logging
from pathlib import Path

from jinja2 import Environment, FileSystemLoader, select_autoescape

import config

logger = logging.getLogger("cv_analyzer.export_html")


class HTMLExporter:
    """Genere des fichiers HTML autonomes a partir du JSON CV."""

    def __init__(self):
        self.env = Environment(
            loader=FileSystemLoader(str(config.TEMPLATES_DIR)),
            autoescape=select_autoescape(["html"]),
        )

    def export(self, cv_data: dict, template: str = "classic",
               output_path: Path = None) -> Path:
        """Genere un fichier HTML standalone."""
        if output_path is None:
            name = cv_data.get("personal_info", {}).get("full_name", "cv") or "cv"
            name = "".join(c for c in name if c.isalnum() or c in (" ", "-", "_")).strip()
            output_path = config.OUTPUTS_DIR / f"{name}_{template}.html"

        output_path.parent.mkdir(parents=True, exist_ok=True)

        template_file = f"cv_{template}.html"
        try:
            tpl = self.env.get_template(template_file)
        except Exception:
            logger.warning(f"Template '{template_file}' non trouve, fallback sur classic")
            tpl = self.env.get_template("cv_classic.html")

        html = tpl.render(cv=cv_data)

        with open(output_path, "w", encoding="utf-8") as f:
            f.write(html)

        logger.info(f"HTML exporte : {output_path} (template={template})")
        return output_path

    def render_html(self, cv_data: dict, template: str = "classic") -> str:
        """Retourne le HTML sans sauvegarder (pour preview)."""
        template_file = f"cv_{template}.html"
        try:
            tpl = self.env.get_template(template_file)
        except Exception:
            tpl = self.env.get_template("cv_classic.html")
        return tpl.render(cv=cv_data)

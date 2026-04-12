# CV Analyzer

Analyseur de CV avec OCR multi-strategie et export multi-format (DOCX, HTML, PDF).
Application web localhost avec interface PySide6 de gestion.

## Installation rapide (Windows)

1. Double-cliquer sur `install.bat`
2. Installer Tesseract OCR : https://github.com/UB-Mannheim/tesseract/wiki
3. Lancer le Manager : `launch.bat`
4. Ou lancer le serveur directement : `start_server.bat`
5. Ouvrir http://localhost:8500

## Prerequis

- Python 3.11+
- Tesseract OCR (recommande, pas obligatoire si EasyOCR installe)

## Fonctionnalites

- Upload drag & drop : PDF, DOCX, DOC, ODT, RTF, TXT, PNG, JPG, TIFF, BMP, WEBP
- OCR en cascade : Tesseract -> EasyOCR -> PaddleOCR (optionnel)
- Pre-traitement d'image : grayscale, denoise, deskew, binarize, upscale DPI
- Structuration intelligente du CV en JSON (NLP spaCy + regex multilingue FR/EN/AR)
- Formulaire editable avec accordions
- Export en 3 formats : DOCX, HTML, PDF
- 3 templates : Classique (ATS), Moderne (sidebar), Minimaliste
- ZIP multi-export (3 formats d'un coup)
- Dark mode
- Historique persistant (SQLite)
- Manager PySide6 (demarrage serveur, verification OCR, logs)

## API Endpoints

    GET  /                              Page web principale
    POST /api/upload                    Upload fichier
    POST /api/analyze/{file_id}         Lancer l'analyse OCR + structuration
    GET  /api/cv/{file_id}              Recuperer le CV complet
    GET  /api/cv/{file_id}/structured   JSON structure uniquement
    PUT  /api/cv/{file_id}              Mettre a jour les champs
    DELETE /api/cv/{file_id}            Supprimer un CV
    GET  /api/history                   Historique des CVs
    GET  /api/ocr-engines               Moteurs OCR disponibles
    POST /api/reanalyze/{file_id}       Re-analyser avec un moteur specifique
    POST /api/export/{file_id}          Exporter (params: format, template)
    GET  /api/export/{file_id}/download/{format}  Telecharger
    GET  /api/preview/{file_id}/{template}        Preview HTML
    POST /api/export/{file_id}/all      ZIP multi-export

## Structure

    cv-analyzer/
      main.py             FastAPI (serveur web)
      manager.py           PySide6 (interface de gestion)
      config.py            Configuration
      modules/
        file_handler.py    Detection de format (magic bytes)
        image_preprocessor.py  Pipeline OpenCV
        ocr_engine.py      Cascade Tesseract/EasyOCR/PaddleOCR
        pdf_parser.py      Extraction PDF (texte + OCR)
        docx_parser.py     Parsing DOCX/DOC/ODT/RTF/TXT
        text_extractor.py  Regex emails/tel/dates/sections
        cv_structurer.py   NLP + assemblage JSON normalise
        export_docx.py     Generation Word
        export_html.py     Generation HTML
        export_pdf.py      Generation PDF
        database.py        Persistance SQLite
      templates/
        index.html         Interface web
        cv_classic.html    Template CV classique
        cv_modern.html     Template CV moderne
        cv_minimal.html    Template CV minimaliste

## Troubleshooting

Tesseract non trouve :
  - Windows : installer depuis le lien ci-dessus, ajouter au PATH
  - Verifier avec : tesseract --version

PDF export echoue :
  - xhtml2pdf est installe par defaut (fallback)
  - Pour un meilleur rendu : pip install weasyprint

Fichier .doc non supporte :
  - Installer LibreOffice pour la conversion automatique
  - https://www.libreoffice.org/

Port 8500 deja utilise :
  - Changer le port dans le Manager (onglet Port)
  - Ou modifier DEFAULT_PORT dans config.py

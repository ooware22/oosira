# -*- coding: utf-8 -*-
"""
CV Analyzer - Extraction robuste de champs depuis le texte brut
Supporte CVs FR/EN/AR, formats algeriens, OCR bruite.
"""

import re
import unicodedata
import logging
from typing import List, Dict, Tuple, Optional

logger = logging.getLogger("cv_analyzer.text_extractor")

# =========================================================================
# MOTS-CLES DE SECTIONS (13 categories)
# =========================================================================
SECTION_KEYWORDS = {
    "personal": {
        "fr": ["informations personnelles", "coordonnees", "contact",
               "infos personnelles", "donnees personnelles", "etat civil"],
        "en": ["personal information", "contact information",
               "contact details", "personal details"],
    },
    "summary": {
        "fr": ["profil", "resume", "synthese", "objectif",
               "objectif professionnel", "a propos", "presentation"],
        "en": ["summary", "profile", "objective", "professional summary",
               "overview", "about me", "executive summary"],
    },
    "experience": {
        "fr": ["experience professionnelle", "experiences professionnelles",
               "experiences", "parcours professionnel", "emplois",
               "experience de travail", "postes occupes", "experience",
               "activites professionnelles"],
        "en": ["work experience", "professional experience",
               "employment history", "career history", "experience",
               "academic and professional experiences"],
    },
    "education": {
        "fr": ["formation", "formations", "etudes", "diplomes", "cursus",
               "parcours academique", "scolarite", "formation academique",
               "education et formation"],
        "en": ["education", "academic background", "qualifications",
               "degrees", "educational background",
               "education and training", "education and formation"],
    },
    "skills": {
        "fr": ["competences", "competences techniques", "aptitudes",
               "savoir-faire", "expertise", "competences professionnelles",
               "connaissances", "connaissances techniques", "logiciels",
               "outils informatiques", "competences informatiques",
               "maitrise des logiciels"],
        "en": ["skills", "technical skills", "core competencies",
               "expertise", "key skills", "computer skills",
               "personal skills and competences", "software"],
    },
    "languages": {
        "fr": ["langues", "competences linguistiques", "langues parlees",
               "langues maitrisees"],
        "en": ["languages", "language skills", "language proficiency"],
    },
    "certifications": {
        "fr": ["certifications", "certificats", "formations complementaires",
               "formations continues"],
        "en": ["certifications", "certificates", "licenses",
               "professional development"],
    },
    "stages": {
        "fr": ["stages", "stages pratiques", "stage"],
        "en": ["internships", "practical training"],
    },
    "projects": {
        "fr": ["projets", "realisations", "principaux projets", "travaux"],
        "en": ["projects", "portfolio", "achievements", "key projects"],
    },
    "publications": {
        "fr": ["publications", "communications", "travaux scientifiques"],
        "en": ["publications", "papers",
               "publications and communications",
               "list of scientific works"],
    },
    "interests": {
        "fr": ["centres d'interet", "loisirs", "hobbies", "divers",
               "centres d interet", "informations complementaires"],
        "en": ["interests", "hobbies", "miscellaneous"],
    },
    "references": {
        "fr": ["references", "recommandations"],
        "en": ["references", "recommendations"],
    },
    "regulations": {
        "fr": ["reglements", "reglements et codes",
               "reglements et codes maitrises", "codes maitrises"],
        "en": ["regulations", "standards", "codes"],
    },
}

# =========================================================================
# PATTERNS
# =========================================================================
EMAIL_RE = re.compile(r'[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}')
PHONE_PATTERNS = [
    re.compile(r'\+\d{1,3}[\s.\-]?\d{2,4}[\s.\-]?\d{2,4}[\s.\-]?\d{2,4}[\s.\-]?\d{0,4}'),
    re.compile(r'0\d[\s.\-]?\d{2,3}[\s.\-]?\d{2,3}[\s.\-]?\d{2,3}[\s.\-]?\d{0,3}'),
]
URL_RE = re.compile(r'https?://[^\s<>"\']+|www\.[^\s<>"\']+\.[a-zA-Z]{2,}')
LINKEDIN_RE = re.compile(r'(?:https?://)?(?:www\.)?linkedin\.com/in/[\w\-]+/?', re.I)

MONTHS = {
    "janvier": "01", "fevrier": "02", "février": "02", "mars": "03",
    "avril": "04", "mai": "05", "juin": "06", "juillet": "07",
    "aout": "08", "août": "08", "septembre": "09", "octobre": "10",
    "novembre": "11", "decembre": "12", "décembre": "12",
    "janv": "01", "jan": "01", "fev": "02", "févr": "02",
    "avr": "04", "juil": "07", "sept": "09", "oct": "10",
    "nov": "11", "dec": "12", "mar": "03",
    "january": "01", "february": "02", "march": "03", "april": "04",
    "may": "05", "june": "06", "july": "07", "august": "08",
    "september": "09", "october": "10", "november": "11", "december": "12",
    "jun": "06", "jul": "07", "aug": "08", "sep": "09",
    "feb": "02", "apr": "04",
}
_M = sorted(MONTHS.keys(), key=len, reverse=True)
_MRE = "|".join(re.escape(m) for m in _M)

CURRENT_MARKERS = {
    "present", "actuel", "actuelle", "en cours", "current", "now",
    "aujourd'hui", "aujourd hui", "ce jour", "a ce jour",
    "jusqu'a present", "to date", "ongoing",
}

# Personal field patterns
RE_DOB = re.compile(
    r'(?:n[ée]e?\s+le|date\s+(?:et\s+lieu\s+)?de\s+naissance|'
    r'date\s+and\s+place\s+of\s+birth)\s*:?\s*'
    r'(\d{1,2}[/.\-]\d{1,2}[/.\-]\d{4}|\d{1,2}\s+\w+\s+\d{4})',
    re.I
)
RE_NATIONALITY = re.compile(r'(?:nationalit[ée]|nationality)\s*:?\s*(\w[\w\s]{2,30})', re.I)
RE_MARITAL = re.compile(r'(?:situation\s+familiale|family\s+status)\s*:?\s*(\w[\w\s]{2,20})', re.I)
RE_MILITARY = re.compile(r'(d[ée]gag[ée]\s+du\s+service\s+national|disponible\s+imm[ée]diatement)', re.I)
RE_LICENSE = re.compile(r'(?:permis\s+de\s+conduire|driving\s+licen[sc]e)\s*:?\s*(.{2,40})', re.I)
RE_AGE_MARITAL = re.compile(r'(\d{2})\s*ans?\s*[-–,]\s*(\w+)', re.I)

LANG_LEVELS = {
    "natif": "Natif", "native": "Natif", "maternelle": "Natif",
    "langue maternelle": "Natif", "mother tongue": "Natif",
    "bilingue": "Bilingue", "bilingual": "Bilingue",
    "courant": "Courant", "fluent": "Courant",
    "avance": "Avance", "advanced": "Avance",
    "intermediaire": "Intermediaire", "intermediate": "Intermediaire",
    "moyen": "Intermediaire", "niveau moyen": "Intermediaire",
    "debutant": "Debutant", "beginner": "Debutant",
    "elementaire": "Debutant", "scolaire": "Debutant",
    "initiation": "Debutant",
    "c2": "C2", "c1": "C1", "c1-c2": "C1-C2",
    "b2": "B2", "b1": "B1", "a2-b1": "A2-B1", "a2- b1": "A2-B1",
    "a2": "A2", "a1": "A1",
    "bien": "Bien", "tres bien": "Tres bien",
    "tres bonne maitrise": "Expert", "bonne maitrise": "Avance",
    "parle et ecrit": "Courant", "oral et ecrit": "Courant",
}


class TextExtractor:

    def extract(self, raw_text: str) -> dict:
        if not raw_text or not raw_text.strip():
            return {"emails": [], "phones": [], "urls": [], "linkedin": "",
                    "sections": [], "personal_fields": {},
                    "detected_language": "unknown", "line_count": 0, "char_count": 0}

        text = raw_text.strip()
        emails = sorted({m.group(0).lower().rstrip(".,;:") for m in EMAIL_RE.finditer(text)})
        phones = self._extract_phones(text)
        urls = sorted({m.group(0).rstrip(".,;:)") for m in URL_RE.finditer(text)})
        li = LINKEDIN_RE.search(text)
        linkedin = ("https://" + li.group(0)) if li and not li.group(0).startswith("http") else (li.group(0) if li else "")
        personal = self._extract_personal_fields(text)
        sections = self._detect_sections(text)
        lang = self._detect_language(text)

        logger.info(f"Extraction : {len(emails)} emails, {len(phones)} tel, {len(sections)} sections, lang={lang}")
        return {"emails": emails, "phones": phones, "urls": urls,
                "linkedin": linkedin, "sections": sections,
                "personal_fields": personal, "detected_language": lang,
                "line_count": text.count("\n") + 1, "char_count": len(text)}

    def _extract_phones(self, text: str) -> list:
        phones, seen = [], set()
        for pat in PHONE_PATTERNS:
            for m in pat.finditer(text):
                p = m.group(0).strip()
                key = re.sub(r'[^\d]', '', p)
                if len(key) >= 8 and key not in seen:
                    seen.add(key)
                    phones.append(p)
        return phones

    def _extract_personal_fields(self, text: str) -> dict:
        f = {}
        m = RE_DOB.search(text)
        if m: f["date_of_birth"] = m.group(1).strip()
        m = RE_NATIONALITY.search(text)
        if m and len(m.group(1).strip()) < 40: f["nationality"] = m.group(1).strip().rstrip(".,;")
        m = RE_MARITAL.search(text)
        if m: f["marital_status"] = m.group(1).strip().rstrip(".,;")
        m = RE_AGE_MARITAL.search(text)
        if m: f.setdefault("marital_status", m.group(2).strip())
        m = RE_MILITARY.search(text)
        if m: f["military_service"] = m.group(0).strip()
        m = RE_LICENSE.search(text)
        if m and len(m.group(1).strip()) < 60: f["driving_license"] = m.group(1).strip().rstrip(".,;")
        name, title = self._guess_name_title(text)
        if name: f["full_name"] = name
        if title: f["professional_title"] = title
        return f

    def _guess_name_title(self, text: str) -> Tuple[str, str]:
        skip = {"curriculum vitae", "cv", "resume", ""}
        ignore_start = ("adresse", "email", "e-mail", "telephone", "tel.",
                         "tel ", "tél", "nationalit", "date", "situation",
                         "permis", "ne le", "née le", "degag", "disponible",
                         "first name", "address", "phone", "nationality",
                         "sex", "numero", "numéro", "cité", "cite")
        candidates = []
        for line in text.split("\n")[:15]:
            c = line.strip()
            if c.lower() in skip or c.startswith("---"):
                continue
            if "@" in c or c.startswith(("http", "www")):
                continue
            if re.match(r'^[\d\+\(]', c) and len(c) < 20:
                continue
            low = c.lower()
            if any(low.startswith(x) for x in ignore_start):
                continue
            if c and len(c) > 2:
                candidates.append(c)

        if not candidates:
            return "", ""

        first = candidates[0]
        name, title = first, ""

        # "NOM Prenom  TITRE PRO" separe par espaces multiples
        parts = re.split(r'\s{3,}|\t', first)
        if len(parts) >= 2:
            name = parts[0].strip()
            title = parts[1].strip()
        elif len(candidates) > 1:
            words = first.split()
            if 1 <= len(words) <= 6 and len(first) < 60:
                name = first
                second = candidates[1]
                if len(second) < 80 and not re.search(r'\d{4}', second):
                    title = second

        return name, title

    # -----------------------------------------------------------------
    # Sections
    # -----------------------------------------------------------------
    def _detect_sections(self, text: str) -> list:
        lines = text.split("\n")
        sections = []
        current = None
        exp_seen = False

        for i, line in enumerate(lines):
            clean = line.strip()
            if not clean:
                continue

            stype, slang = self._match_header(clean)

            if stype:
                # Desambiguation : "competences" avant experience = possible summary
                if stype == "skills" and not exp_seen:
                    nxt = [l.strip() for l in lines[i+1:i+8] if l.strip()]
                    has_bullets = any(l.startswith(("-", "*", ">", "•")) for l in nxt)
                    has_commas = any("," in l for l in nxt)
                    if not has_bullets and not has_commas and nxt:
                        avg = sum(len(l) for l in nxt) / len(nxt)
                        if avg > 80:
                            stype = "summary"

                if stype == "experience":
                    exp_seen = True

                if current:
                    sections.append(current)
                current = {"type": stype, "title": clean, "content": "",
                           "start_line": i, "language": slang}
            elif current:
                current["content"] += ("\n" if current["content"] else "") + clean

        if current:
            sections.append(current)

        if not sections:
            sections.append({"type": "unknown", "title": "", "content": text.strip(),
                             "start_line": 0, "language": self._detect_language(text)})

        logger.info(f"Sections : {[s['type'] for s in sections]}")
        return sections

    def _match_header(self, line: str) -> Tuple[Optional[str], Optional[str]]:
        if len(line) > 120:
            return None, None
        cleaned = line.rstrip(":.- ›»→")
        norm = self._normalize(cleaned)
        low = cleaned.lower().strip()

        for stype, ld in SECTION_KEYWORDS.items():
            for lang, kws in ld.items():
                for kw in kws:
                    kn = self._normalize(kw)
                    if norm == kn or low == kw:
                        return stype, lang
                    if len(line) < 80 and len(kn) > 5 and kn in norm:
                        return stype, lang
                    if len(kn) > 5 and norm.startswith(kn):
                        return stype, lang
        return None, None

    def _normalize(self, text: str) -> str:
        t = text.lower().strip()
        n = unicodedata.normalize('NFKD', t)
        a = n.encode('ASCII', 'ignore').decode('ASCII')
        return re.sub(r'[^a-z0-9\s]', '', a).strip()

    def _detect_language(self, text: str) -> str:
        if not text:
            return "unknown"
        if sum(1 for c in text if '\u0600' <= c <= '\u06FF') > 20:
            return "ar"
        w = text.lower().split()
        fr = sum(1 for x in w if x in {"le","la","les","de","des","du","un","une","et","en","est","pour","dans","avec"})
        en = sum(1 for x in w if x in {"the","is","and","of","to","in","for","with","on","at","by","this","that"})
        return "fr" if fr >= en else ("en" if en > fr else "fr")

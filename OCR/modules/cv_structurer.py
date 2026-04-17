# -*- coding: utf-8 -*-
"""
CV Analyzer - Structuration robuste du CV en JSON normalise
Pipeline : LLM (Gemini) -> Fallback (TextExtractor -> NLP -> Assemblage -> Validation)
"""

import re
import json
import time
import logging
from typing import Dict, List, Optional

try:
    import google.generativeai as genai
except ImportError:
    genai = None

from config import GEMINI_API_KEY
from modules.text_extractor import TextExtractor, MONTHS, CURRENT_MARKERS, LANG_LEVELS

logger = logging.getLogger("cv_analyzer.cv_structurer")

# Mots-cles de diplomes
DEGREE_KW = {
    "doctorat", "phd", "these", "master", "mastere", "magister",
    "licence", "bachelor", "ingenieur", "ingenierie", "bts", "dut",
    "bac", "baccalaureat", "dea", "dess", "mba", "diplome",
    "certificat", "deug", "engineer", "degree", "diploma",
}

# Logiciels connus (pour separation skills)
SOFTWARE_KW = {
    "word", "excel", "powerpoint", "power point", "office",
    "autocad", "solidworks", "catia", "ansys", "matlab", "simulink",
    "photoshop", "illustrator", "indesign", "in design",
    "robot bat", "robot structural", "plaxis", "talren", "k-rea",
    "revit", "archicad", "sketchup",
    "power bi", "tableau", "sap", "oracle", "salesforce",
    "jira", "confluence", "figma", "trello", "git",
    "visual studio", "vscode", "eclipse", "netbeans",
    "ubuntu", "linux", "windows", "unix",
    "covadis", "surfer", "arcmap", "qgis", "hydrolab", "hyfran",
    "windev", "delphi",
}

# Technologies/langages de programmation
TECH_KW = {
    "python", "java", "javascript", "typescript", "c++", "c#", "php",
    "ruby", "go", "rust", "swift", "kotlin", "scala", "r", "sql",
    "nosql", "html", "css", "react", "angular", "vue", "vuejs",
    "node", "nodejs", "django", "flask", "fastapi", "spring",
    "laravel", "yii", "symfony", ".net", "asp.net", "asp",
    "docker", "kubernetes", "aws", "azure", "gcp",
    "mongodb", "postgresql", "mysql", "redis", "elasticsearch",
    "tensorflow", "pytorch", "pandas", "numpy", "jquery", "ajax",
    "bootstrap", "tailwind", "react native", "flutter",
    "pl/sql", "transact sql", "entity framework", "ado.net",
    "visual basic", "vb.net", "turbo pascal", "fortran",
    "merise", "uml",
}

KNOWN_LANGUAGES = {
    "francais", "french", "français", "anglais", "english",
    "arabe", "arabic", "espagnol", "spanish", "allemand", "german",
    "italien", "italian", "portugais", "chinois", "japonais",
    "russe", "turc", "neerlandais", "coreen", "hindi",
    "berbere", "tamazight", "kabyle", "lingala", "kituba",
}


def _empty_cv() -> dict:
    return {
        "personal_info": {
            "full_name": "", "first_name": "", "last_name": "",
            "email": "", "phone": "", "phone2": "",
            "address": "", "city": "", "country": "",
            "date_of_birth": "", "nationality": "",
            "linkedin": "", "portfolio_url": "",
            "marital_status": "", "military_service": "",
            "driving_license": "",
        },
        "professional_title": "",
        "summary": "",
        "experience": [],
        "education": [],
        "skills": {"technical": [], "soft": [], "software": [],
                   "languages": [], "certifications": []},
        "stages": [],
        "projects": [],
        "publications": [],
        "interests": [],
        "references": [],
        "regulations_codes": [],
        "raw_text": "",
        "extraction_metadata": {
            "source_format": "", "ocr_engine_used": "",
            "ocr_confidence": 0.0, "extraction_duration_ms": 0,
            "detected_language": "", "page_count": 0,
            "structuring_duration_ms": 0,
            "fields_filled": 0, "fields_total": 0,
            "completeness_score": 0.0,
            "sections_detected": [],
            "parsing_warnings": [],
        },
    }


# =========================================================================
# PATTERNS DE DATES POUR LE PARSING D'ENTREES
# =========================================================================
_M_NAMES = sorted(MONTHS.keys(), key=len, reverse=True)
_MRE = "|".join(re.escape(m) for m in _M_NAMES)
_CUR = "|".join(re.escape(m) for m in CURRENT_MARKERS)

# Debut d'entree experience/education
ENTRY_PATTERNS = [
    # "Du Avril 2025 Au Août 2025 :"
    re.compile(rf'(?:du\s+)?({_MRE})\.?\s+(\d{{4}})\s+(?:au?|Au?)\s+({_MRE})\.?\s+(\d{{4}})', re.I),
    # "Oct 2024-Janv 2025" / "JUILLET 2022 – JUILLET 2023"
    re.compile(rf'({_MRE})\.?\s+(\d{{4}})\s*[-–—›→]+\s*({_MRE})\.?\s+(\d{{4}})', re.I),
    # "Déc 2025- En cours" / "Aout 2022 à ce jour"
    re.compile(rf'({_MRE})\.?\s+(\d{{4}})\s*[-–—›→àa]\s*(?:{_CUR})', re.I),
    # "17/11/2009 → 06/02/2016"
    re.compile(r'(\d{1,2}/\d{1,2}/\d{4})\s*[-–—›→]+\s*(\d{1,2}/\d{1,2}/\d{4})'),
    # "2014-2016"
    re.compile(r'\b((?:19|20)\d{2})\s*[-–—]\s*((?:19|20)\d{2})\b'),
    # "Janvier 2004 :" ou "Mars 2015 :"
    re.compile(rf'({_MRE})\.?\s+(\d{{4}})\s*:', re.I),
    # "06/02/2016" en debut
    re.compile(r'^(\d{1,2}/\d{1,2}/\d{4})'),
    # "2006 :" annee seule
    re.compile(r'^((?:19|20)\d{2})\s*:'),
    # "Année : 2020-2022"
    re.compile(r'ann[ée]e\s*:\s*((?:19|20)\d{2})\s*[-–]\s*((?:19|20)\d{2})', re.I),
    # "Année : 2017"
    re.compile(r'ann[ée]e\s*:\s*((?:19|20)\d{2})', re.I),
]


class CVStructurer:

    def __init__(self):
        self.text_extractor = TextExtractor()
        self.nlp = self._load_spacy()

    def _load_spacy(self):
        for model in ["fr_core_news_sm", "en_core_web_sm"]:
            try:
                import spacy
                nlp = spacy.load(model)
                logger.info(f"spaCy charge : {model}")
                return nlp
            except Exception:
                continue
        logger.warning("spaCy non disponible, mode regex pur")
        return None

    # -----------------------------------------------------------------
    # API publique
    # -----------------------------------------------------------------
    def structure(self, raw_text: str, extraction_metadata: dict = None) -> dict:
        t0 = time.perf_counter()
        
        # 1. Attempt LLM structuring first if available
        llm_cv = self._structure_with_llm(raw_text)
        if llm_cv:
            cv = llm_cv
            cv["raw_text"] = raw_text
            if not "extraction_metadata" in cv:
                 cv["extraction_metadata"] = _empty_cv()["extraction_metadata"]
                 cv["extraction_metadata"]["sections_detected"] = ["LLM_PARSED"]
        else:
            # 2. Fallback to Regex / spaCy pipeline
            logger.info("Falling back to regex/spaCy CV structurer.")
            cv = _empty_cv()
            cv["raw_text"] = raw_text

            if not raw_text or not raw_text.strip():
                return cv

            extracted = self.text_extractor.extract(raw_text)
            nlp_ents = self._run_nlp(raw_text) if self.nlp else {}

            self._fill_personal(cv, extracted, nlp_ents, raw_text)
            self._fill_summary(cv, extracted)
            self._fill_experience(cv, extracted)
            self._fill_education(cv, extracted)
            self._fill_stages(cv, extracted)
            self._fill_skills(cv, extracted)
            self._fill_languages(cv, extracted)
            self._fill_certifications(cv, extracted)
            self._fill_projects(cv, extracted)
            self._fill_publications(cv, extracted)
            self._fill_interests(cv, extracted)
            self._fill_references(cv, extracted)
            self._fill_regulations(cv, extracted)
            cv["extraction_metadata"]["detected_language"] = extracted.get("detected_language", "")
            cv["extraction_metadata"]["sections_detected"] = [s["type"] for s in extracted.get("sections", [])]

        meta = cv["extraction_metadata"]
        meta["structuring_duration_ms"] = int((time.perf_counter() - t0) * 1000)

        if extraction_metadata:
            for k in ("source_format", "ocr_engine_used", "ocr_confidence",
                       "extraction_duration_ms", "page_count"):
                if k in extraction_metadata:
                    meta[k] = extraction_metadata[k]

        filled, total = self._compute_completeness(cv)
        meta["fields_filled"] = filled
        meta["fields_total"] = total
        meta["completeness_score"] = round(filled / max(total, 1) * 100, 1)

        logger.info(f"Structuration : {meta['structuring_duration_ms']} ms, "
                     f"completude {meta['completeness_score']}%")
        return cv

    # -----------------------------------------------------------------
    # LLM Structuring
    # -----------------------------------------------------------------
    def _structure_with_llm(self, raw_text: str) -> Optional[dict]:
        """Uses Gemini API to structure the CV perfectly."""
        if not genai or not GEMINI_API_KEY:
            logger.warning("Gemini API skipped: No token or missing package.")
            return None
        
        try:
            logger.info("Attempting CV structuring with Gemini API...")
            genai.configure(api_key=GEMINI_API_KEY)
            
            # Using gemini-2.5-flash as it's the current fast/free tier and easily does JSON
            model = genai.GenerativeModel('gemini-2.5-flash', generation_config={"response_mime_type": "application/json"})
            
            empty = _empty_cv()
            schema_keys = json.dumps(empty, indent=2)
            
            prompt = f"""Extract the data from this raw OCR CV text into the exact JSON format provided below.
            Rules:
            1. ONLY answer with valid JSON. Do not include markdown blocks or any other text.
            2. If you cannot find a field, output an empty string "" or empty array [].
            3. Fix obvious OCR typos (e.g. 'Inforrnatique' -> 'Informatique').
            4. Make sure dates are separated from titles, and experiences are properly separated from education.
            5. In 'skills', list individual skills instead of long sentences.

            JSON Schema format:
            {schema_keys}

            Raw OCR Text:
            {raw_text}
            """
            
            response = model.generate_content(prompt)
            data = json.loads(response.text)
            
            # Ensure safe nested dicts exist
            if "skills" not in data:
                data["skills"] = empty["skills"]
            if "personal_info" not in data:
                data["personal_info"] = empty["personal_info"]
            if "extraction_metadata" not in data:
                data["extraction_metadata"] = empty["extraction_metadata"]
                
            return data
        except Exception as e:
            logger.error(f"Gemini LLM Structuring failed: {str(e)}")
            return None

    # -----------------------------------------------------------------
    # NLP
    # -----------------------------------------------------------------
    def _run_nlp(self, text: str) -> dict:
        ents = {"persons": [], "orgs": [], "locs": []}
        try:
            doc = self.nlp(text[:50000])
            for e in doc.ents:
                n = e.text.strip()
                if not n:
                    continue
                if e.label_ in ("PER", "PERSON"):
                    ents["persons"].append(n)
                elif e.label_ == "ORG":
                    ents["orgs"].append(n)
                elif e.label_ in ("LOC", "GPE"):
                    ents["locs"].append(n)
        except Exception as ex:
            logger.warning(f"NLP erreur : {ex}")
        return ents

    # -----------------------------------------------------------------
    # Personal info
    # -----------------------------------------------------------------
    def _fill_personal(self, cv, ext, nlp_ents, raw):
        info = cv["personal_info"]
        pf = ext.get("personal_fields", {})

        # Emails
        emails = ext.get("emails", [])
        if emails:
            info["email"] = emails[0]

        # Telephones
        phones = ext.get("phones", [])
        if phones:
            info["phone"] = phones[0]
        if len(phones) > 1:
            info["phone2"] = phones[1]

        # LinkedIn / portfolio
        info["linkedin"] = ext.get("linkedin", "")
        for url in ext.get("urls", []):
            if "linkedin" not in url.lower():
                info["portfolio_url"] = url
                break

        # Champs detectes par text_extractor
        for field in ("date_of_birth", "nationality", "marital_status",
                       "military_service", "driving_license"):
            if pf.get(field):
                info[field] = pf[field]

        # Nom
        name = pf.get("full_name", "")
        if not name and nlp_ents.get("persons"):
            name = nlp_ents["persons"][0]
        info["full_name"] = name

        # Separer prenom / nom
        parts = name.split()
        if len(parts) >= 2:
            # Si un mot est tout en majuscules -> nom de famille
            uppers = [p for p in parts if p.isupper() and len(p) > 1]
            if uppers:
                info["last_name"] = uppers[-1].title()
                others = [p for p in parts if p != uppers[-1]]
                info["first_name"] = " ".join(others)
            else:
                info["first_name"] = parts[0]
                info["last_name"] = " ".join(parts[1:])
        elif parts:
            info["first_name"] = parts[0]

        # Titre professionnel
        cv["professional_title"] = pf.get("professional_title", "")

        # Ville / adresse via NLP
        if nlp_ents.get("locs"):
            locs = nlp_ents["locs"]
            info["city"] = locs[0]
            if len(locs) > 1:
                info["country"] = locs[-1]

        # Adresse brute
        for line in raw.split("\n")[:15]:
            low = line.strip().lower()
            if low.startswith(("adresse", "address")):
                addr = re.sub(r'^(?:adresse|address)\s*:?\s*', '', line.strip(), flags=re.I)
                if addr:
                    info["address"] = addr
                break

    # -----------------------------------------------------------------
    # Summary
    # -----------------------------------------------------------------
    def _fill_summary(self, cv, ext):
        for s in ext.get("sections", []):
            if s["type"] == "summary":
                cv["summary"] = s["content"].strip()
                return

    # -----------------------------------------------------------------
    # Experience
    # -----------------------------------------------------------------
    def _fill_experience(self, cv, ext):
        content = ""
        for s in ext.get("sections", []):
            if s["type"] == "experience":
                content += ("\n\n" if content else "") + s["content"]
        if not content:
            return

        entries = self._parse_dated_entries(content)
        for e in entries:
            exp = {
                "job_title": e.get("title", ""),
                "company": e.get("company", ""),
                "company_description": e.get("company_desc", ""),
                "contract_type": e.get("contract_type", ""),
                "location": e.get("location", ""),
                "start_date": e.get("start", ""),
                "end_date": e.get("end", ""),
                "is_current": e.get("is_current", False),
                "description": e.get("description", ""),
                "achievements": e.get("achievements", []),
            }
            if exp["job_title"] or exp["company"]:
                cv["experience"].append(exp)

        logger.info(f"Experience : {len(cv['experience'])} entrees")

    # -----------------------------------------------------------------
    # Education
    # -----------------------------------------------------------------
    def _fill_education(self, cv, ext):
        content = ""
        for s in ext.get("sections", []):
            if s["type"] == "education":
                content += ("\n\n" if content else "") + s["content"]
        if not content:
            return

        entries = self._parse_dated_entries(content)
        for e in entries:
            edu = {
                "degree": e.get("title", ""),
                "field_of_study": "",
                "institution": e.get("company", ""),
                "location": e.get("location", ""),
                "start_date": e.get("start", ""),
                "end_date": e.get("end", ""),
                "grade": "",
                "description": e.get("description", ""),
                "thesis_title": "",
            }
            # Chercher "these" ou "memoire" dans les achievements
            for ach in e.get("achievements", []):
                low = ach.lower()
                if "these" in low or "memoire" in low or "thème" in low or "theme" in low:
                    edu["thesis_title"] = ach
                elif not edu["description"]:
                    edu["description"] = ach

            if edu["degree"] or edu["institution"]:
                cv["education"].append(edu)

        logger.info(f"Education : {len(cv['education'])} entrees")

    # -----------------------------------------------------------------
    # Stages
    # -----------------------------------------------------------------
    def _fill_stages(self, cv, ext):
        content = ""
        for s in ext.get("sections", []):
            if s["type"] == "stages":
                content += ("\n\n" if content else "") + s["content"]
        if not content:
            return

        # Format : "ENTREPRISE [description]\nDuree : X, Annee : Y"
        lines = content.split("\n")
        current = None

        for line in lines:
            clean = line.strip()
            if not clean:
                continue

            # Detecter "Duree : X, Annee : Y"
            dur_match = re.search(r'dur[ée]e\s*:\s*(.+?)(?:,|$)', clean, re.I)
            year_match = re.search(r'ann[ée]e\s*:\s*(\d{4})', clean, re.I)

            if dur_match or year_match:
                if current:
                    if dur_match:
                        current["duration"] = dur_match.group(1).strip()
                    if year_match:
                        current["year"] = year_match.group(1)
            else:
                # Nouvelle entree ou entree datee
                entry_match = self._try_entry_patterns(clean)
                if entry_match or (not current and clean):
                    if current:
                        cv["stages"].append(current)
                    current = {
                        "company": clean,
                        "duration": "",
                        "year": "",
                        "description": "",
                    }
                    if entry_match:
                        current["year"] = entry_match.get("start", "")
                        rest = entry_match.get("rest", "")
                        if rest:
                            current["company"] = rest
                elif current:
                    if current["description"]:
                        current["description"] += " " + clean
                    else:
                        current["description"] = clean

        if current:
            cv["stages"].append(current)

    # -----------------------------------------------------------------
    # Skills (separation software / technical / soft)
    # -----------------------------------------------------------------
    def _fill_skills(self, cv, ext):
        content = ""
        for s in ext.get("sections", []):
            if s["type"] == "skills":
                content += ("\n" if content else "") + s["content"]
        if not content:
            return

        items = self._extract_list_items(content)
        technical, software, soft = [], [], []

        for item in items:
            low = item.lower().strip()
            # Ignorer les sous-titres de section
            if any(low.startswith(x) for x in [
                "langues", "langue", "language", "bureautique",
                "langage informatique", "logiciel"
            ]):
                # Extraire le contenu apres le ":"
                after = re.split(r'[›:]\s*', item, maxsplit=1)
                if len(after) > 1 and after[1].strip():
                    sub_items = [s.strip() for s in after[1].split(",") if s.strip()]
                    for si in sub_items:
                        self._classify_skill(si, technical, software, soft)
                continue

            # Lignes avec niveaux de maitrise -> software
            level_match = re.search(r'\(([^)]+maitrise[^)]*|initiation)\)', low)
            if level_match:
                name = re.sub(r'\s*\([^)]*\)\s*', '', item).strip()
                if name:
                    software.append(f"{name} ({level_match.group(1).strip()})")
                continue

            # Items separes par virgules
            sub_items = [s.strip() for s in item.split(",") if s.strip()]
            for si in sub_items:
                self._classify_skill(si, technical, software, soft)

        cv["skills"]["technical"] = technical
        cv["skills"]["software"] = software
        cv["skills"]["soft"] = soft

    def _classify_skill(self, item: str, tech: list, soft_list: list, soft: list):
        low = item.lower().strip()
        if any(sw in low for sw in SOFTWARE_KW):
            soft_list.append(item.strip())
        elif any(t in low for t in TECH_KW):
            tech.append(item.strip())
        elif len(low) < 40:
            tech.append(item.strip())

    # -----------------------------------------------------------------
    # Languages
    # -----------------------------------------------------------------
    def _fill_languages(self, cv, ext):
        content = ""
        for s in ext.get("sections", []):
            if s["type"] == "languages":
                content = s["content"]
                break

        # Aussi chercher dans la section skills si elle contient "langues"
        if not content:
            for s in ext.get("sections", []):
                if s["type"] == "skills" and "langue" in s["content"].lower():
                    # Extraire la sous-section langues
                    lines = s["content"].split("\n")
                    in_lang = False
                    lang_lines = []
                    for line in lines:
                        low = line.strip().lower()
                        if "langue" in low:
                            in_lang = True
                            # Contenu apres "Langues :" sur la meme ligne
                            after = re.split(r'[›:]\s*', line, maxsplit=1)
                            if len(after) > 1 and after[1].strip():
                                lang_lines.append(after[1].strip())
                            continue
                        if in_lang:
                            if any(x in low for x in ["logiciel", "bureautique",
                                                        "langage", "software"]):
                                break
                            lang_lines.append(line.strip())
                    content = "\n".join(lang_lines)
                    break

        if not content:
            return

        self._parse_languages(content, cv)

    def _parse_languages(self, content: str, cv: dict):
        """Parse les langues depuis le texte avec detection multi-format."""
        lines = content.split("\n")

        for line in lines:
            clean = line.strip()
            if not clean or len(clean) < 3:
                continue

            # Format "Anglais : Bien, Français : Très bien, Arabe : Très bien"
            if clean.count(":") >= 2 and "," in clean:
                parts = clean.split(",")
                for part in parts:
                    self._parse_single_lang(part.strip(), cv)
                continue

            # Format "Native language Arabic" / "Other languages English, French"
            m = re.match(r'(?:native\s+language|other\s+languages?)\s+(.+)', clean, re.I)
            if m:
                for lang_name in re.split(r'[,;]', m.group(1)):
                    lang_name = lang_name.strip()
                    if lang_name:
                        cv["skills"]["languages"].append({
                            "language": lang_name, "level": "", "details": ""
                        })
                continue

            # Format "Français, Anglais" (liste simple sans niveaux)
            if ":" not in clean and "," in clean:
                for lang_name in clean.split(","):
                    lang_name = lang_name.strip()
                    if lang_name.lower() in KNOWN_LANGUAGES:
                        cv["skills"]["languages"].append({
                            "language": lang_name, "level": "", "details": ""
                        })
                continue

            # Format "Arabe : oral et écrit : bien."
            self._parse_single_lang(clean, cv)

    def _parse_single_lang(self, text: str, cv: dict):
        """Parse une seule entree de langue."""
        text = text.strip().rstrip(".,;")
        if not text or len(text) < 3:
            return

        # Trouver la langue
        lang_name = ""
        for kl in KNOWN_LANGUAGES:
            if kl in text.lower():
                lang_name = kl.capitalize()
                break

        if not lang_name:
            parts = re.split(r'[:\-›]', text, maxsplit=1)
            if parts:
                lang_name = parts[0].strip()

        if not lang_name:
            return

        # Trouver le niveau
        level = ""
        details = ""
        text_low = text.lower()
        # Chercher du plus specifique au moins specifique
        for marker, lvl in sorted(LANG_LEVELS.items(), key=lambda x: len(x[0]), reverse=True):
            if marker in self._normalize_accents(text_low):
                level = lvl
                break

        # Details supplementaires
        if "oral" in text_low and "ecrit" in text_low:
            details = "oral et ecrit"
        elif "ecrit" in text_low:
            details = "ecrit"
        elif "oral" in text_low or "parle" in text_low:
            details = "oral"

        cv["skills"]["languages"].append({
            "language": lang_name,
            "level": level,
            "details": details,
        })

    def _normalize_accents(self, text: str) -> str:
        import unicodedata
        return unicodedata.normalize('NFKD', text).encode('ASCII', 'ignore').decode('ASCII')

    # -----------------------------------------------------------------
    # Certifications
    # -----------------------------------------------------------------
    def _fill_certifications(self, cv, ext):
        content = ""
        for s in ext.get("sections", []):
            if s["type"] == "certifications":
                content = s["content"]
                break
        if not content:
            return

        items = self._extract_list_items(content)
        for item in items:
            cert = {"name": item.strip(), "issuer": "", "date": ""}
            # Extraire la date si presente
            m = re.search(r'((?:19|20)\d{2})', item)
            if m:
                cert["date"] = m.group(1)
            cv["skills"]["certifications"].append(cert)

    # -----------------------------------------------------------------
    # Projects, Publications, Interests, References, Regulations
    # -----------------------------------------------------------------
    def _fill_projects(self, cv, ext):
        for s in ext.get("sections", []):
            if s["type"] == "projects":
                items = self._extract_list_items(s["content"])
                for item in items:
                    cv["projects"].append({
                        "name": item.strip()[:100],
                        "description": item.strip(),
                        "technologies": [], "url": "",
                    })

    def _fill_publications(self, cv, ext):
        for s in ext.get("sections", []):
            if s["type"] == "publications":
                items = self._extract_list_items(s["content"])
                cv["publications"] = [i.strip() for i in items if i.strip()]

    def _fill_interests(self, cv, ext):
        for s in ext.get("sections", []):
            if s["type"] == "interests":
                items = self._extract_list_items(s["content"])
                cv["interests"] = [i.strip() for i in items if i.strip()]

    def _fill_references(self, cv, ext):
        for s in ext.get("sections", []):
            if s["type"] == "references":
                cv["references"] = [s["content"].strip()]

    def _fill_regulations(self, cv, ext):
        for s in ext.get("sections", []):
            if s["type"] == "regulations":
                items = self._extract_list_items(s["content"])
                cv["regulations_codes"] = [i.strip() for i in items if i.strip()]

    # =================================================================
    # PARSER GENERIQUE D'ENTREES DATEES (experience + education)
    # =================================================================
    def _parse_dated_entries(self, content: str) -> list:
        """Parse un bloc de texte en entrees individuelles basees sur les dates."""
        lines = content.split("\n")
        entries = []
        current = None

        for line in lines:
            clean = line.strip()
            if not clean:
                continue

            # Tenter de matcher un debut d'entree
            match_info = self._try_entry_patterns(clean)

            if match_info:
                if current:
                    entries.append(current)
                current = {
                    "start": match_info.get("start", ""),
                    "end": match_info.get("end", ""),
                    "is_current": match_info.get("is_current", False),
                    "title": "",
                    "company": "",
                    "company_desc": "",
                    "contract_type": "",
                    "location": "",
                    "description": "",
                    "achievements": [],
                }
                rest = match_info.get("rest", "")
                if rest:
                    self._parse_job_line(rest, current)
            elif current:
                # Contenu de l'entree courante
                if clean.startswith(("-", "*", ">", "•", "·")):
                    ach = clean.lstrip("-*>•· ").strip()
                    if ach and len(ach) > 3:
                        current["achievements"].append(ach)
                elif re.match(r'^\d+[\-.)]\s*', clean):
                    ach = re.sub(r'^\d+[\-.)]\s*', '', clean).strip()
                    if ach:
                        current["achievements"].append(ach)
                else:
                    self._add_detail(clean, current)

        if current:
            entries.append(current)

        return entries

    def _try_entry_patterns(self, line: str) -> Optional[dict]:
        """Teste si la ligne matche un pattern de debut d'entree."""
        for i, pat in enumerate(ENTRY_PATTERNS):
            m = pat.search(line)
            if not m:
                continue

            groups = m.groups()
            rest = line[m.end():].strip().lstrip(":›-–— ").strip()
            is_current = any(mk in line.lower() for mk in CURRENT_MARKERS)

            if i == 0:  # Du X Au Y
                start = self._format_month_year(groups[0], groups[1])
                end = self._format_month_year(groups[2], groups[3])
                return {"start": start, "end": end, "is_current": is_current, "rest": rest}
            elif i == 1:  # Month YYYY - Month YYYY
                start = self._format_month_year(groups[0], groups[1])
                end = self._format_month_year(groups[2], groups[3])
                return {"start": start, "end": end, "is_current": is_current, "rest": rest}
            elif i == 2:  # Month YYYY - present
                start = self._format_month_year(groups[0], groups[1])
                return {"start": start, "end": "En cours", "is_current": True, "rest": rest}
            elif i == 3:  # DD/MM/YYYY - DD/MM/YYYY
                return {"start": groups[0], "end": groups[1], "is_current": is_current, "rest": rest}
            elif i == 4:  # YYYY-YYYY
                return {"start": groups[0], "end": groups[1], "is_current": is_current, "rest": rest}
            elif i == 5:  # Month YYYY :
                start = self._format_month_year(groups[0], groups[1])
                return {"start": start, "end": "", "is_current": is_current, "rest": rest}
            elif i == 6:  # DD/MM/YYYY
                return {"start": groups[0], "end": "", "is_current": is_current, "rest": rest}
            elif i == 7:  # YYYY :
                return {"start": groups[0], "end": "", "is_current": is_current, "rest": rest}
            elif i == 8:  # Annee : YYYY-YYYY
                return {"start": groups[0], "end": groups[1], "is_current": is_current, "rest": rest}
            elif i == 9:  # Annee : YYYY
                return {"start": groups[0], "end": "", "is_current": is_current, "rest": rest}

        return None

    def _format_month_year(self, month_str: str, year: str) -> str:
        m = MONTHS.get(month_str.lower().rstrip("."), "")
        if m:
            return f"{year}-{m}"
        return year

    def _parse_job_line(self, line: str, entry: dict):
        """Extrait poste + entreprise depuis une ligne."""
        if not line:
            return

        # Extraire type de contrat entre parentheses
        ct_match = re.search(r'\((CDI|CDD[^)]*|Stage|Freelance|Int[ée]rim[^)]*)\)', line, re.I)
        if ct_match:
            entry["contract_type"] = ct_match.group(1).strip()
            line = line[:ct_match.start()].strip() + " " + line[ct_match.end():].strip()
            line = line.strip()

        # "Occupation du poste « TITRE » auprès de ENTREPRISE"
        m = re.search(r'(?:occupation\s+du\s+poste|poste)\s*[«"](.*?)[»"]', line, re.I)
        if m:
            entry["title"] = m.group(1).strip()
            after = line[m.end():]
            cm = re.search(r'(?:aupr[eè]s\s+de|chez|au\s+sein\s+de)\s+(.*?)(?:\(|,|$)', after, re.I)
            if cm:
                entry["company"] = cm.group(1).strip().rstrip(".,;:")
            return

        # "POSTE › ENTREPRISE"
        if "›" in line:
            parts = line.split("›", 1)
            entry["title"] = parts[0].strip()
            entry["company"] = parts[1].strip() if len(parts) > 1 else ""
            return

        # "POSTE auprès de/chez/au sein de ENTREPRISE"
        m = re.search(r'(.+?)\s+(?:aupr[eè]s\s+de|chez|au\s+sein\s+de)\s+(.*?)(?:\(|,|$)', line, re.I)
        if m:
            entry["title"] = m.group(1).strip()
            entry["company"] = m.group(2).strip().rstrip(".,;:")
            return

        # "POSTE à ENTREPRISE" (quand c'est court)
        m = re.match(r'(.+?)\s+[àa]\s+([A-Z].*)', line)
        if m and len(line) < 80:
            entry["title"] = m.group(1).strip()
            entry["company"] = m.group(2).strip()
            return

        # Ligne en MAJUSCULES = probablement entreprise
        if line.isupper() and len(line) < 70:
            if not entry["company"]:
                entry["company"] = line
            return

        # "Freelancer :" ou titre simple
        if not entry["title"]:
            entry["title"] = line.strip().rstrip(":")

    def _add_detail(self, line: str, entry: dict):
        """Ajoute une ligne de detail a l'entree courante."""
        # Description d'entreprise (entre tirets)
        m = re.match(r'^[-–—]\s*(.+?)\s*[-–—]$', line)
        if m:
            entry["company_desc"] = m.group(1).strip()
            return

        # "Bureau d'étude spécialisé..." -> description entreprise
        if (line.lower().startswith(("bureau d", "entreprise", "societe", "société")) and
                len(line) < 100 and not entry["company_desc"]):
            entry["company_desc"] = line
            return

        # Si titre et company pas encore remplis
        if not entry["title"] and len(line) < 80:
            self._parse_job_line(line, entry)
        elif not entry["company"] and len(line) < 60 and not re.search(r'[.!?]$', line):
            entry["company"] = line.strip()
        else:
            if entry["description"]:
                entry["description"] += " " + line
            else:
                entry["description"] = line

    # -----------------------------------------------------------------
    # Utilitaires
    # -----------------------------------------------------------------
    def _extract_list_items(self, content: str) -> list:
        items = []
        for line in content.split("\n"):
            clean = line.strip()
            if not clean:
                continue
            if clean.startswith(("-", "*", ">", "•", "·")):
                items.append(clean.lstrip("-*>•· ").strip())
            elif "," in clean or ";" in clean:
                for part in re.split(r'[,;]', clean):
                    p = part.strip()
                    if p and len(p) > 1:
                        items.append(p)
            else:
                items.append(clean)
        return items

    def _compute_completeness(self, cv: dict) -> tuple:
        filled, total = 0, 0
        for key in ("full_name", "email", "phone"):
            total += 1
            if cv["personal_info"].get(key):
                filled += 1
        total += 1
        if cv.get("professional_title"):
            filled += 1
        total += 1
        if cv.get("summary"):
            filled += 1
        total += 1
        if cv.get("experience"):
            filled += 1
        total += 1
        if cv.get("education"):
            filled += 1
        total += 1
        if cv["skills"].get("technical") or cv["skills"].get("software"):
            filled += 1
        total += 1
        if cv["skills"].get("languages"):
            filled += 1
        total += 1
        if cv.get("stages"):
            filled += 1
        return filled, total

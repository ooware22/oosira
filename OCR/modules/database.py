# -*- coding: utf-8 -*-
"""
CV Analyzer - Module base de donnees SQLite
Persistance des CVs analyses entre les redemarrages.
"""

import json
import sqlite3
import logging
from pathlib import Path
from datetime import datetime
from typing import Optional, List, Dict

import config

logger = logging.getLogger("cv_analyzer.database")

DB_PATH = config.DB_DIR / "history.db"

CREATE_TABLE = """
CREATE TABLE IF NOT EXISTS cv_history (
    file_id TEXT PRIMARY KEY,
    original_filename TEXT NOT NULL,
    file_path TEXT,
    file_info TEXT,
    cv_data TEXT,
    extraction TEXT,
    strategy_used TEXT,
    exports TEXT,
    status TEXT DEFAULT 'uploaded',
    uploaded_at TEXT,
    updated_at TEXT
);
"""


class Database:
    """Gestionnaire SQLite pour la persistance des CVs."""

    def __init__(self, db_path: Path = None):
        self.db_path = db_path or DB_PATH
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        self._init_db()

    def _init_db(self):
        """Initialise la base et cree la table si necessaire."""
        with self._connect() as conn:
            conn.execute(CREATE_TABLE)
            conn.commit()
        logger.info(f"Base de donnees initialisee : {self.db_path}")

    def _connect(self) -> sqlite3.Connection:
        """Ouvre une connexion avec row_factory."""
        conn = sqlite3.connect(str(self.db_path))
        conn.row_factory = sqlite3.Row
        return conn

    # -----------------------------------------------------------------
    # CRUD
    # -----------------------------------------------------------------

    def save(self, file_id: str, data: dict):
        """Insere ou remplace un enregistrement complet."""
        now = datetime.now().isoformat()
        with self._connect() as conn:
            conn.execute(
                """INSERT OR REPLACE INTO cv_history
                   (file_id, original_filename, file_path, file_info, cv_data,
                    extraction, strategy_used, exports, status, uploaded_at, updated_at)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                (
                    file_id,
                    data.get("original_filename", ""),
                    data.get("file_path", ""),
                    json.dumps(data.get("file_info"), ensure_ascii=False) if data.get("file_info") else None,
                    json.dumps(data.get("cv_data"), ensure_ascii=False) if data.get("cv_data") else None,
                    json.dumps(data.get("extraction"), ensure_ascii=False) if data.get("extraction") else None,
                    json.dumps(data.get("strategy_used"), ensure_ascii=False) if data.get("strategy_used") else None,
                    json.dumps(data.get("exports"), ensure_ascii=False) if data.get("exports") else None,
                    data.get("status", "uploaded"),
                    data.get("uploaded_at", now),
                    now,
                )
            )
            conn.commit()

    def get(self, file_id: str) -> Optional[dict]:
        """Recupere un enregistrement par file_id."""
        with self._connect() as conn:
            row = conn.execute(
                "SELECT * FROM cv_history WHERE file_id = ?", (file_id,)
            ).fetchone()

        if not row:
            return None

        return self._row_to_dict(row)

    def delete(self, file_id: str) -> bool:
        """Supprime un enregistrement."""
        with self._connect() as conn:
            cursor = conn.execute(
                "DELETE FROM cv_history WHERE file_id = ?", (file_id,)
            )
            conn.commit()
            deleted = cursor.rowcount > 0

        if deleted:
            logger.info(f"CV supprime de la base : {file_id}")
        return deleted

    def list_all(self, limit: int = 100) -> List[dict]:
        """Liste tous les CVs, du plus recent au plus ancien."""
        with self._connect() as conn:
            rows = conn.execute(
                "SELECT file_id, original_filename, status, uploaded_at, updated_at, file_info "
                "FROM cv_history ORDER BY uploaded_at DESC LIMIT ?",
                (limit,)
            ).fetchall()

        items = []
        for row in rows:
            item = {
                "file_id": row["file_id"],
                "filename": row["original_filename"],
                "status": row["status"],
                "uploaded_at": row["uploaded_at"],
                "updated_at": row["updated_at"],
                "category": "",
            }
            fi = row["file_info"]
            if fi:
                try:
                    info = json.loads(fi)
                    item["category"] = info.get("category", "")
                except Exception:
                    pass
            items.append(item)

        return items

    def update_status(self, file_id: str, status: str):
        """Met a jour le statut."""
        now = datetime.now().isoformat()
        with self._connect() as conn:
            conn.execute(
                "UPDATE cv_history SET status = ?, updated_at = ? WHERE file_id = ?",
                (status, now, file_id)
            )
            conn.commit()

    def update_cv_data(self, file_id: str, cv_data: dict):
        """Met a jour les donnees structurees du CV."""
        now = datetime.now().isoformat()
        with self._connect() as conn:
            conn.execute(
                "UPDATE cv_history SET cv_data = ?, updated_at = ? WHERE file_id = ?",
                (json.dumps(cv_data, ensure_ascii=False), now, file_id)
            )
            conn.commit()

    def update_extraction(self, file_id: str, extraction: dict, strategy: dict = None):
        """Met a jour les donnees d'extraction."""
        now = datetime.now().isoformat()
        with self._connect() as conn:
            conn.execute(
                "UPDATE cv_history SET extraction = ?, strategy_used = ?, updated_at = ? WHERE file_id = ?",
                (
                    json.dumps(extraction, ensure_ascii=False),
                    json.dumps(strategy, ensure_ascii=False) if strategy else None,
                    now, file_id
                )
            )
            conn.commit()

    def update_exports(self, file_id: str, exports: dict):
        """Met a jour les chemins d'export."""
        now = datetime.now().isoformat()
        with self._connect() as conn:
            conn.execute(
                "UPDATE cv_history SET exports = ?, updated_at = ? WHERE file_id = ?",
                (json.dumps(exports, ensure_ascii=False), now, file_id)
            )
            conn.commit()

    def count(self) -> int:
        """Nombre total de CVs."""
        with self._connect() as conn:
            row = conn.execute("SELECT COUNT(*) as cnt FROM cv_history").fetchone()
        return row["cnt"] if row else 0

    # -----------------------------------------------------------------
    # Utilitaires
    # -----------------------------------------------------------------

    def _row_to_dict(self, row: sqlite3.Row) -> dict:
        """Convertit un Row SQLite en dict avec parsing JSON."""
        d = dict(row)
        for key in ("file_info", "cv_data", "extraction", "strategy_used", "exports"):
            if d.get(key):
                try:
                    d[key] = json.loads(d[key])
                except (json.JSONDecodeError, TypeError):
                    pass
        return d

    def load_all_to_store(self) -> dict:
        """Charge tous les CVs en memoire (pour compatibilite avec cv_store)."""
        store = {}
        with self._connect() as conn:
            rows = conn.execute("SELECT * FROM cv_history").fetchall()

        for row in rows:
            d = self._row_to_dict(row)
            store[d["file_id"]] = d

        logger.info(f"Charge {len(store)} CV(s) depuis la base")
        return store

@echo off
chcp 65001 >nul 2>&1
title CV Analyzer - Manager

:: Verifier le venv
if exist "venv\Scripts\python.exe" (
    venv\Scripts\python.exe manager.py
) else (
    echo [ERREUR] Environnement virtuel non trouve.
    echo          Lancer install.bat d'abord.
    pause
)

@echo off
chcp 65001 >nul 2>&1
title CV Analyzer - Serveur

echo.
echo  CV Analyzer - Demarrage du serveur
echo  URL : http://localhost:8500
echo  Ctrl+C pour arreter
echo.

if exist "venv\Scripts\python.exe" (
    venv\Scripts\python.exe -m uvicorn main:app --host 0.0.0.0 --port 8500
) else (
    echo [ERREUR] Environnement virtuel non trouve.
    echo          Lancer INSTALLER.bat d'abord.
)
echo.
echo Le serveur s'est arrete.
pause

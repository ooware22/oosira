@echo off
chcp 65001 >nul 2>&1
setlocal EnableDelayedExpansion
title CV Analyzer - Lancement de l'installateur

echo.
echo ============================================================
echo   CV Analyzer - Installateur
echo ============================================================
echo.

:: -------------------------------------------------------------------
:: 1. Verifier Python
:: -------------------------------------------------------------------
echo [1/3] Verification de Python...
python --version >nul 2>&1
if errorlevel 1 (
    echo.
    echo [ERREUR] Python n'est pas installe ou n'est pas dans le PATH.
    echo          Telecharger Python 3.11+ : https://www.python.org/downloads/
    echo          Cocher "Add Python to PATH" lors de l'installation.
    echo.
    pause
    exit /b 1
)
for /f "tokens=2" %%v in ('python --version 2^>^&1') do set PYVER=%%v
echo          Python %PYVER% detecte.

:: -------------------------------------------------------------------
:: 2. Installer PySide6 si absent
:: -------------------------------------------------------------------
echo.
echo [2/3] Verification de PySide6...
python -c "import PySide6" >nul 2>&1
if errorlevel 1 (
    echo          PySide6 non trouve. Installation en cours...
    echo          (cela peut prendre 1-2 minutes)
    echo.
    pip install PySide6 --quiet
    if errorlevel 1 (
        echo.
        echo [ERREUR] Impossible d'installer PySide6.
        echo          Essayer manuellement : pip install PySide6
        pause
        exit /b 1
    )
    echo          PySide6 installe avec succes.
) else (
    echo          PySide6 deja installe.
)

:: -------------------------------------------------------------------
:: 3. Lancer l'installateur GUI
:: -------------------------------------------------------------------
echo.
echo [3/3] Lancement de l'installateur graphique...
echo.
python installer.py

if errorlevel 1 (
    echo.
    echo [ERREUR] L'installateur a rencontre un probleme.
    pause
)

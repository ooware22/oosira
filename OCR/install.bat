@echo off
chcp 65001 >nul 2>&1
setlocal EnableDelayedExpansion

title CV Analyzer - Installation
echo.
echo ============================================================
echo   CV Analyzer - Script d'installation Windows
echo ============================================================
echo.

:: -------------------------------------------------------------------
:: 1. Verifier Python
:: -------------------------------------------------------------------
echo [1/5] Verification de Python...
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERREUR] Python n'est pas installe ou n'est pas dans le PATH.
    echo          Telecharger Python 3.11+ : https://www.python.org/downloads/
    pause
    exit /b 1
)

for /f "tokens=2" %%v in ('python --version 2^>^&1') do set PYVER=%%v
echo          Python %PYVER% detecte.

:: -------------------------------------------------------------------
:: 2. Creer l'environnement virtuel
:: -------------------------------------------------------------------
echo.
echo [2/5] Creation de l'environnement virtuel...
if exist "venv\Scripts\python.exe" (
    echo          Environnement virtuel existant detecte.
) else (
    python -m venv venv
    if errorlevel 1 (
        echo [ERREUR] Impossible de creer l'environnement virtuel.
        pause
        exit /b 1
    )
    echo          Environnement virtuel cree.
)

:: -------------------------------------------------------------------
:: 3. Installer les dependances
:: -------------------------------------------------------------------
echo.
echo [3/5] Installation des dependances Python...
call venv\Scripts\pip.exe install --upgrade pip >nul 2>&1
call venv\Scripts\pip.exe install -r requirements.txt
if errorlevel 1 (
    echo [ERREUR] Echec de l'installation des dependances.
    pause
    exit /b 1
)
echo          Dependances installees.

:: -------------------------------------------------------------------
:: 4. Verifier Tesseract
:: -------------------------------------------------------------------
echo.
echo [4/5] Verification de Tesseract OCR...
tesseract --version >nul 2>&1
if errorlevel 1 (
    echo [ATTENTION] Tesseract OCR n'est pas installe.
    echo             L'OCR ne sera pas disponible tant que Tesseract n'est pas installe.
    echo             Telecharger : https://github.com/UB-Mannheim/tesseract/wiki
    echo             Apres installation, ajouter au PATH systeme.
) else (
    echo          Tesseract detecte.
)

:: -------------------------------------------------------------------
:: 5. Creer les dossiers necessaires
:: -------------------------------------------------------------------
echo.
echo [5/5] Creation des dossiers...
if not exist "uploads" mkdir uploads
if not exist "outputs" mkdir outputs
if not exist "logs" mkdir logs
if not exist "db" mkdir db
echo          Dossiers crees.

:: -------------------------------------------------------------------
:: Termine
:: -------------------------------------------------------------------
echo.
echo ============================================================
echo   Installation terminee avec succes !
echo.
echo   Pour lancer le Manager :  launch.bat
echo   Pour lancer le serveur :  start_server.bat
echo ============================================================
echo.
pause

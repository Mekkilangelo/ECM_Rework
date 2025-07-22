@echo off
REM Script pour automatiser l'import des clients sur Windows
REM 1. Traite le CSV avec Python
REM 2. Importe les clients avec Node.js

echo 🎯 SCRIPT D'IMPORT DES CLIENTS ECM
echo =================================
echo.

REM Vérifier que nous sommes dans le bon répertoire
if not exist "..\toBase.txt" (
    echo ❌ Erreur: Le fichier toBase.txt n'a pas été trouvé dans le répertoire parent
    echo    Assurez-vous d'être dans le répertoire scripts\ et que toBase.txt existe
    pause
    exit /b 1
)

REM Étape 1: Traitement du CSV avec Python
echo 📊 Étape 1: Traitement du fichier CSV avec Python...
echo ----------------------------------------------------

python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Erreur: Python n'est pas installé ou n'est pas dans le PATH
    pause
    exit /b 1
)

python process_clients_csv.py
if errorlevel 1 (
    echo ❌ Erreur lors du traitement du CSV
    pause
    exit /b 1
)

echo.
echo ✅ Traitement du CSV terminé
echo.

REM Vérifier que le fichier JSON a été créé
if not exist "clients_to_import.json" (
    echo ❌ Erreur: Le fichier clients_to_import.json n'a pas été créé
    pause
    exit /b 1
)

REM Étape 2: Import des clients avec Node.js
echo 🚀 Étape 2: Import des clients dans la base de données...
echo --------------------------------------------------------

node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Erreur: Node.js n'est pas installé ou n'est pas dans le PATH
    pause
    exit /b 1
)

node import_clients.js
if errorlevel 1 (
    echo ❌ Erreur lors de l'import des clients
    pause
    exit /b 1
)

echo.
echo 🎉 IMPORT TERMINÉ AVEC SUCCÈS!
echo ==============================
echo.

REM Nettoyage optionnel
set /p cleanup="Voulez-vous supprimer le fichier temporaire clients_to_import.json? (y/N): "
if /i "%cleanup%"=="y" (
    del clients_to_import.json
    echo 🗑️  Fichier temporaire supprimé
) else (
    echo 📄 Fichier temporaire conservé: clients_to_import.json
)

echo.
echo ✨ Processus d'import terminé!
pause

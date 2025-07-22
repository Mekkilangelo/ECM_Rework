@echo off
REM Script pour créer automatiquement les demandes d'essai pour tous les clients

echo 🎯 SCRIPT DE CRÉATION DES DEMANDES D'ESSAI ECM
echo ==============================================
echo.

REM Vérifier que Node.js est installé
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Erreur: Node.js n'est pas installé ou n'est pas dans le PATH
    pause
    exit /b 1
)

echo 🚀 Création des demandes d'essai pour tous les clients...
echo --------------------------------------------------------

node create_orders.js
if errorlevel 1 (
    echo ❌ Erreur lors de la création des demandes d'essai
    pause
    exit /b 1
)

echo.
echo 🎉 CRÉATION DES DEMANDES D'ESSAI TERMINÉE AVEC SUCCÈS!
echo ======================================================
echo.
echo ✨ Processus terminé!
pause

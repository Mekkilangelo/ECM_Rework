@echo off
setlocal enabledelayedexpansion

echo ===================================================
echo    Installation et configuration de MySQL - V2
echo ===================================================
echo.

:: Vérifier si MySQL est déjà installé et le service en cours d'exécution
sc query MySQL80 | findstr "RUNNING" > nul
if %ERRORLEVEL% EQU 0 (
    echo MySQL est deja installe et le service est en cours d'execution.
    goto mysql_installed
)

:: Vérifier si le service existe mais n'est pas démarré
sc query MySQL80 > nul
if %ERRORLEVEL% EQU 0 (
    echo Le service MySQL80 existe mais n'est pas en cours d'execution.
    echo Demarrage du service MySQL80...
    net start MySQL80
    goto mysql_installed
)

echo MySQL n'est pas installe ou le service n'existe pas.
echo.
echo Installation de MySQL Server...

:: Rechercher le fichier d'installation MySQL
set "INSTALLER_FOUND=0"
set "INSTALLER_PATH="

:: Vérifier dans le répertoire temporaire
if exist "%TEMP%\mysql-installer-community-8.0.32.0.msi" (
    set "INSTALLER_PATH=%TEMP%\mysql-installer-community-8.0.32.0.msi"
    set "INSTALLER_FOUND=1"
    echo Installateur MySQL trouve dans: !INSTALLER_PATH!
    goto install_mysql
)

:: Vérifier dans le dossier courant
if exist "%~dp0mysql-installer-community-8.0.32.0.msi" (
    set "INSTALLER_PATH=%~dp0mysql-installer-community-8.0.32.0.msi"
    set "INSTALLER_FOUND=1"
    echo Installateur MySQL trouve dans: !INSTALLER_PATH!
    goto install_mysql
)

:: Vérifier dans le dossier prereq de l'application
if exist "%~dp0prereq\mysql-installer-community-8.0.32.0.msi" (
    set "INSTALLER_PATH=%~dp0prereq\mysql-installer-community-8.0.32.0.msi"
    set "INSTALLER_FOUND=1"
    echo Installateur MySQL trouve dans: !INSTALLER_PATH!
    goto install_mysql
)

:: Vérifier dans le dossier du projet d'origine
if exist "C:\Users\mekki\Desktop\CIA\ECM\Monitoring\Rework\electron\prereq\mysql-installer-community-8.0.32.0.msi" (
    set "INSTALLER_PATH=C:\Users\mekki\Desktop\CIA\ECM\Monitoring\Rework\electron\prereq\mysql-installer-community-8.0.32.0.msi"
    set "INSTALLER_FOUND=1"
    echo Installateur MySQL trouve dans: !INSTALLER_PATH!
    goto install_mysql
)

:: Si l'installateur n'est pas trouvé, demander à l'utilisateur
if "!INSTALLER_FOUND!"=="0" (
    echo Installateur MySQL non trouve.
    echo Veuillez telecharger et installer MySQL manuellement depuis: https://dev.mysql.com/downloads/mysql/
    echo Puis relancez ce script pour configurer la base de donnees.
    goto end
)

:install_mysql
echo.
echo Installation de MySQL Server en cours...
echo Cette etape peut prendre plusieurs minutes, veuillez patienter.
echo.

:: Lancer l'installation en utilisant start /wait pour attendre la fin de l'installation
start /wait msiexec /i "!INSTALLER_PATH!" /qb /l*v "%TEMP%\mysql_install_log.txt"

:: Attendre pour s'assurer que l'installation est terminée
echo Attente de la fin de l'installation MySQL...
timeout /t 30 /nobreak > nul

:: Vérifier si l'installation a réussi
sc query MySQL80 > nul
if %ERRORLEVEL% NEQ 0 (
    echo L'installation de MySQL a echoue ou le service n'est pas cree.
    echo Veuillez consulter le fichier journal: %TEMP%\mysql_install_log.txt
    
    :: Demander à l'utilisateur s'il souhaite ouvrir l'installateur manuellement
    set /p MANUAL_INSTALL=Voulez-vous lancer l'installateur MySQL manuellement? (O/N): 
    if /i "!MANUAL_INSTALL!"=="O" (
        echo Lancement de l'installateur MySQL...
        start "" "!INSTALLER_PATH!"
        echo Apres l'installation, fermez cette fenetre et relancez le script.
        goto end
    )
    goto end
)

echo Tentative de demarrage du service MySQL80...
net start MySQL80

:mysql_installed
echo.
echo MySQL est installe.
echo.
echo Configuration de la base de donnees...

:: Rechercher l'exécutable mysql
set "MYSQL_FOUND=0"
set "MYSQL_EXE="

:: Essayer de trouver mysql.exe dans les emplacements habituels
if exist "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" (
    set "MYSQL_EXE=C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe"
    set "MYSQL_FOUND=1"
)

if exist "C:\Program Files (x86)\MySQL\MySQL Server 8.0\bin\mysql.exe" (
    set "MYSQL_EXE=C:\Program Files (x86)\MySQL\MySQL Server 8.0\bin\mysql.exe"
    set "MYSQL_FOUND=1"
)

if "!MYSQL_FOUND!"=="0" (
    echo MySQL est installe mais mysql.exe n'a pas ete trouve.
    echo Impossible de configurer la base de donnees.
    goto end
)

:: Rechercher le fichier SQL
set "SQL_FILE=%~dp0database.sql"
if not exist "!SQL_FILE!" (
    set "SQL_FILE=%~dp0prereq\database.sql"
    if not exist "!SQL_FILE!" (
        set "SQL_FILE=C:\Users\mekki\Desktop\CIA\ECM\Monitoring\Rework\electron\prereq\database.sql"
        if not exist "!SQL_FILE!" (
            echo Fichier SQL introuvable.
            echo Impossible de configurer la base de donnees.
            goto end
        )
    )
)

echo Utilisation du fichier SQL: !SQL_FILE!
echo.

:: Créer un fichier temporaire pour stocker la commande SQL
set "TEMP_SQL=%TEMP%\create_db.sql"
echo CREATE DATABASE IF NOT EXISTS synergy CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci; > "!TEMP_SQL!"

:: Essayer différentes méthodes pour se connecter à MySQL
echo Tentative de creation de la base de donnees...

:: Mot de passe par défaut (root)
"!MYSQL_EXE!" -u root -proot --protocol=TCP < "!TEMP_SQL!" 2>nul
if %ERRORLEVEL% EQU 0 (
    echo Base de donnees creee avec succes.
    echo Importation du schema...
    "!MYSQL_EXE!" -u root -proot --protocol=TCP synergy < "!SQL_FILE!" 2>nul
    if !ERRORLEVEL! EQU 0 (
        echo Schema importe avec succes.
        goto success
    ) else (
        echo Erreur lors de l'importation du schema.
    )
) else (
    echo Echec avec mot de passe par defaut.
)

:: Sans mot de passe
"!MYSQL_EXE!" -u root --protocol=TCP < "!TEMP_SQL!" 2>nul
if %ERRORLEVEL% EQU 0 (
    echo Base de donnees creee avec succes (sans mot de passe).
    echo Importation du schema...
    "!MYSQL_EXE!" -u root --protocol=TCP synergy < "!SQL_FILE!" 2>nul
    if !ERRORLEVEL! EQU 0 (
        echo Schema importe avec succes.
        goto success
    ) else (
        echo Erreur lors de l'importation du schema.
    )
) else (
    echo Echec sans mot de passe.
)

:: Demander un mot de passe personnalisé
echo.
echo Les methodes automatiques ont echoue.
set /p CUSTOM_PASSWORD=Entrez le mot de passe root MySQL: 

"!MYSQL_EXE!" -u root -p!CUSTOM_PASSWORD! --protocol=TCP < "!TEMP_SQL!" 2>nul
if %ERRORLEVEL% EQU 0 (
    echo Base de donnees creee avec succes.
    echo Importation du schema...
    "!MYSQL_EXE!" -u root -p!CUSTOM_PASSWORD! --protocol=TCP synergy < "!SQL_FILE!" 2>nul
    if !ERRORLEVEL! EQU 0 (
        echo Schema importe avec succes.
        goto success
    ) else (
        echo Erreur lors de l'importation du schema.
        goto end
    )
) else (
    echo Impossible de se connecter a MySQL. Veuillez verifier votre mot de passe.
    goto end
)

:success
echo.
echo ===================================================
echo    Installation et configuration terminees avec succes!
echo ===================================================

:: Nettoyer
if exist "!TEMP_SQL!" del "!TEMP_SQL!"

:end
echo.
echo Appuyez sur une touche pour fermer cette fenetre...
pause > nul
endlocal
@echo off
setlocal enabledelayedexpansion

echo ===================================================
echo    Configuration de la base de donnees MySQL
echo ===================================================
echo.

:: Définir les variables
set "MYSQL_ROOT_PASSWORD=root"
set "DB_NAME=synergy"
set "SQL_FILE=%~dp0database.sql"

:: Vérifier si le fichier SQL existe
if not exist "%SQL_FILE%" (
    echo Erreur: Le fichier SQL est introuvable a %SQL_FILE%.
    echo Assurez-vous que le fichier existe et réessayez.
    goto end
)

echo Verification de l'installation MySQL...
echo Recherche de mysql.exe...

:: Rechercher l'exécutable mysql dans les emplacements standard
set "MYSQL_FOUND=0"
set "MYSQL_EXE="

:: Essai 1: MySQL 8.0
if exist "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" (
    set "MYSQL_EXE=C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe"
    set "MYSQL_FOUND=1"
    echo MySQL trouve a: C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe
    goto mysql_found
)

:: Essai 2: MySQL 8.0 (x86)
if exist "C:\Program Files (x86)\MySQL\MySQL Server 8.0\bin\mysql.exe" (
    set "MYSQL_EXE=C:\Program Files (x86)\MySQL\MySQL Server 8.0\bin\mysql.exe"
    set "MYSQL_FOUND=1"
    echo MySQL trouve a: C:\Program Files (x86)\MySQL\MySQL Server 8.0\bin\mysql.exe
    goto mysql_found
)

:: Essai 3: Recherche dans les chemins du système
for %%i in (mysql.exe) do (
    set "TMP_PATH=%%~$PATH:i"
    if not "!TMP_PATH!"=="" (
        set "MYSQL_EXE=!TMP_PATH!"
        set "MYSQL_FOUND=1"
        echo MySQL trouve dans le PATH: !TMP_PATH!
        goto mysql_found
    )
)

:mysql_not_found
echo MySQL n'a pas ete trouve. Installation en cours...

:: Vérifier si le service MySQL est en cours d'exécution
sc query MySQL80 | findstr "RUNNING" > nul
if %ERRORLEVEL% EQU 0 (
    echo Le service MySQL80 est en cours d'execution, mais l'executable mysql.exe n'est pas trouvé.
    echo Verifiez votre installation MySQL.
) else (
    echo Le service MySQL80 n'est pas en cours d'execution. Verification des services...
    sc query MySQL80 > nul
    if %ERRORLEVEL% EQU 0 (
        echo Le service MySQL80 existe mais n'est pas démarré. Démarrage du service...
        net start MySQL80
        if !ERRORLEVEL! EQU 0 (
            echo Service MySQL80 démarré avec succès.
            goto check_mysql_again
        ) else (
            echo Impossible de démarrer le service MySQL80.
        )
    ) else (
        echo Le service MySQL80 n'existe pas. MySQL n'est pas correctement installé.
    )
)

echo.
echo Telechargez et installez MySQL depuis https://dev.mysql.com/downloads/mysql/
echo Ou utilisez l'installateur tout-en-un ECM Monitoring Setup with MySQL.exe
goto end

:check_mysql_again
:: Vérifier à nouveau MySQL après avoir démarré le service
if exist "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" (
    set "MYSQL_EXE=C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe"
    set "MYSQL_FOUND=1"
    echo MySQL trouve a: C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe
    goto mysql_found
)

if exist "C:\Program Files (x86)\MySQL\MySQL Server 8.0\bin\mysql.exe" (
    set "MYSQL_EXE=C:\Program Files (x86)\MySQL\MySQL Server 8.0\bin\mysql.exe"
    set "MYSQL_FOUND=1"
    echo MySQL trouve a: C:\Program Files (x86)\MySQL\MySQL Server 8.0\bin\mysql.exe
    goto mysql_found
)

echo MySQL introuvable même après démarrage du service.
goto end

:mysql_found
echo.
echo Configuration de la base de donnees...

:: Créer un fichier temporaire pour stocker la commande SQL
set "TEMP_SQL=%TEMP%\create_db.sql"
echo CREATE DATABASE IF NOT EXISTS %DB_NAME% CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci; > "%TEMP_SQL%"

:: Créer la base de données si elle n'existe pas
echo Creation de la base de donnees %DB_NAME%...

:: Essayer de se connecter avec le mot de passe par défaut
"%MYSQL_EXE%" -u root -p%MYSQL_ROOT_PASSWORD% --protocol=TCP < "%TEMP_SQL%" 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Erreur lors de la creation de la base de donnees. Verification du mot de passe...
    goto ask_password
)

:: Importer le fichier SQL
echo Importation du schema de la base de donnees...
"%MYSQL_EXE%" -u root -p%MYSQL_ROOT_PASSWORD% --protocol=TCP %DB_NAME% < "%SQL_FILE%" 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Erreur lors de l'importation du schema. Verification du mot de passe...
    goto ask_password
)

echo.
echo Base de donnees configuree avec succes!
goto cleanup

:ask_password
echo.
echo Il semble que le mot de passe par défaut (root) ne fonctionne pas.
set /p CUSTOM_PASSWORD=Entrez le mot de passe root MySQL: 

echo Tentative avec le mot de passe personnalise...
"%MYSQL_EXE%" -u root -p%CUSTOM_PASSWORD% --protocol=TCP < "%TEMP_SQL%" 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Erreur: Impossible de se connecter a MySQL avec le mot de passe fourni.
    
    :: Essayer sans mot de passe
    echo Tentative sans mot de passe...
    "%MYSQL_EXE%" -u root --protocol=TCP < "%TEMP_SQL%" 2>nul
    if !ERRORLEVEL! NEQ 0 (
        echo Echec de connexion sans mot de passe.
        goto cleanup
    ) else (
        echo Connexion sans mot de passe reussie!
        echo Importation du schema de la base de donnees...
        "%MYSQL_EXE%" -u root --protocol=TCP %DB_NAME% < "%SQL_FILE%" 2>nul
        if !ERRORLEVEL! NEQ 0 (
            echo Erreur lors de l'importation du schema.
            goto cleanup
        ) else (
            echo Base de donnees configuree avec succes!
            goto cleanup
        )
    )
)

echo Importation du schema de la base de donnees...
"%MYSQL_EXE%" -u root -p%CUSTOM_PASSWORD% --protocol=TCP %DB_NAME% < "%SQL_FILE%" 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Erreur lors de l'importation du schema.
    goto cleanup
)

echo.
echo Base de donnees configuree avec succes!

:cleanup
:: Supprimer le fichier SQL temporaire
if exist "%TEMP_SQL%" del "%TEMP_SQL%"

:end
echo.
echo Appuyez sur une touche pour fermer cette fenetre...
pause >nul
endlocal
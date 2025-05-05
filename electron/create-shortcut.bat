@echo off
:: Script pour créer un raccourci vers install-mysql.bat
echo Création d'un raccourci sur le bureau...

:: Définir le chemin du fichier cible et du raccourci
set "TARGETFILE=%~dp0install-mysql.bat"
set "SHORTCUTFILE=%USERPROFILE%\Desktop\Installer MySQL.lnk"

:: Création du raccourci VBS
echo Set oWS = WScript.CreateObject("WScript.Shell") > "%TEMP%\CreateShortcut.vbs"
echo sLinkFile = "%SHORTCUTFILE%" >> "%TEMP%\CreateShortcut.vbs"
echo Set oLink = oWS.CreateShortcut(sLinkFile) >> "%TEMP%\CreateShortcut.vbs"
echo oLink.TargetPath = "%TARGETFILE%" >> "%TEMP%\CreateShortcut.vbs"
echo oLink.WorkingDirectory = "%~dp0" >> "%TEMP%\CreateShortcut.vbs"
echo oLink.Description = "Installer et configurer MySQL pour ECM" >> "%TEMP%\CreateShortcut.vbs"
echo oLink.IconLocation = "%SystemRoot%\System32\shell32.dll,21" >> "%TEMP%\CreateShortcut.vbs"
echo oLink.Save >> "%TEMP%\CreateShortcut.vbs"

:: Exécuter le script VBS pour créer le raccourci
cscript //nologo "%TEMP%\CreateShortcut.vbs"
del "%TEMP%\CreateShortcut.vbs"

echo Raccourci créé avec succès sur le bureau.
echo.
pause
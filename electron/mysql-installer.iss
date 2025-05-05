#define MyAppName "ECM Monitoring"
#define MyAppVersion "1.0.0"
#define MyAppPublisher "ECM Technologies"
#define MyAppURL "https://ecm-furnaces.com/"
#define MyAppExeName "ECM Monitoring.exe"

[Setup]
; Application info
AppId={{ECMMONITORING-5A39-4F55-9B3F-1234567890AB}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppPublisher={#MyAppPublisher}
AppPublisherURL={#MyAppURL}
AppSupportURL={#MyAppURL}
AppUpdatesURL={#MyAppURL}
DefaultDirName={autopf}\{#MyAppName}
DefaultGroupName={#MyAppName}
AllowNoIcons=yes
; Installer graphics
SetupIconFile=icons\installer.ico
UninstallDisplayIcon={app}\{#MyAppExeName}
; Output location
OutputDir=dist-inno
OutputBaseFilename=ECM Monitoring Setup with MySQL
; Compression
Compression=lzma
SolidCompression=yes
; Windows 7, 8, 10, 11 (6.1 correspond à Windows 7/Server 2008 R2)
MinVersion=6.1
PrivilegesRequired=admin
; Ne pas demander de redémarrage automatique
AlwaysRestart=no
DisableWelcomePage=no

[Languages]
Name: "french"; MessagesFile: "compiler:Languages\French.isl"

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"; Flags: unchecked

[Files]
; Application files
Source: "dist-installers\win-unpacked\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs
; MySQL installer - assurez-vous que ce fichier existe
Source: "prereq\mysql-installer-community-8.0.32.0.msi"; DestDir: "{tmp}"; Flags: ignoreversion
; Database SQL file
Source: "prereq\database.sql"; DestDir: "{app}\database"; Flags: ignoreversion
; Fichier batch d'installation MySQL complet
Source: "install-mysql-full.bat"; DestDir: "{app}\database"; Flags: ignoreversion
; Autres fichiers batch
Source: "install-mysql.bat"; DestDir: "{app}\database"; Flags: ignoreversion

[Icons]
Name: "{group}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"
Name: "{group}\{cm:ProgramOnTheWeb,{#MyAppName}}"; Filename: "{#MyAppURL}"
Name: "{group}\{cm:UninstallProgram,{#MyAppName}}"; Filename: "{uninstallexe}"
Name: "{autodesktop}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; Tasks: desktopicon

[Run]
; Utiliser le script d'installation MySQL complet à la place des commandes directes
Filename: "{app}\database\install-mysql-full.bat"; StatusMsg: "Installation et configuration de MySQL..."; Description: "Installer et configurer MySQL pour ECM Monitoring"; Flags: waituntilterminated runascurrentuser shellexec; AfterInstall: WaitForMySQL

; Lancer l'application après l'installation (si l'utilisateur le souhaite)
Filename: "{app}\{#MyAppExeName}"; StatusMsg: "Démarrage de l'application..."; Description: "Démarrer ECM Monitoring"; Flags: nowait postinstall skipifsilent runascurrentuser; Check: MySQLConfigured

[Code]
var
  MySQLConfigurationSuccessful: Boolean;

procedure InitializeWizard;
begin
  MySQLConfigurationSuccessful := False;
end;

procedure WaitForMySQL;
begin
  // Cette fonction est appelée après l'exécution du batch d'installation MySQL
  MySQLConfigurationSuccessful := True;
  
  // Attendez quelques secondes pour s'assurer que MySQL est prêt
  Sleep(3000);
end;

function MySQLConfigured: Boolean;
begin
  // Cette fonction contrôle si l'application peut être lancée
  Result := MySQLConfigurationSuccessful;
end;

function InitializeSetup(): Boolean;
begin
  Result := True;
  // Afficher un message pour expliquer l'installation
  MsgBox('L''installateur va procéder à l''installation de votre application et de MySQL :'#13#10#13#10 + 
         '1. Installation des fichiers de l''application'#13#10 + 
         '2. Installation et configuration de MySQL Server'#13#10 + 
         '3. Démarrage de l''application'#13#10#13#10 + 
         'L''installation de MySQL peut prendre plusieurs minutes. Veuillez patienter jusqu''à la fin du processus.', 
         mbInformation, MB_OK);
end;
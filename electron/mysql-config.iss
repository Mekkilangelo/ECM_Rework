;config.iss - Configuration pour installation silencieuse de MySQL
[Setup]
ConnectToServerNeeded=false
ServerResponseTimeout=120
EnableLogging=true

[Install]
SuperSilent=true
ProductsToInstall=server
AutoRestart=false
Directory=C:\Program Files\MySQL
DataDirectory=C:\ProgramData\MySQL\MySQL Server 8.0\Data
ServerType=DEVELOPMENT
Authentication=mixed
RootPassword=root
AddBinToPath=true
ServiceName=MySQL80
CreateService=true
StartService=true
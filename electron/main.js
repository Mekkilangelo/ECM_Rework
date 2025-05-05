const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');
const { spawn } = require('child_process');
const fs = require('fs-extra');

// Au début du fichier main.js, après les imports
const userDataPath = app.getPath('userData');
const appDataPath = path.join(userDataPath, 'data');
const logsPath = path.join(userDataPath, 'logs');

// Créer les dossiers nécessaires
try {
  fs.mkdirSync(appDataPath, { recursive: true });
  fs.mkdirSync(logsPath, { recursive: true });
  console.log('Application data directories created at:', userDataPath);
} catch (error) {
  console.error('Failed to create data directories:', error);
}

// Debugging des chemins
console.log('__dirname dans main.js:', __dirname);
console.log('Chemin serveur (dev):', path.resolve(__dirname, '..', 'server', 'server.js'));
console.log('Chemin serveur existe:', fs.existsSync(path.resolve(__dirname, '..', 'server', 'server.js')));

let mainWindow;
let serverProcess;

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')  // Chemin simplifié pour la production
    },
    icon: path.join(__dirname, 'icons/icon.png')
  });

  if (!isDev) {
    mainWindow.setMenu(null);
  }

  // En mode développement, se connecter au serveur React de développement
  if (isDev) {
    try {
      await mainWindow.loadURL('http://localhost:3000');
      mainWindow.webContents.openDevTools();
    } catch (error) {
      console.error('Failed to load React dev server:', error);
      // Fallback sur le serveur backend
      await mainWindow.loadURL('http://localhost:5001');
    }
  } else {
    // En production, se connecter directement au serveur backend qui sert les fichiers statiques
    // Ajout d'un mécanisme de retry pour s'assurer que le serveur est bien démarré
    console.log('Loading production URL: http://localhost:5001');
    let maxRetries = 30; // 30 secondes maximum
    let retryCount = 0;
    
    async function tryLoadingURL() {
      try {
        await mainWindow.loadURL('http://localhost:5001');
        console.log('Successfully connected to backend server');
        // Pour le débogage en production si nécessaire
        // mainWindow.webContents.openDevTools();
      } catch (error) {
        retryCount++;
        console.error(`Failed to load from backend server (attempt ${retryCount}/${maxRetries}):`, error.message);
        
        if (retryCount < maxRetries) {
          console.log(`Retrying in 1 second...`);
          setTimeout(tryLoadingURL, 1000);
        } else {
          console.error('Maximum retry attempts reached, showing error dialog');
          dialog.showErrorBox(
            'Loading Error',
            `Impossible de charger l'application depuis le serveur après ${maxRetries} tentatives. Veuillez redémarrer l'application ou vérifier que le port 5001 est disponible.`
          );
          
          // Charger une page de diagnostic en cas d'échec
          const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="UTF-8">
              <title>ECM Monitoring - Diagnostic</title>
              <style>
                body { font-family: Arial, sans-serif; padding: 20px; }
                .error { color: red; background: #ffeeee; padding: 10px; border-radius: 5px; }
                .tips { background: #eeeeff; padding: 10px; border-radius: 5px; margin-top: 20px; }
              </style>
            </head>
            <body>
              <h1>ECM Monitoring - Page de diagnostic</h1>
              <p>L'application n'a pas pu se connecter au serveur après plusieurs tentatives.</p>
              <div class="error">
                <h3>Problème de connexion:</h3>
                <p>Impossible de se connecter au serveur sur http://localhost:5001</p>
              </div>
              <div class="tips">
                <h3>Conseils de dépannage:</h3>
                <ul>
                  <li>Vérifiez qu'aucune autre application n'utilise le port 5001</li>
                  <li>Redémarrez l'application</li>
                  <li>Vérifiez votre pare-feu ou antivirus</li>
                  <li>Vérifiez les logs dans: ${logsPath}</li>
                </ul>
              </div>
            </body>
            </html>
          `;
          
          mainWindow.webContents.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`);
        }
      }
    }
    
    // Attendre un peu plus longtemps avant la première tentative de connexion
    setTimeout(tryLoadingURL, 3000);
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
    if (serverProcess) {
      serverProcess.kill();
    }
  });

  // Gérer les erreurs de chargement
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('Failed to load page:', errorDescription);
    
    // Charger une page HTML simple pour diagnostic
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>ECM Monitoring - Diagnostic</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          .error { color: red; background: #ffeeee; padding: 10px; border-radius: 5px; }
        </style>
      </head>
      <body>
        <h1>ECM Monitoring - Page de diagnostic</h1>
        <p>L'application n'a pas pu charger correctement.</p>
        <div class="error">
          <h3>Erreur:</h3>
          <pre>${errorDescription}</pre>
          <p>Code: ${errorCode}</p>
        </div>
        <div>
          <h3>Vérification de la connexion au serveur:</h3>
          <div id="server-status">Vérification en cours...</div>
        </div>
        <script>
          // Essayer de se connecter au serveur
          fetch('http://localhost:5001/api/health')
            .then(response => response.json())
            .then(data => {
              document.getElementById('server-status').innerHTML = 
                '<span style="color:green">✓ Serveur accessible: ' + JSON.stringify(data) + '</span>';
            })
            .catch(error => {
              document.getElementById('server-status').innerHTML = 
                '<span style="color:red">✗ Serveur inaccessible: ' + error.message + '</span>';
            });
        </script>
      </body>
      </html>
    `;
    
    mainWindow.webContents.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`);
  });

  // Capturer les erreurs console
  mainWindow.webContents.on('console-message', (event, level, message, line, sourceId) => {
    console.log(`[WebContents][${level}] ${message}`);
  });
}

// Dans main.js
const devServerPath = path.resolve(process.cwd(), '..', 'server', 'server.js');
const serverPath = isDev ? devServerPath : path.join(__dirname, 'resources/server/server.js');

function startServer() {
  // Déterminer le chemin du serveur en fonction du mode (dev/prod)
  let serverPath;
  
  if (isDev) {
    serverPath = path.resolve(__dirname, '..', 'server', 'server.js');
  } else {
    serverPath = path.join(process.resourcesPath, 'server', 'server.js');
  }
  
  console.log(`Starting server from: ${serverPath}`);
  
  // Créer un fichier de log dans un emplacement accessible
  const userDataPath = app.getPath('userData'); // Dossier des données utilisateur spécifique à l'application
  const logFilePath = path.join(userDataPath, 'server-log.txt');
  const logStream = fs.createWriteStream(logFilePath, { flags: 'a' });
  
  logStream.write(`[${new Date().toISOString()}] Starting server from: ${serverPath}\n`);
  
  // Vérifier que le fichier existe
  if (!fs.existsSync(serverPath)) {
    const errorMsg = `Server file not found at: ${serverPath}`;
    console.error(errorMsg);
    logStream.write(`[${new Date().toISOString()}] ERROR: ${errorMsg}\n`);
    dialog.showErrorBox('Server Error', errorMsg);
    return;
  }
  
  // Liste des fichiers/répertoires du dossier server pour diagnostic
  try {
    const serverDir = path.dirname(serverPath);
    const files = fs.readdirSync(serverDir);
    logStream.write(`[${new Date().toISOString()}] Server directory contents: ${JSON.stringify(files)}\n`);
  } catch (err) {
    logStream.write(`[${new Date().toISOString()}] ERROR listing directory: ${err.message}\n`);
  }
  
  const env = {
    ...process.env,
    NODE_ENV: isDev ? 'development' : 'production',
    ELECTRON_RUN_AS_NODE: '1'
  };
  
  serverProcess = spawn(process.execPath, [serverPath], {
    stdio: 'pipe',
    env: env
  });

  serverProcess.stdout.on('data', (data) => {
    const output = data.toString();
    console.log(`Server stdout: ${output}`);
    logStream.write(`[${new Date().toISOString()}] STDOUT: ${output}\n`);
  });

  serverProcess.stderr.on('data', (data) => {
    const error = data.toString();
    console.error(`Server stderr: ${error}`);
    logStream.write(`[${new Date().toISOString()}] STDERR: ${error}\n`);
  });

  serverProcess.on('close', (code) => {
    const message = `Server process exited with code ${code}`;
    console.log(message);
    logStream.write(`[${new Date().toISOString()}] ${message}\n`);
    
    if (code !== 0) {
      dialog.showErrorBox(
        'Server Error',
        `The server stopped with error code ${code}. The application may not function correctly. Check server-log.txt for details.`
      );
    }
    
    logStream.end();
  });
}

ipcMain.handle('show-error', (event, message) => {
  dialog.showErrorBox('Error', message);
});

app.on('ready', () => {
  startServer();
  setTimeout(createWindow, 1000);
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

app.on('quit', () => {
  if (serverProcess) {
    serverProcess.kill();
  }
});
const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');
const { spawn } = require('child_process');
const fs = require('fs-extra');
const { getServerPath, getUserDataPaths } = require('./config');

// Configuration des chemins utilisateur
const userPaths = getUserDataPaths();

// Créer les dossiers nécessaires
try {
  Object.values(userPaths).forEach(dirPath => {
    fs.mkdirSync(dirPath, { recursive: true });
  });
  console.log('Application data directories created');
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

// Fonction pour démarrer le serveur backend
function startServer() {
  const serverPath = getServerPath();
  
  console.log('Starting server from:', serverPath);
    // Créer un fichier de log dans un emplacement accessible
  const logFilePath = path.join(userPaths.logs, 'server-log.txt');
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

// Gestionnaires IPC
ipcMain.handle('show-error', async (event, message) => {
  return dialog.showErrorBox('Erreur', message);
});

// Optimisation de la fonction downloadFile dans main.js
ipcMain.handle('download-file', async (event, url, fileName) => {
  try {
    console.log('Starting download:', url);
    
    // Créer un dossier de téléchargements dans userData si nécessaire
    const userDataPath = app.getPath('userData');
    const downloadsPath = path.join(userDataPath, 'downloads');
    
    if (!fs.existsSync(downloadsPath)) {
      fs.mkdirSync(downloadsPath, { recursive: true });
    }
    
    // Utiliser le système de téléchargement d'Electron
    const result = await new Promise((resolve, reject) => {
      mainWindow.webContents.session.once('will-download', (event, item, webContents) => {
        // Définir le chemin de sauvegarde
        const savePath = path.join(downloadsPath, item.getFilename());
        item.setSavePath(savePath);
        
        item.on('updated', (event, state) => {
          if (state === 'interrupted') {
            console.log('Download is interrupted but can be resumed');
          } else if (state === 'progressing') {
            if (item.isPaused()) {
              console.log('Download is paused');
            } else {
              console.log(`Received bytes: ${item.getReceivedBytes()}`);
            }
          }
        });
        
        item.once('done', (event, state) => {
          if (state === 'completed') {
            console.log('Download successfully completed');
            resolve({ success: true, path: savePath });
          } else {
            console.log(`Download failed: ${state}`);
            resolve({ success: false, error: state });
          }
        });
      });
      
      // Déclencher le téléchargement
      mainWindow.webContents.downloadURL(url);
    });
    
    return result;
  } catch (error) {
    console.error('Download error:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('open-external', async (event, url) => {
  return shell.openExternal(url);
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
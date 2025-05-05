const fs = require('fs-extra');
const { execSync } = require('child_process');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');
const CLIENT_DIR = path.join(ROOT_DIR, 'client');
const SERVER_DIR = path.join(ROOT_DIR, 'server');
const ELECTRON_DIR = __dirname;
const DIST_DIR = path.join(ELECTRON_DIR, 'dist');
const RESOURCES_DIR = path.join(ELECTRON_DIR, 'resources');  // Changé pour correspondre à electron-builder.json

console.log('__dirname:', __dirname);
console.log('Server path (dev):', path.resolve(__dirname, '..', 'server', 'server.js'));
console.log('Server path exists:', fs.existsSync(path.resolve(__dirname, '..', 'server', 'server.js')));

async function build() {
  try {
    // Nettoyer les dossiers de build existants
    console.log('Cleaning build directories...');
    fs.removeSync(DIST_DIR);
    fs.removeSync(RESOURCES_DIR);  // Supprimer également le dossier resources s'il existe
    
    fs.mkdirSync(DIST_DIR, { recursive: true });
    fs.mkdirSync(RESOURCES_DIR, { recursive: true });
    fs.mkdirSync(path.join(RESOURCES_DIR, 'client'), { recursive: true });
    fs.mkdirSync(path.join(RESOURCES_DIR, 'server'), { recursive: true });

    // Construire l'application React
    console.log('Building React client...');
    process.chdir(CLIENT_DIR);
    execSync('npm run build', { stdio: 'inherit' });
    
    // Copier le build client vers le dossier de ressources
    console.log('Copying client build to resources...');
    fs.copySync(path.join(CLIENT_DIR, 'build'), path.join(RESOURCES_DIR, 'client/build'));

    // Installer les dépendances du serveur et les copier
    console.log('Installing server production dependencies...');
    process.chdir(SERVER_DIR);
    execSync('npm install --omit=dev', { stdio: 'inherit' });
    
    // Copier le code serveur
    console.log('Copying server files to resources...');
    fs.copySync(SERVER_DIR, path.join(RESOURCES_DIR, 'server'), {
      filter: (src, dest) => !src.includes('node_modules') && !src.includes('.git')
    });
    
    // Copier les node_modules du serveur
    fs.copySync(
      path.join(SERVER_DIR, 'node_modules'), 
      path.join(RESOURCES_DIR, 'server/node_modules')
    );

    // Après la partie qui copie les fichiers du serveur
    // Copier le fichier .env s'il existe
    const envFilePath = path.join(ROOT_DIR, '.env');
    if (fs.existsSync(envFilePath)) {
      console.log('Copying .env file to server resources...');
      fs.copySync(envFilePath, path.join(RESOURCES_DIR, 'server', '.env'));
    } else {
      // Créer un fichier .env minimal si l'original n'existe pas
      console.log('Creating default .env file for server...');
      const userDataPathPlaceholder = '%APPDATA%\\ECM Monitoring';

      fs.writeFileSync(path.join(RESOURCES_DIR, 'server', '.env'), `
PORT=5001
NODE_ENV=production
DB_HOST=127.0.0.1
DB_NAME=synergy
DB_USER=root
DB_PASSWORD=
DB_PORT=3306
JWT_SECRET=votre_secret_jwt_ultra_securise
JWT_EXPIRE=24h
UPLOAD_PATH=${userDataPathPlaceholder}\\uploads
TEMP_PATH=${userDataPathPlaceholder}\\uploads\\temp
LOG_PATH=${userDataPathPlaceholder}\\logs
      `.trim());
    }

    // Dans build.js, après avoir copié les fichiers du serveur
    // Créer les répertoires nécessaires
    const serverDirs = ['uploads', 'uploads/temp'];
    for (const dir of serverDirs) {
      const dirPath = path.join(RESOURCES_DIR, 'server', dir);
      console.log(`Creating directory: ${dirPath}`);
      fs.mkdirSync(dirPath, { recursive: true });
    }

    // Après avoir copié les fichiers du serveur, ajoutez :
    // Copier le preload.js
    console.log('Copying preload.js to dist directory...');
    fs.copySync(
      path.join(ELECTRON_DIR, 'preload.js'),
      path.join(DIST_DIR, 'preload.js')
    );

    // Vérifier le build client
    const clientBuildPath = path.join(RESOURCES_DIR, 'client/build');
    console.log('Verifying client build at:', clientBuildPath);
    if (fs.existsSync(clientBuildPath)) {
      console.log('Client build directory contains:');
      const listClientFiles = (dir, indent = '') => {
        fs.readdirSync(dir).forEach(file => {
          const filePath = path.join(dir, file);
          const isDir = fs.statSync(filePath).isDirectory();
          console.log(`${indent}${file}${isDir ? '/' : ''}`);
          if (isDir) listClientFiles(filePath, indent + '  ');
        });
      };
      listClientFiles(clientBuildPath);
    } else {
      console.error('WARNING: Client build directory not found!');
    }

    // Vérifier que les dossiers ont bien été créés
    console.log('Resources directory contents:', fs.readdirSync(RESOURCES_DIR));
    console.log('Client resources exist:', fs.existsSync(path.join(RESOURCES_DIR, 'client/build')));
    console.log('Server resources exist:', fs.existsSync(path.join(RESOURCES_DIR, 'server')));
    
    // Revenir au dossier electron
    process.chdir(ELECTRON_DIR);
    console.log('Build preparation completed successfully!');
  } catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
  }
}

build();
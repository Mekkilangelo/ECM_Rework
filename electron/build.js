const fs = require('fs-extra');
const { execSync } = require('child_process');
const path = require('path');
const chalk = require('chalk');

const ROOT_DIR = path.resolve(__dirname, '..');
const CLIENT_DIR = path.join(ROOT_DIR, 'client');
const SERVER_DIR = path.join(ROOT_DIR, 'server');
const ELECTRON_DIR = __dirname;
const DIST_DIR = path.join(ELECTRON_DIR, 'dist');
const RESOURCES_DIR = path.join(ELECTRON_DIR, 'resources');

// Utilitaires de logging avec couleurs
const log = {
  info: (msg) => console.log(chalk.blue('ℹ'), msg),
  success: (msg) => console.log(chalk.green('✅'), msg),
  warning: (msg) => console.log(chalk.yellow('⚠️'), msg),
  error: (msg) => console.log(chalk.red('❌'), msg),
  step: (step, total, msg) => console.log(chalk.cyan(`[${step}/${total}]`), msg)
};

// Validation des chemins requis
const validatePaths = () => {
  const requiredPaths = [
    { path: CLIENT_DIR, name: 'Client directory' },
    { path: SERVER_DIR, name: 'Server directory' },
    { path: path.join(CLIENT_DIR, 'package.json'), name: 'Client package.json' },
    { path: path.join(SERVER_DIR, 'package.json'), name: 'Server package.json' }
  ];

  for (const { path: checkPath, name } of requiredPaths) {
    if (!fs.existsSync(checkPath)) {
      log.error(`${name} not found at: ${checkPath}`);
      process.exit(1);
    }
  }
  log.success('All required paths validated');
};

async function build() {
  try {
    log.info('🚀 Starting ECM Monitoring Electron build process...');
    
    // Étape 1: Validation
    log.step(1, 6, 'Validating project structure...');
    validatePaths();
    
    // Étape 2: Nettoyage
    log.step(2, 6, 'Cleaning build directories...');
    fs.removeSync(DIST_DIR);
    fs.removeSync(RESOURCES_DIR);
    
    fs.mkdirSync(DIST_DIR, { recursive: true });
    fs.mkdirSync(RESOURCES_DIR, { recursive: true });
    fs.mkdirSync(path.join(RESOURCES_DIR, 'client'), { recursive: true });
    fs.mkdirSync(path.join(RESOURCES_DIR, 'server'), { recursive: true });

    // Étape 3: Build du client React
    log.step(3, 6, 'Building React client...');
    process.chdir(CLIENT_DIR);
    execSync('npm run build', { stdio: 'inherit' });
    
    log.info('Copying client build to resources...');
    fs.copySync(path.join(CLIENT_DIR, 'build'), path.join(RESOURCES_DIR, 'client/build'));

    // Étape 4: Préparation du serveur
    log.step(4, 6, 'Preparing server files...');
    process.chdir(SERVER_DIR);
    
    log.info('Installing server production dependencies...');
    execSync('npm install --omit=dev', { stdio: 'inherit' });
    
    log.info('Copying server files to resources...');
    fs.copySync(SERVER_DIR, path.join(RESOURCES_DIR, 'server'), {
      filter: (src, dest) => !src.includes('node_modules') && !src.includes('.git')
    });
    
    log.info('Copying server dependencies...');
    fs.copySync(
      path.join(SERVER_DIR, 'node_modules'), 
      path.join(RESOURCES_DIR, 'server/node_modules')
    );

    // Étape 5: Configuration et fichiers Electron
    log.step(5, 6, 'Configuring Electron files...');
    
    // Copier ou créer le fichier .env
    const envFilePath = path.join(ROOT_DIR, '.env');
    if (fs.existsSync(envFilePath)) {
      log.info('Copying .env file to server resources...');
      fs.copySync(envFilePath, path.join(RESOURCES_DIR, 'server', '.env'));
    } else {
      log.warning('Creating default .env file for server...');
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

    // Créer les répertoires nécessaires pour les uploads
    const serverDirs = ['uploads', 'uploads/temp'];
    for (const dir of serverDirs) {
      const dirPath = path.join(RESOURCES_DIR, 'server', dir);
      fs.mkdirSync(dirPath, { recursive: true });
    }

    // Copier les fichiers Electron principaux
    log.info('Copying Electron files...');
    fs.copySync(path.join(ELECTRON_DIR, 'main.js'), path.join(DIST_DIR, 'main.js'));
    fs.copySync(path.join(ELECTRON_DIR, 'preload.js'), path.join(DIST_DIR, 'preload.js'));

    // Étape 6: Validation finale
    log.step(6, 6, 'Validating build output...');
    const validationPaths = [
      { path: path.join(RESOURCES_DIR, 'client/build'), name: 'Client build' },
      { path: path.join(RESOURCES_DIR, 'server'), name: 'Server files' },
      { path: path.join(DIST_DIR, 'main.js'), name: 'Main Electron file' },
      { path: path.join(DIST_DIR, 'preload.js'), name: 'Preload script' }
    ];

    for (const { path: checkPath, name } of validationPaths) {
      if (fs.existsSync(checkPath)) {
        log.success(`${name} ✓`);
      } else {
        log.error(`${name} missing at: ${checkPath}`);
        throw new Error(`Build validation failed: ${name} not found`);
      }
    }
    
    // Revenir au dossier electron
    process.chdir(ELECTRON_DIR);
    log.success('🎉 Build preparation completed successfully!');
    
  } catch (error) {
    log.error(`💥 Build failed: ${error.message}`);
    process.exit(1);
  }
}

build();
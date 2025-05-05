// mysql-installer.js
// Utilitaire pour installer et configurer MySQL
const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Chemins des ressources
const mysqlInstallerPath = path.join(__dirname, 'prereq', 'mysql-installer-community-8.0.32.0.msi');
const dbName = 'synergy';
const rootPassword = 'root'; // Mot de passe défini pour l'utilisateur root

// Interface console pour l'interaction utilisateur
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Fonction pour vérifier si MySQL est installé
function checkMySQLInstalled() {
  try {
    // Vérifier les chemins possibles pour mysql.exe
    const possiblePaths = [
      'C:\\Program Files\\MySQL\\MySQL Server 8.0\\bin\\mysql.exe',
      'C:\\Program Files (x86)\\MySQL\\MySQL Server 8.0\\bin\\mysql.exe',
      'C:\\Program Files\\MySQL\\MySQL Server 5.7\\bin\\mysql.exe',
      'C:\\Program Files (x86)\\MySQL\\MySQL Server 5.7\\bin\\mysql.exe',
      // Chemins supplémentaires pour les installations MySQL Installer
      'C:\\Program Files\\MySQL\\MySQL Server\\bin\\mysql.exe',
      'C:\\Program Files (x86)\\MySQL\\MySQL Server\\bin\\mysql.exe',
      // Chercher récursivement dans le dossier MySQL
      ...findMySQLExecutableRecursively('C:\\Program Files\\MySQL'),
      ...findMySQLExecutableRecursively('C:\\Program Files (x86)\\MySQL')
    ];
    
    for (const mysqlPath of possiblePaths) {
      if (fs.existsSync(mysqlPath)) {
        console.log(`MySQL est déjà installé à : ${mysqlPath}`);
        return mysqlPath;
      }
    }
    
    console.log("MySQL n'est pas installé ou n'a pas été trouvé.");
    return null;
  } catch (error) {
    console.error("Erreur lors de la vérification de MySQL:", error);
    return null;
  }
}

// Fonction pour chercher récursivement l'exécutable mysql.exe
function findMySQLExecutableRecursively(rootDir) {
  if (!fs.existsSync(rootDir)) {
    return [];
  }
  
  let results = [];
  try {
    // Récupérer tous les dossiers dans le répertoire racine
    const items = fs.readdirSync(rootDir, { withFileTypes: true });
    
    for (const item of items) {
      const fullPath = path.join(rootDir, item.name);
      
      if (item.isDirectory()) {
        // Rechercher récursivement dans les sous-dossiers
        results = [...results, ...findMySQLExecutableRecursively(fullPath)];
      } else if (item.name.toLowerCase() === 'mysql.exe') {
        // Trouver l'exécutable mysql.exe
        console.log(`Trouvé mysql.exe à: ${fullPath}`);
        results.push(fullPath);
      }
    }
  } catch (error) {
    console.error(`Erreur lors de la recherche dans ${rootDir}:`, error);
  }
  
  return results;
}

// Fonction pour installer MySQL
function installMySQL() {
  return new Promise((resolve, reject) => {
    console.log('Installation de MySQL...');
    
    if (!fs.existsSync(mysqlInstallerPath)) {
      console.error(`Le fichier d'installation MySQL est introuvable à ${mysqlInstallerPath}`);
      reject(new Error('Fichier d\'installation MySQL introuvable'));
      return;
    }
    
    // Définir le chemin où MySQL Server sera installé
    const mysqlServerDir = 'C:\\Program Files\\MySQL\\MySQL Server 8.0';
    
    console.log('Lancement de l\'installation MySQL...');
    console.log('Cette opération peut prendre quelques minutes...');
    
    // Étape 1: Installer MySQL Installer avec msiexec
    const msiProcess = spawn('msiexec', [
      '/i', mysqlInstallerPath,
      '/qn', // Installation silencieuse
      '/l*v', 'mysql_installer_log.txt', // Journal d'installation
    ], { shell: true });
    
    msiProcess.on('close', async (code) => {
      if (code !== 0) {
        console.error(`L'installation de MySQL Installer a échoué avec le code ${code}`);
        reject(new Error(`Installation MySQL Installer échouée avec le code ${code}`));
        return;
      }
      
      console.log('MySQL Installer installé avec succès');
      console.log('Installation de MySQL Server en cours...');
      
      // Étape 2: Utiliser MySQL Installer pour installer MySQL Server
      // Chemins possibles pour MySQL Installer
      const mysqlInstallerCliPaths = [
        'C:\\Program Files\\MySQL\\MySQL Installer\\MySQLInstallerConsole.exe',
        'C:\\Program Files (x86)\\MySQL\\MySQL Installer\\MySQLInstallerConsole.exe',
        'C:\\Program Files (x86)\\MySQL\\MySQL Installer for Windows\\MySQLInstallerConsole.exe',
        'C:\\Program Files\\MySQL\\MySQL Installer for Windows\\MySQLInstallerConsole.exe'
      ];
      
      let mysqlInstallerCliPath = null;
      for (const path of mysqlInstallerCliPaths) {
        if (fs.existsSync(path)) {
          mysqlInstallerCliPath = path;
          break;
        }
      }
      
      if (!mysqlInstallerCliPath) {
        console.log('MySQL Installer Console non trouvé. Installation directe de MySQL Server...');
        
        // Solution alternative: Installation directe de MySQL Server
        try {
          // Extraire le setup.exe de MySQL Server à partir du MSI
          const setupExtractionDir = path.join(__dirname, 'mysql_setup');
          if (!fs.existsSync(setupExtractionDir)) {
            fs.mkdirSync(setupExtractionDir);
          }
          
          console.log('Extraction des fichiers d\'installation MySQL...');
          execSync(`msiexec /a "${mysqlInstallerPath}" /qn TARGETDIR="${setupExtractionDir}"`, { stdio: 'inherit' });
          
          // Installer MySQL Server directement
          console.log('Installation de MySQL Server...');
          execSync(`"${path.join(__dirname, 'mysql-setup.exe')}" --install-silent --product=mysql --password=${rootPassword}`, 
            { stdio: 'inherit' });
          
          console.log('MySQL Server installé avec succès');
          resolve();
        } catch (error) {
          console.error('Erreur lors de l\'installation directe de MySQL Server:', error);
          console.log('Installation manuelle requise. Veuillez installer MySQL Server manuellement.');
          console.log(`Double-cliquez sur ${mysqlInstallerPath} pour lancer l'installation.`);
          reject(error);
        }
        return;
      }
      
      // Utiliser MySQL Installer CLI pour installer MySQL Server
      const serverInstallProcess = spawn(mysqlInstallerCliPath, [
        'install',
        'server',
        `-servertype=DEVELOPMENT`,
        `-passwd=${rootPassword}`,
        '-silent'
      ], { shell: true });
      
      serverInstallProcess.stdout.on('data', (data) => {
        console.log(`Installation en cours: ${data}`);
      });
      
      serverInstallProcess.stderr.on('data', (data) => {
        console.error(`Erreur d'installation: ${data}`);
      });
      
      serverInstallProcess.on('close', (code) => {
        if (code === 0) {
          console.log('Installation de MySQL Server terminée avec succès');
          resolve();
        } else {
          console.error(`L'installation de MySQL Server a échoué avec le code ${code}`);
          console.log('Installation manuelle requise. Veuillez installer MySQL Server manuellement.');
          console.log(`Double-cliquez sur ${mysqlInstallerPath} pour lancer l'installation.`);
          reject(new Error(`Installation MySQL Server échouée avec le code ${code}`));
        }
      });
    });
    
    msiProcess.stdout.on('data', (data) => {
      console.log(`Installation en cours: ${data}`);
    });
    
    msiProcess.stderr.on('data', (data) => {
      console.error(`Erreur d'installation: ${data}`);
    });
  });
}

// Fonction pour créer la base de données et l'utilisateur
async function configureMySQL(mysqlPath) {
  return new Promise(async (resolve, reject) => {
    try {
      console.log('Configuration de MySQL...');
      
      // Utiliser le fichier SQL existant dans prereq au lieu du code SQL codé en dur
      const sqlFilePath = path.join(__dirname, 'prereq', 'database.sql');
      
      if (!fs.existsSync(sqlFilePath)) {
        console.error(`Le fichier SQL est introuvable à ${sqlFilePath}`);
        reject(new Error('Fichier SQL introuvable'));
        return;
      }
      
      console.log('Exécution du script SQL pour créer la base de données...');
      
      // Créer d'abord la base de données synergy si elle n'existe pas
      const createDbScript = `CREATE DATABASE IF NOT EXISTS ${dbName} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`;
      const tempCreateDbFile = path.join(__dirname, 'temp_create_db.sql');
      fs.writeFileSync(tempCreateDbFile, createDbScript);
      
      // Tester plusieurs variantes de commandes MySQL pour créer la base de données
      let success = false;
      const createDbCommands = [
        // Avec le mot de passe 'root'
        `"${mysqlPath}" -u root -p${rootPassword} < "${tempCreateDbFile}"`,
        // Autre syntaxe avec le mot de passe 'root'
        `"${mysqlPath}" -u root --password=${rootPassword} < "${tempCreateDbFile}"`
      ];
      
      for (const command of createDbCommands) {
        try {
          console.log(`Tentative de création de la base de données avec: ${command.replace(/"/g, '\\"')}`);
          execSync(command, { stdio: 'inherit' });
          console.log('Base de données créée ou déjà existante.');
          success = true;
          break;
        } catch (error) {
          console.log(`Échec de la commande: ${error.message}`);
        }
      }
      
      if (!success) {
        throw new Error("Impossible de créer la base de données.");
      }
      
      // Tester plusieurs variantes de commandes MySQL pour exécuter le script SQL principal
      success = false;
      const commands = [
        // Avec le mot de passe 'root' et utilisation de la base de données
        `"${mysqlPath}" -u root -p${rootPassword} ${dbName} < "${sqlFilePath}"`,
        // Autre syntaxe avec le mot de passe 'root'
        `"${mysqlPath}" -u root --password=${rootPassword} ${dbName} < "${sqlFilePath}"`,
        // Commande avec USE database dans la même ligne
        `"${mysqlPath}" -u root -p${rootPassword} -e "USE ${dbName}; source ${sqlFilePath};"`
      ];
      
      let lastError = null;
      
      for (const command of commands) {
        try {
          console.log(`Tentative avec: ${command.replace(/"/g, '\\"')}`);
          execSync(command, { stdio: 'inherit' });
          console.log('Commande exécutée avec succès.');
          success = true;
          break;
        } catch (error) {
          console.log(`Échec de la commande: ${error.message}`);
          lastError = error;
        }
      }
      
      // Si toutes les tentatives ont échoué
      if (!success) {
        console.error("Toutes les tentatives d'exécution du script SQL ont échoué.");
        console.log("Essai avec une méthode alternative...");
        
        try {
          // Tentative avec mysqladmin pour confirmer la connexion
          const mysqlAdminPath = mysqlPath.replace(/mysql\.exe$/i, 'mysqladmin.exe');
          if (fs.existsSync(mysqlAdminPath)) {
            console.log("Tentative de vérification de la connexion MySQL...");
            try {
              // Essayer avec le mot de passe actuel 'root'
              execSync(`"${mysqlAdminPath}" -u root -p${rootPassword} status`, { stdio: 'inherit' });
              console.log("Connexion MySQL confirmée.");
            } catch (resetError) {
              console.log("Échec de la vérification de la connexion. Essai avec une autre méthode...");
            }
            
            // Essayer de créer la base de données et d'exécuter le script SQL séparément
            try {
              console.log(`Création manuelle de la base de données ${dbName}...`);
              execSync(`"${mysqlPath}" -u root -p${rootPassword} -e "CREATE DATABASE IF NOT EXISTS ${dbName} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"`, { stdio: 'inherit' });
              
              console.log(`Exécution du script SQL sur la base de données ${dbName}...`);
              execSync(`"${mysqlPath}" -u root -p${rootPassword} -e "USE ${dbName}; source ${sqlFilePath};"`, { stdio: 'inherit' });
              success = true;
            } catch (dbError) {
              console.error(`Erreur lors de la création ou configuration de la base de données: ${dbError.message}`);
            }
          }
        } catch (adminError) {
          console.error("La vérification de la connexion MySQL a échoué:", adminError.message);
          
          // Demander à l'utilisateur de saisir le mot de passe manuellement
          console.log("\nToutes les tentatives automatiques ont échoué.");
          console.log("Veuillez entrer le mot de passe root MySQL manuellement:");
          
          const manualPassword = await new Promise(resolve => {
            const rl = readline.createInterface({
              input: process.stdin,
              output: process.stdout
            });
            rl.question('Mot de passe MySQL: ', (answer) => {
              rl.close();
              resolve(answer);
            });
          });
          
          if (manualPassword) {
            try {
              console.log("Tentative avec le mot de passe saisi manuellement...");
              console.log(`Création de la base de données ${dbName}...`);
              execSync(`"${mysqlPath}" -u root -p${manualPassword} -e "CREATE DATABASE IF NOT EXISTS ${dbName} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"`, { stdio: 'inherit' });
              
              console.log(`Exécution du script SQL sur la base de données ${dbName}...`);
              execSync(`"${mysqlPath}" -u root -p${manualPassword} -e "USE ${dbName}; source ${sqlFilePath};"`, { stdio: 'inherit' });
              console.log("Configuration réussie avec le mot de passe saisi manuellement.");
              success = true;
            } catch (manualError) {
              console.error("Échec avec le mot de passe saisi manuellement:", manualError.message);
            }
          }
        }
      }
      
      // Supprimer le fichier temporaire
      if (fs.existsSync(tempCreateDbFile)) {
        fs.unlinkSync(tempCreateDbFile);
      }
      
      if (success) {
        console.log('Configuration de la base de données terminée avec succès.');
        resolve();
      } else {
        reject(lastError || new Error("Impossible de configurer la base de données."));
      }
    } catch (error) {
      console.error("Erreur lors de la configuration MySQL:", error);
      reject(error);
    }
  });
}

// Fonction principale
async function main() {
  console.log("=======================================================");
  console.log("  INSTALLATION ET CONFIGURATION MYSQL POUR ECM");
  console.log("=======================================================");
  console.log("Ce programme va :");
  console.log("1. Vérifier si MySQL est déjà installé");
  console.log("2. Installer MySQL si nécessaire");
  console.log("3. Créer la base de données et les tables");
  console.log("=======================================================");
  
  try {
    // Vérifier si MySQL est déjà installé
    let mysqlPath = checkMySQLInstalled();
    
    // Si MySQL n'est pas installé, l'installer
    if (!mysqlPath) {
      console.log("MySQL n'est pas installé. Voulez-vous l'installer maintenant? (O/N)");
      const answer = await new Promise(resolve => rl.question('> ', resolve));
      
      if (answer.toLowerCase() === 'o' || answer.toLowerCase() === 'oui') {
        await installMySQL();
        
        // Attendre que le service MySQL démarre
        console.log("Attente du démarrage du service MySQL...");
        // Augmenter le temps d'attente à 30 secondes
        await new Promise(resolve => setTimeout(resolve, 30000));
        
        // Essayer de démarrer le service MySQL manuellement si nécessaire
        try {
          console.log("Tentative de démarrage manuel du service MySQL...");
          execSync('net start mysql80', { stdio: 'inherit' });
        } catch (error) {
          console.log("Impossible de démarrer le service manuellement. Cela peut être normal si le service n'est pas nommé 'mysql80'.");
          // Essayer avec un autre nom de service courant
          try {
            execSync('net start mysql', { stdio: 'inherit' });
          } catch (innerError) {
            console.log("Impossible de démarrer le service 'mysql'. Nous continuons la recherche de l'exécutable...");
          }
        }
        
        // Revérifier l'installation
        console.log("Recherche de l'exécutable MySQL...");
        mysqlPath = checkMySQLInstalled();
        
        if (!mysqlPath) {
          // Recherche élargie en cas d'échec
          console.log("Recherche approfondie de MySQL...");
          // Vérifier les installations récentes dans Program Files
          const programFilesPath = 'C:\\Program Files';
          const possibleMySQLFolders = fs.readdirSync(programFilesPath)
            .filter(folder => folder.toLowerCase().includes('mysql'))
            .map(folder => path.join(programFilesPath, folder));
          
          for (const folder of possibleMySQLFolders) {
            console.log(`Recherche dans: ${folder}`);
            const mysqlExes = findMySQLExecutableRecursively(folder);
            if (mysqlExes.length > 0) {
              mysqlPath = mysqlExes[0];
              break;
            }
          }
          
          if (!mysqlPath) {
            throw new Error("L'installation de MySQL a échoué ou MySQL n'est pas trouvable.");
          }
        }
        
        // Tester la connexion MySQL
        try {
          console.log("Test de la connexion MySQL...");
          execSync(`"${mysqlPath}" --version`, { stdio: 'inherit' });
          console.log("Test réussi - MySQL est correctement installé et accessible.");
        } catch (error) {
          console.error("Échec du test de connexion MySQL:", error);
          throw new Error("MySQL est installé mais ne répond pas correctement.");
        }
      } else {
        console.log("Installation annulée par l'utilisateur.");
        rl.close();
        return;
      }
    }
    
    // Configurer MySQL
    console.log("Voulez-vous créer la base de données et les tables pour l'application? (O/N)");
    const configAnswer = await new Promise(resolve => rl.question('> ', resolve));
    
    if (configAnswer.toLowerCase() === 'o' || configAnswer.toLowerCase() === 'oui') {
      await configureMySQL(mysqlPath);
      console.log("=======================================================");
      console.log("Installation et configuration terminées avec succès!");
      console.log("Vous pouvez maintenant lancer l'application ECM Monitoring.");
      console.log("=======================================================");
    } else {
      console.log("Configuration de la base de données annulée.");
    }
  } catch (error) {
    console.error("Une erreur est survenue:", error);
    console.log("L'installation ou la configuration a échoué. Veuillez contacter le support technique.");
  } finally {
    rl.close();
  }
}

// Lancer le programme
main().catch(error => {
  console.error("Erreur fatale:", error);
  rl.close();
});
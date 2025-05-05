// mysql-config.js - Version optimisée pour exécutable standalone
const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Chemins des ressources - Adapté pour fonctionner depuis une clé USB
const dbName = 'synergy';
const rootPassword = 'root'; // Mot de passe par défaut

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
      'C:\\Program Files\\MySQL\\MySQL Server\\bin\\mysql.exe',
      'C:\\Program Files (x86)\\MySQL\\MySQL Server\\bin\\mysql.exe',
      // Recherche récursive
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

// Fonction pour créer la base de données et les tables
async function configureMySQL(mysqlPath) {
  return new Promise(async (resolve, reject) => {
    try {
      console.log('Configuration de MySQL...');
      
      // Utiliser le fichier SQL du même répertoire
      const currentDir = path.dirname(process.execPath);
      const sqlFilePath = path.join(currentDir, 'database.sql');
      
      if (!fs.existsSync(sqlFilePath)) {
        console.error(`Le fichier SQL est introuvable à ${sqlFilePath}`);
        console.log("Tentative de recherche alternative...");
        
        // Recherche alternative dans le répertoire courant
        if (fs.existsSync(path.join(process.cwd(), 'database.sql'))) {
          console.log("Fichier trouvé dans le répertoire courant");
          sqlFilePath = path.join(process.cwd(), 'database.sql');
        } else {
          reject(new Error('Fichier SQL introuvable'));
          return;
        }
      }
      
      console.log('Exécution du script SQL pour créer la base de données...');
      
      // Créer d'abord la base de données synergy si elle n'existe pas
      const createDbScript = `CREATE DATABASE IF NOT EXISTS ${dbName} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`;
      const tempCreateDbFile = path.join(os.tmpdir(), 'temp_create_db.sql');
      fs.writeFileSync(tempCreateDbFile, createDbScript);
      
      // Tester plusieurs variantes de commandes MySQL pour créer la base de données
      let success = false;
      const createDbCommands = [
        // Avec le mot de passe 'root'
        `"${mysqlPath}" -u root -p${rootPassword} < "${tempCreateDbFile}"`,
        // Autre syntaxe
        `"${mysqlPath}" -u root --password=${rootPassword} < "${tempCreateDbFile}"`
      ];
      
      for (const command of createDbCommands) {
        try {
          console.log(`Tentative de création de la base de données...`);
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
        // Autre syntaxe
        `"${mysqlPath}" -u root --password=${rootPassword} ${dbName} < "${sqlFilePath}"`,
        // Commande avec USE database dans la même ligne
        `"${mysqlPath}" -u root -p${rootPassword} -e "USE ${dbName}; source ${sqlFilePath};"`
      ];
      
      let lastError = null;
      
      for (const command of commands) {
        try {
          console.log(`Tentative d'exécution du script SQL...`);
          execSync(command, { stdio: 'inherit' });
          console.log('Script SQL exécuté avec succès.');
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
        
        // Demander à l'utilisateur de saisir le mot de passe manuellement
        console.log("\nVeuillez entrer le mot de passe root MySQL manuellement:");
        
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
  console.log("  CONFIGURATION DE LA BASE DE DONNÉES POUR ECM");
  console.log("=======================================================");
  console.log("Ce programme va :");
  console.log("1. Vérifier si MySQL est déjà installé");
  console.log("2. Créer la base de données et les tables pour l'application");
  console.log("=======================================================");
  
  try {
    // Vérifier si MySQL est déjà installé
    let mysqlPath = checkMySQLInstalled();
    
    // Si MySQL n'est pas installé, conseiller d'installer
    if (!mysqlPath) {
      console.log("MySQL n'est pas installé. Veuillez d'abord installer MySQL en exécutant l'installateur dans le dossier 1-MySQL.");
      console.log("Après l'installation, relancez ce programme pour configurer la base de données.");
      await new Promise(resolve => setTimeout(resolve, 3000));
      rl.close();
      return;
    }
    
    // Configurer MySQL
    console.log("MySQL est installé. Voulez-vous créer la base de données et les tables pour l'application ECM Monitoring? (O/N)");
    const configAnswer = await new Promise(resolve => rl.question('> ', resolve));
    
    if (configAnswer.toLowerCase() === 'o' || configAnswer.toLowerCase() === 'oui') {
      await configureMySQL(mysqlPath);
      console.log("=======================================================");
      console.log("Configuration terminée avec succès!");
      console.log("Vous pouvez maintenant lancer l'application ECM Monitoring.");
      console.log("=======================================================");
      console.log("Appuyez sur une touche pour fermer cette fenêtre...");
      await new Promise(resolve => rl.question('', resolve));
    } else {
      console.log("Configuration de la base de données annulée.");
    }
  } catch (error) {
    console.error("Une erreur est survenue:", error);
    console.log("La configuration a échoué. Veuillez contacter le support technique.");
    console.log("Appuyez sur une touche pour fermer cette fenêtre...");
    await new Promise(resolve => rl.question('', resolve));
  } finally {
    rl.close();
  }
}

// Gestionnaire d'erreurs non traitées
process.on('uncaughtException', (err) => {
  console.error('Une erreur non gérée s\'est produite :', err);
  console.log('Appuyez sur une touche pour fermer...');
  readline.createInterface({
    input: process.stdin,
    output: process.stdout
  }).question('', () => {
    process.exit(1);
  });
});

// Lancer le programme
main().catch(error => {
  console.error("Erreur fatale:", error);
  console.log("Appuyez sur une touche pour fermer...");
  readline.createInterface({
    input: process.stdin,
    output: process.stdout
  }).question('', () => {
    process.exit(1);
  });
});
/**
 * Script d'aide pour l'utilisation de l'ETL
 * Guide l'utilisateur dans la préparation et le chargement des données
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

function showHelp() {
  console.log(`
🚀 ETL Helper - Guide d'utilisation

Ce script vous aide à charger vos données CSV dans la base de données.

📋 ÉTAPES RECOMMANDÉES :

1. 📊 PRÉPAREZ VOTRE FICHIER CSV
   ────────────────────────────────
   Votre fichier doit contenir ces colonnes :
   
   Obligatoires :
   - client          : Nom du client
   - country         : Pays (utilise 'OTHER' si vide)
   - designation     : Type de pièce (Gear, Shaft, Hub, etc.)
   
   Optionnelles mais recommandées :
   - city            : Ville du client
   - client_designation : Désignation client de la pièce
   - dimensions_json : Dimensions en JSON {"diameter": 50, "length": 100}
   - specifications  : Spécifications en JSON ou texte
   - acier_canon     : Type d'acier
   - standard        : Standard utilisé
   - load            : Numéro de charge
   - created_on      : Date de création (YYYY-MM-DD)
   - load_data       : Données de charge en JSON
   - recipe_data     : Données de recette en JSON
   - results_data    : Résultats en JSON
   - id, file, date, recipe, updated_on

2. 🔍 VALIDEZ VOTRE ENVIRONNEMENT
   ────────────────────────────────
   npm run etl:validate

3. 🧪 TESTEZ AVEC DES DONNÉES D'EXEMPLE
   ────────────────────────────────────
   npm run etl:test

4. 📥 CHARGEZ VOS DONNÉES
   ─────────────────────
   npm run etl:load chemin/vers/votre/fichier.csv

📝 EXEMPLE DE FICHIER CSV :

client,country,city,designation,client_designation,dimensions_json,specifications,acier_canon,load,created_on
"ACME Corp",FRANCE,Paris,Gear,"Gear-Type-A","{""diameter"": 50}","{""hardness"": ""45-50 HRC""}",42CrMo4,LOAD001,2024-01-15
"TechSteel",GERMANY,Munich,Shaft,"Drive-Shaft","{""length"": 200}","Quenching + Tempering",16MnCr5,LOAD002,2024-01-16

⚠️  POINTS IMPORTANTS :

• Les guillemets dans les champs JSON doivent être échappés ("")
• Chaque ligne CSV = 1 test qui sera créé
• Les clients, commandes et pièces uniques seront automatiquement créés
• La hiérarchie sera : Client > Commande > Pièce > Test

🔧 COMMANDES DISPONIBLES :

npm run etl:validate  - Valide l'environnement
npm run etl:test      - Test avec données d'exemple  
npm run etl:load      - Charge un fichier CSV
node scripts/etl-help.js - Affiche cette aide

📞 EN CAS DE PROBLÈME :

1. Vérifiez que votre base de données est accessible
2. Assurez-vous que les colonnes obligatoires sont présentes
3. Validez le format JSON de vos colonnes JSON
4. Consultez les logs d'erreur pour les détails

Bonne chance ! 🍀
`);
}

async function interactiveMode() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  console.log('🤖 Mode interactif ETL\n');

  try {
    // Demander le chemin du fichier
    const filePath = await new Promise((resolve) => {
      rl.question('📁 Chemin vers votre fichier CSV : ', resolve);
    });

    if (!filePath.trim()) {
      console.log('❌ Aucun fichier spécifié.');
      rl.close();
      return;
    }

    // Vérifier si le fichier existe
    if (!fs.existsSync(filePath)) {
      console.log(`❌ Fichier non trouvé : ${filePath}`);
      rl.close();
      return;
    }

    // Demander confirmation
    const confirm = await new Promise((resolve) => {
      rl.question(`\n⚠️  Voulez-vous charger ${filePath} ? (oui/non) : `, resolve);
    });

    if (confirm.toLowerCase() !== 'oui' && confirm.toLowerCase() !== 'o') {
      console.log('❌ Chargement annulé.');
      rl.close();
      return;
    }

    rl.close();

    // Charger les données
    console.log('\n🚀 Lancement du chargement ETL...\n');
    const ETLLoader = require('./etl-load-data');
    const etlLoader = new ETLLoader();
    await etlLoader.loadData(filePath);

  } catch (error) {
    console.error('❌ Erreur :', error.message);
    rl.close();
  }
}

async function analyzeCSV(filePath) {
  try {
    console.log(`🔍 Analyse du fichier : ${filePath}\n`);

    if (!fs.existsSync(filePath)) {
      console.log('❌ Fichier non trouvé');
      return;
    }

    const csv = require('csv-parser');
    const results = [];
    
    return new Promise((resolve, reject) => {
      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', () => {
          console.log(`📊 ${results.length} lignes trouvées`);
          
          if (results.length === 0) {
            console.log('⚠️  Fichier vide');
            resolve();
            return;
          }

          // Analyser les colonnes
          const columns = Object.keys(results[0]);
          console.log(`📋 ${columns.length} colonnes détectées :`);
          columns.forEach(col => console.log(`   - ${col}`));

          // Vérifier les colonnes obligatoires
          const required = ['client', 'designation'];
          const missing = required.filter(col => !columns.includes(col));
          
          if (missing.length > 0) {
            console.log(`\n❌ Colonnes obligatoires manquantes : ${missing.join(', ')}`);
          } else {
            console.log('\n✅ Colonnes obligatoires présentes');
          }

          // Analyser les clients uniques
          const clients = [...new Set(results.map(r => r.client).filter(Boolean))];
          console.log(`\n👥 ${clients.length} clients uniques trouvés :`);
          clients.slice(0, 10).forEach(client => console.log(`   - ${client}`));
          if (clients.length > 10) {
            console.log(`   ... et ${clients.length - 10} autres`);
          }

          // Analyser les désignations
          const designations = [...new Set(results.map(r => r.designation).filter(Boolean))];
          console.log(`\n🔧 ${designations.length} types de pièces trouvés :`);
          designations.forEach(des => console.log(`   - ${des}`));

          resolve();
        })
        .on('error', reject);
    });

  } catch (error) {
    console.error('❌ Erreur analyse :', error.message);
  }
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    showHelp();
    return;
  }

  const command = args[0];

  switch (command) {
    case 'help':
    case '--help':
    case '-h':
      showHelp();
      break;

    case 'interactive':
    case '-i':
      await interactiveMode();
      break;

    case 'analyze':
    case '-a':
      if (args[1]) {
        await analyzeCSV(args[1]);
      } else {
        console.log('❌ Usage: npm run etl:help analyze <fichier.csv>');
      }
      break;

    default:
      console.log(`❌ Commande inconnue : ${command}`);
      console.log('💡 Utilisez "npm run etl:help" pour voir l\'aide');
  }
}

if (require.main === module) {
  main().catch(error => {
    console.error('💥 Erreur fatale :', error);
    process.exit(1);
  });
}

module.exports = {
  showHelp,
  interactiveMode,
  analyzeCSV
};

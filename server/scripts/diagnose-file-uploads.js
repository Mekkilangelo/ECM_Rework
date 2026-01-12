#!/usr/bin/env node
/**
 * Script de diagnostic pour les problèmes d'upload de fichiers
 * Usage: node scripts/diagnose-file-uploads.js [options]
 * 
 * Options:
 *   --category=datapaq    Filtrer par catégorie
 *   --nodeId=123          Filtrer par nodeId (trial)
 *   --fix                 Tenter de corriger les chemins invalides
 */

const fs = require('fs');
const path = require('path');
const { Sequelize, Op } = require('sequelize');
require('dotenv').config();

// Configuration de la base de données
const sequelize = new Sequelize(
  process.env.DB_NAME || process.env.MYSQL_DATABASE,
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST || 'localhost',
    dialect: 'mysql',
    logging: false
  }
);

// Calculer UPLOAD_BASE_DIR comme le fait fileStorage.js
function resolveEnvPath(envPath) {
  if (typeof envPath === 'string') {
    return envPath.replace(/%([^%]+)%/g, (_, name) => {
      const os = require('os');
      return process.env[name] || os.homedir();
    });
  }
  return envPath;
}

const uploadPathEnv = resolveEnvPath(process.env.UPLOAD_PATH || 'uploads');
const UPLOAD_BASE_DIR = uploadPathEnv.match(/^([A-Z]:|\/)/) 
  ? uploadPathEnv 
  : path.join(__dirname, '..', uploadPathEnv);

console.log('\n' + '='.repeat(80));
console.log('📋 DIAGNOSTIC DES FICHIERS UPLOADS');
console.log('='.repeat(80));

async function diagnose() {
  const args = process.argv.slice(2);
  const options = {};
  
  for (const arg of args) {
    if (arg.startsWith('--')) {
      const [key, value] = arg.slice(2).split('=');
      options[key] = value || true;
    }
  }

  console.log('\n📁 Configuration des chemins:');
  console.log(`   UPLOAD_PATH env:     ${process.env.UPLOAD_PATH || '(non défini)'}`);
  console.log(`   UPLOAD_BASE_DIR:     ${UPLOAD_BASE_DIR}`);
  console.log(`   Répertoire existe:   ${fs.existsSync(UPLOAD_BASE_DIR) ? '✅ Oui' : '❌ Non'}`);
  
  if (fs.existsSync(UPLOAD_BASE_DIR)) {
    const entries = fs.readdirSync(UPLOAD_BASE_DIR);
    console.log(`   Contenu racine:      [${entries.join(', ')}]`);
  }

  try {
    await sequelize.authenticate();
    console.log('\n✅ Connexion BDD réussie');
  } catch (error) {
    console.error('\n❌ Erreur connexion BDD:', error.message);
    process.exit(1);
  }

  // Construire la requête
  let whereClause = {};
  if (options.category) {
    whereClause.category = options.category;
  }
  
  const query = `
    SELECT 
      f.node_id,
      f.original_name,
      f.file_path,
      f.storage_key,
      f.category,
      f.subcategory,
      f.size,
      f.context,
      n.path as node_path,
      n.parent_id
    FROM files f
    JOIN nodes n ON f.node_id = n.id
    ${options.category ? "WHERE f.category = '" + options.category + "'" : ''}
    ${options.nodeId ? (options.category ? " AND" : " WHERE") + " n.parent_id = " + options.nodeId : ''}
    ORDER BY f.uploaded_at DESC
    LIMIT 50
  `;

  console.log('\n📊 Analyse des fichiers en base de données:');
  console.log('-'.repeat(80));
  
  const [files] = await sequelize.query(query);
  
  let totalFiles = 0;
  let existingFiles = 0;
  let missingFiles = 0;
  let fixedFiles = 0;
  const issues = [];

  for (const file of files) {
    totalFiles++;
    
    // Déterminer le chemin physique
    let physicalPathFromKey = null;
    let physicalPathFromPath = null;
    let fileExists = false;
    let existsVia = null;
    
    if (file.storage_key) {
      physicalPathFromKey = path.join(UPLOAD_BASE_DIR, file.storage_key);
      if (fs.existsSync(physicalPathFromKey)) {
        fileExists = true;
        existsVia = 'storage_key';
      }
    }
    
    if (!fileExists && file.file_path) {
      physicalPathFromPath = file.file_path;
      if (fs.existsSync(physicalPathFromPath)) {
        fileExists = true;
        existsVia = 'file_path';
      }
    }
    
    const status = fileExists ? '✅' : '❌';
    
    console.log(`\n${status} Fichier #${file.node_id}: ${file.original_name}`);
    console.log(`   Catégorie:      ${file.category || 'N/A'}`);
    console.log(`   storage_key:    ${file.storage_key || 'N/A'}`);
    console.log(`   file_path:      ${file.file_path || 'N/A'}`);
    console.log(`   Taille BDD:     ${file.size ? (file.size / 1024).toFixed(2) + ' KB' : 'N/A'}`);
    
    if (fileExists) {
      existingFiles++;
      console.log(`   🟢 Existe via:  ${existsVia}`);
      
      // Vérifier la taille réelle
      const realPath = existsVia === 'storage_key' ? physicalPathFromKey : physicalPathFromPath;
      const stats = fs.statSync(realPath);
      console.log(`   Taille réelle:  ${(stats.size / 1024).toFixed(2)} KB`);
      
      if (stats.size !== parseInt(file.size)) {
        console.log(`   ⚠️ Incohérence de taille!`);
        issues.push({ nodeId: file.node_id, issue: 'size_mismatch', expected: file.size, actual: stats.size });
      }
    } else {
      missingFiles++;
      console.log(`   🔴 Fichier introuvable!`);
      console.log(`   Chemin vérifié (key):  ${physicalPathFromKey}`);
      console.log(`   Chemin vérifié (path): ${physicalPathFromPath}`);
      
      // Chercher le fichier dans d'autres emplacements possibles
      const possibleLocations = [
        path.join(UPLOAD_BASE_DIR, 'temp', file.original_name),
        path.join(UPLOAD_BASE_DIR, 'temp_uploads'),
        path.join('/app/uploads', file.storage_key || ''),
        path.join('./uploads', file.storage_key || '')
      ];
      
      let foundAt = null;
      for (const loc of possibleLocations) {
        if (loc && fs.existsSync(loc)) {
          foundAt = loc;
          break;
        }
      }
      
      if (foundAt) {
        console.log(`   💡 Trouvé à:    ${foundAt}`);
        issues.push({ nodeId: file.node_id, issue: 'wrong_path', foundAt, expectedKey: file.storage_key });
        
        if (options.fix) {
          // Tenter de corriger
          const correctPath = path.join(UPLOAD_BASE_DIR, file.storage_key);
          try {
            fs.mkdirSync(path.dirname(correctPath), { recursive: true });
            fs.copyFileSync(foundAt, correctPath);
            console.log(`   ✅ Fichier copié vers: ${correctPath}`);
            fixedFiles++;
          } catch (err) {
            console.log(`   ❌ Erreur correction: ${err.message}`);
          }
        }
      } else {
        issues.push({ nodeId: file.node_id, issue: 'file_missing', storage_key: file.storage_key, file_path: file.file_path });
      }
      
      // Analyser le contexte JSON
      if (file.context) {
        try {
          const ctx = typeof file.context === 'string' ? JSON.parse(file.context) : file.context;
          console.log(`   Contexte:       entity=${ctx.entity_type}/${ctx.entity_id}, type=${ctx.file_type}`);
          if (ctx.temp_id) {
            console.log(`   ⚠️ temp_id encore présent: ${ctx.temp_id}`);
          }
        } catch (e) {
          console.log(`   Contexte:       (erreur parsing)`);
        }
      }
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('📈 RÉSUMÉ');
  console.log('='.repeat(80));
  console.log(`   Total fichiers analysés:  ${totalFiles}`);
  console.log(`   Fichiers existants:       ${existingFiles} ✅`);
  console.log(`   Fichiers manquants:       ${missingFiles} ❌`);
  if (options.fix) {
    console.log(`   Fichiers corrigés:        ${fixedFiles}`);
  }

  if (issues.length > 0) {
    console.log('\n⚠️ PROBLÈMES DÉTECTÉS:');
    for (const issue of issues) {
      console.log(`   - Node #${issue.nodeId}: ${issue.issue}`);
    }
    
    if (!options.fix) {
      console.log('\n💡 Pour tenter de corriger les problèmes de chemin, relancez avec --fix');
    }
  }

  // Vérifier les fichiers temporaires orphelins
  console.log('\n' + '-'.repeat(80));
  console.log('🔍 Vérification des fichiers temporaires orphelins:');
  
  const tempUploadDir = path.join(UPLOAD_BASE_DIR, 'temp_uploads');
  if (fs.existsSync(tempUploadDir)) {
    const tempDirs = fs.readdirSync(tempUploadDir);
    console.log(`   Dossiers temp_uploads: ${tempDirs.length}`);
    
    if (tempDirs.length > 0) {
      console.log(`   ⚠️ Il y a ${tempDirs.length} dossier(s) temporaire(s) non nettoyé(s)`);
      for (const dir of tempDirs.slice(0, 5)) {
        const tempDirPath = path.join(tempUploadDir, dir);
        if (fs.statSync(tempDirPath).isDirectory()) {
          const files = fs.readdirSync(tempDirPath);
          console.log(`      - ${dir}: ${files.length} fichier(s)`);
        }
      }
      if (tempDirs.length > 5) {
        console.log(`      ... et ${tempDirs.length - 5} autre(s)`);
      }
    }
  } else {
    console.log(`   Dossier temp_uploads n'existe pas (normal si aucun upload récent)`);
  }

  await sequelize.close();
  console.log('\n✅ Diagnostic terminé\n');
}

diagnose().catch(err => {
  console.error('\n❌ Erreur fatale:', err);
  process.exit(1);
});

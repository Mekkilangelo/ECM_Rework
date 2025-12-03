/**
 * Script de migration des fichiers existants vers le nouveau système
 * 
 * Ce script:
 * 1. Parcourt tous les fichiers en BDD
 * 2. Génère storage_key et context pour chacun
 * 3. Déplace les fichiers physiques vers la nouvelle structure
 * 4. Met à jour les enregistrements en BDD
 * 5. Crée un rapport de migration
 * 
 * Usage:
 *   node scripts/migrate-files-to-storage-key.js [--dry-run] [--batch-size=100]
 */

const path = require('path');
const fs = require('fs').promises;
const fsSync = require('fs');
const { node, file, closure, sequelize } = require('../models');
const fileStorageService = require('../services/storage/FileStorageService');
const fileMetadataService = require('../services/storage/FileMetadataService');
const logger = require('../utils/logger');

// Configuration
const DRY_RUN = process.argv.includes('--dry-run');
const BATCH_SIZE = parseInt(process.argv.find(arg => arg.startsWith('--batch-size='))?.split('=')[1] || '100');

class FileMigrationService {
  constructor() {
    this.stats = {
      total: 0,
      migrated: 0,
      skipped: 0,
      errors: 0,
      errorFiles: []
    };
  }

  /**
   * Point d'entrée principal de la migration
   */
  async migrate() {
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║  Migration des fichiers vers le nouveau système           ║');
    console.log('╚════════════════════════════════════════════════════════════╝');
    console.log('');
    console.log(`Mode: ${DRY_RUN ? '🔍 DRY-RUN (simulation)' : '🚀 PRODUCTION'}`);
    console.log(`Taille des lots: ${BATCH_SIZE}`);
    console.log('');

    try {
      // 1. Compter les fichiers à migrer
      await this.countFiles();
      
      // 2. Confirmer avant de continuer (sauf en dry-run)
      if (!DRY_RUN) {
        await this.confirmMigration();
      }
      
      // 3. Créer un backup
      if (!DRY_RUN) {
        await this.createBackup();
      }
      
      // 4. Migrer les fichiers par lots
      await this.migrateFiles();
      
      // 5. Vérifier l'intégrité
      await this.verifyIntegrity();
      
      // 6. Afficher le rapport
      this.printReport();
      
    } catch (error) {
      console.error('❌ Erreur fatale durant la migration:', error);
      process.exit(1);
    }
  }

  /**
   * Compte les fichiers à migrer
   */
  async countFiles() {
    console.log('📊 Comptage des fichiers...');
    
    const totalFiles = await file.count({
      where: {
        storage_key: null // Fichiers pas encore migrés
      }
    });
    
    this.stats.total = totalFiles;
    
    console.log(`   Fichiers à migrer: ${totalFiles}`);
    console.log('');
  }

  /**
   * Demande confirmation pour la migration
   */
  async confirmMigration() {
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    return new Promise((resolve) => {
      rl.question('⚠️  Continuer la migration ? (oui/non): ', (answer) => {
        rl.close();
        
        if (answer.toLowerCase() !== 'oui') {
          console.log('Migration annulée.');
          process.exit(0);
        }
        
        resolve();
      });
    });
  }

  /**
   * Crée un backup de la table files
   */
  async createBackup() {
    console.log('💾 Création du backup...');
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(__dirname, `../backups/files_backup_${timestamp}.json`);
    
    // Créer le dossier backups s'il n'existe pas
    const backupDir = path.dirname(backupFile);
    if (!fsSync.existsSync(backupDir)) {
      await fs.mkdir(backupDir, { recursive: true });
    }
    
    // Récupérer toutes les données
    const allFiles = await file.findAll({
      include: [{
        model: node,
        as: 'node'
      }]
    });
    
    // Sauvegarder en JSON
    await fs.writeFile(
      backupFile,
      JSON.stringify(allFiles, null, 2),
      'utf8'
    );
    
    console.log(`   Backup créé: ${backupFile}`);
    console.log('');
  }

  /**
   * Migre les fichiers par lots
   */
  async migrateFiles() {
    console.log('🔄 Migration des fichiers...');
    console.log('');
    
    let offset = 0;
    let hasMore = true;
    
    while (hasMore) {
      // Récupérer un lot de fichiers
      const filesToMigrate = await file.findAll({
        where: {
          storage_key: null
        },
        include: [{
          model: node,
          as: 'node',
          required: true
        }],
        limit: BATCH_SIZE,
        offset: offset
      });
      
      if (filesToMigrate.length === 0) {
        hasMore = false;
        break;
      }
      
      // Migrer chaque fichier du lot
      for (const fileRecord of filesToMigrate) {
        await this.migrateFile(fileRecord);
      }
      
      offset += BATCH_SIZE;
      
      // Afficher la progression
      const progress = Math.min(100, (offset / this.stats.total * 100).toFixed(1));
      console.log(`   Progression: ${progress}% (${this.stats.migrated}/${this.stats.total})`);
    }
    
    console.log('');
  }

  /**
   * Migre un fichier individuel
   */
  async migrateFile(fileRecord) {
    const fileNode = fileRecord.node;
    
    try {
      // 1. Construire le contexte depuis category/subcategory
      const context = await this.buildContextFromLegacyData(fileRecord, fileNode);
      
      // 2. Générer la storage_key
      const storageKey = fileStorageService.generateStorageKey(
        context.entity_type,
        context.entity_id,
        context.file_type,
        fileRecord.original_name
      );
      
      // 3. Calculer le nouveau chemin physique
      const newPhysicalPath = fileStorageService.getPhysicalPath(storageKey);
      
      // 4. Déplacer le fichier physique (si non dry-run)
      if (!DRY_RUN) {
        if (fileRecord.file_path && fsSync.existsSync(fileRecord.file_path)) {
          const newDir = path.dirname(newPhysicalPath);
          await fs.mkdir(newDir, { recursive: true });
          await fs.rename(fileRecord.file_path, newPhysicalPath);
        } else {
          logger.warn('Fichier physique manquant', {
            fileId: fileRecord.node_id,
            filePath: fileRecord.file_path
          });
          this.stats.skipped++;
          return;
        }
      }
      
      // 5. Générer checksum si pas déjà présent
      let checksum = fileRecord.checksum;
      if (!checksum && !DRY_RUN) {
        checksum = await fileStorageService.generateChecksum(storageKey);
      }
      
      // 6. Mettre à jour l'enregistrement (si non dry-run)
      if (!DRY_RUN) {
        await fileRecord.update({
          storage_key: storageKey,
          context: context,
          checksum: checksum || fileRecord.checksum,
          version: 1,
          is_latest: true
        });
      }
      
      this.stats.migrated++;
      
      if (DRY_RUN) {
        console.log(`   ✓ [DRY-RUN] ${fileRecord.original_name} → ${storageKey}`);
      }
      
    } catch (error) {
      this.stats.errors++;
      this.stats.errorFiles.push({
        fileId: fileRecord.node_id,
        fileName: fileRecord.original_name,
        error: error.message
      });
      
      logger.error('Erreur migration fichier', {
        fileId: fileRecord.node_id,
        fileName: fileRecord.original_name,
        error: error.message
      });
    }
  }

  /**
   * Construit le contexte depuis les données legacy
   */
  async buildContextFromLegacyData(fileRecord, fileNode) {
    // Déterminer l'entité parente
    const { entityType, entityId } = await fileMetadataService.getEntityInfo(fileNode);
    
    // Normaliser category/subcategory
    const fileType = fileMetadataService.normalizeFileType(fileRecord.category);
    const fileSubtype = fileMetadataService.normalizeFileSubtype(
      fileRecord.subcategory,
      fileType
    );
    
    // Extraire sample/result depuis la subcategory si format dynamique
    let sampleNumber = null;
    let resultIndex = null;
    
    if (fileRecord.subcategory) {
      const match = fileRecord.subcategory.match(/result-(\d+)-sample-(\d+)/);
      if (match) {
        resultIndex = parseInt(match[1]);
        sampleNumber = parseInt(match[2]);
      }
    }
    
    // Ou depuis category
    if (fileRecord.category && fileRecord.category.startsWith('micrographs-result-')) {
      const match = fileRecord.category.match(/micrographs-result-(\d+)/);
      if (match) {
        resultIndex = parseInt(match[1]);
      }
    }
    
    return {
      entity_type: entityType,
      entity_id: entityId,
      file_type: fileType,
      file_subtype: fileSubtype,
      sample_number: sampleNumber,
      result_index: resultIndex,
      parent_node_id: fileNode.parent_id,
      parent_node_type: fileNode.type,
      parent_node_path: fileNode.path,
      upload_source: 'migration',
      custom_tags: [],
      migrated_from_legacy: true,
      legacy_category: fileRecord.category,
      legacy_subcategory: fileRecord.subcategory,
      migration_date: new Date().toISOString()
    };
  }

  /**
   * Vérifie l'intégrité après migration
   */
  async verifyIntegrity() {
    console.log('🔍 Vérification de l\'intégrité...');
    
    if (DRY_RUN) {
      console.log('   (Ignoré en mode dry-run)');
      console.log('');
      return;
    }
    
    // Compter les fichiers migrés
    const migratedCount = await file.count({
      where: {
        storage_key: { [sequelize.Sequelize.Op.ne]: null }
      }
    });
    
    // Compter les fichiers restants
    const remainingCount = await file.count({
      where: {
        storage_key: null
      }
    });
    
    console.log(`   Fichiers migrés: ${migratedCount}`);
    console.log(`   Fichiers restants: ${remainingCount}`);
    
    // Vérifier l'existence physique de quelques fichiers au hasard
    const sampleFiles = await file.findAll({
      where: {
        storage_key: { [sequelize.Sequelize.Op.ne]: null }
      },
      limit: 10,
      order: sequelize.literal('RAND()')
    });
    
    let missingFiles = 0;
    for (const fileRecord of sampleFiles) {
      const exists = await fileStorageService.fileExists(fileRecord.storage_key);
      if (!exists) {
        missingFiles++;
        logger.error('Fichier physique manquant après migration', {
          fileId: fileRecord.node_id,
          storageKey: fileRecord.storage_key
        });
      }
    }
    
    if (missingFiles > 0) {
      console.log(`   ⚠️  ${missingFiles} fichiers physiques manquants (sur ${sampleFiles.length} vérifiés)`);
    } else {
      console.log(`   ✓ Tous les fichiers vérifiés existent physiquement`);
    }
    
    console.log('');
  }

  /**
   * Affiche le rapport final
   */
  printReport() {
    console.log('');
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║  RAPPORT DE MIGRATION                                      ║');
    console.log('╚════════════════════════════════════════════════════════════╝');
    console.log('');
    console.log(`Total de fichiers:      ${this.stats.total}`);
    console.log(`Migrés avec succès:     ${this.stats.migrated}`);
    console.log(`Ignorés:                ${this.stats.skipped}`);
    console.log(`Erreurs:                ${this.stats.errors}`);
    console.log('');
    
    if (this.stats.errors > 0) {
      console.log('❌ Fichiers en erreur:');
      console.log('');
      this.stats.errorFiles.forEach((errorFile, index) => {
        console.log(`   ${index + 1}. ${errorFile.fileName} (ID: ${errorFile.fileId})`);
        console.log(`      Erreur: ${errorFile.error}`);
      });
      console.log('');
    }
    
    if (DRY_RUN) {
      console.log('ℹ️  Mode DRY-RUN: Aucune modification n\'a été effectuée.');
      console.log('   Relancer sans --dry-run pour effectuer la migration réelle.');
    } else {
      console.log('✅ Migration terminée avec succès!');
    }
    
    console.log('');
  }
}

// Exécution du script
if (require.main === module) {
  const migrationService = new FileMigrationService();
  
  migrationService.migrate()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error('Erreur fatale:', error);
      process.exit(1);
    });
}

module.exports = FileMigrationService;

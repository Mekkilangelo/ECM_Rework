/**
 * Script de migration pour normaliser les noms de fichiers mal encodés
 * Corrige les problèmes d'encodage UTF-8 dans les noms de fichiers (è → e, é → e, etc.)
 *
 * Usage:
 *   node scripts/fix-file-encoding.js [--dry-run]
 *
 * Options:
 *   --dry-run : Affiche les changements sans les appliquer
 */

const { node, file, sequelize } = require('../models');
const logger = require('../utils/logger');

/**
 * Normalise un nom de fichier en retirant les accents
 * @param {string} filename - Nom de fichier original
 * @returns {string} Nom normalisé
 */
function normalizeFilename(filename) {
  if (!filename) return filename;

  return filename
    .normalize('NFD') // Décompose les caractères accentués (é → e + ´)
    .replace(/[\u0300-\u036f]/g, ''); // Supprime les diacritiques
}

/**
 * Détecte si un nom contient des caractères mal encodés (double encodage UTF-8)
 * @param {string} str - Chaîne à vérifier
 * @returns {boolean}
 */
function hasEncodingIssues(str) {
  if (!str) return false;

  // Vérifier la présence de séquences caractéristiques du double encodage UTF-8
  // Ã¨ (è mal encodé), Ã© (é mal encodé), Ã  (à mal encodé), etc.
  return /Ã[\x80-\xBF]/.test(str);
}

/**
 * Tente de corriger le double encodage UTF-8
 * @param {string} str - Chaîne mal encodée
 * @returns {string} Chaîne corrigée
 */
function fixDoubleEncoding(str) {
  if (!str) return str;

  try {
    // Encoder en latin1 puis décoder en UTF-8 pour corriger le double encodage
    const buffer = Buffer.from(str, 'latin1');
    return buffer.toString('utf8');
  } catch (error) {
    logger.warn('Impossible de corriger le double encodage', { str, error: error.message });
    return str;
  }
}

async function fixFileEncoding(dryRun = false) {
  try {
    logger.info('🔧 Début de la correction des noms de fichiers', { dryRun });

    // Récupérer tous les fichiers
    const files = await file.findAll({
      include: [{
        model: node,
        as: 'node',
        required: true
      }]
    });

    logger.info(`📁 ${files.length} fichiers trouvés`);

    let fixedCount = 0;
    let skippedCount = 0;
    const changes = [];

    for (const fileRecord of files) {
      const fileNode = fileRecord.node;
      let needsUpdate = false;
      let newOriginalName = fileRecord.original_name;
      let newNodeName = fileNode.name;

      // 1. Vérifier et corriger le double encodage UTF-8
      if (hasEncodingIssues(fileRecord.original_name)) {
        const fixed = fixDoubleEncoding(fileRecord.original_name);
        newOriginalName = normalizeFilename(fixed);
        needsUpdate = true;
        logger.info(`🔄 Double encodage détecté`, {
          id: fileRecord.node_id,
          original: fileRecord.original_name,
          fixed: fixed,
          normalized: newOriginalName
        });
      }

      if (hasEncodingIssues(fileNode.name)) {
        const fixed = fixDoubleEncoding(fileNode.name);
        newNodeName = normalizeFilename(fixed);
        needsUpdate = true;
      }

      // 2. Normaliser les accents restants
      const normalizedOriginalName = normalizeFilename(newOriginalName);
      const normalizedNodeName = normalizeFilename(newNodeName);

      if (normalizedOriginalName !== newOriginalName || normalizedNodeName !== newNodeName) {
        newOriginalName = normalizedOriginalName;
        newNodeName = normalizedNodeName;
        needsUpdate = true;
        logger.info(`✨ Normalisation des accents`, {
          id: fileRecord.node_id,
          originalName: fileRecord.original_name,
          newName: newOriginalName
        });
      }

      // 3. Appliquer les modifications si nécessaire
      if (needsUpdate) {
        changes.push({
          fileId: fileRecord.node_id,
          oldOriginalName: fileRecord.original_name,
          newOriginalName: newOriginalName,
          oldNodeName: fileNode.name,
          newNodeName: newNodeName
        });

        if (!dryRun) {
          // Mettre à jour en base de données
          await file.update(
            { original_name: newOriginalName },
            { where: { node_id: fileRecord.node_id } }
          );

          await node.update(
            { name: newNodeName },
            { where: { id: fileNode.id } }
          );

          logger.info(`✅ Fichier mis à jour`, {
            id: fileRecord.node_id,
            newName: newOriginalName
          });
        }

        fixedCount++;
      } else {
        skippedCount++;
      }
    }

    // Afficher le résumé
    logger.info('📊 Résumé de la migration', {
      total: files.length,
      fixed: fixedCount,
      skipped: skippedCount,
      dryRun
    });

    if (dryRun && changes.length > 0) {
      logger.info('📋 Changements qui seraient appliqués:');
      changes.forEach(change => {
        logger.info(`  - File #${change.fileId}:`);
        logger.info(`    Original: "${change.oldOriginalName}" → "${change.newOriginalName}"`);
        logger.info(`    Node: "${change.oldNodeName}" → "${change.newNodeName}"`);
      });
    }

    logger.info('✅ Migration terminée avec succès');

    return {
      total: files.length,
      fixed: fixedCount,
      skipped: skippedCount,
      changes
    };

  } catch (error) {
    logger.error('❌ Erreur lors de la migration', {
      error: error.message,
      stack: error.stack
    });
    throw error;
  }
}

// Exécution du script
if (require.main === module) {
  const dryRun = process.argv.includes('--dry-run');

  if (dryRun) {
    logger.info('🔍 Mode DRY-RUN activé - Aucune modification ne sera appliquée');
  }

  fixFileEncoding(dryRun)
    .then(result => {
      logger.info('✅ Script terminé', result);
      process.exit(0);
    })
    .catch(error => {
      logger.error('❌ Erreur fatale', { error: error.message });
      process.exit(1);
    });
}

module.exports = { fixFileEncoding, normalizeFilename, hasEncodingIssues, fixDoubleEncoding };

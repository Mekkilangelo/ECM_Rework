/**
 * Utilitaires pour la suppression de fichiers physiques
 * Évite les dépendances circulaires entre les services
 */

const fs = require('fs');
const { Node, File } = require('../models');
const { Op } = require('sequelize');

/**
 * Supprime physiquement tous les fichiers associés à un nœud
 * @param {number} nodeId - ID du nœud
 * @param {Object} transaction - Transaction Sequelize
 * @returns {Promise<number>} Nombre de fichiers supprimés
 */
const deletePhysicalFiles = async (nodeId, transaction = null) => {
  try {
    // Récupérer tous les fichiers associés à ce nœud
    const fileNodes = await Node.findAll({
      where: {
        [Op.or]: [
          { parent_id: nodeId, type: 'file' },
          { id: nodeId, type: 'file' }
        ]
      },
      include: [{
        model: File,
        required: true
      }],
      transaction
    });

    let deletedCount = 0;

    for (const fileNode of fileNodes) {
      try {
        const file = fileNode.File;
        
        // Supprimer le fichier physique si il existe
        if (file && file.file_path && fs.existsSync(file.file_path)) {
          fs.unlinkSync(file.file_path);
          console.log(`Fichier physique supprimé: ${file.file_path}`);
        }

        deletedCount++;
      } catch (error) {
        console.warn(`Erreur lors de la suppression du fichier physique ${fileNode.id}:`, error.message);
        // Continue avec les autres fichiers même si un échoue
      }
    }

    return deletedCount;
  } catch (error) {
    console.error('Erreur lors de la suppression des fichiers physiques:', error);
    return 0; // Retourner 0 plutôt que de lancer une erreur pour ne pas bloquer la suppression du nœud
  }
};

module.exports = {
  deletePhysicalFiles
};

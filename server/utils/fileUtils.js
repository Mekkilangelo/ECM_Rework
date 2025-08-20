/**
 * Utilitaires pour la suppression de fichiers physiques
 * Évite les dépendances circulaires entre les services
 */

const fs = require('fs');
const path = require('path');
const { node, file } = require('../models');
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
    const fileNodes = await node.findAll({
      where: {
        [Op.or]: [
          { parent_id: nodeId, type: 'file' },
          { id: nodeId, type: 'file' }
        ]
      },
      include: [{
        model: file,
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
    }    return deletedCount;
  } catch (error) {
    console.error('Erreur lors de la suppression des fichiers physiques:', error);
    return 0; // Retourner 0 plutôt que de lancer une erreur pour ne pas bloquer la suppression du nœud
  }
};

/**
 * Supprime physiquement le dossier d'un nœud et tous ses sous-dossiers
 * @param {string} nodePath - Chemin logique du nœud (colonne path de la table nodes)
 * @param {string} uploadsBasePath - Chemin de base des uploads (optionnel)
 * @returns {Promise<boolean>} True si la suppression a réussi
 */
const deletePhysicalDirectory = async (nodePath, uploadsBasePath = null) => {
  try {
    // Obtenir le chemin de base des uploads
    const baseDir = uploadsBasePath || process.env.UPLOAD_PATH || path.join(__dirname, '..', 'uploads');
    
    // Construire le chemin physique complet
    // Le nodePath commence généralement par /, donc on l'enlève pour éviter les doublons
    const cleanedPath = nodePath.startsWith('/') ? nodePath.substring(1) : nodePath;
    const physicalPath = path.join(baseDir, cleanedPath);
    
    console.log(`Tentative de suppression du dossier physique: ${physicalPath}`);
    
    // Vérifier si le dossier existe
    if (!fs.existsSync(physicalPath)) {
      console.log(`Le dossier n'existe pas: ${physicalPath}`);
      return true; // Considéré comme réussi car le dossier n'existe déjà plus
    }
    
    // Supprimer récursivement le dossier et tout son contenu
    fs.rmSync(physicalPath, { recursive: true, force: true });
    console.log(`Dossier physique supprimé avec succès: ${physicalPath}`);
    
    return true;
  } catch (error) {
    console.error(`Erreur lors de la suppression du dossier physique ${nodePath}:`, error.message);
    return false; // Retourner false plutôt que de lancer une erreur pour ne pas bloquer la suppression du nœud
  }
};

module.exports = {
  deletePhysicalFiles,
  deletePhysicalDirectory
};

/**
 * FileStorageService - Gestion du stockage physique des fichiers
 * 
 * Responsabilités:
 * - Génération de storage_key immuables
 * - Gestion des chemins physiques
 * - Opérations sur le filesystem (save, delete, move)
 * - Nettoyage automatique des dossiers vides
 * 
 * Architecture:
 * - Indépendant de la BDD (pure logique de stockage)
 * - Facilement remplaçable par S3Service pour cloud storage
 * - Testable en isolation
 */

const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const logger = require('../../utils/logger');
const { UPLOAD_BASE_DIR } = require('../../utils/fileStorage');

class FileStorageService {
  /**
   * Initialise le service de stockage
   * @param {string} baseDir - Répertoire de base pour le stockage
   */
  constructor(baseDir = null) {
    // Utiliser UPLOAD_BASE_DIR depuis fileStorage.js pour cohérence
    this.baseDir = baseDir || UPLOAD_BASE_DIR;
    this.ensureBaseDirExists();
  }

  /**
   * S'assure que le répertoire de base existe
   */
  ensureBaseDirExists() {
    if (!fsSync.existsSync(this.baseDir)) {
      fsSync.mkdirSync(this.baseDir, { recursive: true });
      logger.info('Répertoire de stockage créé', { path: this.baseDir });
    }
  }

  /**
   * Génère une clé de stockage unique et immuable
   * 
   * Format: {entity_type}/{entity_id}/{file_type}/{uuid}-{safename}.{ext}
   * Exemple: trial/456/micrograph/a3f5c9d1-sample-1-x50.jpg
   * 
   * @param {string} entityType - Type d'entité (trial, part, client)
   * @param {number} entityId - ID de l'entité
   * @param {string} fileType - Type de fichier (micrograph, photo, etc.)
   * @param {string} originalFilename - Nom du fichier original
   * @returns {string} Storage key unique
   */
  generateStorageKey(entityType, entityId, fileType, originalFilename) {
    const uuid = uuidv4().split('-')[0]; // Utiliser seulement les 8 premiers chars
    const ext = path.extname(originalFilename);
    const baseName = path.basename(originalFilename, ext);
    
    // Créer un nom sûr (alphanumerique + tirets/underscores)
    const safeName = baseName
      .replace(/[^a-zA-Z0-9-_]/g, '_')
      .replace(/_{2,}/g, '_')
      .substring(0, 50);
    
    const fileName = `${uuid}-${safeName}${ext}`;
    
    return `${entityType}/${entityId}/${fileType}/${fileName}`;
  }

  /**
   * Construit le chemin physique complet depuis une storage_key
   * @param {string} storageKey - Clé de stockage
   * @returns {string} Chemin physique absolu
   */
  getPhysicalPath(storageKey) {
    return path.join(this.baseDir, storageKey);
  }

  /**
   * Extrait les composants d'une storage_key
   * @param {string} storageKey - Clé de stockage
   * @returns {Object} Composants { entityType, entityId, fileType, filename }
   */
  parseStorageKey(storageKey) {
    const parts = storageKey.split('/');
    
    if (parts.length !== 4) {
      throw new Error(`Format de storage_key invalide: ${storageKey}`);
    }
    
    return {
      entityType: parts[0],
      entityId: parseInt(parts[1]),
      fileType: parts[2],
      filename: parts[3]
    };
  }

  /**
   * Sauvegarde un fichier uploadé vers sa destination finale
   * @param {Object} uploadedFile - Fichier multer avec path temporaire
   * @param {string} storageKey - Clé de stockage cible
   * @returns {Promise<string>} Chemin physique final
   */
  async saveFile(uploadedFile, storageKey) {
    try {
      const physicalPath = this.getPhysicalPath(storageKey);
      const dir = path.dirname(physicalPath);
      
      logger.debug('Début saveFile', {
        sourcePath: uploadedFile.path,
        storageKey,
        targetPath: physicalPath,
        size: uploadedFile.size
      });
      
      // Vérifier que le fichier source existe
      try {
        await fs.access(uploadedFile.path);
      } catch (accessError) {
        logger.error('Fichier source introuvable dans saveFile', {
          sourcePath: uploadedFile.path,
          error: accessError.message
        });
        throw new Error(`Fichier source introuvable: ${uploadedFile.path}`);
      }
      
      // Créer les dossiers parents si nécessaire
      await fs.mkdir(dir, { recursive: true });
      
      // Essayer de déplacer le fichier, sinon copier puis supprimer
      // (fs.rename ne fonctionne pas entre différents systèmes de fichiers)
      try {
        await fs.rename(uploadedFile.path, physicalPath);
      } catch (renameError) {
        if (renameError.code === 'EXDEV') {
          // Cross-device link: copier puis supprimer
          logger.debug('Cross-device rename, utilisation de copy+delete', { 
            source: uploadedFile.path, 
            destination: physicalPath 
          });
          await fs.copyFile(uploadedFile.path, physicalPath);
          await fs.unlink(uploadedFile.path);
        } else {
          throw renameError;
        }
      }
      
      // Vérifier que le fichier a bien été sauvegardé
      try {
        const stats = await fs.stat(physicalPath);
        logger.debug('Fichier sauvegardé avec succès', { 
          storageKey, 
          physicalPath,
          size: stats.size
        });
      } catch (verifyError) {
        logger.error('Fichier non trouvé après sauvegarde!', {
          storageKey,
          physicalPath,
          error: verifyError.message
        });
        throw new Error(`Échec de vérification après sauvegarde: ${physicalPath}`);
      }
      
      return physicalPath;
    } catch (error) {
      logger.error('Erreur sauvegarde fichier', { 
        storageKey,
        sourcePath: uploadedFile.path, 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * Vérifie l'existence d'un fichier
   * @param {string} storageKey - Clé de stockage
   * @returns {Promise<boolean>}
   */
  async fileExists(storageKey) {
    const physicalPath = this.getPhysicalPath(storageKey);
    
    try {
      await fs.access(physicalPath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Récupère les informations d'un fichier
   * @param {string} storageKey - Clé de stockage
   * @returns {Promise<Object>} Stats du fichier
   */
  async getFileStats(storageKey) {
    const physicalPath = this.getPhysicalPath(storageKey);
    
    try {
      const stats = await fs.stat(physicalPath);
      return {
        size: stats.size,
        createdAt: stats.birthtime,
        modifiedAt: stats.mtime,
        isFile: stats.isFile(),
        isDirectory: stats.isDirectory()
      };
    } catch (error) {
      logger.error('Erreur récupération stats fichier', { 
        storageKey, 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * Supprime un fichier physique
   * @param {string} storageKey - Clé de stockage
   * @returns {Promise<boolean>} True si supprimé, false si n'existait pas
   */
  async deleteFile(storageKey) {
    const physicalPath = this.getPhysicalPath(storageKey);
    
    try {
      if (await this.fileExists(storageKey)) {
        await fs.unlink(physicalPath);
        
        logger.debug('Fichier supprimé', { storageKey });
        
        // Nettoyer les dossiers vides
        await this.cleanupEmptyDirectories(path.dirname(physicalPath));
        
        return true;
      }
      
      logger.warn('Tentative de suppression d\'un fichier inexistant', { storageKey });
      return false;
    } catch (error) {
      logger.error('Erreur suppression fichier', { 
        storageKey, 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * Déplace un fichier vers un nouveau storage_key
   * @param {string} oldStorageKey - Ancienne clé
   * @param {string} newStorageKey - Nouvelle clé
   * @returns {Promise<void>}
   */
  async moveFile(oldStorageKey, newStorageKey) {
    const oldPath = this.getPhysicalPath(oldStorageKey);
    const newPath = this.getPhysicalPath(newStorageKey);
    const newDir = path.dirname(newPath);
    
    try {
      // Vérifier que le fichier source existe
      try {
        await fs.access(oldPath);
      } catch (accessError) {
        logger.error('Fichier source introuvable pour déplacement', {
          oldStorageKey,
          oldPath,
          error: accessError.message
        });
        throw new Error(`Fichier source introuvable: ${oldPath}`);
      }
      
      // Créer le nouveau dossier si nécessaire
      await fs.mkdir(newDir, { recursive: true });
      
      // Essayer de déplacer le fichier, sinon copier puis supprimer
      // (fs.rename ne fonctionne pas entre différents systèmes de fichiers)
      try {
        await fs.rename(oldPath, newPath);
      } catch (renameError) {
        if (renameError.code === 'EXDEV') {
          // Cross-device link: copier puis supprimer
          logger.debug('Cross-device rename dans moveFile, utilisation de copy+delete', { 
            source: oldPath, 
            destination: newPath 
          });
          await fs.copyFile(oldPath, newPath);
          await fs.unlink(oldPath);
        } else {
          throw renameError;
        }
      }
      
      // Vérifier que le fichier a bien été déplacé
      try {
        await fs.access(newPath);
        logger.debug('Fichier déplacé avec succès', { 
          from: oldStorageKey, 
          to: newStorageKey 
        });
      } catch (verifyError) {
        logger.error('Fichier non trouvé après déplacement!', {
          oldStorageKey,
          newStorageKey,
          newPath
        });
        throw new Error(`Échec de vérification après déplacement: ${newPath}`);
      }
      
      // Nettoyer l'ancien dossier s'il est vide
      await this.cleanupEmptyDirectories(path.dirname(oldPath));
    } catch (error) {
      logger.error('Erreur déplacement fichier', { 
        oldStorageKey, 
        newStorageKey,
        oldPath,
        newPath,
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * Copie un fichier vers un nouveau storage_key
   * @param {string} sourceStorageKey - Clé source
   * @param {string} targetStorageKey - Clé cible
   * @returns {Promise<void>}
   */
  async copyFile(sourceStorageKey, targetStorageKey) {
    const sourcePath = this.getPhysicalPath(sourceStorageKey);
    const targetPath = this.getPhysicalPath(targetStorageKey);
    const targetDir = path.dirname(targetPath);
    
    try {
      await fs.mkdir(targetDir, { recursive: true });
      await fs.copyFile(sourcePath, targetPath);
      
      logger.debug('Fichier copié', { 
        from: sourceStorageKey, 
        to: targetStorageKey 
      });
    } catch (error) {
      logger.error('Erreur copie fichier', { 
        sourceStorageKey, 
        targetStorageKey,
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * Nettoie les dossiers vides de manière récursive
   * @param {string} dirPath - Chemin du dossier à nettoyer
   */
  async cleanupEmptyDirectories(dirPath) {
    // Ne pas supprimer le dossier de base
    if (dirPath === this.baseDir || !dirPath.startsWith(this.baseDir)) {
      return;
    }
    
    try {
      const files = await fs.readdir(dirPath);
      
      // Si le dossier est vide, le supprimer
      if (files.length === 0) {
        await fs.rmdir(dirPath);
        logger.debug('Dossier vide supprimé', { path: dirPath });
        
        // Récursion pour vérifier le parent
        const parentDir = path.dirname(dirPath);
        await this.cleanupEmptyDirectories(parentDir);
      }
    } catch (error) {
      // Ignorer les erreurs de nettoyage (le dossier peut être utilisé par un autre processus)
      logger.debug('Erreur nettoyage dossier (ignorée)', { 
        path: dirPath, 
        error: error.message 
      });
    }
  }

  /**
   * Génère un checksum SHA-256 pour un fichier
   * @param {string} storageKey - Clé de stockage
   * @returns {Promise<string>} Checksum hexadécimal
   */
  async generateChecksum(storageKey) {
    const physicalPath = this.getPhysicalPath(storageKey);
    
    return new Promise((resolve, reject) => {
      const hash = crypto.createHash('sha256');
      const stream = fsSync.createReadStream(physicalPath);
      
      stream.on('error', err => reject(err));
      stream.on('data', chunk => hash.update(chunk));
      stream.on('end', () => resolve(hash.digest('hex')));
    });
  }

  /**
   * Liste tous les fichiers dans un répertoire d'entité
   * @param {string} entityType - Type d'entité
   * @param {number} entityId - ID de l'entité
   * @param {string} fileType - Type de fichier (optionnel)
   * @returns {Promise<Array<string>>} Liste des storage_keys
   */
  async listEntityFiles(entityType, entityId, fileType = null) {
    const basePath = fileType 
      ? path.join(this.baseDir, entityType, String(entityId), fileType)
      : path.join(this.baseDir, entityType, String(entityId));
    
    try {
      if (!fsSync.existsSync(basePath)) {
        return [];
      }
      
      const storageKeys = [];
      
      const scanDirectory = async (dirPath, prefix = '') => {
        const entries = await fs.readdir(dirPath, { withFileTypes: true });
        
        for (const entry of entries) {
          const fullPath = path.join(dirPath, entry.name);
          const relativePath = prefix ? `${prefix}/${entry.name}` : entry.name;
          
          if (entry.isDirectory()) {
            await scanDirectory(fullPath, relativePath);
          } else if (entry.isFile()) {
            // Construire le storage_key complet
            const storageKey = fileType
              ? `${entityType}/${entityId}/${fileType}/${relativePath}`
              : `${entityType}/${entityId}/${relativePath}`;
            storageKeys.push(storageKey);
          }
        }
      };
      
      await scanDirectory(basePath);
      
      return storageKeys;
    } catch (error) {
      logger.error('Erreur listage fichiers entité', { 
        entityType, 
        entityId, 
        fileType,
        error: error.message 
      });
      return [];
    }
  }

  /**
   * Calcule l'espace disque utilisé par une entité
   * @param {string} entityType - Type d'entité
   * @param {number} entityId - ID de l'entité
   * @returns {Promise<number>} Taille en bytes
   */
  async getEntityStorageSize(entityType, entityId) {
    const basePath = path.join(this.baseDir, entityType, String(entityId));
    
    try {
      if (!fsSync.existsSync(basePath)) {
        return 0;
      }
      
      let totalSize = 0;
      
      const calculateSize = async (dirPath) => {
        const entries = await fs.readdir(dirPath, { withFileTypes: true });
        
        for (const entry of entries) {
          const fullPath = path.join(dirPath, entry.name);
          
          if (entry.isDirectory()) {
            await calculateSize(fullPath);
          } else if (entry.isFile()) {
            const stats = await fs.stat(fullPath);
            totalSize += stats.size;
          }
        }
      };
      
      await calculateSize(basePath);
      
      return totalSize;
    } catch (error) {
      logger.error('Erreur calcul taille stockage', { 
        entityType, 
        entityId,
        error: error.message 
      });
      return 0;
    }
  }
}

// Export singleton instance
module.exports = new FileStorageService();

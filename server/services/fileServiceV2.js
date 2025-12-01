/**
 * FileServiceV2 - Service principal de gestion des fichiers (Version refactorisée)
 * 
 * Cette version utilise:
 * - FileStorageService pour la gestion physique
 * - FileMetadataService pour le contexte et métadonnées
 * - Storage key immuable au lieu de file_path
 * - Contexte JSON flexible au lieu de category/subcategory rigides
 * 
 * Compatible avec l'ancien système pendant la migration
 */

const fs = require('fs').promises;
const { Op } = require('sequelize');
const { node, file, closure, sequelize } = require('../models');
const { NotFoundError, ValidationError } = require('../utils/errors');
const { updateAncestorsModifiedAt } = require('../utils/hierarchyUtils');
const logger = require('../utils/logger');

// Nouveaux services
const fileStorageService = require('./storage/FileStorageService');
const fileMetadataService = require('./storage/FileMetadataService');

class FileServiceV2 {
  /**
   * Upload de fichiers avec le nouveau système
   * @param {Array} uploadedFiles - Fichiers multer
   * @param {Object} params - Paramètres d'upload
   * @param {Object} options - Options supplémentaires
   * @returns {Promise<Object>} Résultat de l'opération
   */
  async uploadFiles(uploadedFiles, params, options = {}) {
    const { 
      nodeId, 
      category, 
      subcategory, 
      sampleNumber, 
      resultIndex,
      userId = null
    } = params;
    
    const { useLegacySystem = false } = options;
    
    // Validation
    if (!nodeId) {
      throw new ValidationError('nodeId est requis pour l\'upload de fichiers');
    }
    
    if (!uploadedFiles || uploadedFiles.length === 0) {
      throw new ValidationError('Aucun fichier à uploader');
    }
    
    const transaction = await sequelize.transaction();
    
    try {
      // Récupérer le nœud parent
      const parentNode = await node.findByPk(nodeId, { transaction });
      if (!parentNode) {
        throw new NotFoundError('Nœud parent non trouvé');
      }
      
      const uploadedFileRecords = [];
      
      for (const uploadedFile of uploadedFiles) {
        // 1. Construire le contexte du fichier
        const context = await fileMetadataService.buildFileContext({
          category,
          subcategory,
          sampleNumber,
          resultIndex
        }, parentNode);
        
        // 2. Générer la storage key
        const storageKey = fileStorageService.generateStorageKey(
          context.entity_type,
          context.entity_id,
          context.file_type,
          uploadedFile.originalname
        );
        
        // 3. Sauvegarder le fichier physique
        const physicalPath = await fileStorageService.saveFile(
          uploadedFile,
          storageKey
        );
        
        // 4. Créer le nœud du fichier
        const fileNode = await node.create({
          name: uploadedFile.originalname,
          path: `${parentNode.path}/${uploadedFile.originalname}`,
          type: 'file',
          parent_id: nodeId,
          data_status: 'new'
        }, { transaction });
        
        // 5. Créer les relations de closure
        await this.createClosureRelations(fileNode.id, nodeId, transaction);
        
        // 6. Générer le checksum
        const checksum = await fileStorageService.generateChecksum(storageKey);
        
        // 7. Créer l'enregistrement du fichier
        const fileRecord = await file.create({
          node_id: fileNode.id,
          original_name: uploadedFile.originalname,
          storage_key: storageKey,
          size: uploadedFile.size,
          mime_type: uploadedFile.mimetype,
          checksum: checksum,
          context: context,
          version: 1,
          is_latest: true,
          uploaded_by: userId,
          // Garder category/subcategory pour compatibilité
          category: useLegacySystem ? category : context.file_type,
          subcategory: useLegacySystem ? subcategory : context.file_subtype
        }, { transaction });
        
        uploadedFileRecords.push({
          id: fileNode.id,
          name: uploadedFile.originalname,
          storageKey,
          size: uploadedFile.size,
          mimeType: uploadedFile.mimetype,
          context,
          checksum
        });
        
        logger.info('Fichier uploadé avec succès', {
          fileId: fileNode.id,
          storageKey,
          entityType: context.entity_type,
          entityId: context.entity_id
        });
      }
      
      await transaction.commit();
      
      // Mettre à jour les timestamps des ancêtres
      await updateAncestorsModifiedAt(nodeId);
      
      return {
        success: true,
        files: uploadedFileRecords
      };
      
    } catch (error) {
      await transaction.rollback();
      
      // Nettoyer les fichiers physiques uploadés en cas d'erreur
      for (const uploadedFile of uploadedFiles) {
        try {
          if (uploadedFile.path) {
            await fs.unlink(uploadedFile.path);
          }
        } catch (cleanupError) {
          logger.warn('Erreur nettoyage fichier temporaire', {
            path: uploadedFile.path,
            error: cleanupError.message
          });
        }
      }
      
      logger.error('Erreur upload fichiers', {
        nodeId,
        error: error.message,
        stack: error.stack
      });
      
      throw error;
    }
  }

  /**
   * Crée les relations de fermeture pour un fichier
   * @param {number} fileNodeId - ID du nœud fichier
   * @param {number} parentId - ID du parent
   * @param {Object} transaction - Transaction Sequelize
   */
  async createClosureRelations(fileNodeId, parentId, transaction) {
    // 1. Auto-relation (depth = 0)
    await closure.create({
      ancestor_id: fileNodeId,
      descendant_id: fileNodeId,
      depth: 0
    }, { transaction });
    
    // 2. Relations avec tous les ancêtres du parent
    const parentClosures = await closure.findAll({
      where: { descendant_id: parentId },
      transaction
    });
    
    for (const parentClosure of parentClosures) {
      await closure.create({
        ancestor_id: parentClosure.ancestor_id,
        descendant_id: fileNodeId,
        depth: parentClosure.depth + 1
      }, { transaction });
    }
  }

  /**
   * Récupère des fichiers par contexte (remplace getAllFilesByNode)
   * @param {Object} filter - Critères de recherche
   * @returns {Promise<Object>} Fichiers trouvés
   */
  async getFilesByContext(filter) {
    const { 
      entityType, 
      entityId, 
      fileType, 
      fileSubtype,
      sampleNumber,
      resultIndex,
      nodeId,
      includeMetadata = false
    } = filter;
    
    try {
      const whereConditions = [];
      const params = [];
      
      // Construire les conditions JSON pour le contexte
      if (entityType) {
        whereConditions.push("JSON_EXTRACT(context, '$.entity_type') = ?");
        params.push(entityType);
      }
      
      if (entityId) {
        whereConditions.push("JSON_EXTRACT(context, '$.entity_id') = ?");
        params.push(entityId);
      }
      
      if (fileType) {
        whereConditions.push("JSON_EXTRACT(context, '$.file_type') = ?");
        params.push(fileType);
      }
      
      if (fileSubtype) {
        whereConditions.push("JSON_EXTRACT(context, '$.file_subtype') = ?");
        params.push(fileSubtype);
      }
      
      if (sampleNumber !== undefined && sampleNumber !== null) {
        whereConditions.push("JSON_EXTRACT(context, '$.sample_number') = ?");
        params.push(sampleNumber);
      }
      
      if (resultIndex !== undefined && resultIndex !== null) {
        whereConditions.push("JSON_EXTRACT(context, '$.result_index') = ?");
        params.push(resultIndex);
      }
      
      if (nodeId) {
        whereConditions.push("JSON_EXTRACT(context, '$.parent_node_id') = ?");
        params.push(nodeId);
      }
      
      // Si aucun filtre, retourner vide
      if (whereConditions.length === 0) {
        return { files: [], total: 0 };
      }
      
      // Construire la requête
      const whereClause = sequelize.literal(
        whereConditions.join(' AND '),
        ...params
      );
      
      const files = await file.findAll({
        where: whereClause,
        include: [{
          model: node,
          as: 'node',
          required: true
        }],
        order: [['uploaded_at', 'DESC']]
      });
      
      // Formater la réponse
      const formattedFiles = await Promise.all(files.map(async (f) => {
        const fileData = {
          id: f.node_id,
          name: f.original_name,
          storageKey: f.storage_key,
          size: f.size,
          mimeType: f.mime_type,
          checksum: f.checksum,
          context: f.context,
          uploadedAt: f.uploaded_at,
          uploadedBy: f.uploaded_by,
          version: f.version,
          isLatest: f.is_latest,
          viewPath: `/api/files/${f.node_id}`,
          downloadPath: `/api/files/download/${f.node_id}`,
          // Info du nœud
          nodePath: f.node?.path,
          nodeType: f.node?.type
        };
        
        // Ajouter les métadonnées si demandé
        if (includeMetadata) {
          fileData.metadata = await fileMetadataService.getMetadata(f.node_id);
        }
        
        return fileData;
      }));
      
      logger.debug('Fichiers récupérés par contexte', {
        filter,
        count: formattedFiles.length
      });
      
      return {
        files: formattedFiles,
        total: formattedFiles.length
      };
      
    } catch (error) {
      logger.error('Erreur récupération fichiers par contexte', {
        filter,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Récupère les fichiers d'un nœud (compatibilité avec ancien système)
   * @param {Object} options - Options de recherche
   * @returns {Promise<Object>} Fichiers trouvés
   */
  async getAllFilesByNode(options) {
    const { nodeId, category, subcategory } = options;
    
    // Si category/subcategory fournis, les normaliser et utiliser le nouveau système
    if (category || subcategory) {
      const fileType = fileMetadataService.normalizeFileType(category);
      const fileSubtype = fileMetadataService.normalizeFileSubtype(subcategory, fileType);
      
      return await this.getFilesByContext({
        nodeId,
        fileType,
        fileSubtype
      });
    }
    
    // Sinon, récupérer tous les fichiers du nœud
    return await this.getFilesByContext({ nodeId });
  }

  /**
   * Récupère un fichier par son ID
   * @param {number} fileId - ID du fichier
   * @returns {Promise<Object>} Informations du fichier
   */
  async getFileById(fileId) {
    const fileRecord = await file.findOne({
      where: { node_id: fileId },
      include: [{
        model: node,
        as: 'node',
        required: true
      }]
    });
    
    if (!fileRecord) {
      throw new NotFoundError('Fichier non trouvé');
    }
    
    // Vérifier l'existence physique
    if (fileRecord.storage_key) {
      const exists = await fileStorageService.fileExists(fileRecord.storage_key);
      if (!exists) {
        logger.error('Fichier physique manquant', {
          fileId,
          storageKey: fileRecord.storage_key
        });
        throw new NotFoundError('Fichier physique introuvable');
      }
    }
    
    return {
      id: fileRecord.node_id,
      name: fileRecord.original_name,
      storageKey: fileRecord.storage_key,
      filePath: fileRecord.storage_key 
        ? fileStorageService.getPhysicalPath(fileRecord.storage_key)
        : fileRecord.file_path, // Fallback pour ancien système
      size: fileRecord.size,
      mimeType: fileRecord.mime_type,
      checksum: fileRecord.checksum,
      context: fileRecord.context,
      uploadedAt: fileRecord.uploaded_at,
      node: fileRecord.node
    };
  }

  /**
   * Prépare le téléchargement d'un fichier
   * @param {number} fileId - ID du fichier
   * @returns {Promise<Object>} Informations pour le téléchargement
   */
  async downloadFile(fileId) {
    const fileData = await this.getFileById(fileId);
    
    return {
      path: fileData.filePath,
      originalName: fileData.name,
      mimeType: fileData.mimeType,
      size: fileData.size
    };
  }

  /**
   * Supprime un fichier
   * @param {number} fileId - ID du fichier à supprimer
   * @returns {Promise<boolean>} True si supprimé
   */
  async deleteFile(fileId) {
    const transaction = await sequelize.transaction();
    
    try {
      const fileRecord = await file.findOne({
        where: { node_id: fileId },
        transaction
      });
      
      if (!fileRecord) {
        throw new NotFoundError('Fichier non trouvé');
      }
      
      // 1. Supprimer le fichier physique
      if (fileRecord.storage_key) {
        await fileStorageService.deleteFile(fileRecord.storage_key);
      } else if (fileRecord.file_path) {
        // Fallback pour ancien système
        const fsSync = require('fs');
        if (fsSync.existsSync(fileRecord.file_path)) {
          await fs.unlink(fileRecord.file_path);
        }
      }
      
      // 2. Supprimer les métadonnées
      await fileMetadataService.deleteAllMetadata(fileId);
      
      // 3. Supprimer les relations de closure
      await closure.destroy({
        where: {
          [Op.or]: [
            { ancestor_id: fileId },
            { descendant_id: fileId }
          ]
        },
        transaction
      });
      
      // 4. Supprimer l'enregistrement du fichier
      await file.destroy({
        where: { node_id: fileId },
        transaction
      });
      
      // 5. Supprimer le nœud
      await node.destroy({
        where: { id: fileId },
        transaction
      });
      
      await transaction.commit();
      
      logger.info('Fichier supprimé avec succès', {
        fileId,
        storageKey: fileRecord.storage_key
      });
      
      return true;
    } catch (error) {
      await transaction.rollback();
      
      logger.error('Erreur suppression fichier', {
        fileId,
        error: error.message
      });
      
      throw error;
    }
  }

  /**
   * Exporte les fonctions du service
   */
  getPublicMethods() {
    return {
      uploadFiles: this.uploadFiles.bind(this),
      getFilesByContext: this.getFilesByContext.bind(this),
      getAllFilesByNode: this.getAllFilesByNode.bind(this),
      getFileById: this.getFileById.bind(this),
      downloadFile: this.downloadFile.bind(this),
      deleteFile: this.deleteFile.bind(this)
    };
  }
}

// Export singleton instance
module.exports = new FileServiceV2();

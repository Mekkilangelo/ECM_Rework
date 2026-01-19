/**
 * Service de gestion des fichiers
 * Contient la logique métier liée aux opérations sur les fichiers
 * 
 * ⚠️ MIGRATION EN COURS : Ce service utilise maintenant le nouveau système
 * avec storage_key et contexte JSON tout en restant compatible avec l'ancien code
 */

const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');
const { node, file, closure, sequelize } = require('../models');
const { Op } = require('sequelize');
const { UPLOAD_BASE_DIR, TEMP_DIR } = require('../utils/fileStorage');
const { NotFoundError, ValidationError } = require('../utils/errors');
const { updateAncestorsModifiedAt } = require('../utils/hierarchyUtils');

// Importer la fonction depuis le middleware pour éviter la duplication
const { buildPhysicalFilePath } = require('../middleware/file-path');

// ⭐ NOUVEAU : Importer les services du nouveau système
const fileStorageService = require('./storage/FileStorageService');
const fileMetadataService = require('./storage/FileMetadataService');

/**
 * Construit le chemin logique pour un fichier (utilisé dans la base de données)
 * @param {Object} parentNode - Nœud parent
 * @param {string} category - Catégorie du fichier
 * @param {string} subcategory - Sous-catégorie du fichier
 * @param {string} filename - Nom du fichier
 * @returns {string} Chemin logique
 */
const buildNodePath = (parentNode, category, subcategory, filename) => {
  let nodePath = parentNode.path;
  
  // Déterminer la structure de chemin appropriée
  let categoryPath = category;
  let subcategoryPath = subcategory;
  
  // Si le parent est une demande d'essai, respecter la structure trial_request/documents/alldocuments
  if (parentNode.type === 'trial_request') {
    categoryPath = 'documents';
    subcategoryPath = 'alldocuments';
  }
  
  // Ajouter la catégorie et sous-catégorie au chemin
  if (categoryPath) {
    nodePath += `/${categoryPath}`;
    if (subcategoryPath) {
      nodePath += `/${subcategoryPath}`;
    }
  }
  nodePath += `/${filename}`;
  return nodePath;
};

/**
 * Nettoie les dossiers temporaires vides après déplacement des fichiers
 * @param {Array} tempFiles - Liste des fichiers temporaires déplacés
 */
const cleanupTempDirectories = async (tempFiles) => {
  const tempDirsToCheck = new Set();
  
  // Collecter tous les dossiers temporaires à vérifier
  for (const tempFile of tempFiles) {
    const tempDir = path.dirname(tempFile.file_path);
    tempDirsToCheck.add(tempDir);
  }
  
  // Vérifier et supprimer les dossiers vides
  for (const tempDir of tempDirsToCheck) {
    try {
      if (fs.existsSync(tempDir)) {
        const files = fs.readdirSync(tempDir);
        if (files.length === 0) {
          fs.rmdirSync(tempDir);
          logger.debug('Dossier temporaire vide supprimé', { path: tempDir });
          
          // Vérifier aussi le dossier parent s'il est dans temp/
          const parentDir = path.dirname(tempDir);
          if (parentDir.includes('temp') && fs.existsSync(parentDir)) {
            const parentFiles = fs.readdirSync(parentDir);
            if (parentFiles.length === 0) {
              fs.rmdirSync(parentDir);
              logger.debug('Dossier parent temporaire vide supprimé', { path: parentDir });
            }
          }
        }
      }
    } catch (error) {
      logger.warn('Erreur nettoyage dossier temporaire', { 
        path: tempDir, 
        error: error.message 
      });
    }
  }
};

/**
 * Enregistre des fichiers téléchargés
 * @param {Array} files - Fichiers téléchargés
 * @param {Object} data - Données supplémentaires (nodeId, category, subcategory)
 * @param {Object} req - Objet request pour récupérer tempId si défini
 * @returns {Promise<Object>} Résultat de l'opération
 */
const saveUploadedFiles = async (files, data, req = null) => {
  const { nodeId, category, subcategory, sampleNumber, resultIndex, descriptions = {}, userId } = data;
  const fileRecords = [];
  
  // Utiliser une transaction pour garantir la cohérence des données
  const transaction = await sequelize.transaction();
  
  try {
    // Récupérer le nœud parent si nodeId est fourni
    let parentNode = null;
    if (nodeId) {
      parentNode = await node.findByPk(nodeId, { transaction });
      if (!parentNode) {
        throw new NotFoundError('Nœud parent non trouvé');
      }
    }

  // Générer un ID temporaire pour ce lot d'upload
  const tempId = uuidv4();

  let fileIndex = 0;
  for (const uploadedFile of files) {
    let context;
    let storageKey;
    
    if (parentNode) {
      // ⭐ NOUVEAU SYSTÈME : Construire le contexte standard
      context = await fileMetadataService.buildFileContext({
        category,
        subcategory,
        sampleNumber,
        resultIndex
      }, parentNode);
      
      storageKey = fileStorageService.generateStorageKey(
        context.entity_type,
        context.entity_id,
        context.file_type,
        uploadedFile.originalname
      );
    } else {
      // Cas UPLOAD TEMPORAIRE (sans parent)
      context = {
        entity_type: 'temp',
        entity_id: 0,
        file_type: 'temp',
        temp_id: tempId,
        upload_source: 'web_ui',
        original_category: category,
        original_subcategory: subcategory,
        sample_number: sampleNumber,
        result_index: resultIndex
      };
      
      // Storage key temporaire : temp/{tempId}/{filename}
      // Utiliser un nom de fichier sûr (comme le fait parseAndResolvePath)
      const safeFilename = uploadedFile.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
      storageKey = `temp/${tempId}/${safeFilename}`;
    }
    
    // Ajouter l'ID temporaire au contexte UNIQUEMENT pour les uploads temporaires (sans parent)
    // Pour les uploads directs, on ne met pas de temp_id car le fichier est déjà à sa place finale
    if (!parentNode) {
      context.temp_id = tempId;
    }
    
    logger.info('Sauvegarde fichier uploadé', {
      originalName: uploadedFile.originalname,
      tempPath: uploadedFile.path,
      storageKey,
      hasParentNode: !!parentNode,
      category,
      subcategory
    });
    
    // ⭐ NOUVEAU SYSTÈME : Sauvegarder le fichier à sa destination finale (ou temp)
    const finalPath = await fileStorageService.saveFile(uploadedFile, storageKey);
    
    logger.info('Fichier sauvegardé avec succès', {
      originalName: uploadedFile.originalname,
      finalPath,
      storageKey
    });
    
    // Construire le chemin logique
    let nodePath;
    if (parentNode) {
      nodePath = buildNodePath(parentNode, category, subcategory, uploadedFile.originalname);
    } else {
      nodePath = `/temp/${tempId}/${uploadedFile.originalname}`;
    }
    
    // Récupérer la description spécifique pour ce fichier (par index)
    const fileDescription = descriptions[fileIndex] || uploadedFile.originalname;
    
    // Créer l'enregistrement du nœud
    const fileNode = await node.create({
      name: uploadedFile.originalname,
      path: nodePath,
      type: 'file',
      parent_id: nodeId ? parseInt(nodeId) : null,
      created_at: new Date(),
      data_status: 'new',
      description: fileDescription
    }, { transaction });

      // Créer les relations de fermeture
      // 1. Auto-relation (toujours)
      await closure.create({
        ancestor_id: fileNode.id,
        descendant_id: fileNode.id,
        depth: 0
      }, { transaction });
      
      // 2. Relations avec les ancêtres du parent (si parent existe)
      if (nodeId) {
        const parentClosures = await closure.findAll({
          where: { descendant_id: parseInt(nodeId) },
          transaction
        });
        
        for (const parentClosure of parentClosures) {
          await closure.create({
            ancestor_id: parentClosure.ancestor_id,
            descendant_id: fileNode.id,
            depth: parentClosure.depth + 1
          }, { transaction });
        }
      }
      
      // ⭐ NOUVEAU SYSTÈME : Générer le checksum
      const checksum = await fileStorageService.generateChecksum(storageKey);
      
      // Créer l'enregistrement du fichier
      // Normaliser la catégorie : si elle commence par 'micrographs-result', utiliser 'micrography'
      let normalizedCategory = category || 'general';
      if (category && category.startsWith('micrographs-result')) {
        normalizedCategory = 'micrography';
      }
      
      const fileRecord = await file.create({
        node_id: fileNode.id,
        original_name: uploadedFile.originalname,
        file_path: finalPath, // Garder pour compatibilité
        storage_key: storageKey, // ⭐ NOUVEAU
        size: uploadedFile.size,
        mime_type: uploadedFile.mimetype,
        checksum: checksum, // ⭐ NOUVEAU
        context: context, // ⭐ NOUVEAU
        version: 1, // ⭐ NOUVEAU
        is_latest: true, // ⭐ NOUVEAU
        uploaded_by: userId || null, // ⭐ NOUVEAU
        category: normalizedCategory,
        subcategory: subcategory || null
      }, { transaction });
      
      fileRecords.push({
        id: fileNode.id,
        name: uploadedFile.originalname,
        size: uploadedFile.size,
        type: uploadedFile.mimetype,
        category,
        subcategory
      });
      
      fileIndex++; // Incrémenter l'index pour le prochain fichier
    }
    // Valider la transaction
    await transaction.commit();
    
    // Mettre à jour le modified_at du nœud parent et de ses ancêtres après ajout de fichiers
    if (nodeId) {
      await updateAncestorsModifiedAt(parseInt(nodeId));
    }
    
    return {
      success: true,
      files: fileRecords,
      tempId // Retourner l'ID temporaire pour l'association future
    };
  } catch (error) {
    // Annuler la transaction en cas d'erreur
    await transaction.rollback();
    throw error;
  }
};

/**
 * Associe des fichiers temporaires à un nœud
 * @param {string} tempId - ID temporaire des fichiers
 * @param {number} nodeId - ID du nœud parent
 * @param {Object} options - Options supplémentaires (category, subcategory)
 * @returns {Promise<Object>} Résultat de l'opération
 */
const associateFilesToNode = async (tempId, nodeId, options = {}) => {
  const { category, subcategory } = options;

  logger.info('🔗🔗🔗 [FILE_ASSOC_SERVER] Début association', {
    tempId,
    nodeId,
    category,
    subcategory,
    options
  });

  // Utiliser une transaction
  const transaction = await sequelize.transaction();
  try {
    // Récupérer les fichiers temporaires en utilisant le champ context.temp_id
    // Utiliser l'opérateur JSON de Sequelize
    // IMPORTANT: Ne pas utiliser required: true car les fichiers temporaires n'ont pas encore de node associé
    const tempFiles = await file.findAll({
      where: sequelize.where(
        sequelize.json('context.temp_id'),
        tempId
      ),
      include: [{
        model: node,
        as: 'node',
        required: false  // LEFT JOIN pour inclure les fichiers sans node
      }],
      transaction
    });

    logger.info('🔗🔗🔗 [FILE_ASSOC_SERVER] Fichiers temporaires trouvés', {
      count: tempFiles.length,
      files: tempFiles.map(f => ({
        node_id: f.node_id,
        original_name: f.original_name,
        hasNode: !!f.node
      }))
    });

    if (!tempFiles.length) {
      logger.error('🔗🔗🔗 [FILE_ASSOC_SERVER] Aucun fichier trouvé avec tempId', { tempId });
      throw new NotFoundError('Aucun fichier temporaire trouvé avec cet ID');
    }

    // Vérifier que le nœud parent existe
    const parentNode = await node.findByPk(nodeId);
    if (!parentNode) {
      logger.error('🔗🔗🔗 [FILE_ASSOC_SERVER] Parent node non trouvé', { nodeId });
      throw new NotFoundError('Nœud parent non trouvé');
    }
    
    // Déterminer la structure de répertoire appropriée en fonction du type de nœud parent
    let categoryPath = category || 'general';
    let subcategoryPath = subcategory || '';
    
    // Si le parent est une demande d'essai, respecter la structure trial_request/documents/alldocuments
    if (parentNode.type === 'trial_request') {
      categoryPath = 'documents';
      subcategoryPath = 'alldocuments';
    }
    
    // Mettre à jour chaque fichier et le déplacer vers le répertoire final
    for (const tempFile of tempFiles) {
      // Récupérer le nœud associé au fichier
      // Avec required: false, le node peut ne pas être chargé, donc on doit le charger explicitement
      let fileNode = tempFile.node;

      if (!fileNode) {
        // Charger le node explicitement s'il n'a pas été inclus
        fileNode = await node.findByPk(tempFile.node_id, { transaction });

        if (!fileNode) {
          logger.error('Node manquant pour fichier temporaire', {
            tempFileNodeId: tempFile.node_id,
            tempId,
            originalName: tempFile.original_name
          });
          throw new Error(`Node ${tempFile.node_id} not found for temporary file ${tempFile.original_name}`);
        }
      }

      // 1. Générer la nouvelle storage_key définitive
      // Utiliser les catégories passées en option, ou celles stockées dans le contexte temporaire
      const finalCategory = category || tempFile.context.original_category;
      const finalSubcategory = subcategory || tempFile.context.original_subcategory;
      
      // Récupérer les métadonnées du contexte temporaire si elles ne sont pas fournies
      const finalSampleNumber = options.sampleNumber || tempFile.context.sample_number;
      const finalResultIndex = options.resultIndex || tempFile.context.result_index;

      const newContext = await fileMetadataService.buildFileContext({
        category: finalCategory,
        subcategory: finalSubcategory,
        sampleNumber: finalSampleNumber,
        resultIndex: finalResultIndex
      }, parentNode);

      const newStorageKey = fileStorageService.generateStorageKey(
        newContext.entity_type,
        newContext.entity_id,
        newContext.file_type,
        tempFile.original_name
      );

      logger.info('Association fichier temporaire', {
        tempFileId: tempFile.node_id,
        originalName: tempFile.original_name,
        oldStorageKey: tempFile.storage_key,
        newStorageKey,
        oldFilePath: tempFile.file_path
      });

      // 2. DÉPLACEMENT PHYSIQUE (Temp -> Final)
      // Vérifier si le fichier a besoin d'être déplacé
      // (il peut déjà être au bon endroit si l'upload était direct avec nodeId)
      const needsMove = tempFile.storage_key && tempFile.storage_key.startsWith('temp/');
      const finalStorageKey = needsMove ? newStorageKey : tempFile.storage_key;
      
      if (needsMove) {
        try {
          await fileStorageService.moveFile(tempFile.storage_key, newStorageKey);
          logger.info('Fichier déplacé de temp vers emplacement final', {
            tempFileId: tempFile.node_id,
            from: tempFile.storage_key,
            to: newStorageKey
          });
        } catch (moveError) {
          logger.error('Échec déplacement fichier lors de l\'association', {
            tempFileId: tempFile.node_id,
            oldStorageKey: tempFile.storage_key,
            newStorageKey,
            error: moveError.message
          });
          throw moveError;
        }
      } else {
        // Le fichier est déjà à sa place finale (upload direct avec nodeId)
        // On garde le storage_key existant
        logger.info('Fichier déjà à sa place finale, pas de déplacement nécessaire', {
          tempFileId: tempFile.node_id,
          existingStorageKey: tempFile.storage_key
        });
      }
      
      // Construire le nouveau chemin logique pour le nœud
      const newNodePath = buildNodePath(parentNode, finalCategory, finalSubcategory, fileNode.name);
      
      // ÉTAPE 1: Supprimer les anciennes relations de fermeture du nœud fichier
      await closure.destroy({
        where: {
          [Op.or]: [
            { ancestor_id: tempFile.node_id },
            { descendant_id: tempFile.node_id }
          ]
        },
        transaction
      });
      
      // ÉTAPE 2: Mettre à jour les enregistrements du nœud avec le nouveau parent et chemin
      await node.update({
        parent_id: nodeId,
        path: newNodePath,
        data_status: 'updated',
        modified_at: new Date()
      }, { 
        where: { id: tempFile.node_id },
        transaction 
      });

      // ÉTAPE 3: Recréer toutes les relations de fermeture
      // 3a. Relation avec lui-même (depth = 0)
      await closure.create({
        ancestor_id: tempFile.node_id,
        descendant_id: tempFile.node_id,
        depth: 0
      }, { transaction });

      // 3b. Relations avec tous les ancêtres du nouveau parent
      const ancestorRelations = await closure.findAll({
        where: { descendant_id: nodeId },
        transaction
      });

      for (const ancestorRelation of ancestorRelations) {
        await closure.create({
          ancestor_id: ancestorRelation.ancestor_id,
          descendant_id: tempFile.node_id,
          depth: ancestorRelation.depth + 1
        }, { transaction });
      }
      
      // Étape 4: Mettre à jour l'enregistrement du fichier avec le nouveau chemin physique et nettoyer le contexte
      // On nettoie temp_id et on met à jour le contexte avec les vraies infos
      const updatedContext = { ...newContext };
      updatedContext.associated_at = new Date().toISOString();
      // Supprimer temp_id du contexte maintenant que l'association est faite
      delete updatedContext.temp_id;

      // Obtenir le nouveau chemin physique absolu pour la compatibilité legacy
      // Utiliser finalStorageKey qui est soit le nouveau chemin (si déplacé) soit l'existant (si déjà en place)
      const newPhysicalPath = fileStorageService.getPhysicalPath(finalStorageKey);

      await file.update({
        file_path: newPhysicalPath, // Legacy path
        storage_key: finalStorageKey, // New system key (peut être inchangé si pas de déplacement)
        category: finalCategory || 'general',
        subcategory: finalSubcategory || '',
        context: updatedContext
      }, { 
        where: { node_id: tempFile.node_id },
        transaction 
      });
    }

    // Valider la transaction
    logger.info('🔗🔗🔗 [FILE_ASSOC_SERVER] Commit transaction', { filesCount: tempFiles.length });
    await transaction.commit();
    logger.info('🔗🔗🔗 [FILE_ASSOC_SERVER] Transaction committed avec succès');

    // Nettoyer les dossiers temporaires vides après déplacement des fichiers
    await cleanupTempDirectories(tempFiles);

    // Mettre à jour le modified_at du nœud parent et de ses ancêtres après association de fichiers
    await updateAncestorsModifiedAt(nodeId);

    logger.info('🔗🔗🔗 [FILE_ASSOC_SERVER] Association terminée avec succès', {
      nodeId,
      filesAssociated: tempFiles.length
    });

    return {
      success: true,
      count: tempFiles.length,
      nodeId
    };
  } catch (error) {
    // Annuler la transaction en cas d'erreur
    logger.error('🔗🔗🔗 [FILE_ASSOC_SERVER] Erreur lors de l\'association', {
      tempId,
      nodeId,
      error: error.message,
      stack: error.stack
    });
    await transaction.rollback();
    throw error;
  }
};

/**
 * Supprime physiquement tous les fichiers associés à un nœud et ses descendants
 * @param {number} nodeId - ID du nœud parent
 * @param {Object} transaction - Transaction Sequelize optionnelle
 * @returns {Promise<number>} Nombre de fichiers supprimés
 */
const deleteNodeFiles = async (nodeId, transaction = null) => {
  try {
    // Récupérer tous les fichiers associés à ce nœud et ses descendants
    const fileNodes = await node.findAll({
      where: {
        [Op.or]: [
          { parent_id: nodeId, type: 'file' },
          { id: nodeId, type: 'file' }
        ]
      },
      include: [{
        model: file,
        as: 'file',
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
          logger.debug('Fichier physique supprimé', { path: file.file_path });
        }

        // Supprimer l'enregistrement File
        if (file) {
          await file.destroy({
            where: { node_id: fileNode.id },
            transaction
          });
        }

        // Supprimer le nœud de fichier
        await node.destroy({
          where: { id: fileNode.id },
          transaction
        });

        deletedCount++;
      } catch (error) {
        logger.warn('Erreur suppression fichier du nœud', { 
          nodeId: fileNode.id, 
          error: error.message 
        });
        // Continue avec les autres fichiers même si un échoue
      }
    }

    return deletedCount;
  } catch (error) {
    logger.error('Erreur suppression fichiers du nœud', { error: error.message });
    throw error;
  }
};

/**
 * Récupère les détails d'un fichier
 * @param {number} fileId - ID du fichier à récupérer
 * @returns {Promise<Object>} Détails du fichier
 */
const getFileDetails = async (fileId) => {
  const fileNode = await node.findOne({
    where: { id: fileId, type: 'file' },
    include: [{
      model: file,
      as: 'file',
      attributes: { exclude: ['node_id'] }
    }]
  });
  
  if (!fileNode) {
    throw new NotFoundError('Fichier non trouvé');
  }
  
  return fileNode;
};

/**
 * Supprime un fichier
 * @param {number} fileId - ID du fichier à supprimer
 * @param {Object} options - Options (transaction)
 * @returns {Promise<boolean>} Résultat de l'opération
 */
const deleteFile = async (fileId, options = {}) => {
  const t = options.transaction || await sequelize.transaction();
  const commit = !options.transaction; // Commiter seulement si transaction locale

  try {
    // Récupérer les détails du fichier
    // D'abord, vérifions que le nœud existe et qu'il s'agit bien d'un fichier
    const fileNode = await node.findOne({
      where: { id: fileId, type: 'file' },
      transaction: t
    });
    
    if (!fileNode) {
      if (commit) await t.rollback();
      throw new NotFoundError('Nœud de fichier non trouvé');
    }

    // Ensuite, récupérons les informations du fichier associé
    const fileRecord = await file.findOne({
      where: { node_id: fileId },
      transaction: t
    });
    
    if (!fileRecord) {
      if (commit) await t.rollback();
      throw new NotFoundError('Fichier non trouvé');
    }

    // 1. Supprimer toutes les relations de fermeture liées à ce fichier
    await closure.destroy({
      where: {
        [Op.or]: [
          { ancestor_id: fileId },
          { descendant_id: fileId }
        ]
      },
      transaction: t
    });

    // 2. Supprimer les enregistrements en base
    await file.destroy({
      where: { node_id: fileId },
      transaction: t
    });
    
    await node.destroy({
      where: { id: fileId },
      transaction: t
    });

    // 3. Supprimer le fichier physique (APRÈS les opérations DB pour éviter orphelins si DB fail)
    // On le fait seulement si le commit va réussir (ou si on est dans une grosse transaction, on espère qu'elle réussira)
    // Note: Si la transaction englobante rollback, le fichier physique sera quand même supprimé.
    // C'est un compromis acceptable : mieux vaut un fichier manquant (mais supprimé en DB) qu'un fichier orphelin.
    if (fileRecord.storage_key) {
      // Utiliser le service de stockage (gère le nettoyage des dossiers)
      await fileStorageService.deleteFile(fileRecord.storage_key);
    } else if (fileRecord.file_path && fs.existsSync(fileRecord.file_path)) {
      // Fallback legacy
      try {
        fs.unlinkSync(fileRecord.file_path);
        // Tenter de nettoyer le dossier parent si vide
        const parentDir = path.dirname(fileRecord.file_path);
        if (fs.readdirSync(parentDir).length === 0) {
          fs.rmdirSync(parentDir);
        }
      } catch (err) {
        logger.warn('Erreur suppression fichier physique legacy', { path: fileRecord.file_path, error: err.message });
      }
    }

    // Valider la transaction locale si nécessaire
    if (commit) await t.commit();
    return true;
  } catch (error) {
    // Annuler la transaction locale si nécessaire
    if (commit) await t.rollback();
    throw error;
  }
};

/**
 * Supprime récursivement tous les fichiers descendants d'un nœud
 * @param {number} nodeId - ID du nœud parent
 * @param {Object} transaction - Transaction externe
 */
const deleteFilesRecursively = async (nodeId, transaction) => {
  logger.info('Suppression récursive des fichiers du nœud', { nodeId });
  
  // Trouver tous les descendants de type 'file'
  const descendantFiles = await node.findAll({
    include: [{
      model: closure,
      as: 'ancestors', // Relation définie par alias dans models/index.js (souvent 'ancestors' ou implicitly via closure table logic)
      where: { ancestor_id: nodeId },
      attributes: []
    }],
    where: { type: 'file' },
    transaction
  });

  // NOTE: Si l'association 'ancestors' n'est pas configurée correctement pour ce type de requête directe,
  // on passe par la table closure directement.
  const descendants = await closure.findAll({
    where: { ancestor_id: nodeId },
    attributes: ['descendant_id'],
    transaction
  });
  
  const descendantIds = descendants.map(d => d.descendant_id);
  
  const fileNodes = await node.findAll({
    where: { 
      id: { [Op.in]: descendantIds },
      type: 'file'
    },
    transaction
  });

  logger.info(`Found ${fileNodes.length} files to delete recursively under node ${nodeId}`);

  let deletedCount = 0;
  for (const fileNode of fileNodes) {
    try {
      await deleteFile(fileNode.id, { transaction });
      deletedCount++;
    } catch (error) {
      logger.error('Failed to delete file during recursive delete', { fileId: fileNode.id, error: error.message });
      // On continue pour essayer de supprimer les autres
    }
  }
  
  return deletedCount;
};

/**
 * Supprime les fichiers d'un nœud parent basés sur des critères de contexte (ex: sample supprimé)
 * @param {number} parentNodeId - ID du nœud parent (ex: Trial)
 * @param {Function} predicate - Fonction (context) => boolean. Si true, le fichier est supprimé.
 * @param {Object} transaction - Transaction
 */
const deleteFilesByContext = async (parentNodeId, predicate, transaction) => {
  logger.info('Suppression conditionnelle des fichiers', { parentNodeId });
  
  // 1. Récupérer tous les fichiers du parent
  // On utilise getAllFilesByNode logic mais avec transaction
  const descendants = await closure.findAll({
    where: { ancestor_id: parentNodeId },
    attributes: ['descendant_id'],
    transaction
  });
  
  const descendantIds = descendants.map(d => d.descendant_id);
  
  // Récupérer les infos complètes des fichiers (avec contexte)
  const files = await file.findAll({
    where: { node_id: { [Op.in]: descendantIds } },
    transaction
  });
  
  let deletedCount = 0;
  for (const f of files) {
    if (f.context && predicate(f.context)) {
      logger.info('Suppression fichier suite à suppression de contexte', { fileId: f.node_id, context: f.context });
      await deleteFile(f.node_id, { transaction });
      deletedCount++;
    }
  }
  
  return deletedCount;
};


/**
 * Récupère tous les fichiers associés à un nœud avec filtrage optionnel
 * @param {Object} options - Options de recherche
 * @returns {Promise<Object>} Fichiers trouvés et leurs détails
 */
const getAllFilesByNode = async (options) => {
  const { nodeId, category, subcategory, sampleNumber, resultIndex } = options;
  
  logger.info('🔍 [getAllFilesByNode] Recherche fichiers', { 
    nodeId, 
    category, 
    subcategory, 
    sampleNumber, 
    resultIndex,
    isLikePattern: subcategory && subcategory.includes('%')
  });
  
  // D'abord, récupérer tous les descendants du nœud (y compris lui-même)
  const descendantClosure = await closure.findAll({
    where: { ancestor_id: nodeId },
    attributes: ['descendant_id', 'depth']
  });
  
  logger.debug('Relations closure trouvées', { count: descendantClosure.length });
  
  // Extraire les IDs des descendants
  const descendantIds = descendantClosure.map(closure => closure.descendant_id);
  
  // Construire les conditions de recherche pour les fichiers descendants
  const conditions = {
    type: 'file',
    id: { [Op.in]: descendantIds }
  };
  
  // Filtrer par catégorie et sous-catégorie si fournis
  const fileConditions = {};
  if (category) fileConditions.category = category;
  if (subcategory) {
    // Support pour pattern matching si subcategory contient '%'
    if (subcategory.includes('%')) {
      fileConditions.subcategory = { [Op.like]: subcategory };
    } else {
      fileConditions.subcategory = subcategory;
    }
  }
  
  // Filtrer par métadonnées JSON (sampleNumber, resultIndex)
  // IMPORTANT: Appliquer ce filtre SEULEMENT si subcategory n'est pas fournie
  // pour éviter les conflits avec le matching par subcategory
  if (!subcategory && (sampleNumber !== undefined || resultIndex !== undefined)) {
    // Utiliser l'opérateur JSON de Sequelize pour filtrer dans le champ context
    const contextConditions = [];
    
    if (sampleNumber !== undefined) {
      contextConditions.push(
        sequelize.where(
          sequelize.json('context.sample_number'),
          parseInt(sampleNumber)
        )
      );
    }
    
    if (resultIndex !== undefined) {
      contextConditions.push(
        sequelize.where(
          sequelize.json('context.result_index'),
          parseInt(resultIndex)
        )
      );
    }
    
    if (contextConditions.length > 0) {
      fileConditions[Op.and] = contextConditions;
    }
  }
  
  // Récupérer les nœuds de fichiers
  const fileNodes = await node.findAll({
    where: conditions,
    include: [
      {
        model: file,
        as: 'file',
        where: Object.keys(fileConditions).length > 0 ? fileConditions : undefined,
        required: true
      }
    ]
  });
  
  logger.debug('Fichiers trouvés', { count: fileNodes.length });
  
  // Formater la réponse
  const files = fileNodes.map(nodeItem => ({
    id: nodeItem.id,
    name: nodeItem.name,
    description: nodeItem.description, // Ajouter la description
    path: nodeItem.path,
    createdAt: nodeItem.created_at,
    size: nodeItem.file ? nodeItem.file.size : null,
    mimeType: nodeItem.file ? nodeItem.file.mime_type : null,
    category: nodeItem.file ? nodeItem.file.category : null,
    subcategory: nodeItem.file ? nodeItem.file.subcategory : null,
    original_name: nodeItem.file ? nodeItem.file.original_name : null,
    file_path: nodeItem.file ? nodeItem.file.file_path : null,
    type: nodeItem.file ? nodeItem.file.mime_type : 'application/octet-stream',
    // IMPORTANT: Ajouter viewPath pour que les images s'affichent dans le PDF
    // On utilise un chemin relatif pour éviter les problèmes de CORS/Mixed Content
    // Le client (ou le proxy) résoudra ce chemin par rapport à son origine
    viewPath: nodeItem.id ? `/api/files/${nodeItem.id}` : null
  }));
  
  logger.info('📦 [getAllFilesByNode] Fichiers retournés', { 
    count: files.length,
    subcategories: files.length > 0 ? [...new Set(files.map(f => f.subcategory))] : []
  });
  
  return { files };
};

/**
 * Récupère un fichier spécifique par son ID
 * @param {number} fileId - ID du fichier
 * @returns {Promise<Object>} Données du fichier
 */
const getFileById = async (fileId) => {
  const fileData = await file.findOne({ 
    where: { node_id: fileId }
  });
  
  if (!fileData) {
    throw new NotFoundError('Fichier non trouvé');
  }
  
  logger.debug('getFileById - Recherche fichier physique', {
    fileId,
    storage_key: fileData.storage_key,
    file_path: fileData.file_path,
    UPLOAD_BASE_DIR: UPLOAD_BASE_DIR,
    baseDir: fileStorageService.baseDir
  });
  
  // Déterminer le chemin physique réel
  // Priorité: storage_key (nouveau système) > file_path (ancien système)
  let physicalPath = null;
  let resolvedVia = null;
  
  // Essayer d'abord avec storage_key (nouveau système)
  if (fileData.storage_key) {
    const storageKeyPath = fileStorageService.getPhysicalPath(fileData.storage_key);
    if (fs.existsSync(storageKeyPath)) {
      physicalPath = storageKeyPath;
      resolvedVia = 'storage_key';
    } else {
      logger.debug('Fichier non trouvé via storage_key', { 
        fileId, 
        storage_key: fileData.storage_key,
        checkedPath: storageKeyPath,
        UPLOAD_BASE_DIR: UPLOAD_BASE_DIR
      });
      
      // Tentative de récupération : le fichier est peut-être au bon endroit relatif
      // mais le UPLOAD_BASE_DIR a changé. Cherchons via file_path si le nom correspond.
      if (fileData.file_path && fs.existsSync(fileData.file_path)) {
        // Le fichier existe à l'ancien chemin - le déplacer vers le nouveau
        const targetDir = path.dirname(storageKeyPath);
        try {
          if (!fs.existsSync(targetDir)) {
            fs.mkdirSync(targetDir, { recursive: true });
          }
          fs.copyFileSync(fileData.file_path, storageKeyPath);
          // Mettre à jour file_path en DB pour cohérence future
          await file.update(
            { file_path: storageKeyPath },
            { where: { node_id: fileId } }
          );
          physicalPath = storageKeyPath;
          resolvedVia = 'migrated_from_file_path';
          logger.info('Fichier migré vers storage_key path', { 
            fileId, 
            from: fileData.file_path, 
            to: storageKeyPath 
          });
        } catch (migrateError) {
          logger.warn('Échec migration fichier', { fileId, error: migrateError.message });
          // Utiliser l'ancien chemin en fallback
          physicalPath = fileData.file_path;
          resolvedVia = 'file_path_fallback';
        }
      }
    }
  }
  
  // Fallback sur file_path (ancien système ou chemin absolu)
  if (!physicalPath && fileData.file_path) {
    if (fs.existsSync(fileData.file_path)) {
      physicalPath = fileData.file_path;
      resolvedVia = 'file_path';
    } else {
      logger.debug('Fichier non trouvé via file_path', { 
        fileId, 
        file_path: fileData.file_path 
      });
    }
  }
  
  // Vérifier si le fichier existe physiquement
  if (!physicalPath) {
    logger.error('Fichier physique introuvable', { 
      fileId,
      storage_key: fileData.storage_key,
      file_path: fileData.file_path,
      UPLOAD_BASE_DIR: UPLOAD_BASE_DIR,
      category: fileData.category,
      context: fileData.context
    });
    
    throw new NotFoundError('Fichier physique introuvable', { 
      storage_key: fileData.storage_key,
      file_path: fileData.file_path
    });
  }
  
  logger.debug('Fichier résolu avec succès', { fileId, resolvedVia, path: physicalPath });
  
  // Retourner les données avec le chemin physique correct
  return {
    ...fileData.toJSON(),
    file_path: physicalPath
  };
};

/**
 * Préparation au téléchargement d'un fichier
 * @param {number} fileId - ID du fichier à télécharger
 * @returns {Promise<Object>} Informations pour le téléchargement
 */
const downloadFile = async (fileId) => {
  // Récupérer les données du fichier
  const fileData = await file.findOne({ 
    where: { node_id: fileId }
  });
  
  const nodeData = await node.findOne({ 
    where: { id: fileId } 
  });
  
  if (!fileData || !nodeData) {
    throw new NotFoundError('Fichier non trouvé');
  }
  
  // Déterminer le chemin physique réel (même logique que getFileById)
  let physicalPath = null;
  
  // Essayer d'abord avec storage_key (nouveau système)
  if (fileData.storage_key) {
    const storageKeyPath = fileStorageService.getPhysicalPath(fileData.storage_key);
    if (fs.existsSync(storageKeyPath)) {
      physicalPath = storageKeyPath;
    }
  }
  
  // Fallback sur file_path (ancien système)
  if (!physicalPath && fileData.file_path && fs.existsSync(fileData.file_path)) {
    physicalPath = fileData.file_path;
  }
  
  // Vérifier si le fichier existe physiquement
  if (!physicalPath) {
    logger.error('Fichier physique introuvable pour téléchargement', { 
      fileId,
      storage_key: fileData.storage_key,
      file_path: fileData.file_path,
      UPLOAD_BASE_DIR: UPLOAD_BASE_DIR
    });
    
    throw new NotFoundError('Fichier physique introuvable', { 
      storage_key: fileData.storage_key,
      file_path: fileData.file_path
    });
  }
  
  return { 
    filePath: physicalPath, 
    originalName: fileData.original_name 
  };
};

/**
 * Récupère les statistiques des fichiers pour un nœud
 * @param {number} nodeId - ID du nœud parent
 * @returns {Promise<Object>} Statistiques des fichiers
 */
const getFileStats = async (nodeId) => {
  // Vérifier si le nœud existe
  const node = await node.findByPk(nodeId);
  if (!node) {
    throw new NotFoundError('Nœud non trouvé');
  }
  
  // Compter par catégories
  const categories = await file.findAll({
    attributes: [
      'category',
      [sequelize.fn('COUNT', sequelize.col('node_id')), 'count'],
      [sequelize.fn('SUM', sequelize.col('size')), 'totalSize']
    ],
    include: [{
      model: node,
      as: 'node',
      where: {
        parent_id: nodeId
      }
    }],
    group: ['category']
  });
  
  // Compter par sous-catégories
  const subcategories = await file.findAll({
    attributes: [
      'category',
      'subcategory',
      [sequelize.fn('COUNT', sequelize.col('node_id')), 'count'],
      [sequelize.fn('SUM', sequelize.col('size')), 'totalSize']
    ],
    include: [{
      model: node,
      as: 'node',
      where: {
        parent_id: nodeId
      }
    }],
    group: ['category', 'subcategory']
  });
  
  // Formater et retourner les statistiques
  return {
    fileCount: categories.reduce((acc, cat) => acc + parseInt(cat.dataValues.count), 0),
    totalSize: categories.reduce((acc, cat) => acc + parseInt(cat.dataValues.totalSize), 0),
    byCategory: categories.map(cat => ({
      category: cat.category,
      count: parseInt(cat.dataValues.count),
      totalSize: parseInt(cat.dataValues.totalSize)
    })),
    bySubcategory: subcategories.map(subcat => ({
      category: subcat.category,
      subcategory: subcat.subcategory,
      count: parseInt(subcat.dataValues.count),
      totalSize: parseInt(subcat.dataValues.totalSize)
    }))
  };
};

/**
 * Met à jour un fichier (changement de parent, catégorie, etc.)
 * REWORK: Découplage total - Ne déplace JAMAIS le fichier physique.
 * Seules les métadonnées et la structure logique (noeuds) sont mises à jour.
 * 
 * @param {number} fileId - ID du fichier à mettre à jour
 * @param {Object} updateData - Données de mise à jour
 * @returns {Promise<Object>} Résultat de l'opération
 */
const updateFile = async (fileId, updateData) => {
  const { newParentId, category, subcategory, name, description } = updateData;
  
  const transaction = await sequelize.transaction();
  
  try {
    // Récupérer le fichier actuel
    const currentFile = await file.findOne({
      where: { node_id: fileId },
      include: [{
        model: node,
        as: 'node',
        required: true
      }],
      transaction
    });
    
    if (!currentFile) {
      throw new NotFoundError('Fichier non trouvé');
    }
    
    const currentNode = currentFile.node;
    let newLogicalPath = currentNode.path;
    let nodeUpdated = false;
    
    const nodeUpdates = {
      modified_at: new Date()
    };

    if (description !== undefined) {
      nodeUpdates.description = description;
      nodeUpdated = true;
    }
    
    // 1. Gestion du changement de parent (Déplacement logique uniquement)
    if (newParentId && newParentId !== currentNode.parent_id) {
      const newParent = await node.findByPk(newParentId, { transaction });
      if (!newParent) {
        throw new NotFoundError('Nouveau nœud parent non trouvé');
      }
      
      // Marquer comme modifié structurellement
      nodeUpdates.data_status = 'old'; // Utiliser 'old' au lieu de 'updated'
      
      // Calculer le nouveau chemin logique
      const fileName = name || currentNode.name;
      // Note: On garde la catégorie/sous-catégorie actuelle pour le chemin logique si non fournies
      const pathCategory = category || currentFile.category;
      const pathSubcategory = subcategory || currentFile.subcategory;
      
      newLogicalPath = buildNodePath(newParent, pathCategory, pathSubcategory, fileName);
      
      // Supprimer les anciennes relations de fermeture
      await closure.destroy({
        where: {
          [Op.or]: [
            { ancestor_id: fileId },
            { descendant_id: fileId }
          ]
        },
        transaction
      });
      
      // Mettre à jour les propriétés du nœud pour le changement de parent
      nodeUpdates.parent_id = newParentId;
      nodeUpdates.path = newLogicalPath;
      nodeUpdates.name = fileName;
      nodeUpdated = true;
      
      // Recréer les relations de fermeture
      // Relation avec lui-même
      await closure.create({
        ancestor_id: fileId,
        descendant_id: fileId,
        depth: 0
      }, { transaction });
      
      // Relations avec tous les ancêtres du nouveau parent
      const ancestorRelations = await closure.findAll({
        where: { descendant_id: newParentId },
        transaction
      });
      
      for (const ancestorRelation of ancestorRelations) {
        await closure.create({
          ancestor_id: ancestorRelation.ancestor_id,
          descendant_id: fileId,
          depth: ancestorRelation.depth + 1
        }, { transaction });
      }
      
    } else if (name && name !== currentNode.name) {
      // 2. Gestion du renommage (Logique uniquement)
      // On ne touche PAS au fichier physique, ni à sa storage_key
      
      // Marquer comme modifié structurellement
      nodeUpdates.data_status = 'old'; // Utiliser 'old' au lieu de 'updated'
      
      newLogicalPath = currentNode.path.replace(currentNode.name, name);
      
      nodeUpdates.name = name;
      nodeUpdates.path = newLogicalPath;
      nodeUpdated = true;
    }
    
    // Appliquer les mises à jour du nœud si nécessaire
    if (nodeUpdated) {
      await node.update(nodeUpdates, {
        where: { id: fileId },
        transaction
      });
    }
    
    // 3. Mise à jour des métadonnées du fichier
    const updatePayload = {};
    if (category) updatePayload.category = category;
    if (subcategory) updatePayload.subcategory = subcategory;
    
    // Mise à jour du contexte si nécessaire
    if (category || subcategory) {
      updatePayload.context = {
        ...currentFile.context,
        updated_at: new Date().toISOString()
      };
      // Si on change la catégorie, on pourrait vouloir mettre à jour le contexte
      // mais on ne change PAS la storage_key existante pour garantir l'intégrité
    }

    if (Object.keys(updatePayload).length > 0) {
      await file.update(updatePayload, {
        where: { node_id: fileId },
        transaction
      });
    }
    
    // Valider la transaction
    await transaction.commit();
    
    // Mettre à jour le modified_at du fichier et de ses ancêtres
    await updateAncestorsModifiedAt(fileId);
    
    // Retourner le fichier mis à jour
    const updatedFile = await file.findOne({
      where: { node_id: fileId },
      include: [{
        model: node,
        as: 'node',
        attributes: { exclude: ['id'] }
      }]
    });
    
    return {
      success: true,
      file: updatedFile,
      physicalPathChanged: false // Toujours faux maintenant !
    };
    
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

module.exports = {
  buildNodePath,
  saveUploadedFiles,
  associateFilesToNode,
  getFileDetails,
  deleteFile,
  deleteNodeFiles,
  getAllFilesByNode,
  getFileById,
  downloadFile,
  getFileStats,
  updateFile,
  deleteFilesRecursively,
  deleteFilesByContext
};

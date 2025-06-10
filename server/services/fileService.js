/**
 * Service de gestion des fichiers
 * Contient la logique métier liée aux opérations sur les fichiers
 */

const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { Node, File, Closure, sequelize } = require('../models');
const { Op } = require('sequelize');
const { UPLOAD_BASE_DIR, TEMP_DIR } = require('../utils/fileStorage');
const { NotFoundError, ValidationError } = require('../utils/errors');

/**
 * Construit le chemin physique pour un fichier à partir du chemin du nœud parent
 * @param {Object} parentNode - Nœud parent
 * @param {string} category - Catégorie du fichier
 * @param {string} subcategory - Sous-catégorie du fichier
 * @returns {string} Chemin physique complet
 */
const buildPhysicalFilePath = (parentNode, category, subcategory) => {
  // Commencer par le répertoire de base
  let physicalPath = UPLOAD_BASE_DIR;
  
  // Construire le chemin à partir du chemin logique du nœud parent
  // Le chemin logique est comme "/Audi/TRQ_20250528" 
  const pathComponents = parentNode.path.split('/').filter(c => c.length > 0);
  
  // Ajouter chaque composant du chemin
  for (const component of pathComponents) {
    physicalPath = path.join(physicalPath, component);
  }
  
  // Déterminer la structure de catégorie appropriée
  let categoryPath = category || 'general';
  let subcategoryPath = subcategory || '';
  
  // Si le parent est un ordre, respecter la structure spécifique
  if (parentNode.type === 'order') {
    categoryPath = 'documents';
    subcategoryPath = 'alldocuments';
  }
  
  // Ajouter la catégorie et sous-catégorie
  if (categoryPath) {
    physicalPath = path.join(physicalPath, categoryPath);
    if (subcategoryPath) {
      physicalPath = path.join(physicalPath, subcategoryPath);
    }
  }
  
  return physicalPath;
};

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
  
  // Si le parent est un ordre, respecter la structure order/documents/alldocuments
  if (parentNode.type === 'order') {
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
  for (const file of tempFiles) {
    const tempDir = path.dirname(file.file_path);
    tempDirsToCheck.add(tempDir);
  }
  
  // Vérifier et supprimer les dossiers vides
  for (const tempDir of tempDirsToCheck) {
    try {
      if (fs.existsSync(tempDir)) {
        const files = fs.readdirSync(tempDir);
        if (files.length === 0) {
          fs.rmdirSync(tempDir);
          console.log(`Dossier temporaire vide supprimé: ${tempDir}`);
          
          // Vérifier aussi le dossier parent s'il est dans temp/
          const parentDir = path.dirname(tempDir);
          if (parentDir.includes('temp') && fs.existsSync(parentDir)) {
            const parentFiles = fs.readdirSync(parentDir);
            if (parentFiles.length === 0) {
              fs.rmdirSync(parentDir);
              console.log(`Dossier parent temporaire vide supprimé: ${parentDir}`);
            }
          }
        }
      }
    } catch (error) {
      console.warn(`Erreur lors du nettoyage du dossier temporaire ${tempDir}:`, error.message);
    }
  }
};

/**
 * Enregistre des fichiers téléchargés
 * @param {Array} files - Fichiers téléchargés
 * @param {Object} data - Données supplémentaires (nodeId, category, subcategory)
 * @returns {Promise<Object>} Résultat de l'opération
 */
const saveUploadedFiles = async (files, data) => {
  const { nodeId, category, subcategory } = data;
  
  // Si nodeId n'est pas fourni, nous stockons temporairement
  const tempId = nodeId || `temp-${uuidv4()}`;
  const fileRecords = [];
  
  // Utiliser une transaction pour garantir la cohérence des données
  const transaction = await sequelize.transaction();
  
  try {
    // Récupérer le nœud parent si nodeId est fourni
    let parentNode = null;
    if (nodeId) {
      parentNode = await Node.findByPk(nodeId, { transaction });
      if (!parentNode) {
        throw new NotFoundError('Nœud parent non trouvé');
      }
    }

    for (const file of files) {
      // Déterminer le chemin final du fichier
      let finalPath;
      let nodePath;
      
      if (nodeId && parentNode) {
        // Construire le chemin physique en utilisant le chemin du parent
        const physicalDirPath = buildPhysicalFilePath(parentNode, category, subcategory);
        fs.mkdirSync(physicalDirPath, { recursive: true });
        
        // Déplacer le fichier de temp vers le chemin final
        finalPath = path.join(physicalDirPath, file.filename);
        fs.renameSync(file.path, finalPath);
        
        // Construire le chemin logique pour la base de données
        nodePath = buildNodePath(parentNode, category, subcategory, file.originalname);
      } else {
        // Garder le fichier dans temp pour l'instant
        finalPath = file.path;
        nodePath = `/temp/${tempId}/${file.filename}`;
      }
        // Créer l'enregistrement du nœud
      const fileNode = await Node.create({
        name: file.originalname,
        path: nodePath,
        type: 'file',
        parent_id: nodeId ? parseInt(nodeId) : null,
        created_at: new Date(),
        data_status: 'new',
        description: `File uploaded as ${category || 'general'}${subcategory ? `/${subcategory}` : ''}`
      }, { transaction });

      // Créer les relations de fermeture si le fichier est directement associé à un nœud
      if (nodeId) {
        // 1. Auto-relation (profondeur 0)
        await Closure.create({
          ancestor_id: fileNode.id,
          descendant_id: fileNode.id,
          depth: 0
        }, { transaction });
        
        // 2. Relations avec les ancêtres du parent
        const parentClosures = await Closure.findAll({
          where: { descendant_id: parseInt(nodeId) },
          transaction
        });
        
        for (const parentClosure of parentClosures) {
          await Closure.create({
            ancestor_id: parentClosure.ancestor_id,
            descendant_id: fileNode.id,
            depth: parentClosure.depth + 1
          }, { transaction });
        }
      }

      // Créer l'enregistrement du fichier
      const fileRecord = await File.create({
        node_id: fileNode.id,
        original_name: file.originalname,
        file_path: finalPath,
        size: file.size,
        mime_type: file.mimetype,
        category: category || 'general',
        subcategory: subcategory || null,
        additional_info: {
          temp_id: !nodeId ? tempId : null,
          upload_date: new Date().toISOString()
        }
      }, { transaction });
      
      fileRecords.push({
        id: fileNode.id,
        name: file.originalname,
        size: file.size,
        type: file.mimetype,
        tempId: !nodeId ? tempId : null,
        category,
        subcategory
      });
    }
    
    // Valider la transaction
    await transaction.commit();
    
    return {
      success: true,
      files: fileRecords,
      tempId
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
  
  // Utiliser une transaction
  const transaction = await sequelize.transaction();
  try {
    // Récupérer les fichiers temporaires en utilisant le champ additional_info.temp_id
    // Utiliser l'opérateur JSON de Sequelize pour une compatibilité maximale
    const tempFiles = await File.findAll({
      where: sequelize.where(
        sequelize.json('additional_info.temp_id'),
        tempId
      ),
      include: [{
        model: Node,
        required: true
      }]
    });
    
    if (!tempFiles.length) {
      throw new NotFoundError('Aucun fichier temporaire trouvé avec cet ID');
    }
    
    // Vérifier que le nœud parent existe
    const parentNode = await Node.findByPk(nodeId);
    if (!parentNode) {
      throw new NotFoundError('Nœud parent non trouvé');
    }
    
    // Déterminer la structure de répertoire appropriée en fonction du type de nœud parent
    let categoryPath = category || 'general';
    let subcategoryPath = subcategory || '';
    
    // Si le parent est un ordre, respecter la structure order/documents/alldocuments
    if (parentNode.type === 'order') {
      categoryPath = 'documents';
      subcategoryPath = 'alldocuments';
    }
      // Créer le répertoire de destination en utilisant le chemin du parent
    const physicalDirPath = buildPhysicalFilePath(parentNode, categoryPath, subcategoryPath);
    fs.mkdirSync(physicalDirPath, { recursive: true });
        // Mettre à jour chaque fichier et le déplacer vers le répertoire final
    for (const file of tempFiles) {
      // Déplacer le fichier physique
      const fileName = path.basename(file.file_path);
      const destPath = path.join(physicalDirPath, fileName);
      fs.renameSync(file.file_path, destPath);
      
      // Récupérer le nœud associé au fichier
      const fileNode = file.Node;
      if (!fileNode) {
        throw new Error('Node is not associated to File!');
      }
      
      // Construire le nouveau chemin logique pour le nœud
      const newNodePath = buildNodePath(parentNode, categoryPath, subcategoryPath, fileNode.name);
      
      // ÉTAPE 1: Supprimer les anciennes relations de fermeture du nœud fichier
      await Closure.destroy({
        where: {
          [Op.or]: [
            { ancestor_id: file.node_id },
            { descendant_id: file.node_id }
          ]
        },
        transaction
      });
      
      // ÉTAPE 2: Mettre à jour les enregistrements du nœud avec le nouveau parent et chemin
      await Node.update({
        parent_id: nodeId,
        path: newNodePath,
        data_status: 'updated',
        modified_at: new Date()
      }, { 
        where: { id: file.node_id },
        transaction 
      });

      // ÉTAPE 3: Recréer toutes les relations de fermeture
      // 3a. Relation avec lui-même (depth = 0)
      await Closure.create({
        ancestor_id: file.node_id,
        descendant_id: file.node_id,
        depth: 0
      }, { transaction });

      // 3b. Relations avec tous les ancêtres du nouveau parent
      const ancestorRelations = await Closure.findAll({
        where: { descendant_id: nodeId },
        transaction
      });

      for (const ancestorRelation of ancestorRelations) {
        await Closure.create({
          ancestor_id: ancestorRelation.ancestor_id,
          descendant_id: file.node_id,
          depth: ancestorRelation.depth + 1
        }, { transaction });
      }
      
      // ÉTAPE 4: Mettre à jour l'enregistrement du fichier avec le nouveau chemin physique
      await File.update({
        file_path: destPath,
        category: categoryPath,
        subcategory: subcategoryPath,
        additional_info: {
          ...file.additional_info,
          associated_at: new Date().toISOString(),
          temp_id: null
        }
      }, { 
        where: { node_id: file.node_id },
        transaction 
      });
    }
    
    // Nettoyer les dossiers temporaires vides après déplacement des fichiers
    await cleanupTempDirectories(tempFiles);
    
    // Valider la transaction
    await transaction.commit();
    
    return {
      success: true,
      count: tempFiles.length,
      nodeId
    };
  } catch (error) {
    // Annuler la transaction en cas d'erreur
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

        // Supprimer l'enregistrement File
        if (file) {
          await File.destroy({
            where: { node_id: fileNode.id },
            transaction
          });
        }

        // Supprimer le nœud de fichier
        await Node.destroy({
          where: { id: fileNode.id },
          transaction
        });

        deletedCount++;
      } catch (error) {
        console.warn(`Erreur lors de la suppression du fichier ${fileNode.id}:`, error.message);
        // Continue avec les autres fichiers même si un échoue
      }
    }

    return deletedCount;
  } catch (error) {
    console.error('Erreur lors de la suppression des fichiers du nœud:', error);
    throw error;
  }
};

/**
 * Récupère les détails d'un fichier
 * @param {number} fileId - ID du fichier à récupérer
 * @returns {Promise<Object>} Détails du fichier
 */
const getFileDetails = async (fileId) => {
  const file = await Node.findOne({
    where: { id: fileId, type: 'file' },
    include: [{
      model: File,
      attributes: { exclude: ['node_id'] }
    }]
  });
  
  if (!file) {
    throw new NotFoundError('Fichier non trouvé');
  }
  
  return file;
};

/**
 * Supprime un fichier
 * @param {number} fileId - ID du fichier à supprimer
 * @returns {Promise<boolean>} Résultat de l'opération
 */
const deleteFile = async (fileId) => {
  const transaction = await sequelize.transaction();
  
  try {
    // Récupérer les détails du fichier
    // D'abord, vérifions que le nœud existe et qu'il s'agit bien d'un fichier
    const node = await Node.findOne({
      where: { id: fileId, type: 'file' },
      transaction
    });
    
    if (!node) {
      throw new NotFoundError('Nœud de fichier non trouvé');
    }
    
    // Ensuite, récupérons les informations du fichier associé
    const file = await File.findOne({
      where: { node_id: fileId },
      transaction
    });
    
    if (!file) {
      throw new NotFoundError('Fichier non trouvé');
    }
    
    // 1. Supprimer toutes les relations de fermeture liées à ce fichier
    await Closure.destroy({
      where: {
        [Op.or]: [
          { ancestor_id: fileId },
          { descendant_id: fileId }
        ]
      },
      transaction
    });
    
    // 2. Supprimer le fichier physique
    if (fs.existsSync(file.file_path)) {
      fs.unlinkSync(file.file_path);
    }
    
    // 3. Supprimer les enregistrements en base
    await File.destroy({
      where: { node_id: fileId },
      transaction
    });
    
    await Node.destroy({
      where: { id: fileId },
      transaction
    });
    
    // Valider la transaction
    await transaction.commit();
    
    return true;
  } catch (error) {
    // Annuler la transaction en cas d'erreur
    await transaction.rollback();
    throw error;
  }
};

/**
 * Récupère tous les fichiers associés à un nœud avec filtrage optionnel
 * @param {Object} options - Options de recherche
 * @returns {Promise<Object>} Fichiers trouvés et leurs détails
 */
const getAllFilesByNode = async (options) => {
  const { nodeId, category, subcategory } = options;
  
  console.log(`[getAllFilesByNode] Recherche: nodeId=${nodeId}, category=${category}, subcategory=${subcategory}`);
  
  // D'abord, récupérer tous les descendants du nœud (y compris lui-même)
  const descendantClosure = await Closure.findAll({
    where: { ancestor_id: nodeId },
    attributes: ['descendant_id', 'depth']
  });
  
  console.log(`[getAllFilesByNode] Relations closure trouvées: ${descendantClosure.length}`);
  
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
  if (subcategory) fileConditions.subcategory = subcategory;
  // Récupérer les nœuds de fichiers
  const fileNodes = await Node.findAll({
    where: conditions,
    include: [
      {
        model: File,
        where: Object.keys(fileConditions).length > 0 ? fileConditions : undefined,
        required: true
      }
    ]
  });
  
  console.log(`[getAllFilesByNode] Fichiers trouvés: ${fileNodes.length}`);
  
  // Formater la réponse
  const files = fileNodes.map(node => ({
    id: node.id,
    name: node.name,
    path: node.path,
    createdAt: node.created_at,
    size: node.File ? node.File.size : null,
    mimeType: node.File ? node.File.mime_type : null,
    category: node.File ? node.File.category : null,
    subcategory: node.File ? node.File.subcategory : null,
    original_name: node.File ? node.File.original_name : null,
    file_path: node.File ? node.File.file_path : null,
    type: node.File ? node.File.mime_type : 'application/octet-stream'
  }));
  console.log(`[getAllFilesByNode] Retour: ${files.length} fichiers`);
  
  return { files };
};

/**
 * Récupère un fichier spécifique par son ID
 * @param {number} fileId - ID du fichier
 * @returns {Promise<Object>} Données du fichier
 */
const getFileById = async (fileId) => {
  const fileData = await File.findOne({ 
    where: { node_id: fileId }
  });
  
  if (!fileData) {
    throw new NotFoundError('Fichier non trouvé');
  }
  
  // Vérifier si le fichier existe physiquement
  if (!fs.existsSync(fileData.file_path)) {
    throw new NotFoundError('Fichier physique introuvable', { path: fileData.file_path });
  }
  
  return fileData;
};

/**
 * Préparation au téléchargement d'un fichier
 * @param {number} fileId - ID du fichier à télécharger
 * @returns {Promise<Object>} Informations pour le téléchargement
 */
const downloadFile = async (fileId) => {
  // Récupérer les données du fichier
  const fileData = await File.findOne({ 
    where: { node_id: fileId }
  });
  
  const nodeData = await Node.findOne({ 
    where: { id: fileId } 
  });
  
  if (!fileData || !nodeData) {
    throw new NotFoundError('Fichier non trouvé');
  }
  
  // Vérifier si le fichier existe physiquement
  if (!fs.existsSync(fileData.file_path)) {
    throw new NotFoundError('Fichier physique introuvable', { path: fileData.file_path });
  }
  
  return { 
    filePath: fileData.file_path, 
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
  const node = await Node.findByPk(nodeId);
  if (!node) {
    throw new NotFoundError('Nœud non trouvé');
  }
  
  // Compter par catégories
  const categories = await File.findAll({
    attributes: [
      'category',
      [sequelize.fn('COUNT', sequelize.col('node_id')), 'count'],
      [sequelize.fn('SUM', sequelize.col('size')), 'totalSize']
    ],
    include: [{
      model: Node,
      where: {
        parent_id: nodeId
      }
    }],
    group: ['category']
  });
  
  // Compter par sous-catégories
  const subcategories = await File.findAll({
    attributes: [
      'category',
      'subcategory',
      [sequelize.fn('COUNT', sequelize.col('node_id')), 'count'],
      [sequelize.fn('SUM', sequelize.col('size')), 'totalSize']
    ],
    include: [{
      model: Node,
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
 * @param {number} fileId - ID du fichier à mettre à jour
 * @param {Object} updateData - Données de mise à jour
 * @param {number} [updateData.newParentId] - Nouvel ID du parent
 * @param {string} [updateData.category] - Nouvelle catégorie
 * @param {string} [updateData.subcategory] - Nouvelle sous-catégorie
 * @param {string} [updateData.name] - Nouveau nom du fichier
 * @returns {Promise<Object>} Résultat de l'opération
 */
const updateFile = async (fileId, updateData) => {
  const { newParentId, category, subcategory, name } = updateData;
  
  const transaction = await sequelize.transaction();
  
  try {
    // Récupérer le fichier actuel
    const currentFile = await File.findOne({
      where: { node_id: fileId },
      include: [{
        model: Node,
        required: true
      }],
      transaction
    });
    
    if (!currentFile) {
      throw new NotFoundError('Fichier non trouvé');
    }
    
    const currentNode = currentFile.Node;
    let needsPhysicalMove = false;
    let newPhysicalPath = currentFile.file_path;
    let newLogicalPath = currentNode.path;
    
    // Si changement de parent, gérer le déplacement
    if (newParentId && newParentId !== currentNode.parent_id) {
      const newParent = await Node.findByPk(newParentId, { transaction });
      if (!newParent) {
        throw new NotFoundError('Nouveau nœud parent non trouvé');
      }
      
      // Déterminer la nouvelle structure
      let newCategory = category || currentFile.category || 'general';
      let newSubcategory = subcategory || currentFile.subcategory || '';
      
      if (newParent.type === 'order') {
        newCategory = 'documents';
        newSubcategory = 'alldocuments';
      }
      
      // Construire les nouveaux chemins
      const newPhysicalDir = buildPhysicalFilePath(newParent, newCategory, newSubcategory);
      const fileName = name || currentNode.name;
      newPhysicalPath = path.join(newPhysicalDir, path.basename(currentFile.file_path));
      newLogicalPath = buildNodePath(newParent, newCategory, newSubcategory, fileName);
      
      // Créer le répertoire de destination
      fs.mkdirSync(newPhysicalDir, { recursive: true });
      
      // Déplacer le fichier physique
      fs.renameSync(currentFile.file_path, newPhysicalPath);
      needsPhysicalMove = true;
      
      // Supprimer les anciennes relations de fermeture
      await Closure.destroy({
        where: {
          [Op.or]: [
            { ancestor_id: fileId },
            { descendant_id: fileId }
          ]
        },
        transaction
      });
      
      // Mettre à jour le nœud avec le nouveau parent et chemin
      await Node.update({
        parent_id: newParentId,
        path: newLogicalPath,
        name: fileName,
        data_status: 'updated',
        modified_at: new Date()
      }, {
        where: { id: fileId },
        transaction
      });
      
      // Recréer les relations de fermeture
      // Relation avec lui-même
      await Closure.create({
        ancestor_id: fileId,
        descendant_id: fileId,
        depth: 0
      }, { transaction });
      
      // Relations avec tous les ancêtres du nouveau parent
      const ancestorRelations = await Closure.findAll({
        where: { descendant_id: newParentId },
        transaction
      });
      
      for (const ancestorRelation of ancestorRelations) {
        await Closure.create({
          ancestor_id: ancestorRelation.ancestor_id,
          descendant_id: fileId,
          depth: ancestorRelation.depth + 1
        }, { transaction });
      }
      
      // Mettre à jour l'enregistrement File
      await File.update({
        file_path: newPhysicalPath,
        category: newCategory,
        subcategory: newSubcategory,
        additional_info: {
          ...currentFile.additional_info,
          updated_at: new Date().toISOString()
        }
      }, {
        where: { node_id: fileId },
        transaction
      });
      
    } else if (name && name !== currentNode.name) {
      // Changement de nom seulement
      const newFileName = name;
      const currentDir = path.dirname(currentFile.file_path);
      const currentExt = path.extname(currentFile.file_path);
      newPhysicalPath = path.join(currentDir, newFileName + currentExt);
      
      // Renommer le fichier physique
      fs.renameSync(currentFile.file_path, newPhysicalPath);
      
      // Mettre à jour le chemin logique
      newLogicalPath = currentNode.path.replace(currentNode.name, newFileName);
      
      // Mettre à jour en base
      await Node.update({
        name: newFileName,
        path: newLogicalPath,
        data_status: 'updated',
        modified_at: new Date()
      }, {
        where: { id: fileId },
        transaction
      });
      
      await File.update({
        file_path: newPhysicalPath,
        additional_info: {
          ...currentFile.additional_info,
          updated_at: new Date().toISOString()
        }
      }, {
        where: { node_id: fileId },
        transaction
      });
    }
    
    // Valider la transaction
    await transaction.commit();
    
    // Retourner le fichier mis à jour
    const updatedFile = await File.findOne({
      where: { node_id: fileId },
      include: [{
        model: Node,
        attributes: { exclude: ['id'] }
      }]
    });
    
    return {
      success: true,
      file: updatedFile,
      physicalPathChanged: needsPhysicalMove
    };
    
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

module.exports = {
  buildPhysicalFilePath,
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
  updateFile
};

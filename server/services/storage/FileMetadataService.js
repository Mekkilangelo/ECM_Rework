/**
 * FileMetadataService - Gestion des métadonnées et contexte des fichiers
 * 
 * Responsabilités:
 * - Construction du contexte JSON pour les fichiers
 * - Normalisation des catégories (ancien système → nouveau)
 * - Détermination du type d'entité parent
 * - Gestion des métadonnées extensibles
 * 
 * Architecture:
 * - Indépendant du storage physique
 * - Logique métier pour le contexte des fichiers
 * - Support pour migration progressive
 */

const { node, closure, fileMetadata } = require('../../models');
const logger = require('../../utils/logger');

class FileMetadataService {
  /**
   * Construit le contexte JSON pour un fichier
   * @param {Object} params - Paramètres d'upload
   * @param {Object} parentNode - Nœud parent du fichier
   * @returns {Object} Contexte JSON
   */
  async buildFileContext(params, parentNode) {
    const { 
      category, 
      subcategory, 
      sampleNumber, 
      resultIndex,
      customTags = []
    } = params;
    
    // Déterminer le type d'entité racine
    const { entityType, entityId } = await this.getEntityInfo(parentNode);
    
    // Normaliser le type de fichier (ancien système → nouveau)
    const fileType = this.normalizeFileType(category);
    const fileSubtype = this.normalizeFileSubtype(subcategory, fileType);
    
    // Construire le contexte
    const context = {
      // Informations d'entité
      entity_type: entityType,
      entity_id: entityId,
      
      // Type de fichier
      file_type: fileType,
      file_subtype: fileSubtype,
      
      // Informations contextuelles
      sample_number: sampleNumber || null,
      result_index: resultIndex !== undefined ? resultIndex : null,
      
      // Informations parent
      parent_node_id: parentNode.id,
      parent_node_type: parentNode.type,
      parent_node_path: parentNode.path,
      
      // Métadonnées
      upload_source: 'web_ui',
      custom_tags: customTags,
      
      // Traçabilité migration
      migrated_from_legacy: false,
      legacy_category: category || null,
      legacy_subcategory: subcategory || null
    };
    
    logger.debug('Contexte fichier construit', { 
      entityType, 
      entityId, 
      fileType,
      parentNodeId: parentNode.id 
    });
    
    return context;
  }

  /**
   * Détermine le type d'entité et son ID depuis le nœud parent
   * @param {Object} startNode - Nœud de départ
   * @returns {Promise<Object>} { entityType, entityId }
   */
  async getEntityInfo(startNode) {
    // Si le nœud est directement une entité, retourner ses infos
    const directEntities = ['trial', 'part', 'client', 'trial_request'];
    
    if (directEntities.includes(startNode.type)) {
      return {
        entityType: startNode.type,
        entityId: startNode.id
      };
    }
    
    // Sinon, remonter l'arborescence via la closure table
    try {
      const ancestors = await closure.findAll({
        where: { descendant_id: startNode.id },
        include: [{
          model: node,
          as: 'ancestor',
          required: true
        }],
        order: [['depth', 'ASC']] // Du plus proche au plus lointain
      });
      
      // Chercher le premier ancêtre qui est une entité
      for (const ancestorClosure of ancestors) {
        const ancestorNode = ancestorClosure.ancestor;
        
        if (directEntities.includes(ancestorNode.type)) {
          return {
            entityType: ancestorNode.type,
            entityId: ancestorNode.id
          };
        }
      }
      
      // Si aucune entité trouvée, utiliser le nœud racine
      logger.warn('Aucune entité trouvée dans les ancêtres, utilisation du nœud lui-même', {
        nodeId: startNode.id,
        nodeType: startNode.type
      });
      
      return {
        entityType: startNode.type,
        entityId: startNode.id
      };
      
    } catch (error) {
      logger.error('Erreur récupération entité parente', {
        nodeId: startNode.id,
        error: error.message
      });
      
      // Fallback: utiliser le nœud actuel
      return {
        entityType: startNode.type,
        entityId: startNode.id
      };
    }
  }

  /**
   * Normalise le type de fichier (mapping ancien → nouveau système)
   * @param {string} category - Catégorie de l'ancien système
   * @returns {string} Type de fichier normalisé
   */
  normalizeFileType(category) {
    if (!category) return 'general';
    
    // Mapping des anciennes catégories vers les nouveaux types
    const mapping = {
      // Micrographies (toutes les variantes)
      'micrography': 'micrograph',
      'micrographs': 'micrograph',
      'micrographs-result-0': 'micrograph',
      'micrographs-result-1': 'micrograph',
      'micrographs-result-2': 'micrograph',
      'micrographs-result-3': 'micrograph',
      
      // Photos
      'photos': 'part_photo',
      'photos_identification': 'part_photo',
      'photos_recette': 'recipe_photo',
      'photos_durete': 'hardness_photo',
      'photos_dce': 'ecd_photo',
      
      // Documents et rapports
      'documents': 'document',
      'all_documents': 'document',
      'furnace_report': 'furnace_report',
      'load_design': 'load_design',
      'control_location': 'control_location'
    };
    
    // Vérifier si c'est une catégorie dynamique de micrographie
    if (category.startsWith('micrographs-result-')) {
      return 'micrograph';
    }
    
    return mapping[category] || category;
  }

  /**
   * Normalise le sous-type de fichier
   * @param {string} subcategory - Sous-catégorie de l'ancien système
   * @param {string} fileType - Type de fichier normalisé
   * @returns {string} Sous-type normalisé
   */
  normalizeFileSubtype(subcategory, fileType) {
    if (!subcategory) return null;
    
    // Mapping des sous-catégories
    const mapping = {
      // Zooms de micrographie
      'x50': 'x50',
      'x500': 'x500',
      'x1000': 'x1000',
      'other': 'other',
      
      // Photos de pièce
      'front': 'front',
      'profile': 'profile',
      'quarter': 'quarter',
      
      // Rapports de four
      'heating': 'heating',
      'cooling': 'cooling',
      'alarms': 'alarms',
      'datapaq': 'datapaq',
      
      // Documents
      'all_documents': 'all_documents',
      'alldocuments': 'all_documents'
    };
    
    // Vérifier si c'est une sous-catégorie dynamique (result-X-sample-Y)
    if (subcategory.match(/^result-\d+-sample-\d+$/)) {
      return subcategory; // Garder tel quel
    }
    
    return mapping[subcategory] || subcategory;
  }

  /**
   * Extrait les informations de sample/result depuis le contexte ou subcategory
   * @param {Object} context - Contexte du fichier
   * @returns {Object} { sampleNumber, resultIndex }
   */
  extractSampleInfo(context) {
    let sampleNumber = context.sample_number;
    let resultIndex = context.result_index;
    
    // Si pas dans le contexte, essayer d'extraire depuis legacy_subcategory
    if ((sampleNumber === null || resultIndex === null) && context.legacy_subcategory) {
      const match = context.legacy_subcategory.match(/result-(\d+)-sample-(\d+)/);
      if (match) {
        resultIndex = resultIndex !== null ? resultIndex : parseInt(match[1]);
        sampleNumber = sampleNumber !== null ? sampleNumber : parseInt(match[2]);
      }
    }
    
    // Ou depuis legacy_category
    if (resultIndex === null && context.legacy_category) {
      const match = context.legacy_category.match(/micrographs-result-(\d+)/);
      if (match) {
        resultIndex = parseInt(match[1]);
      }
    }
    
    return { sampleNumber, resultIndex };
  }

  /**
   * Ajoute une métadonnée à un fichier
   * @param {number} fileNodeId - ID du nœud fichier
   * @param {string} key - Clé de la métadonnée
   * @param {*} value - Valeur de la métadonnée
   * @param {string} type - Type (string, number, boolean, json)
   * @returns {Promise<Object>} Métadonnée créée
   */
  async addMetadata(fileNodeId, key, value, type = 'string') {
    try {
      const metadata = await fileMetadata.create({
        file_node_id: fileNodeId,
        meta_key: key,
        meta_value: typeof value === 'object' ? JSON.stringify(value) : String(value),
        meta_type: type
      });
      
      logger.debug('Métadonnée ajoutée', { 
        fileNodeId, 
        key, 
        type 
      });
      
      return metadata;
    } catch (error) {
      // Si la métadonnée existe déjà, la mettre à jour
      if (error.name === 'SequelizeUniqueConstraintError') {
        return await this.updateMetadata(fileNodeId, key, value, type);
      }
      throw error;
    }
  }

  /**
   * Met à jour une métadonnée existante
   * @param {number} fileNodeId - ID du nœud fichier
   * @param {string} key - Clé de la métadonnée
   * @param {*} value - Nouvelle valeur
   * @param {string} type - Type
   * @returns {Promise<Object>} Métadonnée mise à jour
   */
  async updateMetadata(fileNodeId, key, value, type = 'string') {
    const [updatedCount] = await fileMetadata.update({
      meta_value: typeof value === 'object' ? JSON.stringify(value) : String(value),
      meta_type: type
    }, {
      where: {
        file_node_id: fileNodeId,
        meta_key: key
      }
    });
    
    if (updatedCount === 0) {
      throw new Error(`Métadonnée non trouvée: ${key} pour fichier ${fileNodeId}`);
    }
    
    logger.debug('Métadonnée mise à jour', { 
      fileNodeId, 
      key 
    });
    
    return await fileMetadata.findOne({
      where: { file_node_id: fileNodeId, meta_key: key }
    });
  }

  /**
   * Récupère toutes les métadonnées d'un fichier
   * @param {number} fileNodeId - ID du nœud fichier
   * @returns {Promise<Object>} Objet clé-valeur des métadonnées
   */
  async getMetadata(fileNodeId) {
    const metadata = await fileMetadata.findAll({
      where: { file_node_id: fileNodeId }
    });
    
    return metadata.reduce((acc, meta) => {
      let value = meta.meta_value;
      
      // Parser selon le type
      switch (meta.meta_type) {
        case 'json':
          try {
            value = JSON.parse(value);
          } catch {
            logger.warn('Erreur parsing JSON metadata', { 
              fileNodeId, 
              key: meta.meta_key 
            });
          }
          break;
        case 'number':
          value = parseFloat(value);
          break;
        case 'boolean':
          value = value === 'true' || value === '1';
          break;
        default:
          // string - garder tel quel
          break;
      }
      
      acc[meta.meta_key] = value;
      return acc;
    }, {});
  }

  /**
   * Récupère une métadonnée spécifique
   * @param {number} fileNodeId - ID du nœud fichier
   * @param {string} key - Clé de la métadonnée
   * @returns {Promise<*>} Valeur de la métadonnée
   */
  async getMetadataValue(fileNodeId, key) {
    const metadata = await fileMetadata.findOne({
      where: {
        file_node_id: fileNodeId,
        meta_key: key
      }
    });
    
    if (!metadata) {
      return null;
    }
    
    let value = metadata.meta_value;
    
    switch (metadata.meta_type) {
      case 'json':
        return JSON.parse(value);
      case 'number':
        return parseFloat(value);
      case 'boolean':
        return value === 'true' || value === '1';
      default:
        return value;
    }
  }

  /**
   * Supprime une métadonnée
   * @param {number} fileNodeId - ID du nœud fichier
   * @param {string} key - Clé de la métadonnée
   * @returns {Promise<boolean>} True si supprimée
   */
  async deleteMetadata(fileNodeId, key) {
    const deletedCount = await fileMetadata.destroy({
      where: {
        file_node_id: fileNodeId,
        meta_key: key
      }
    });
    
    return deletedCount > 0;
  }

  /**
   * Supprime toutes les métadonnées d'un fichier
   * @param {number} fileNodeId - ID du nœud fichier
   * @returns {Promise<number>} Nombre de métadonnées supprimées
   */
  async deleteAllMetadata(fileNodeId) {
    const deletedCount = await fileMetadata.destroy({
      where: { file_node_id: fileNodeId }
    });
    
    logger.debug('Métadonnées supprimées', { 
      fileNodeId, 
      count: deletedCount 
    });
    
    return deletedCount;
  }

  /**
   * Enrichit un fichier avec ses métadonnées
   * @param {Object} fileRecord - Enregistrement du fichier
   * @returns {Promise<Object>} Fichier enrichi
   */
  async enrichFileWithMetadata(fileRecord) {
    const metadata = await this.getMetadata(fileRecord.node_id);
    
    return {
      ...fileRecord.toJSON(),
      metadata
    };
  }

  /**
   * Recherche des fichiers par métadonnée
   * @param {string} key - Clé de métadonnée
   * @param {*} value - Valeur recherchée
   * @returns {Promise<Array<number>>} Liste des node_id
   */
  async findFilesByMetadata(key, value) {
    const metadata = await fileMetadata.findAll({
      where: {
        meta_key: key,
        meta_value: String(value)
      }
    });
    
    return metadata.map(m => m.file_node_id);
  }
}

// Export singleton instance
module.exports = new FileMetadataService();

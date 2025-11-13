/**
 * Contrôleur pour les fonctionnalités de recherche
 */
const { node: Node, client: Client, trial_request: TrialRequest, part: Part, trial: Trial, steel: Steel } = require('../models');
const { Op, Sequelize } = require('sequelize');

// Mappages de types d'entités vers les champs à rechercher
const searchableFields = {
  clients: [
    'name', 
    'description',
    'Client.client_group', 
    'Client.country', 
    'Client.city', 
    'Client.address'
  ],
  orders: [
    'name', 
    'description',
    'TrialRequest.commercial', 
    'TrialRequest.request_number'
  ],
  parts: [
    'name', 
    'description',
    'Part.designation', 
    'Part.client_designation', 
    'Part.reference'
  ],
  trials: [
    'name', 
    'description',
    'Trial.load_number', 
    'Trial.mounting_type', 
    'Trial.position_type',
    'Trial.process_type',
    'Trial.preox_media',
    // Champs JSON imbriqués
    'Trial.furnace_data->furnace_type',
    'Trial.furnace_data->heating_cell',
    'Trial.furnace_data->cooling_media',
    'Trial.furnace_data->quench_cell',
    'Trial.load_data->floor_count',
    'Trial.load_data->part_count',
    'Trial.load_data->comments',
    'Trial.recipe_data->number',
    'Trial.recipe_data->selected_gas1',
    'Trial.recipe_data->selected_gas2',
    'Trial.recipe_data->selected_gas3',
    'Trial.recipe_data->preox->media',
    'Trial.quench_data->gas_quench->speed_parameters',
    'Trial.quench_data->oil_quench->speed_parameters',
    'Trial.results_data->results'
  ],
  steels: [
    'name', 
    'description',
    'Steel.grade', 
    'Steel.family', 
    'Steel.standard',
    // JSON
    'Steel.chemistery',
    'Steel.equivalents'
  ]
};

// Fonctions de formatage pour les différents types d'entités
const formatResults = {
  clients: (nodes) => nodes,
  orders: (nodes) => nodes,
  parts: (nodes) => nodes,
  trials: (nodes) => nodes,
  steels: (nodes) => nodes
};

/**
 * Recherche globale dans tous les types d'entités
 */
exports.search = async (req, res) => {
  try {
    const { 
      q, 
      entityTypes, 
      page = 1, 
      limit = 20,
      // Filtres spécifiques aux entités
      clientGroup, country, city,
      orderDate, commercial,
      partDesignation, steelType, minQuantity, maxQuantity,
      trialStatus, trialLocation, mountingType, processType, positionType, trialDateFrom, trialDateTo,
      steelFamily, steelStandard
    } = req.query;
    
    if (!q && !anyFilterApplied(req.query)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Un terme de recherche ou au moins un filtre est requis' 
      });
    }
    
    // Déterminer les types d'entités à rechercher
    let typesToSearch = ['clients', 'orders', 'parts', 'trials', 'steels'];
    if (entityTypes) {
      typesToSearch = entityTypes.split(',').filter(type => 
        ['clients', 'orders', 'parts', 'trials', 'steels'].includes(type)
      );
    }
    
    // Offset pour la pagination
    const offset = (page - 1) * limit;
    
    // Préparer l'objet de résultats
    const results = {};
    let totalResults = 0;
    
    // Exécuter la recherche pour chaque type d'entité
    for (const entityType of typesToSearch) {
      const fields = searchableFields[entityType];
      const nodeType = entityType.slice(0, -1); // Convertir 'clients' en 'client'
      
      // Générer les conditions de recherche pour les champs textuels
      const searchConditions = q ? fields.map(field => {
        if (field.includes('.') && !field.includes('->')) {
          // Si c'est un champ dans une table associée (Client.country)
          const [table, column] = field.split('.');
          return {
            [`$${field}$`]: { [Op.like]: `%${q}%` }
          };
        } else if (field.includes('->')) {
          // Si c'est un champ JSON (Part.specifications->material)
          const [tableField, jsonPath] = field.split('->');
          
          // Traitement spécial pour les champs JSON imbriqués
          if (jsonPath.includes('->')) {
            // Cas des chemins JSON imbriqués comme 'recipe_data->preox->media'
            const jsonParts = jsonPath.split('->');
            let jsonPathStr = '';
            
            // Construire le chemin JSON complet ($.preox.media)
            for (const part of jsonParts) {
              jsonPathStr += `.${part}`;
            }
            jsonPathStr = `$${jsonPathStr}`;
            
            return Sequelize.literal(
              `JSON_EXTRACT(${tableField}, '${jsonPathStr}') LIKE '%${q}%'`
            );
          } else {
            // Cas standard de chemin JSON simple
            return Sequelize.literal(
              `(JSON_CONTAINS(${tableField}, '"${q}"', '$.${jsonPath}') = 1 OR 
                JSON_EXTRACT(${tableField}, '$.${jsonPath}') LIKE '%${q}%' OR
                ${tableField} LIKE '%${q}%')`
            );
          }
        } else {
          // Si c'est un champ direct du nœud (name)
          return {
            [field]: { [Op.like]: `%${q}%` }
          };
        }
      }) : [];
      
      // Ajouter des filtres spécifiques selon le type d'entité
      const entityFilters = getEntitySpecificFilters(entityType, req.query);
      
      // Créer l'objet d'options pour la requête
      const queryOptions = {
        where: {
          type: nodeType,
          ...(q && { [Op.or]: searchConditions }),
          ...entityFilters
        },
        include: getIncludesForType(entityType),
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['modified_at', 'DESC']],
        // Ajouter une clause distinct pour éviter les doublons
        distinct: true,
        // Inclure le nombre total de résultats distincts
        subQuery: false
      };
      
      // Exécuter la requête
      const { rows, count } = await Node.findAndCountAll(queryOptions);
      
      // Dédupliquer les résultats sur la base des ID
      const uniqueRows = [];
      const seenIds = new Set();
      
      for (const row of rows) {
        if (!seenIds.has(row.id)) {
          seenIds.add(row.id);
          uniqueRows.push(row);
        }
      }
      
      // Ajouter les résultats dédupliqués au tableau final
      results[entityType] = formatResults[entityType](uniqueRows);
      totalResults += count;
    }
    
    // Retourner les résultats
    return res.status(200).json({
      success: true,
      results,
      totalResults,
      page: parseInt(page),
      limit: parseInt(limit),
      filters: getAppliedFilters(req.query)
    });
    
  } catch (error) {
    console.error('Erreur lors de la recherche:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Erreur lors de la recherche', 
      error: error.message 
    });
  }
};

// Vérifier si un filtre a été appliqué
function anyFilterApplied(query) {
  const filterFields = [
    'clientGroup', 'country', 'city',
    'orderDate', 'commercial',
    'partDesignation', 'steelType', 'minQuantity', 'maxQuantity',
    'trialStatus', 'trialLocation', 'mountingType', 'processType', 'positionType', 'trialDateFrom', 'trialDateTo',
    'steelFamily', 'steelStandard'
  ];
  
  return filterFields.some(field => query[field] !== undefined && query[field] !== '');
}

// Obtenir les filtres appliqués pour les inclure dans la réponse
function getAppliedFilters(query) {
  const appliedFilters = {};
  const filterFields = [
    'clientGroup', 'country', 'city',
    'orderDate', 'commercial',
    'partDesignation', 'steelType', 'minQuantity', 'maxQuantity',
    'trialStatus', 'trialLocation', 'mountingType', 'processType', 'positionType', 'trialDateFrom', 'trialDateTo',
    'steelFamily', 'steelStandard'
  ];
  
  filterFields.forEach(field => {
    if (query[field] !== undefined && query[field] !== '') {
      appliedFilters[field] = query[field];
    }
  });
  
  return appliedFilters;
}

// Construire des filtres spécifiques selon le type d'entité
function getEntitySpecificFilters(entityType, query) {
  const filters = {};
  
  switch (entityType) {
    case 'clients':
      if (query.clientGroup) filters['$Client.client_group$'] = { [Op.like]: `%${query.clientGroup}%` };
      if (query.country) filters['$Client.country$'] = { [Op.like]: `%${query.country}%` };
      if (query.city) filters['$Client.city$'] = { [Op.like]: `%${query.city}%` };
      if (query.address) filters['$Client.address$'] = { [Op.like]: `%${query.address}%` };
      break;
      
    case 'orders':
      if (query.orderDate) {
        const orderDate = new Date(query.orderDate);
        filters['$TrialRequest.request_date$'] = orderDate;
      }
      if (query.commercial) filters['$TrialRequest.commercial$'] = { [Op.like]: `%${query.commercial}%` };
      break;
      
    case 'parts':
      if (query.partDesignation) filters['$Part.designation$'] = { [Op.like]: `%${query.partDesignation}%` };
      if (query.clientDesignation) filters['$Part.client_designation$'] = { [Op.like]: `%${query.clientDesignation}%` };
      if (query.reference) filters['$Part.reference$'] = { [Op.like]: `%${query.reference}%` };
      
      // Filtres numériques
      if (query.minQuantity) filters['$Part.quantity$'] = { [Op.gte]: parseInt(query.minQuantity) };
      if (query.maxQuantity) {
        filters['$Part.quantity$'] = { 
          ...(filters['$Part.quantity$'] || {}), 
          [Op.lte]: parseInt(query.maxQuantity) 
        };
      }
      
      // TODO: Ajouter les filtres pour les dimensions (dim_rect_length, etc.) 
      // et les spécifications (tables specs_hardness, specs_ecd) si nécessaire
      break;
      
    case 'trials':
      if (query.trialStatus) filters['$Trial.status$'] = query.trialStatus;
      if (query.trialLocation) filters['$Trial.location$'] = query.trialLocation;
      if (query.mountingType) filters['$Trial.mounting_type$'] = query.mountingType;
      if (query.processType) filters['$Trial.process_type$'] = query.processType;
      if (query.positionType) filters['$Trial.position_type$'] = query.positionType;
      if (query.loadNumber) filters['$Trial.load_number$'] = { [Op.like]: `%${query.loadNumber}%` };
      if (query.preoxMedia) filters['$Trial.preox_media$'] = { [Op.like]: `%${query.preoxMedia}%` };
      
      // Filtres de plage de dates
      if (query.trialDateFrom || query.trialDateTo) {
        filters['$Trial.trial_date$'] = {};
        if (query.trialDateFrom) filters['$Trial.trial_date$'][Op.gte] = query.trialDateFrom;
        if (query.trialDateTo) filters['$Trial.trial_date$'][Op.lte] = query.trialDateTo;
      }
      
      // Filtres pour les données de four (via JSON)
      if (query.furnaceType) {
        filters[Op.and] = filters[Op.and] || [];
        filters[Op.and].push(Sequelize.literal(
          `JSON_EXTRACT(Trial.furnace_data, '$.furnace_type') LIKE '%${query.furnaceType}%'`
        ));
      }
      
      // Filtres pour les données de recette (via JSON)
      if (query.recipeNumber) {
        filters[Op.and] = filters[Op.and] || [];
        filters[Op.and].push(Sequelize.literal(
          `JSON_EXTRACT(Trial.recipe_data, '$.number') LIKE '%${query.recipeNumber}%'`
        ));
      }
      break;
      
    case 'steels':
      if (query.steelFamily) filters['$Steel.family$'] = { [Op.like]: `%${query.steelFamily}%` };
      if (query.steelStandard) filters['$Steel.standard$'] = { [Op.like]: `%${query.steelStandard}%` };
      if (query.steelGrade) filters['$Steel.grade$'] = { [Op.like]: `%${query.steelGrade}%` };
      
      // Recherche dans les équivalents (via JSON)
      if (query.equivalent) {
        filters[Op.and] = filters[Op.and] || [];
        filters[Op.and].push(Sequelize.literal(
          `JSON_CONTAINS(Steel.equivalents, '"${query.equivalent}"') = 1 OR JSON_SEARCH(Steel.equivalents, 'one', '%${query.equivalent}%') IS NOT NULL`
        ));
      }
      
      // Recherche dans la composition chimique (via JSON)
      if (query.chemicalElement) {
        filters[Op.and] = filters[Op.and] || [];
        filters[Op.and].push(Sequelize.literal(
          `JSON_SEARCH(Steel.chemistery, 'one', '%${query.chemicalElement}%', '$[*].element') IS NOT NULL`
        ));
      }
      break;
  }
  
  return filters;
}

/**
 * Recherche spécifique dans un type d'entité
 */
exports.searchByEntityType = async (req, res) => {
  try {
    const { entityType } = req.params;
    const { 
      q, 
      page = 1, 
      limit = 20,
      // Les mêmes filtres que pour la recherche globale
      clientGroup, country, city,
      orderDate, commercial,
      partDesignation, steelType, minQuantity, maxQuantity,
      trialStatus, trialLocation, mountingType, processType, positionType, trialDateFrom, trialDateTo,
      steelFamily, steelStandard
    } = req.query;
    
    if (!q && !anyFilterApplied(req.query)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Un terme de recherche ou au moins un filtre est requis' 
      });
    }
    
    if (!['clients', 'orders', 'parts', 'trials', 'steels'].includes(entityType)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Type d\'entité invalide' 
      });
    }
    
    // Convertir le type d'entité pluriel au singulier pour le type de nœud
    let nodeType = entityType.slice(0, -1); // Ex: 'clients' -> 'client'
    if (entityType === 'orders') nodeType = 'trial_request'; // Exception: orders -> trial_request dans la DB
    
    // Les champs à rechercher pour ce type d'entité
    const fields = searchableFields[entityType];
    
    // Offset pour la pagination
    const offset = (page - 1) * limit;
    
    // Générer les conditions de recherche pour les champs
    const searchConditions = q ? fields.map(field => {
      if (field.includes('.') && !field.includes('->')) {
        // Si c'est un champ dans une table associée (Client.country)
        return {
          [`$${field}$`]: { [Op.like]: `%${q}%` }
        };
      } else if (field.includes('->')) {
        // Si c'est un champ JSON (Part.specifications->material)
        const [tableField, jsonPath] = field.split('->');
        
        // Traitement spécial pour les champs JSON imbriqués
        if (jsonPath.includes('->')) {
          // Cas des chemins JSON imbriqués comme 'recipe_data->preox->media'
          const jsonParts = jsonPath.split('->');
          let jsonPathStr = '';
          
          // Construire le chemin JSON complet ($.preox.media)
          for (const part of jsonParts) {
            jsonPathStr += `.${part}`;
          }
          jsonPathStr = `$${jsonPathStr}`;
          
          return Sequelize.literal(
            `JSON_EXTRACT(${tableField}, '${jsonPathStr}') LIKE '%${q}%'`
          );
        } else {
          // Cas standard de chemin JSON simple
          return Sequelize.literal(
            `(JSON_CONTAINS(${tableField}, '"${q}"', '$.${jsonPath}') = 1 OR 
              JSON_EXTRACT(${tableField}, '$.${jsonPath}') LIKE '%${q}%' OR
              ${tableField} LIKE '%${q}%')`
          );
        }
      } else {
        // Si c'est un champ direct du nœud (name)
        return {
          [field]: { [Op.like]: `%${q}%` }
        };
      }
    }) : [];
    
    // Ajouter des filtres spécifiques selon le type d'entité
    const entityFilters = getEntitySpecificFilters(entityType, req.query);
    
    // Créer l'objet d'options pour la requête
    const queryOptions = {
      where: {
        type: nodeType,
        ...(q && { [Op.or]: searchConditions }),
        ...entityFilters
      },
      include: getIncludesForType(entityType),
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['modified_at', 'DESC']]
    };
    
    // Exécuter la requête
    const { rows, count } = await Node.findAndCountAll(queryOptions);
    
    // Retourner les résultats
    return res.status(200).json({
      success: true,
      results: formatResults[entityType](rows),
      totalResults: count,
      page: parseInt(page),
      limit: parseInt(limit),
      filters: getAppliedFilters(req.query)
    });
    
  } catch (error) {
    console.error(`Erreur lors de la recherche de ${req.params.entityType}:`, error);
    return res.status(500).json({ 
      success: false, 
      message: `Erreur lors de la recherche de ${req.params.entityType}`, 
      error: error.message 
    });
  }
};

/**
 * Obtient les relations à inclure selon le type d'entité
 */
function getIncludesForType(entityType) {
  switch (entityType) {
    case 'clients':
      return [{ model: Client, as: 'Client' }];
    case 'orders':
      return [{ model: TrialRequest, as: 'TrialRequest' }];
    case 'parts':
      return [{ model: Part, as: 'Part' }];
    case 'trials':
      return [{ model: Trial, as: 'Trial' }];
    case 'steels':
      return [{ model: Steel, as: 'Steel' }];
    default:
      return [];
  }
}
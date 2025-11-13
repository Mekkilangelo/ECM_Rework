/**
 * Contrôleur de recherche d'essais (Trials)
 * Système de recherche moderne et optimisé pour trouver des essais
 * basé sur la nouvelle structure de base de données
 */

const { 
  node: Node, 
  trial: Trial, 
  client: Client,
  part: Part,
  steel: Steel,
  recipe: Recipe,
  furnace: Furnace,
  ref_status: RefStatus,
  ref_location: RefLocation,
  ref_mounting_type: RefMountingType,
  ref_position_type: RefPositionType,
  ref_process_type: RefProcessType,
  ref_designation: RefDesignation,
  ref_furnace_types: RefFurnaceTypes,
  ref_cooling_media: RefCoolingMedia,
  ref_steel_family: RefSteelFamily,
  ref_steel_standard: RefSteelStandard
} = require('../models');

const { Op, Sequelize } = require('sequelize');

/**
 * Recherche d'essais avec filtres avancés
 * Cette fonction permet de rechercher des essais en fonction de multiples critères
 */
exports.searchTrials = async (req, res) => {
  try {
    const {
      // Recherche textuelle générale
      query,
      
      // Pagination
      page = 1,
      limit = 20,
      
      // Filtres sur l'essai lui-même
      trialCode,
      loadNumber,
      status,
      location,
      mountingType,
      positionType,
      processType,
      trialDateFrom,
      trialDateTo,
      
      // Filtres sur le client (via la hiérarchie des nodes)
      clientName,
      clientCode,
      clientCountry,
      clientCity,
      clientGroup,
      
      // Filtres sur la pièce (via la hiérarchie des nodes)
      partName,
      partDesignation,
      partReference,
      partClientDesignation,
      
      // Filtres sur l'acier (via la pièce)
      steelGrade,
      steelFamily,
      steelStandard,
      
      // Filtres sur le four
      furnaceType,
      furnaceSize,
      heatingCell,
      coolingMedia,
      quenchCell,
      
      // Filtres sur la recette
      recipeNumber,
      
      // Tri
      sortBy = 'trial_date',
      sortOrder = 'DESC'
    } = req.query;

    // Construction des conditions WHERE
    const whereConditions = {
      type: 'trial' // Les trials sont stockés avec type='trial' dans la DB
    };

    // Conditions pour la table Trial
    const trialWhere = {};

    if (trialCode) {
      trialWhere.trial_code = { [Op.like]: `%${trialCode}%` };
    }

    if (loadNumber) {
      trialWhere.load_number = { [Op.like]: `%${loadNumber}%` };
    }

    if (status) {
      trialWhere.status = status;
    }

    if (location) {
      trialWhere.location = location;
    }

    if (mountingType) {
      trialWhere.mounting_type = mountingType;
    }

    if (positionType) {
      trialWhere.position_type = positionType;
    }

    if (processType) {
      trialWhere.process_type = processType;
    }

    // Filtrage par date
    if (trialDateFrom || trialDateTo) {
      trialWhere.trial_date = {};
      if (trialDateFrom) {
        trialWhere.trial_date[Op.gte] = trialDateFrom;
      }
      if (trialDateTo) {
        trialWhere.trial_date[Op.lte] = trialDateTo;
      }
    }

    // Recherche textuelle globale (si fournie)
    if (query) {
      whereConditions[Op.or] = [
        { name: { [Op.like]: `%${query}%` } },
        { description: { [Op.like]: `%${query}%` } },
        { '$trial.trial_code$': { [Op.like]: `%${query}%` } },
        { '$trial.load_number$': { [Op.like]: `%${query}%` } }
      ];
    }

    // Construction des includes (jointures)
    const includes = [
      {
        model: Trial,
        as: 'trial',
        where: Object.keys(trialWhere).length > 0 ? trialWhere : undefined,
        required: true,
        include: [
          {
            model: Recipe,
            as: 'recipe',
            where: recipeNumber ? { recipe_number: { [Op.like]: `%${recipeNumber}%` } } : undefined,
            required: false
          },
          {
            model: Furnace,
            as: 'furnace',
            where: buildFurnaceWhere({ furnaceType, furnaceSize, heatingCell, coolingMedia, quenchCell }),
            required: false
          }
        ]
      }
    ];

    // Recherche dans la hiérarchie pour trouver le client et les pièces
    // On va chercher les ancestors et descendants via la table closure
    const offset = (page - 1) * limit;

    // Requête principale
    const { rows: trials, count } = await Node.findAndCountAll({
      where: whereConditions,
      include: includes,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [[buildOrderClause(sortBy, sortOrder)]],
      distinct: true,
      subQuery: false
    });

    // Pour chaque trial, on récupère les informations enrichies
    const enrichedTrials = await Promise.all(
      trials.map(async (trial) => {
        // Récupérer les ancêtres (client, order, part)
        const ancestors = await getAncestors(trial.id);

        // Extraire les informations pertinentes
        const clientNode = ancestors.find(a => a.type === 'client');
        const orderNode = ancestors.find(a => a.type === 'trial_request');
        const partNode = ancestors.find(a => a.type === 'part');

        // Filtrer par client si nécessaire
        if (clientName || clientCode || clientCountry || clientCity || clientGroup) {
          if (!clientNode || !matchesClientFilters(clientNode, { clientName, clientCode, clientCountry, clientCity, clientGroup })) {
            return null;
          }
        }

        // Filtrer par pièce si nécessaire
        if (partName || partDesignation || partReference || partClientDesignation || steelGrade || steelFamily || steelStandard) {
          if (!partNode || !matchesPartFilters(partNode, { partName, partDesignation, partReference, partClientDesignation, steelGrade, steelFamily, steelStandard })) {
            return null;
          }
        }

        return {
          id: trial.id,
          name: trial.name,
          description: trial.description,
          path: trial.path,
          created_at: trial.created_at,
          modified_at: trial.modified_at,
          trial: trial.trial,
          client: clientNode ? {
            id: clientNode.id,
            name: clientNode.name,
            ...clientNode.client
          } : null,
          order: orderNode ? {
            id: orderNode.id,
            name: orderNode.name,
            ...orderNode.trialRequest
          } : null,
          part: partNode ? {
            id: partNode.id,
            name: partNode.name,
            designation: partNode.part?.designation,
            reference: partNode.part?.reference,
            steel: partNode.part?.steel_node_id ? {
              grade: partNode.part.steel?.grade,
              family: partNode.part.steel?.family,
              standard: partNode.part.steel?.standard
            } : null
          } : null
        };
      })
    );

    // Filtrer les null (essais qui ne correspondent pas aux filtres)
    const filteredTrials = enrichedTrials.filter(t => t !== null);

    // Réponse
    return res.status(200).json({
      success: true,
      data: filteredTrials,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        totalPages: Math.ceil(count / limit)
      }
    });

  } catch (error) {
    console.error('Erreur lors de la recherche d\'essais:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la recherche d\'essais',
      error: error.message
    });
  }
};

/**
 * Récupère les ancêtres d'un nœud (via la table closure)
 */
async function getAncestors(nodeId) {
  const ancestorIds = await Node.sequelize.query(
    `SELECT ancestor_id FROM closure WHERE descendant_id = :nodeId AND ancestor_id != :nodeId ORDER BY depth DESC`,
    {
      replacements: { nodeId },
      type: Sequelize.QueryTypes.SELECT
    }
  );

  if (ancestorIds.length === 0) return [];

  const ancestors = await Node.findAll({
    where: {
      id: { [Op.in]: ancestorIds.map(a => a.ancestor_id) }
    },
    include: [
      { model: Client, as: 'client', required: false },
      { model: require('../models').trial_request, as: 'trialRequest', required: false }
    ]
  });

  return ancestors;
}

/**
 * Récupère les descendants d'un nœud (via la table closure)
 */
async function getDescendants(nodeId) {
  const descendantIds = await Node.sequelize.query(
    `SELECT descendant_id FROM closure WHERE ancestor_id = :nodeId AND descendant_id != :nodeId ORDER BY depth ASC`,
    {
      replacements: { nodeId },
      type: Sequelize.QueryTypes.SELECT
    }
  );

  if (descendantIds.length === 0) return [];

  const descendants = await Node.findAll({
    where: {
      id: { [Op.in]: descendantIds.map(d => d.descendant_id) }
    },
    include: [
      { 
        model: Part, 
        as: 'part', 
        required: false,
        include: [
          {
            model: Steel,
            as: 'steel',
            required: false
          }
        ]
      }
    ]
  });

  return descendants;
}

/**
 * Construit la clause WHERE pour le four
 */
function buildFurnaceWhere(filters) {
  const { furnaceType, furnaceSize, heatingCell, coolingMedia, quenchCell } = filters;
  const where = {};

  if (furnaceType) where.furnace_type = furnaceType;
  if (furnaceSize) where.furnace_size = furnaceSize;
  if (heatingCell) where.heating_cell = heatingCell;
  if (coolingMedia) where.cooling_media = coolingMedia;
  if (quenchCell) where.quench_cell = quenchCell;

  return Object.keys(where).length > 0 ? where : undefined;
}

/**
 * Construit la clause ORDER BY
 */
function buildOrderClause(sortBy, sortOrder) {
  const order = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

  switch (sortBy) {
    case 'trial_date':
      return ['trial', 'trial_date', order];
    case 'trial_code':
      return ['trial', 'trial_code', order];
    case 'name':
      return ['name', order];
    case 'modified_at':
      return ['modified_at', order];
    case 'created_at':
      return ['created_at', order];
    default:
      return ['trial', 'trial_date', order];
  }
}

/**
 * Vérifie si un client correspond aux filtres
 */
function matchesClientFilters(clientNode, filters) {
  const { clientName, clientCode, clientCountry, clientCity, clientGroup } = filters;

  if (clientName && !clientNode.name.toLowerCase().includes(clientName.toLowerCase())) {
    return false;
  }

  if (!clientNode.client) return false;

  if (clientCode && (!clientNode.client.client_code || !clientNode.client.client_code.toLowerCase().includes(clientCode.toLowerCase()))) {
    return false;
  }

  if (clientCountry && (!clientNode.client.country || !clientNode.client.country.toLowerCase().includes(clientCountry.toLowerCase()))) {
    return false;
  }

  if (clientCity && (!clientNode.client.city || !clientNode.client.city.toLowerCase().includes(clientCity.toLowerCase()))) {
    return false;
  }

  if (clientGroup && (!clientNode.client.client_group || !clientNode.client.client_group.toLowerCase().includes(clientGroup.toLowerCase()))) {
    return false;
  }

  return true;
}

/**
 * Vérifie si une pièce correspond aux filtres
 */
function matchesPartFilters(partNode, filters) {
  const { partName, partDesignation, partReference, partClientDesignation, steelGrade, steelFamily, steelStandard } = filters;

  if (partName && !partNode.name.toLowerCase().includes(partName.toLowerCase())) {
    return false;
  }

  if (!partNode.part) return false;

  if (partDesignation && (!partNode.part.designation || !partNode.part.designation.toLowerCase().includes(partDesignation.toLowerCase()))) {
    return false;
  }

  if (partReference && (!partNode.part.reference || !partNode.part.reference.toLowerCase().includes(partReference.toLowerCase()))) {
    return false;
  }

  if (partClientDesignation && (!partNode.part.client_designation || !partNode.part.client_designation.toLowerCase().includes(partClientDesignation.toLowerCase()))) {
    return false;
  }

  // Filtres sur l'acier
  if (steelGrade || steelFamily || steelStandard) {
    if (!partNode.part.steel) return false;

    if (steelGrade && (!partNode.part.steel.grade || !partNode.part.steel.grade.toLowerCase().includes(steelGrade.toLowerCase()))) {
      return false;
    }

    if (steelFamily && (!partNode.part.steel.family || !partNode.part.steel.family.toLowerCase().includes(steelFamily.toLowerCase()))) {
      return false;
    }

    if (steelStandard && (!partNode.part.steel.standard || !partNode.part.steel.standard.toLowerCase().includes(steelStandard.toLowerCase()))) {
      return false;
    }
  }

  return true;
}

/**
 * Récupère toutes les valeurs de référence pour les filtres
 */
exports.getFilterOptions = async (req, res) => {
  try {
    const [
      statuses,
      locations,
      mountingTypes,
      positionTypes,
      processTypes,
      designations,
      furnaceTypes,
      coolingMedias,
      steelFamilies,
      steelStandards,
      clients
    ] = await Promise.all([
      RefStatus.findAll({ attributes: ['name'], order: [['name', 'ASC']] }),
      RefLocation.findAll({ attributes: ['name'], order: [['name', 'ASC']] }),
      RefMountingType.findAll({ attributes: ['name'], order: [['name', 'ASC']] }),
      RefPositionType.findAll({ attributes: ['name'], order: [['name', 'ASC']] }),
      RefProcessType.findAll({ attributes: ['name'], order: [['name', 'ASC']] }),
      RefDesignation.findAll({ attributes: ['name'], order: [['name', 'ASC']] }),
      RefFurnaceTypes.findAll({ attributes: ['name'], order: [['name', 'ASC']] }),
      RefCoolingMedia.findAll({ attributes: ['name'], order: [['name', 'ASC']] }),
      RefSteelFamily.findAll({ attributes: ['name'], order: [['name', 'ASC']] }),
      RefSteelStandard.findAll({ attributes: ['name'], order: [['name', 'ASC']] }),
      // Récupérer tous les clients avec leurs informations
      Node.findAll({
        where: { type: 'client' },
        attributes: ['id', 'name'],
        include: [{
          model: Client,
          as: 'client',
          required: true,
          attributes: ['client_code', 'city', 'country', 'client_group']
        }],
        order: [['name', 'ASC']]
      })
    ]);

    // Extraire les valeurs uniques pour les filtres clients
    // Nom du client vient de la colonne name de la table nodes
    const clientNames = [...new Set(clients.map(c => c.name).filter(Boolean))].sort();
    
    // Code client vient de la colonne client_code de la table clients
    const clientCodes = [...new Set(clients.map(c => c.client?.client_code).filter(Boolean))].sort();
    
    // Pays vient de la colonne country de la table clients (clé étrangère vers ref_country)
    const clientCountries = [...new Set(clients.map(c => c.client?.country).filter(Boolean))].sort();
    
    // Ville vient de la colonne city de la table clients
    const clientCities = [...new Set(clients.map(c => c.client?.city).filter(Boolean))].sort();
    
    // Groupe vient de la colonne client_group de la table clients
    const clientGroups = [...new Set(clients.map(c => c.client?.client_group).filter(Boolean))].sort();

    return res.status(200).json({
      success: true,
      data: {
        statuses: statuses.map(s => s.name),
        locations: locations.map(l => l.name),
        mountingTypes: mountingTypes.map(m => m.name),
        positionTypes: positionTypes.map(p => p.name),
        processTypes: processTypes.map(p => p.name),
        designations: designations.map(d => d.name),
        furnaceTypes: furnaceTypes.map(f => f.name),
        coolingMedias: coolingMedias.map(c => c.name),
        steelFamilies: steelFamilies.map(s => s.name),
        steelStandards: steelStandards.map(s => s.name),
        // Nouvelles options pour les filtres clients
        clientNames: clientNames,
        clientCodes: clientCodes,
        clientCountries: clientCountries,
        clientCities: clientCities,
        clientGroups: clientGroups
      }
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des options de filtres:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des options de filtres',
      error: error.message
    });
  }
};

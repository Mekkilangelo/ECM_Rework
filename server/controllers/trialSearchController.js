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
      clientNames, // NOUVEAU: support multi-sélection
      clientCountry,
      clientCity,
      clientGroup,
      
      // Filtres sur la pièce (via la hiérarchie des nodes)
      partDesignation,
      partReference,
      partClientDesignation,
      
      // Filtres sur l'acier (via la pièce)
      steelGrade,
      steelGrades, // NOUVEAU: support multi-sélection
      steelFamily,
      steelStandard,
      includeEquivalents, // NOUVEAU: inclure les équivalents
      
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
        { '$trial.load_number$': { [Op.like]: `%${query}%` } }
      ];
    }

    // Recherche dans la hiérarchie pour trouver le client et les pièces
    // On construit une requête SQL avec jointures via la table closure
    const offset = (page - 1) * limit;

    // Construction de la requête SQL pour filtrer par client/pièce via closure
    let sqlWhere = 'nodes.type = :nodeType';
    const sqlReplacements = { nodeType: 'trial' };

    // Construire les sous-requêtes pour les filtres hiérarchiques
    // Support des filtres multiples pour clientNames (OR inclusif)
    const clientNamesArray = Array.isArray(clientNames) ? clientNames : (clientNames ? [clientNames] : (clientName ? [clientName] : []));
    
    if (clientNamesArray.length > 0 || clientCountry || clientCity || clientGroup) {
      const clientConditions = [];
      
      if (clientNamesArray.length > 0) {
        const nameConditions = clientNamesArray.map((name, idx) => {
          const paramName = `clientName${idx}`;
          sqlReplacements[paramName] = `%${name}%`;
          return `client_nodes.name LIKE :${paramName}`;
        });
        clientConditions.push(`(${nameConditions.join(' OR ')})`);
      }
      if (clientCountry) {
        clientConditions.push('clients.country LIKE :clientCountry');
        sqlReplacements.clientCountry = `%${clientCountry}%`;
      }
      if (clientCity) {
        clientConditions.push('clients.city LIKE :clientCity');
        sqlReplacements.clientCity = `%${clientCity}%`;
      }
      if (clientGroup) {
        clientConditions.push('clients.client_group LIKE :clientGroup');
        sqlReplacements.clientGroup = `%${clientGroup}%`;
      }

      if (clientConditions.length > 0) {
        sqlWhere += ` AND EXISTS (
          SELECT 1 FROM closure c1
          JOIN nodes client_nodes ON c1.ancestor_id = client_nodes.id AND client_nodes.type = 'client'
          JOIN clients ON client_nodes.id = clients.node_id
          WHERE c1.descendant_id = nodes.id AND (${clientConditions.join(' AND ')})
        )`;
      }
    }

    // Filtres sur les pièces via la hiérarchie
    // Support des filtres multiples pour steelGrades (OR inclusif) + équivalences
    const steelGradesArray = Array.isArray(steelGrades) ? steelGrades : (steelGrades ? [steelGrades] : (steelGrade ? [steelGrade] : []));
    const useEquivalents = includeEquivalents === 'true' || includeEquivalents === true;
    
    if (partDesignation || partReference || partClientDesignation || steelGradesArray.length > 0 || steelFamily || steelStandard) {
      const partConditions = [];
      
      if (partDesignation) {
        partConditions.push('parts.designation LIKE :partDesignation');
        sqlReplacements.partDesignation = `%${partDesignation}%`;
      }
      if (partReference) {
        partConditions.push('parts.reference LIKE :partReference');
        sqlReplacements.partReference = `%${partReference}%`;
      }
      if (partClientDesignation) {
        partConditions.push('parts.client_designation LIKE :partClientDesignation');
        sqlReplacements.partClientDesignation = `%${partClientDesignation}%`;
      }

      // Filtres sur l'acier avec gestion des équivalences
      const steelJoin = (steelGradesArray.length > 0 || steelFamily || steelStandard) ? `
        JOIN nodes steel_nodes ON parts.steel_node_id = steel_nodes.id
        JOIN steels ON steel_nodes.id = steels.node_id
      ` : '';

      if (steelGradesArray.length > 0) {
        if (useEquivalents) {
          // Recherche avec équivalents : utiliser LIKE pour chaque grade
          const gradeConditions = steelGradesArray.map((grade, idx) => {
            const paramName = `steelGrade${idx}`;
            sqlReplacements[paramName] = `%${grade}%`;
            return `steels.grade LIKE :${paramName}`;
          });
          
          const gradeEquivConditions = steelGradesArray.map((grade, idx) => {
            const paramName = `steelGrade${idx}`;
            return `base_steel.grade LIKE :${paramName}`;
          });
          
          const gradeEquivConditions2 = steelGradesArray.map((grade, idx) => {
            const paramName = `steelGrade${idx}`;
            return `equiv_steel.grade LIKE :${paramName}`;
          });
          
          partConditions.push(`(
            (${gradeConditions.join(' OR ')})
            OR EXISTS (
              SELECT 1 FROM steel_equivalents se
              JOIN steels base_steel ON se.steel_node_id = base_steel.node_id
              WHERE se.equivalent_steel_node_id = steels.node_id
              AND (${gradeEquivConditions.join(' OR ')})
            )
            OR EXISTS (
              SELECT 1 FROM steel_equivalents se
              JOIN steels equiv_steel ON se.equivalent_steel_node_id = equiv_steel.node_id
              WHERE se.steel_node_id = steels.node_id
              AND (${gradeEquivConditions2.join(' OR ')})
            )
          )`);
        } else {
          // Recherche simple sans équivalents (OR inclusif)
          const gradeConditions = steelGradesArray.map((grade, idx) => {
            const paramName = `steelGrade${idx}`;
            sqlReplacements[paramName] = `%${grade}%`;
            return `steels.grade LIKE :${paramName}`;
          });
          partConditions.push(`(${gradeConditions.join(' OR ')})`);
        }
      }
      
      if (steelFamily) {
        partConditions.push('steels.family LIKE :steelFamily');
        sqlReplacements.steelFamily = `%${steelFamily}%`;
      }
      if (steelStandard) {
        partConditions.push('steels.standard LIKE :steelStandard');
        sqlReplacements.steelStandard = `%${steelStandard}%`;
      }

      if (partConditions.length > 0) {
        sqlWhere += ` AND EXISTS (
          SELECT 1 FROM closure c2
          JOIN nodes part_nodes ON c2.ancestor_id = part_nodes.id AND part_nodes.type = 'part'
          JOIN parts ON part_nodes.id = parts.node_id
          ${steelJoin}
          WHERE c2.descendant_id = nodes.id AND (${partConditions.join(' AND ')})
        )`;
      }
    }

    // Ajouter les conditions de recherche textuelle
    if (query) {
      // Construire les conditions pour la recherche sur les nuances d'acier
      const querySteelConditions = useEquivalents 
        ? `(
            steels.grade LIKE :query
            OR EXISTS (
              SELECT 1 FROM steel_equivalents se
              JOIN steels base_steel ON se.steel_node_id = base_steel.node_id
              WHERE se.equivalent_steel_node_id = steels.node_id
              AND base_steel.grade LIKE :query
            )
            OR EXISTS (
              SELECT 1 FROM steel_equivalents se
              JOIN steels equiv_steel ON se.equivalent_steel_node_id = equiv_steel.node_id
              WHERE se.steel_node_id = steels.node_id
              AND equiv_steel.grade LIKE :query
            )
          )`
        : 'steels.grade LIKE :query';
      
      sqlWhere += ` AND (
        trials.load_number LIKE :query OR
        EXISTS (
          SELECT 1 FROM closure c
          JOIN nodes client_nodes ON c.ancestor_id = client_nodes.id AND client_nodes.type = 'client'
          WHERE c.descendant_id = nodes.id AND client_nodes.name LIKE :query
        ) OR
        recipes.recipe_number LIKE :query OR
        EXISTS (
          SELECT 1 FROM closure c2
          JOIN nodes part_nodes ON c2.ancestor_id = part_nodes.id AND part_nodes.type = 'part'
          JOIN parts ON part_nodes.id = parts.node_id
          JOIN nodes steel_nodes ON parts.steel_node_id = steel_nodes.id
          JOIN steels ON steel_nodes.id = steels.node_id
          WHERE c2.descendant_id = nodes.id AND ${querySteelConditions}
        )
      )`;
      sqlReplacements.query = `%${query}%`;
    }

    // Ajouter les conditions sur les trials
    Object.keys(trialWhere).forEach((key, index) => {
      const paramName = `trial_${key}`;
      const value = trialWhere[key];
      
      if (value && typeof value === 'object' && value[Op.like]) {
        sqlWhere += ` AND trials.${key} LIKE :${paramName}`;
        sqlReplacements[paramName] = value[Op.like];
      } else if (value && typeof value === 'object' && (value[Op.gte] || value[Op.lte])) {
        if (value[Op.gte]) {
          sqlWhere += ` AND trials.${key} >= :${paramName}_gte`;
          sqlReplacements[`${paramName}_gte`] = value[Op.gte];
        }
        if (value[Op.lte]) {
          sqlWhere += ` AND trials.${key} <= :${paramName}_lte`;
          sqlReplacements[`${paramName}_lte`] = value[Op.lte];
        }
      } else if (value !== undefined) {
        sqlWhere += ` AND trials.${key} = :${paramName}`;
        sqlReplacements[paramName] = value;
      }
    });

    // Ajouter les conditions sur les recettes
    if (recipeNumber) {
      sqlWhere += ` AND recipes.recipe_number LIKE :recipeNumber`;
      sqlReplacements.recipeNumber = `%${recipeNumber}%`;
    }

    // Ajouter les conditions sur les fours
    const furnaceWhere = buildFurnaceWhere({ furnaceType, furnaceSize, heatingCell, coolingMedia, quenchCell });
    if (furnaceWhere) {
      Object.keys(furnaceWhere).forEach(key => {
        sqlWhere += ` AND furnaces.${key} = :furnace_${key}`;
        sqlReplacements[`furnace_${key}`] = furnaceWhere[key];
      });
    }

    // Requête pour compter le total
    const countQuery = `
      SELECT COUNT(DISTINCT nodes.id) as total
      FROM nodes
      INNER JOIN trials ON nodes.id = trials.node_id
      LEFT JOIN recipes ON trials.recipe_id = recipes.recipe_id
      LEFT JOIN furnaces ON trials.furnace_id = furnaces.furnace_id
      WHERE ${sqlWhere}
    `;

    const [countResult] = await Node.sequelize.query(countQuery, {
      replacements: sqlReplacements,
      type: Sequelize.QueryTypes.SELECT
    });

    const total = parseInt(countResult.total) || 0;

    // Si aucun résultat, retourner directement
    if (total === 0) {
      return res.status(200).json({
        success: true,
        data: [],
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: 0,
          totalPages: 0
        }
      });
    }

    // Requête principale avec pagination
    const orderClause = buildOrderSQLClause(sortBy, sortOrder);
    const orderColumn = getOrderColumn(sortBy);
    const dataQuery = `
      SELECT DISTINCT nodes.id, ${orderColumn} as sort_column
      FROM nodes
      INNER JOIN trials ON nodes.id = trials.node_id
      LEFT JOIN recipes ON trials.recipe_id = recipes.recipe_id
      LEFT JOIN furnaces ON trials.furnace_id = furnaces.furnace_id
      WHERE ${sqlWhere}
      ORDER BY ${orderClause}
      LIMIT :limit OFFSET :offset
    `;

    sqlReplacements.limit = parseInt(limit);
    sqlReplacements.offset = parseInt(offset);

    const trialIds = await Node.sequelize.query(dataQuery, {
      replacements: sqlReplacements,
      type: Sequelize.QueryTypes.SELECT
    });

    // Récupérer les informations complètes des essais
    const trials = await Node.findAll({
      where: {
        id: { [Op.in]: trialIds.map(t => t.id) }
      },
      attributes: ['id', 'name', 'description', 'path', 'parent_id', 'created_at', 'modified_at'],
      include: [
        {
          model: Trial,
          as: 'trial',
          required: true,
          include: [
            {
              model: Recipe,
              as: 'recipe',
              required: false
            },
            {
              model: Furnace,
              as: 'furnace',
              required: false
            }
          ]
        }
      ],
      order: [[buildOrderClause(sortBy, sortOrder)]]
    });

    // Pour chaque trial, récupérer les informations enrichies
    const enrichedTrials = await Promise.all(
      trials.map(async (trial) => {
        // Récupérer le parent direct (la part)
        const partNode = await Node.findOne({
          where: { id: trial.parent_id },
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

        // Récupérer les ancêtres de la part pour avoir le client et l'order
        const ancestors = partNode ? await getAncestors(partNode.id) : [];
        
        const clientNode = ancestors.find(a => a.type === 'client');
        const orderNode = ancestors.find(a => a.type === 'trial_request');

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

    // Réponse
    return res.status(200).json({
      success: true,
      data: enrichedTrials,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: total,
        totalPages: Math.ceil(total / limit)
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
      { model: require('../models').trial_request, as: 'trialRequest', required: false },
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
 * Récupère la colonne pour le tri SQL
 */
function getOrderColumn(sortBy) {
  switch (sortBy) {
    case 'trial_date':
      return 'trials.trial_date';
    case 'trial_code':
      return 'trials.trial_code';
    case 'name':
      return 'nodes.name';
    case 'modified_at':
      return 'nodes.modified_at';
    case 'created_at':
      return 'nodes.created_at';
    default:
      return 'trials.trial_date';
  }
}

/**
 * Construit la clause ORDER BY pour SQL brut
 */
function buildOrderSQLClause(sortBy, sortOrder) {
  const order = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

  switch (sortBy) {
    case 'trial_date':
      return `trials.trial_date ${order}`;
    case 'trial_code':
      return `trials.trial_code ${order}`;
    case 'name':
      return `nodes.name ${order}`;
    case 'modified_at':
      return `nodes.modified_at ${order}`;
    case 'created_at':
      return `nodes.created_at ${order}`;
    default:
      return `trials.trial_date ${order}`;
  }
}

/**
 * Construit la clause ORDER BY pour Sequelize
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
      clients,
      loadNumbers,
      steelGrades,
      recipeNumbers
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
      }),
      // Récupérer tous les load numbers distincts
      Trial.findAll({
        attributes: [[Sequelize.fn('DISTINCT', Sequelize.col('load_number')), 'load_number']],
        where: {
          load_number: { [Op.ne]: null }
        },
        order: [['load_number', 'ASC']],
        raw: true
      }),
      // Récupérer tous les steel grades distincts
      Steel.findAll({
        attributes: [[Sequelize.fn('DISTINCT', Sequelize.col('grade')), 'grade']],
        where: {
          grade: { [Op.ne]: null }
        },
        order: [['grade', 'ASC']],
        raw: true
      }),
      // Récupérer tous les recipe numbers distincts
      Recipe.findAll({
        attributes: [[Sequelize.fn('DISTINCT', Sequelize.col('recipe_number')), 'recipe_number']],
        where: {
          recipe_number: { [Op.ne]: null }
        },
        order: [['recipe_number', 'ASC']],
        raw: true
      })
    ]);

    // Extraire les valeurs uniques pour les filtres clients
    // Nom du client vient de la colonne name de la table nodes
    const clientNames = [...new Set(clients.map(c => c.name).filter(Boolean))].sort();
    
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
        // Options pour les filtres clients
        clientNames: clientNames,
        clientCountries: clientCountries,
        clientCities: clientCities,
        clientGroups: clientGroups,
        // Nouvelles options pour les selects
        loadNumbers: loadNumbers.map(l => l.load_number).filter(Boolean),
        steelGrades: steelGrades.map(s => s.grade).filter(Boolean),
        recipeNumbers: recipeNumbers.map(r => r.recipe_number).filter(Boolean)
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

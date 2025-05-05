// server/controllers/testController.js
const { Node, Test, Part, Client, Closure } = require('../models');
const { sequelize } = require('../models');
const { Op } = require('sequelize');

/**
 * Génère un nom séquentiel pour un nouveau test basé sur les tests existants avec le même parent
 * @param {string} parentId - ID du nœud parent
 * @returns {Promise<string>} - Nom généré (TRIAL_X)
 */
async function generateSequentialTestName(parentId) {
  try {
    // Récupérer tous les tests qui ont le même parent
    const testsWithSameParent = await Node.findAll({
      where: {
        parent_id: parentId,
        type: 'test'
      }
    });
    
    // S'il n'y a pas de tests existants, commencer à 1
    if (testsWithSameParent.length === 0) {
      return 'TRIAL_1';
    }
    
    // Extraire les numéros des noms existants
    const existingNumbers = testsWithSameParent
      .map(node => {
        const match = node.name.match(/TRIAL_(\d+)/);
        return match ? parseInt(match[1], 10) : 0;
      })
      .filter(num => !isNaN(num));
    
    // Trouver le plus grand nombre
    const maxNumber = existingNumbers.length > 0 ? Math.max(...existingNumbers) : 0;
    
    // Créer le nouveau nom avec le numéro suivant
    return `TRIAL_${maxNumber + 1}`;
  } catch (error) {
    console.error('Erreur lors de la génération du nom de test:', error);
    throw error;
  }
}

/**
 * Récupérer tous les tests avec pagination
 */
exports.getTests = async (req, res) => {
  try {
    const { limit = 10, offset = 0, parent_id } = req.query;
    
    const whereCondition = { type: 'test' };

    // Si un part_id est fourni, rechercher les tests associés à cette pièce
    if (parent_id) {
      const partsDescendants = await Closure.findAll({
        where: { ancestor_id: parent_id },
        attributes: ['descendant_id']
      });
      
      const descendantIds = partsDescendants.map(d => d.descendant_id);
      
      whereCondition.id = {
        [Op.in]: descendantIds
      };
    }
    
    const tests = await Node.findAll({
      where: whereCondition,
      include: [{
        model: Test,
        attributes: { exclude: ['node_id'] }
      }],
      order: [['modified_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
    
    const total = await Node.count({
      where: whereCondition
    });
    
    return res.status(200).json({
      tests,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des tests:', error);
    return res.status(500).json({ message: 'Erreur lors de la récupération des tests', error: error.message });
  }
};

/**
 * Récupérer un test spécifique
 */
exports.getTestById = async (req, res) => {
  try {
    const { testId } = req.params;
    
    const test = await Node.findOne({
      where: { id: testId, type: 'test' },
      include: [{
        model: Test,
        attributes: { exclude: ['node_id'] }
      }]
    });
    
    if (!test) {
      return res.status(404).json({ message: 'Test non trouvé' });
    }
    
    return res.status(200).json(test);
  } catch (error) {
    console.error('Erreur lors de la récupération du test:', error);
    return res.status(500).json({ message: 'Erreur lors de la récupération du test', error: error.message });
  }
};

/**
 * Créer un nouveau test
 */
exports.createTest = async (req, res) => {
  try {
    const { 
      load_number,
      test_date, 
      status,
      location,
      is_mesured,
      furnace_data,
      load_data,
      recipe_data,
      quench_data,
      mounting_type,
      position_type,
      process_type,
      parent_id,
      description 
    } = req.body;
    
    // Validation des données
    if (!parent_id) {
      return res.status(400).json({ message: 'ID parent requis' });
    }
    
    // Vérifier si le parent existe
    const parentNode = await Node.findByPk(parent_id);
    if (!parentNode) {
      return res.status(404).json({ message: 'Nœud parent non trouvé' });
    }
    
    // Générer un nom séquentiel basé sur les tests existants avec le même parent
    const name = await generateSequentialTestName(parent_id);
    
    // Créer le test dans une transaction
    const result = await sequelize.transaction(async (t) => {
      // Créer le nœud
      const newNode = await Node.create({
        name,
        path: `${parentNode.path}/${name}`,
        type: 'test',
        parent_id,
        created_at: new Date(),
        modified_at: new Date(),
        data_status: 'new',
        description
      }, { transaction: t });
      
      // Générer le numéro de commande basé sur l'ID du nœud
      const test_code = `TRIAL_${newNode.id}`;

      // Créer les données du test
      await Test.create({
        node_id: newNode.id,
        test_code,
        test_date: test_date || null,
        load_number: load_number || null,
        status: status || 'planned',
        location,
        is_mesured,
        furnace_data,
        load_data,
        recipe_data,
        quench_data,
        mounting_type,
        position_type,
        process_type
      }, { transaction: t });
      
      // Créer l'entrée de fermeture (auto-relation)
      await Closure.create({
        ancestor_id: newNode.id,
        descendant_id: newNode.id,
        depth: 0
      }, { transaction: t });
      
      // Créer des relations closure avec tous les ancêtres du parent
      const parentClosures = await Closure.findAll({
        where: { descendant_id: parent_id },
        transaction: t
      });
      
      for (const parentClosure of parentClosures) {
        await Closure.create({
          ancestor_id: parentClosure.ancestor_id,
          descendant_id: newNode.id,
          depth: parentClosure.depth + 1
        }, { transaction: t });
      }
      
      return newNode;
    });
    
    // Récupérer le test complet avec ses données associées
    const newTest = await Node.findByPk(result.id, {
      include: [{
        model: Test,
        attributes: { exclude: ['node_id'] }
      }]
    });
    
    return res.status(201).json(newTest);
  } catch (error) {
    console.error('Erreur lors de la création du test:', error);
    return res.status(500).json({ message: 'Erreur lors de la création du test', error: error.message });
  }
};

/**
 * Mettre à jour un test existant
 */
exports.updateTest = async (req, res) => {
  try {
    const { testId } = req.params;
    const { 
      test_code, 
      test_date,
      load_number, 
      status,
      location,
      is_mesured,
      furnace_data,
      load_data,
      recipe_data,
      quench_data,
      results_data,
      mounting_type,
      position_type,
      process_type,
      description 
    } = req.body;
    
    const node = await Node.findOne({
      where: { id: testId, type: 'test' },
      include: [{
        model: Test
      }]
    });
    
    if (!node) {
      return res.status(404).json({ message: 'Test non trouvé' });
    }
    
    // Si le code de test change, vérifier s'il est déjà utilisé
    if (test_code && test_code !== node.Test.test_code) {
      const existingTest = await Test.findOne({
        where: { test_code }
      });
      
      if (existingTest) {
        return res.status(409).json({ message: 'Ce code de test existe déjà' });
      }
    }
    
    await sequelize.transaction(async (t) => {
      // Mettre à jour uniquement la description et la date de modification du nœud
      // Le nom reste inchangé après la création
      await node.update({
        modified_at: new Date(),
        description: description !== undefined ? description : node.description
      }, { transaction: t });
      
      // Mettre à jour les données du test
      const testData = {};
      if (test_code) testData.test_code = test_code;
      testData.test_date = test_date;
      if (load_number) testData.load_number = load_number;
      if (status) testData.status = status;
      if (location !== undefined) testData.location = location;
      if (is_mesured !== undefined) testData.is_mesured = is_mesured;
      if (furnace_data) testData.furnace_data = furnace_data;
      if (load_data) testData.load_data = load_data;
      if (recipe_data) testData.recipe_data = recipe_data;
      if (quench_data) testData.quench_data = quench_data;
      if (results_data) testData.results_data = results_data;
      if (mounting_type) testData.mounting_type = mounting_type;
      if (position_type) testData.position_type = position_type;
      if (process_type) testData.process_type = process_type;
      
      if (Object.keys(testData).length > 0) {
        await Test.update(testData, {
          where: { node_id: testId },
          transaction: t
        });
      }
    });
    
    // Récupérer et renvoyer le test mis à jour
    const updatedTest = await Node.findByPk(testId, {
      include: [{
        model: Test,
        attributes: { exclude: ['node_id'] }
      }]
    });
    
    return res.status(200).json(updatedTest);
  } catch (error) {
    console.error('Erreur lors de la mise à jour du test:', error);
    return res.status(500).json({ message: 'Erreur lors de la mise à jour du test', error: error.message });
  }
};

/**
 * Supprimer un test
 */
exports.deleteTest = async (req, res) => {
  // Créer une transaction pour assurer l'intégrité des données
  const t = await sequelize.transaction();
  
  try {
    const { testId } = req.params;
    
    // 1. Vérifier que le test existe
    const test = await Node.findOne({
      where: { id: testId, type: 'test' },
      transaction: t
    });
    
    if (!test) {
      await t.rollback();
      return res.status(404).json({ message: 'Test non trouvé' });
    }
    
    // 2. Trouver tous les descendants dans la table closure
    const closureEntries = await Closure.findAll({
      where: { ancestor_id: testId },
      transaction: t
    });
    
    // Récupérer tous les IDs des descendants (y compris le nœud lui-même)
    const descendantIds = new Set(closureEntries.map(entry => entry.descendant_id));
    descendantIds.add(parseInt(testId)); // Ajouter l'ID du test lui-même
    
    // 3. Supprimer toutes les entrées de fermeture associées aux descendants
    // Supprimer d'abord où ils sont descendants ou ancêtres
    await Closure.destroy({
      where: {
        [Op.or]: [
          { descendant_id: { [Op.in]: Array.from(descendantIds) } },
          { ancestor_id: { [Op.in]: Array.from(descendantIds) } }
        ]
      },
      transaction: t
    });
    
    // 4. Maintenant, supprimer tous les nœuds descendants
    await Node.destroy({
      where: {
        id: { [Op.in]: Array.from(descendantIds) }
      },
      transaction: t
    });
    
    // 5. Valider toutes les modifications
    await t.commit();
    
    return res.status(200).json({ 
      message: 'Test supprimé avec succès',
      deletedId: testId
    });
    
  } catch (error) {
    // En cas d'erreur, annuler toutes les modifications
    await t.rollback();
    console.error('Erreur lors de la suppression du test:', error);
    
    return res.status(500).json({ 
      message: 'Erreur lors de la suppression du test', 
      error: error.message 
    });
  }
};


// Compléter la fonction getTestReportData
exports.getTestReportData = async (req, res) => {
  const { testId } = req.params;
  const { sections } = req.query;
  
  try {
    // Valider les paramètres
    if (!testId) {
      return res.status(400).json({ error: 'ID de test requis' });
    }
    
    // Analyser les sections demandées
    let selectedSections;
    try {
      selectedSections = typeof sections === 'string' ? JSON.parse(sections) : sections;
    } catch (parseError) {
      console.error("Erreur lors de l'analyse des sections:", parseError);
      return res.status(400).json({ error: 'Format de sections invalide' });
    }

    // Récupérer les informations du test
    const { Node, Test, Part, Client } = require('../models');
    const { Op } = require('sequelize');
    
    const test = await Test.findOne({
      where: {
        node_id: testId
      },
      include: [{
        model: Node,
        required: true
      }]
    });
    
    if (!test) {
      return res.status(404).json({ error: 'Test non trouvé' });
    }
    
    // Récupérer les ancêtres du nœud de test
    const closure = await require('../models').Closure.findAll({
      where: {
        descendant_id: testId
      }
    });
    
    const ancestorIds = closure.map(c => c.ancestor_id);
    console.log(`Executing (default): SELECT \`ancestor_id\`, \`descendant_id\`, \`depth\` FROM \`closure\` AS \`Closure\` WHERE \`Closure\`.\`descendant_id\` = ${testId};`);
    console.log("Ancestor IDs:", ancestorIds);
    
    // Structure de données pour le rapport
    const reportData = {
      test: {
        id: test.node_id,
        testCode: test.test_code,
        loadNumber: test.load_number,
        testDate: test.test_date,
        status: test.status,
        location: test.location,
        furnaceData: test.furnace_data,
        loadData: test.load_data,
        recipeData: test.recipe_data,
        quenchData: test.quench_data,
        resultsData: test.results_data,
        mountingType: test.mounting_type,
        positionType: test.position_type,
        processType: test.process_type,
        preoxMedia: test.preox_media,
        name: test.Node.name,
      },
      part: null,
      client: null
    };
    
    // IDENTIFICATION: récupérer les infos de la pièce et du client
    let partNode = null;
    let partNodeId = null;  // Déclaration explicite de partNodeId

    if (selectedSections.identification) {
      console.log("Retrieving identification data");
      
      // Trouver le nœud parent de type "part"
      partNode = await Node.findOne({
        where: { 
          id: { [Op.in]: ancestorIds },
          type: 'part' 
        },
        include: [{ model: Part }]
      });
      
      if (partNode) {
        partNodeId = partNode.id;  // Assigner la valeur à partNodeId
        console.log("Part node found:", partNodeId);
        
        // Extraire les dimensions si disponibles
        let dimensions = null;
        try {
          dimensions = partNode.Part.dimensions && typeof partNode.Part.dimensions === 'string' 
            ? JSON.parse(partNode.Part.dimensions) 
            : partNode.Part.dimensions;
        } catch (error) {
          console.error("Error parsing dimensions:", error);
          dimensions = null;
        }
        
        // Récupérer les photos associées à la pièce
        let partPhotos = [];
        
        // Récupérer les spécifications de la pièce
        let specifications = null;
        try {
          specifications = partNode.Part.specifications && typeof partNode.Part.specifications === 'string' 
            ? JSON.parse(partNode.Part.specifications) 
            : partNode.Part.specifications;
        } catch (error) {
          console.error("Error parsing specifications:", error);
          specifications = null;
        }
        
        // Construire l'objet part pour le rapport
        reportData.part = {
          id: partNode.id,
          designation: partNode.Part.designation,
          clientDesignation: partNode.Part.client_designation || '',
          reference: partNode.Part.reference || '',
          steel: partNode.Part.steel,
          quantity: partNode.Part.quantity || '',
          specifications: specifications,
          dimensions: dimensions,
          weight: dimensions?.weight || '',
          comments: dimensions?.comments || '',
          photos: [] // Sera rempli plus tard
        };
      }
      
      // Trouver le nœud client
      const clientNode = await Node.findOne({
        where: { 
          id: { [Op.in]: ancestorIds },
          type: 'client' 
        },
        include: [{ model: Client }]
      });
      
      if (clientNode) {
        reportData.client = {
          name: clientNode.name,
          code: clientNode.Client.client_code,
          city: clientNode.Client.city,
          country: clientNode.Client.country,
          address: clientNode.Client.address
        };
      }
    }
    
    // Récupérer les photos associées à la pièce, si on a l'ID
    if (partNodeId) {
      try {
        console.log("Searching photos for part:", partNodeId);
        
        // Rechercher les nœuds de type 'file' associés à la pièce
        const photoNodes = await Node.findAll({
          where: {
            parent_id: partNodeId,
            type: 'file'
          },
          include: [{
            model: require('../models').File,
            where: {
              category: 'photos'
            },
            required: true
          }]
        });
        
        if (photoNodes && photoNodes.length > 0) {
          const partPhotos = photoNodes.map(node => {
            return {
              id: node.id,
              name: node.name || node.File.original_name,
              path: node.path,
              viewPath: `/api/files/${node.id}`,
              downloadPath: `/api/files/download/${node.id}`,
              subcategory: node.File.subcategory || 'other',
              description: node.description || `File uploaded as photos/${node.File.subcategory || 'other'}`,
              category: node.File.category,
              mimeType: node.File.mime_type,
              size: node.File.size,
              createdAt: node.created_at
            };
          });
          
          console.log(`Found ${partPhotos.length} photos for part`);
          console.log("Processed photos:", partPhotos);
          
          if (reportData.part) {
            reportData.part.photos = partPhotos;
          }
        } else {
          console.log("No photos found for part");
        }
      } catch (photoError) {
        console.error("Error retrieving part photos:", photoError);
      }
    }
    
    // Récupérer les photos associées au test
    try {
      // Rechercher les nœuds de type 'file' associés au test
      const testPhotoNodes = await Node.findAll({
        where: {
          parent_id: testId,
          type: 'file'
        },
        include: [{
          model: require('../models').File,
          required: true
        }]
      });
      
      if (testPhotoNodes && testPhotoNodes.length > 0) {
        const testPhotos = testPhotoNodes.map(node => {
          return {
            id: node.id,
            name: node.name || node.File.original_name,
            path: node.path,
            viewPath: `/api/files/${node.id}`,
            downloadPath: `/api/files/download/${node.id}`,
            subcategory: node.File.subcategory || 'other',
            description: node.description,
            category: node.File.category || 'documentation',
            mimeType: node.File.mime_type,
            size: node.File.size,
            createdAt: node.created_at
          };
        });
        
        console.log(`Found ${testPhotos.length} photos for test`);
        reportData.test.photos = testPhotos;
      } else {
        console.log("No photos found for test");
        reportData.test.photos = [];
      }
    } catch (photoError) {
      console.error("Error retrieving test photos:", photoError);
      reportData.test.photos = [];
    }

    // RECIPE: données de la recette
    if (selectedSections.recipe) {
      console.log("Retrieving recipe data");
      
      // Récupérer les données de recette directement du test
      if (test.recipe_data) {
        try {
          // Si c'est une chaîne JSON, la parser
          reportData.test.recipe_data = typeof test.recipe_data === 'string' 
            ? JSON.parse(test.recipe_data) 
            : test.recipe_data;
          
          console.log("Recipe data retrieved successfully");
        } catch (error) {
          console.error("Error parsing recipe data:", error);
          reportData.test.recipe_data = null;
        }
      }
      
      // Récupérer les données de trempe (quench data)
      if (test.quench_data) {
        try {
          // Si c'est une chaîne JSON, la parser
          reportData.test.quench_data = typeof test.quench_data === 'string' 
            ? JSON.parse(test.quench_data) 
            : test.quench_data;
          
          console.log("Quench data retrieved successfully");
        } catch (error) {
          console.error("Error parsing quench data:", error);
          reportData.test.quench_data = null;
        }
      }
    }

    // CONTROL: données de contrôle et résultats
    if (selectedSections.control && partNodeId) {  // Utiliser partNodeId ici aussi
      console.log("Retrieving control and results data");
      
      // Récupérer les données de résultats du test
      if (test.results_data) {
        try {
          // Si c'est une chaîne JSON, la parser
          const parsedResultsData = typeof test.results_data === 'string' 
            ? JSON.parse(test.results_data) 
            : test.results_data;
          
          reportData.test.results_data = parsedResultsData;
          
          // Extraire les résultats pour faciliter l'accès
          if (parsedResultsData && parsedResultsData.results) {
            reportData.test.results = parsedResultsData.results;
            console.log("Results found:", reportData.test.results.length);
          }
          
          console.log("Results data retrieved successfully");
        } catch (error) {
          console.error("Error parsing results data:", error);
          reportData.test.results_data = null;
        }
      }
      
      // Récupérer les spécifications de la pièce parente pour les résultats
      if (partNode && partNode.Part && partNode.Part.specifications) {
        console.log("Found part specifications:", partNode.Part.specifications);
        
        // Parser les spécifications si elles sont stockées sous forme de chaîne
        let specifications;
        try {
          specifications = typeof partNode.Part.specifications === 'string'
            ? JSON.parse(partNode.Part.specifications)
            : partNode.Part.specifications;
        } catch (err) {
          console.error("Error parsing specifications:", err);
          specifications = partNode.Part.specifications || {};
        }
        
        // S'assurer que reportData.part existe
        if (!reportData.part) {
          reportData.part = {};
        }
        
        // Ajouter les spécifications au rapport
        reportData.part.specifications = specifications;
        console.log("Added specifications to report");
        
        // Créer les points ECD pour le graphique si disponibles
        if (specifications && specifications.ecd) {
          const depthMin = parseFloat(specifications.ecd.depthMin);
          const depthMax = parseFloat(specifications.ecd.depthMax);
          const hardness = parseFloat(specifications.ecd.hardness);
          
          if (!isNaN(depthMin) && !isNaN(depthMax) && !isNaN(hardness)) {
            reportData.part.ecdPoints = [
              { distance: depthMin, value: hardness },
              { distance: depthMax, value: hardness }
            ];
            console.log("Created ECD points for graph:", reportData.part.ecdPoints);
          }
        }
      }
    }

    // Autres sections de rapport selon les besoins...

    // Envoyer les données complètes du rapport
    return res.json(reportData);
    
  } catch (error) {
    console.error("Error fetching report data:", error);
    return res.status(500).json({ error: 'Erreur lors de la récupération des données du rapport' });
  }
};

/**
 * Récupère les spécifications associées à un test
 * @route GET /tests/:testId/specs
 * @access Public
 */
exports.getTestSpecs = async (req, res) => {
  try {
    const { testId } = req.params;
    const { parentId } = req.query;

    // Vérifier si le test existe
    const test = await Test.findOne({
      where: { node_id: testId },
      include: [{ model: Node }]
    });

    if (!test) {
      return res.status(404).json({ message: 'Test non trouvé' });
    }

    // Si parentId est fourni, utiliser directement ce ID
    const partNodeId = parentId ? parentId : null;

    if (!partNodeId) {
      return res.status(400).json({ message: 'ID de la pièce parente requis' });
    }

    // Récupérer la pièce et ses spécifications
    const part = await Part.findOne({
      where: { node_id: partNodeId },
      include: [{ model: Node }]
    });

    if (!part) {
      return res.status(404).json({ message: 'Pièce parente non trouvée' });
    }

    // Renvoyer les spécifications de la pièce
    const specifications = part.specifications;
    const response = { specifications };

    // Traiter les spécifications ECD pour le graphique
    if (specifications && specifications.ecd) {
      const ecd = specifications.ecd;
      
      if (ecd.depthMin && ecd.depthMax && ecd.hardness) {
        // S'assurer que les valeurs sont traitées comme des nombres
        const depthMin = parseFloat(ecd.depthMin);
        const depthMax = parseFloat(ecd.depthMax);
        const hardnessValue = parseFloat(ecd.hardness);
        
        // Points pour tracer la droite horizontale dans la plage spécifiée
        response.ecdPoints = [
          { distance: depthMin, value: hardnessValue },
          { distance: depthMax, value: hardnessValue }
        ];
      }
    }

    res.json(response);
  } catch (error) {
    console.error('Erreur lors de la récupération des spécifications:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};
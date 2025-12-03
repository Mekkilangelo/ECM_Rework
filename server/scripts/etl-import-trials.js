/**
 * Script ETL pour charger les données depuis un fichier CSV
 * Compatible avec la nouvelle architecture hiérarchique (nodes + closure table)
 * 
 * Hiérarchie: Client → Trial Request → Part → Trial
 * 
 * Utilise les services existants pour garantir la cohérence des données
 */

const fs = require('fs');
const csv = require('csv-parser');
const path = require('path');

// Services
const clientService = require('../services/clientService');
const trialRequestService = require('../services/trialRequestService');
const partService = require('../services/partService');
const trialService = require('../services/trialService');
const steelService = require('../services/steelService');
const referenceService = require('../services/referenceService');

// Models pour les requêtes directes si nécessaire
const { node, sequelize } = require('../models');

class ETLLoader {
  constructor() {
    // Maps pour stocker les IDs créés et éviter les doublons
    this.clientsMap = new Map(); // client_name -> node_id
    this.trialRequestsMap = new Map(); // client_name -> node_id de la trial_request
    this.partsMap = new Map(); // part_key -> node_id
    this.steelsMap = new Map(); // steel_grade -> node_id
    
    this.processedData = [];
    this.errors = [];
    this.stats = {
      clients: { created: 0, existing: 0 },
      trialRequests: { created: 0, existing: 0 },
      parts: { created: 0, existing: 0 },
      steels: { created: 0, existing: 0 },
      trials: { created: 0, errors: 0 },
      references: { created: 0, existing: 0 }
    };
  }

  /**
   * Mapping des unités vers leurs types
   */
  getUnitType(unitName) {
    const UNIT_TYPE_MAPPING = {
      // Longueur / Length
      'mm': 'length', 'cm': 'length', 'm': 'length', 'inch': 'length', 'in': 'length',
      
      // Poids / Weight
      'g': 'weight', 'kg': 'weight', 'pound': 'weight', 'lb': 'weight', 't': 'weight',
      
      // Température / Temperature
      '°C': 'temperature', '°F': 'temperature', 'C': 'temperature', 'F': 'temperature',
      
      // Temps / Time
      's': 'time', 'sec': 'time', 'min': 'time', 'minutes': 'time', 'h': 'time', 'hours': 'time',
      
      // Pression / Pressure
      'mbar': 'pressure', 'bar': 'pressure', 'Pa': 'pressure', 'N': 'pressure',
      
      // Dureté / Hardness
      'HRC': 'hardness', 'HV': 'hardness', 'HB': 'hardness',
      'HC_20': 'hardness', 'HC_30': 'hardness', 'HC_45': 'hardness', 'HC_60': 'hardness',
      'HV_200': 'hardness', 'HV_300': 'hardness', 'HV_500': 'hardness',
      
      // Vitesse / Speed
      'rpm': 'speed', 'm/s': 'speed', 'km/h': 'speed',
      
      // Débit / Flow rate
      'l/min': 'flow', 'l/h': 'flow', 'm3/h': 'flow'
    };
    
    return UNIT_TYPE_MAPPING[unitName] || 'other';
  }

  /**
   * Assure qu'un type d'unité existe en base
   */
  async ensureUnitType(unitType) {
    if (!unitType || typeof unitType !== 'string') return false;
    
    const trimmedType = unitType.trim();
    
    try {
      // Vérifier si le type existe
      const checkQuery = 'SELECT COUNT(*) as count FROM ref_unit_types WHERE type_name = ?';
      const checkResults = await sequelize.query(checkQuery, {
        replacements: [trimmedType],
        type: sequelize.QueryTypes.SELECT
      });
      
      if (checkResults[0].count > 0) {
        return true;
      }
      
      // Créer le type
      const insertQuery = 'INSERT IGNORE INTO ref_unit_types (type_name, description) VALUES (?, ?)';
      await sequelize.query(insertQuery, {
        replacements: [trimmedType, `Type d'unité: ${trimmedType}`],
        type: sequelize.QueryTypes.INSERT
      });
      
      return true;
    } catch (error) {
      if (error.parent && error.parent.code !== 'ER_DUP_ENTRY') {
        console.warn(`   ⚠️  Erreur création type d'unité ${trimmedType}:`, error.message);
      }
      return false;
    }
  }

  /**
   * Assure qu'une valeur existe dans une table de référence (get or create)
   * Utilise des requêtes SQL directes pour garantir la fiabilité
   * Gère spécialement ref_units avec leur unit_type
   * @param {string} tableName - Nom de la table de référence
   * @param {string} value - Valeur à vérifier/créer
   * @param {Object} additionalData - Données supplémentaires (optionnel)
   * @returns {Promise<string>} - La valeur (confirmée ou créée)
   */
  async ensureReferenceValue(tableName, value, additionalData = {}) {
    if (!value || typeof value !== 'string') return null;
    
    const trimmedValue = value.trim();
    if (!trimmedValue || trimmedValue === 'null') return null;
    
    // CAS SPÉCIAL: ref_units nécessite un unit_type
    if (tableName === 'ref_units') {
      try {
        // Déterminer le unit_type
        let unitType = additionalData.unit_type || this.getUnitType(trimmedValue);
        
        // S'assurer que le type existe
        await this.ensureUnitType(unitType);
        
        // Vérifier si l'unité existe déjà
        const checkQuery = 'SELECT COUNT(*) as count FROM ref_units WHERE name = ?';
        const checkResults = await sequelize.query(checkQuery, {
          replacements: [trimmedValue],
          type: sequelize.QueryTypes.SELECT
        });
        
        if (checkResults[0].count > 0) {
          this.stats.references.existing++;
          return trimmedValue;
        }
        
        // Créer l'unité avec son type
        const insertQuery = 'INSERT IGNORE INTO ref_units (name, unit_type, description) VALUES (?, ?, ?)';
        await sequelize.query(insertQuery, {
          replacements: [trimmedValue, unitType, `Unité: ${trimmedValue}`],
          type: sequelize.QueryTypes.INSERT
        });
        
        this.stats.references.created++;
        return trimmedValue;
      } catch (error) {
        if (error.parent && error.parent.code !== 'ER_DUP_ENTRY') {
          console.warn(`   ⚠️  Erreur création unité ${trimmedValue}:`, error.message);
        } else {
          this.stats.references.existing++;
        }
        return trimmedValue;
      }
    }
    
    // CAS STANDARD: autres tables de référence
    try {
      // Vérifier si la valeur existe
      const checkQuery = `SELECT COUNT(*) as count FROM ${tableName} WHERE name = ?`;
      const checkResults = await sequelize.query(checkQuery, {
        replacements: [trimmedValue],
        type: sequelize.QueryTypes.SELECT
      });
      
      if (checkResults[0].count > 0) {
        this.stats.references.existing++;
        return trimmedValue;
      }
      
      // Créer la valeur
      const insertQuery = `INSERT IGNORE INTO ${tableName} (name) VALUES (?)`;
      await sequelize.query(insertQuery, {
        replacements: [trimmedValue],
        type: sequelize.QueryTypes.INSERT
      });
      
      this.stats.references.created++;
      return trimmedValue;
      
    } catch (error) {
      if (error.parent && error.parent.code !== 'ER_DUP_ENTRY') {
        console.warn(`   ⚠️  Erreur création référence "${trimmedValue}" dans ${tableName}:`, error.message);
      } else {
        this.stats.references.existing++;
      }
      return trimmedValue;
    }
  }

  /**
   * Point d'entrée principal pour charger les données
   * @param {string} csvFilePath - Chemin vers le fichier CSV
   */
  async loadData(csvFilePath) {
    console.log('\n╔════════════════════════════════════════════════════════════════╗');
    console.log('║         🚀 DÉMARRAGE DU CHARGEMENT ETL                        ║');
    console.log('╚════════════════════════════════════════════════════════════════╝\n');
    
    try {
      // 1. Charger et parser le CSV
      console.log('📖 Étape 1/6 : Lecture du fichier CSV...');
      const data = await this.readCSV(csvFilePath);
      console.log(`   ✅ ${data.length} lignes chargées\n`);

      // 2. Extraire et initialiser TOUTES les valeurs de référence du dataset
      console.log('🔧 Étape 2/6 : Extraction et initialisation des références...');
      await this.initializeReferences();
      await this.extractAndInitializeAllReferences(data);
      console.log(`   ✅ ${this.stats.references.created} créées, ${this.stats.references.existing} existantes\n`);

      // 3. Créer/récupérer les aciers
      console.log('🔩 Étape 3/6 : Gestion des aciers...');
      await this.processSteel(data);
      console.log(`   ✅ ${this.stats.steels.created} créés, ${this.stats.steels.existing} existants\n`);

      // 4. Créer/récupérer les clients
      console.log('👥 Étape 4/6 : Gestion des clients...');
      await this.processClients(data);
      console.log(`   ✅ ${this.stats.clients.created} créés, ${this.stats.clients.existing} existants\n`);

      // 5. Créer/récupérer les demandes d'essai (trial_requests)
      console.log('📋 Étape 5/6 : Gestion des demandes d\'essai...');
      await this.processTrialRequests(data);
      console.log(`   ✅ ${this.stats.trialRequests.created} créées, ${this.stats.trialRequests.existing} existantes\n`);

      // 6. Créer les pièces et trials
      console.log('🔬 Étape 6/6 : Création des pièces et essais...');
      await this.processPartsAndTrials(data);
      console.log(`   ✅ ${this.stats.parts.created} pièces créées`);
      console.log(`   ✅ ${this.stats.trials.created} essais créés\n`);

      // Résumé final
      this.printSummary();

    } catch (error) {
      console.error('❌ Erreur lors du chargement ETL :', error);
      throw error;
    }
  }

  /**
   * Initialise les valeurs de référence minimales nécessaires
   */
  async initializeReferences() {
    // Statuts de données des nœuds
    await this.ensureReferenceValue('ref_node_data_status', 'new');
    await this.ensureReferenceValue('ref_node_data_status', 'old');
    await this.ensureReferenceValue('ref_node_data_status', 'opened');
    
    // Statuts des trials
    await this.ensureReferenceValue('ref_status', 'Pending');
    await this.ensureReferenceValue('ref_status', 'Completed');
    await this.ensureReferenceValue('ref_status', 'In Progress');
    
    // Locations de base
    await this.ensureReferenceValue('ref_location', 'ECM');
    await this.ensureReferenceValue('ref_location', 'Surface');
    await this.ensureReferenceValue('ref_location', 'Core');
    await this.ensureReferenceValue('ref_location', 'Position 1');
    await this.ensureReferenceValue('ref_location', 'Position 2');
    await this.ensureReferenceValue('ref_location', 'Position 3');
    
    // Désignations communes
    await this.ensureReferenceValue('ref_designation', 'Gear');
    await this.ensureReferenceValue('ref_designation', 'Ring');
    await this.ensureReferenceValue('ref_designation', 'Shaft');
    await this.ensureReferenceValue('ref_designation', 'Hub');
    await this.ensureReferenceValue('ref_designation', 'Tool');
    await this.ensureReferenceValue('ref_designation', 'Housing');
    await this.ensureReferenceValue('ref_designation', 'Clip');
    await this.ensureReferenceValue('ref_designation', 'Bushing');
    await this.ensureReferenceValue('ref_designation', 'Piston');
    await this.ensureReferenceValue('ref_designation', 'Sample');
    await this.ensureReferenceValue('ref_designation', 'Other');
    
    // Unités de base
    await this.ensureReferenceValue('ref_units', 'mm');
    await this.ensureReferenceValue('ref_units', 'g');
    await this.ensureReferenceValue('ref_units', 'kg');
    await this.ensureReferenceValue('ref_units', 'HRC');
    await this.ensureReferenceValue('ref_units', 'HV');
    await this.ensureReferenceValue('ref_units', 'minutes');
    await this.ensureReferenceValue('ref_units', 'mbar');
    await this.ensureReferenceValue('ref_units', '°C');
  }

  /**
   * Extrait et initialise TOUTES les valeurs de référence du dataset
   * Scanne toutes les colonnes JSON pour trouver les unités, locations, etc.
   * AVEC CONTEXTE pour déterminer intelligemment les types d'unités
   */
  async extractAndInitializeAllReferences(data) {
    console.log('🔍 Extraction de toutes les valeurs de référence du dataset...');
    
    const unitsToCreate = new Map(); // unit -> type
    const allLocations = new Set();
    const allDesignations = new Set();
    const allCountries = new Set();
    const allSteelStandards = new Set();
    
    for (const row of data) {
      // Extraire les pays
      if (row.country?.trim()) {
        allCountries.add(row.country.trim());
      }
      
      // Extraire les désignations
      if (row.designation?.trim()) {
        allDesignations.add(row.designation.trim());
      }
      
      // Extraire les standards d'acier UNIQUEMENT du CSV
      if (row.standard?.trim()) {
        allSteelStandards.add(row.standard.trim());
      }
      
      // ========== DIMENSIONS_JSON ==========
      if (row.dimensions_json) {
        try {
          const dims = this.parseJSON(row.dimensions_json);
          
          // Weight unit (ex: "g", "kg") -> type: weight
          if (dims?.weight?.unit) {
            unitsToCreate.set(dims.weight.unit, 'weight');
          }
          
          // Rectangular/Circular units (ex: "mm") -> type: length
          if (dims?.rectangular?.unit) {
            unitsToCreate.set(dims.rectangular.unit, 'length');
          }
          if (dims?.circular?.unit) {
            unitsToCreate.set(dims.circular.unit, 'length');
          }
        } catch (e) { /* ignore */ }
      }
      
      // ========== SPECIFICATIONS ==========
      if (row.specifications) {
        try {
          const specs = this.parseJSON(row.specifications);
          
          // Hardness specs: unit (ex: "HRC", "HV") -> type: hardness
          if (specs?.hardnessSpecs) {
            for (const hs of specs.hardnessSpecs) {
              if (hs.unit) {
                unitsToCreate.set(hs.unit, 'hardness');
              }
            }
          }
          
          // ECD specs: depthUnit (ex: "mm") -> type: length, hardnessUnit (ex: "HV") -> type: hardness
          if (specs?.ecdSpecs) {
            for (const es of specs.ecdSpecs) {
              if (es.depthUnit) {
                unitsToCreate.set(es.depthUnit, 'length');
              }
              if (es.hardnessUnit) {
                unitsToCreate.set(es.hardnessUnit, 'hardness');
              }
            }
          }
        } catch (e) { /* ignore */ }
      }
      
      // ========== LOAD_DATA ==========
      if (row.load_data) {
        try {
          const load = this.parseJSON(row.load_data);
          
          // Weight unit (ex: "kg") -> type: weight
          if (load?.weight?.unit) {
            unitsToCreate.set(load.weight.unit, 'weight');
          }
          
          // Size units (ex: "mm") -> type: length
          if (load?.size?.width?.unit) {
            unitsToCreate.set(load.size.width.unit, 'length');
          }
          if (load?.size?.height?.unit) {
            unitsToCreate.set(load.size.height.unit, 'length');
          }
          if (load?.size?.length?.unit) {
            unitsToCreate.set(load.size.length.unit, 'length');
          }
        } catch (e) { /* ignore */ }
      }
      
      // ========== RECIPE_DATA ==========
      if (row.recipe_data) {
        try {
          const recipe = this.parseJSON(row.recipe_data);
          
          // wait_time.unit (ex: "minutes") -> type: time
          if (recipe?.wait_time?.unit) {
            unitsToCreate.set(recipe.wait_time.unit, 'time');
          }
          
          // wait_pressure.unit (ex: "mbar") -> type: pressure
          if (recipe?.wait_pressure?.unit) {
            unitsToCreate.set(recipe.wait_pressure.unit, 'pressure');
          }
          
          // preox.duration.unit (ex: "minutes") -> type: time
          if (recipe?.preox?.duration?.unit) {
            unitsToCreate.set(recipe.preox.duration.unit, 'time');
          }
          
          // preox.temperature.unit (ex: "°C") -> type: temperature
          if (recipe?.preox?.temperature?.unit) {
            unitsToCreate.set(recipe.preox.temperature.unit, 'temperature');
          }
          
          // cell_temp.unit (ex: "°C") -> type: temperature
          if (recipe?.cell_temp?.unit) {
            unitsToCreate.set(recipe.cell_temp.unit, 'temperature');
          }
        } catch (e) { /* ignore */ }
      }
      
      // ========== QUENCH_DATA ==========
      if (row.quench_data) {
        try {
          const quench = this.parseJSON(row.quench_data);
          
          // oil_quench.temperature.unit (ex: "°C") -> type: temperature
          if (quench?.oil_quench?.temperature?.unit) {
            unitsToCreate.set(quench.oil_quench.temperature.unit, 'temperature');
          }
          
          // oil_quench.dripping_time.unit (ex: "min") -> type: time
          if (quench?.oil_quench?.dripping_time?.unit) {
            unitsToCreate.set(quench.oil_quench.dripping_time.unit, 'time');
          }
          
          // oil_quench.inerting_delay.unit (ex: "min") -> type: time
          if (quench?.oil_quench?.inerting_delay?.unit) {
            unitsToCreate.set(quench.oil_quench.inerting_delay.unit, 'time');
          }
        } catch (e) { /* ignore */ }
      }
      
      // ========== RESULTS_DATA ==========
      if (row.results_data) {
        try {
          const results = this.parseJSON(row.results_data);
          
          if (results?.results) {
            for (const result of results.results) {
              if (result.samples) {
                for (const sample of result.samples) {
                  
                  // Hardness points: unit (ex: "HRC") -> type: hardness, location (ex: "Surface", "Core")
                  if (sample.hardness_points) {
                    for (const hp of sample.hardness_points) {
                      if (hp.unit) {
                        unitsToCreate.set(hp.unit, 'hardness');
                      }
                      if (hp.location) {
                        allLocations.add(hp.location);
                      }
                    }
                  }
                  
                  // ECD: hardness_unit (ex: "HV") -> type: hardness, position locations
                  if (sample.ecd) {
                    if (sample.ecd.hardness_unit) {
                      unitsToCreate.set(sample.ecd.hardness_unit, 'hardness');
                    }
                    
                    // Positions (ex: "Position 1", "Position 2")
                    const ecdPoints = sample.ecd.positions || sample.ecd.ecd_points;
                    if (ecdPoints) {
                      for (const ecd of ecdPoints) {
                        if (ecd.position) {
                          allLocations.add(ecd.position);
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        } catch (e) { /* ignore */ }
      }
    }
    
    // Créer toutes les références extraites
    console.log(`   📊 Trouvé : ${unitsToCreate.size} unités, ${allLocations.size} locations, ${allDesignations.size} désignations, ${allCountries.size} pays`);
    console.log(`   📊 Trouvé : ${allSteelStandards.size} standards acier`);
    
    // Créer les standards d'acier EN PREMIER
    for (const standard of allSteelStandards) {
      if (standard && standard !== 'null') {
        await this.ensureReferenceValue('ref_steel_standard', standard);
      }
    }
    
    // Créer les UNITÉS avec leur type exact
    for (const [unitName, unitType] of unitsToCreate.entries()) {
      if (unitName && unitName !== 'null') {
        await this.ensureUnitDirect(unitName, unitType);
      }
    }
    
    // Créer les autres références
    for (const location of allLocations) {
      if (location && location !== 'null') {
        await this.ensureReferenceValue('ref_location', location);
      }
    }
    
    for (const designation of allDesignations) {
      if (designation && designation !== 'null') {
        await this.ensureReferenceValue('ref_designation', designation);
      }
    }
    
    for (const country of allCountries) {
      if (country && country !== 'null' && country !== 'OTHER' && country !== '.') {
        await this.ensureReferenceValue('ref_country', country);
      }
    }
    
    console.log('   ✅ Toutes les références ont été initialisées\n');
  }

  /**
   * Crée une unité avec son type DIRECTEMENT sans inférence
   */
  async ensureUnitDirect(unitName, unitType) {
    if (!unitName || unitName === 'null') return;

    try {
      // Vérifier si l'unité existe déjà
      const [existingUnit] = await sequelize.query(
        'SELECT name FROM ref_units WHERE name = ?',
        { replacements: [unitName], type: sequelize.QueryTypes.SELECT }
      );
      
      if (existingUnit) {
        return; // Déjà existe
      }

      // S'assurer que le type d'unité existe
      const [existingType] = await sequelize.query(
        'SELECT type_name FROM ref_unit_types WHERE type_name = ?',
        { replacements: [unitType], type: sequelize.QueryTypes.SELECT }
      );
      
      if (!existingType) {
        await sequelize.query(
          'INSERT INTO ref_unit_types (type_name) VALUES (?)',
          { replacements: [unitType] }
        );
      }

      // Créer l'unité
      await sequelize.query(
        'INSERT INTO ref_units (name, unit_type) VALUES (?, ?)',
        { replacements: [unitName, unitType] }
      );
      
    } catch (error) {
      // Ignorer les erreurs de doublons silencieusement
      if (!error.message?.includes('Duplicate') && !error.message?.includes('duplicate') && error.code !== 'ER_DUP_ENTRY') {
        throw error;
      }
    }
  }

  /**
   * Lit et parse le fichier CSV
   * @param {string} csvFilePath - Chemin vers le fichier CSV
   * @returns {Promise<Array>} Données parsées
   */
  async readCSV(csvFilePath) {
    return new Promise((resolve, reject) => {
      const results = [];
      
      if (!fs.existsSync(csvFilePath)) {
        reject(new Error(`Fichier CSV non trouvé : ${csvFilePath}`));
        return;
      }

      fs.createReadStream(csvFilePath)
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', () => resolve(results))
        .on('error', (error) => reject(error));
    });
  }

  /**
   * Traite et crée les aciers manquants
   * @param {Array} data - Données du CSV
   */
  async processSteel(data) {
    // Extraire tous les aciers uniques avec leur standard
    const uniqueSteel = new Map(); // grade -> {standard, family}
    
    data.forEach(row => {
      const grade = row.acier_canon?.trim();
      const standard = row.standard?.trim();
      
      if (grade && grade.length <= 50) {
        // Utiliser UNIQUEMENT les données du CSV, sans détection automatique
        uniqueSteel.set(grade, {
          standard: standard || null,
          family: null // Famille gérée séparément si colonne existe
        });
      }
    });

    // Récupérer les aciers existants
    const existingSteel = await steelService.getAllSteels({ limit: 10000 });
    const existingGrades = new Map();
    existingSteel.steels.forEach(s => {
      if (s.steel?.grade) {
        existingGrades.set(s.steel.grade, s.id);
      }
    });

    // Créer ou récupérer les aciers
    for (const [grade, steelInfo] of uniqueSteel) {
      try {
        if (existingGrades.has(grade)) {
          this.steelsMap.set(grade, existingGrades.get(grade));
          this.stats.steels.existing++;
        } else {
          // S'assurer que la famille et le standard existent dans les tables de référence
          // UNIQUEMENT si présents dans le CSV
          if (steelInfo.family) {
            await this.ensureReferenceValue('ref_steel_family', steelInfo.family);
          }
          if (steelInfo.standard) {
            await this.ensureReferenceValue('ref_steel_standard', steelInfo.standard);
          }
          
          const steelData = {
            name: `Steel ${grade}`,
            grade: grade,
            family: steelInfo.family,
            standard: steelInfo.standard,
            description: `Steel imported via ETL on ${new Date().toISOString().split('T')[0]}`,
            equivalents: [],
            chemistery: null,
            elements: null
          };

          const createdSteel = await steelService.createSteel(steelData);
          this.steelsMap.set(grade, createdSteel.id);
          this.stats.steels.created++;
        }
      } catch (error) {
        this.errors.push(`Error creating steel "${grade}" (${steelInfo.standard}): ${error.message}`);
      }
    }
  }

  /**
   * Détermine la famille d'acier basée sur le grade
   */
  determineSteelFamily(grade) {
    if (!grade) return 'Low_alloyed';
    const gradeUpper = grade.toUpperCase();
    
    if (/INOX|SS\d+|X\d+CR|STAINLESS|17-4PH/i.test(gradeUpper)) return 'Stainless_steel';
    if (/H13|H11|D2|A2|O1|TOOL|X\d+CRMOV/i.test(gradeUpper)) return 'Tool_steel';
    if (/100C|XC\d+|C\d{2,3}[^R]|52100|100CRMN/i.test(gradeUpper)) return 'HCC';
    
    return 'Low_alloyed';
  }

  /**
   * Détermine le standard d'acier basé sur le grade
   */
  determineSteelStandard(grade) {
    if (!grade) return 'EN_10020';
    const gradeUpper = grade.toUpperCase();
    
    // Standards explicites
    if (/^(AISI|SAE)/i.test(gradeUpper)) return 'ASTM_AISI';
    if (/^(EN)/i.test(gradeUpper)) return 'EN_10020';
    if (/^(GOST)/i.test(gradeUpper)) return 'GOST_1050';
    if (/^(JIS|SUP|SCM|SCR|SNCM|S[0-9]{2}C)/i.test(gradeUpper)) return 'JIS';
    if (/^(GB|[0-9]{1,2}CR)/i.test(gradeUpper)) return 'GB';
    if (/^(DIN)/i.test(gradeUpper)) return 'DIN';
    if (/^(BS)/i.test(gradeUpper)) return 'BS';
    
    // Patterns de grades par standard
    if (/^[0-9]{4}[A-Z]?$/i.test(gradeUpper)) return 'ASTM_AISI'; // Ex: 4140, 8620
    if (/^(X[0-9]|C[0-9]{2}E|[0-9]+[A-Z]+[0-9])/i.test(gradeUpper)) return 'EN_10020'; // Ex: X40CrMoV5-1, 20CrMnTiH
    
    return 'EN_10020';
  }

  /**
   * Traite et crée les clients uniques
   * @param {Array} data - Données du CSV (données déjà nettoyées par l'ETL)
   */
  async processClients(data) {
    const uniqueClients = new Map();
    
    // Extraire les clients uniques
    data.forEach(row => {
      const clientName = row.client?.trim();
      const country = row.country?.trim();
      const city = row.city?.trim();
      
      if (clientName && !uniqueClients.has(clientName)) {
        uniqueClients.set(clientName, {
          name: clientName,
          country: country || null,
          city: city || null,
          client_group: null,
          address: null,
          description: `Client imported via ETL on ${new Date().toISOString().split('T')[0]}`
        });
      }
    });

    // Créer ou récupérer les clients
    for (const [clientName, clientData] of uniqueClients) {
      try {
        // S'assurer que le pays existe dans la table de référence (données propres de l'ETL)
        if (clientData.country) {
          await this.ensureReferenceValue('ref_country', clientData.country);
        }
        
        // Vérifier si le client existe déjà
        const existingClient = await node.findOne({
          where: { 
            name: clientName,
            type: 'client'
          }
        });

        if (existingClient) {
          this.clientsMap.set(clientName, existingClient.id);
          this.stats.clients.existing++;
        } else {
          const createdClient = await clientService.createClient(clientData);
          this.clientsMap.set(clientName, createdClient.id);
          this.stats.clients.created++;
        }
      } catch (error) {
        this.errors.push(`Error processing client "${clientName}": ${error.message}`);
      }
    }
  }

  /**
   * Crée les demandes d'essai (trial_requests) pour chaque client
   * @param {Array} data - Données du CSV
   */
  async processTrialRequests(data) {
    // Grouper par client pour créer une trial_request par client
    const clientRequests = new Map();
    
    data.forEach(row => {
      const clientName = row.client?.trim();
      if (clientName && this.clientsMap.has(clientName)) {
        if (!clientRequests.has(clientName)) {
          clientRequests.set(clientName, {
            clientName,
            clientId: this.clientsMap.get(clientName),
            testCount: 1
          });
        } else {
          clientRequests.get(clientName).testCount++;
        }
      }
    });

    // Créer une trial_request par client
    for (const [clientName, requestInfo] of clientRequests) {
      try {
        // Vérifier si une trial_request existe déjà pour ce client
        const existingRequest = await node.findOne({
          where: {
            parent_id: requestInfo.clientId,
            type: 'trial_request'
          }
        });

        if (existingRequest) {
          this.trialRequestsMap.set(clientName, existingRequest.id);
          this.stats.trialRequests.existing++;
        } else {
          const requestData = {
            parent_id: requestInfo.clientId,
            name: `Trial Request - ${clientName}`,
            description: `Trial request imported via ETL (${requestInfo.testCount} tests)`,
            request_date: new Date().toISOString().split('T')[0],
            commercial: 'ETL Import'
          };

          const createdRequest = await trialRequestService.createTrialRequest(requestData);
          this.trialRequestsMap.set(clientName, createdRequest.id);
          this.stats.trialRequests.created++;
        }
      } catch (error) {
        this.errors.push(`Error creating trial request for "${clientName}": ${error.message}`);
      }
    }
  }

  /**
   * Traite les pièces et crée les essais
   * @param {Array} data - Données du CSV
   */
  async processPartsAndTrials(data) {
    // Regrouper par pièce unique (designation + client)
    const partGroups = new Map();
    
    data.forEach((row, index) => {
      const clientName = row.client?.trim();
      const designation = row.designation?.trim();
      const clientDesignation = row.client_designation?.trim();
      const steel = row.acier_canon?.trim() || row.standard?.trim();
      
      if (!clientName || !this.trialRequestsMap.has(clientName)) {
        return;
      }

      // Inclure l'acier dans la clé pour différencier les parts avec des aciers différents
      const partKey = `${clientName}__${designation}__${clientDesignation || 'NO_CLIENT_DESIG'}__${steel || 'NO_STEEL'}`;
      
      if (!partGroups.has(partKey)) {
        partGroups.set(partKey, {
          clientName,
          designation,
          clientDesignation,
          trialRequestId: this.trialRequestsMap.get(clientName),
          steel: steel,
          specifications: row.specifications,
          dimensions_json: row.dimensions_json,
          trials: []
        });
      }
      
      // Ajouter le trial à la pièce
      partGroups.get(partKey).trials.push({
        rowIndex: index,
        ...row
      });
    });

    // Créer les pièces et leurs trials
    for (const [partKey, partGroup] of partGroups) {
      try {
        // Créer la pièce si elle n'existe pas
        let partNodeId = this.partsMap.get(partKey);
        
        if (!partNodeId) {
          const partData = await this.buildPartData(partGroup);
          const createdPart = await partService.createPart(partData);
          partNodeId = createdPart.id;
          this.partsMap.set(partKey, partNodeId);
          this.stats.parts.created++;
        }

        // Créer tous les trials de cette pièce
        for (const trialRow of partGroup.trials) {
          try {
            const trialData = await this.buildTrialData(trialRow, partNodeId);
            await trialService.createTrial(trialData);
            this.stats.trials.created++;
          } catch (trialError) {
            this.errors.push(`Error creating trial (row ${trialRow.rowIndex + 1}): ${trialError.message}`);
            this.stats.trials.errors++;
          }
        }

      } catch (error) {
        this.errors.push(`Error creating part "${partKey}": ${error.message}`);
      }
    }
  }

  /**
   * Construit les données de la pièce pour la création
   */
  async buildPartData(partGroup) {
    // Parser les spécifications (données déjà préparées par l'ETL)
    let hardnessSpecs = [];
    let ecdSpecs = [];
    
    if (partGroup.specifications) {
      try {
        const specs = typeof partGroup.specifications === 'string' 
          ? JSON.parse(partGroup.specifications)
          : partGroup.specifications;
        
        hardnessSpecs = specs.hardnessSpecs || [];
        ecdSpecs = specs.ecdSpecs || [];
        
        // S'assurer que les unités des specs hardness existent
        for (const spec of hardnessSpecs) {
          if (spec.unit) {
            await this.ensureReferenceValue('ref_units', spec.unit);
          }
        }
        
        // S'assurer que les unités des specs ECD existent
        for (const spec of ecdSpecs) {
          if (spec.depthUnit) {
            await this.ensureReferenceValue('ref_units', spec.depthUnit);
          }
          if (spec.hardnessUnit) {
            await this.ensureReferenceValue('ref_units', spec.hardnessUnit);
          }
        }
      } catch (e) {
        console.warn(`   ⚠️  Error parsing specifications for ${partGroup.designation}`);
      }
    }

    // Parser les dimensions (données déjà préparées par l'ETL)
    let dimensions = {};
    if (partGroup.dimensions_json) {
      try {
        dimensions = typeof partGroup.dimensions_json === 'string'
          ? JSON.parse(partGroup.dimensions_json)
          : partGroup.dimensions_json;
      } catch (e) {
        console.warn(`   ⚠️  Error parsing dimensions for ${partGroup.designation}`);
      }
    }

    // Récupérer le steel_node_id
    const steel_node_id = partGroup.steel ? this.steelsMap.get(partGroup.steel) : null;
    
    // Utiliser la désignation telle quelle (déjà normalisée par l'ETL)
    const designation = partGroup.designation || 'Other';
    
    // S'assurer que la désignation existe dans la table de référence
    if (designation) {
      await this.ensureReferenceValue('ref_designation', designation);
    }
    
    // S'assurer que les unités existent dans la table de référence
    if (dimensions.weight?.unit) {
      await this.ensureReferenceValue('ref_units', dimensions.weight.unit);
    }
    if (dimensions.rectangular?.unit) {
      await this.ensureReferenceValue('ref_units', dimensions.rectangular.unit);
    }
    if (dimensions.circular?.unit) {
      await this.ensureReferenceValue('ref_units', dimensions.circular.unit);
    }

    return {
      parent_id: partGroup.trialRequestId,
      name: partGroup.designation || 'Unknown Part',
      designation: designation,
      client_designation: partGroup.clientDesignation || null,
      steel_node_id: steel_node_id,
      reference: null,
      quantity: null,
      description: `Part imported via ETL`,
      
      // Dimensions - Weight
      dim_weight_value: dimensions.weight?.value || null,
      dim_weight_unit: dimensions.weight?.unit || null,
      
      // Dimensions - Rectangular
      dim_rect_length: dimensions.rectangular?.length || null,
      dim_rect_width: dimensions.rectangular?.width || null,
      dim_rect_height: dimensions.rectangular?.height || null,
      dim_rect_unit: dimensions.rectangular?.unit || null,
      
      // Dimensions - Circular
      dim_circ_diameterIn: dimensions.circular?.diameterIn || null,
      dim_circ_diameterOut: dimensions.circular?.diameterOut || null,
      dim_circ_unit: dimensions.circular?.unit || null,
      
      // Spécifications
      hardnessSpecs: hardnessSpecs,
      ecdSpecs: ecdSpecs
    };
  }

  /**
   * Construit les données du trial pour la création
   */
  async buildTrialData(row, partNodeId) {
    // Parser la date
    const trialDate = this.parseDate(row.date || row.created_on);

    // Parser load_data
    let loadData = null;
    if (row.load_data) {
      try {
        loadData = this.parseJSON(row.load_data);
        
        // S'assurer que les unités du load_data existent
        if (loadData) {
          if (loadData.weight?.unit) {
            await this.ensureReferenceValue('ref_units', loadData.weight.unit);
          }
          if (loadData.size?.width?.unit) {
            await this.ensureReferenceValue('ref_units', loadData.size.width.unit);
          }
          if (loadData.size?.height?.unit) {
            await this.ensureReferenceValue('ref_units', loadData.size.height.unit);
          }
          if (loadData.size?.length?.unit) {
            await this.ensureReferenceValue('ref_units', loadData.size.length.unit);
          }
        }
      } catch (e) {
        console.warn(`   ⚠️  Error parsing load_data`);
      }
    }

    // Parser recipe_data
    let recipeData = null;
    if (row.recipe_data) {
      try {
        recipeData = this.parseJSON(row.recipe_data);
        // Ajouter le numéro de recette si disponible
        if (row.recipe && recipeData) {
          recipeData.number = row.recipe;
        }
        
        // S'assurer que toutes les unités du recipe_data existent
        if (recipeData) {
          // Wait time et pressure
          if (recipeData.wait_time?.unit) {
            await this.ensureReferenceValue('ref_units', recipeData.wait_time.unit);
          }
          if (recipeData.wait_pressure?.unit) {
            await this.ensureReferenceValue('ref_units', recipeData.wait_pressure.unit);
          }
          // Preox
          if (recipeData.preox?.duration?.unit) {
            await this.ensureReferenceValue('ref_units', recipeData.preox.duration.unit);
          }
          if (recipeData.preox?.temperature?.unit) {
            await this.ensureReferenceValue('ref_units', recipeData.preox.temperature.unit);
          }
          // Cell temp
          if (recipeData.cell_temp?.unit) {
            await this.ensureReferenceValue('ref_units', recipeData.cell_temp.unit);
          }
        }
      } catch (e) {
        // Ignorer silencieusement
      }
    } else if (row.recipe) {
      // Si pas de recipe_data mais un numéro de recette
      recipeData = { number: row.recipe };
    }

    // Parser quench_data
    let quenchData = null;
    if (row.quench_data) {
      try {
        quenchData = this.parseJSON(row.quench_data);
        
        // S'assurer que toutes les unités du quench_data existent
        if (quenchData?.oil_quench) {
          if (quenchData.oil_quench.temperature?.unit) {
            await this.ensureReferenceValue('ref_units', quenchData.oil_quench.temperature.unit);
          }
          if (quenchData.oil_quench.dripping_time?.unit) {
            await this.ensureReferenceValue('ref_units', quenchData.oil_quench.dripping_time.unit);
          }
          if (quenchData.oil_quench.inerting_delay?.unit) {
            await this.ensureReferenceValue('ref_units', quenchData.oil_quench.inerting_delay.unit);
          }
        }
      } catch (e) {
        // Ignorer silencieusement
      }
    }

    // Parser results_data
    let resultsData = null;
    if (row.results_data) {
      try {
        resultsData = this.parseJSON(row.results_data);
        
        // S'assurer que toutes les unités et locations dans results_data existent
        if (resultsData && Array.isArray(resultsData.results)) {
          for (const result of resultsData.results) {
            if (Array.isArray(result.samples)) {
              for (const sample of result.samples) {
                // Traiter les hardness_points
                if (Array.isArray(sample.hardness_points)) {
                  for (const hp of sample.hardness_points) {
                    if (hp.unit) {
                      await this.ensureReferenceValue('ref_units', hp.unit);
                    }
                    if (hp.location) {
                      await this.ensureReferenceValue('ref_location', hp.location);
                    }
                  }
                }
                
                // Traiter les ECD
                if (sample.ecd) {
                  if (sample.ecd.hardness_unit) {
                    await this.ensureReferenceValue('ref_units', sample.ecd.hardness_unit);
                  }
                  
                  // Supporter à la fois 'positions' et 'ecd_points'
                  const ecdPoints = sample.ecd.positions || sample.ecd.ecd_points;
                  if (Array.isArray(ecdPoints)) {
                    for (const ecd of ecdPoints) {
                      if (ecd.position) {
                        await this.ensureReferenceValue('ref_location', ecd.position);
                      }
                    }
                  }
                }
              }
            }
          }
        }
      } catch (e) {
        console.warn(`   ⚠️  Error parsing results_data:`, e.message);
      }
    }

    return {
      parent_id: partNodeId,
      name: `Trial ${row.load || row.id || 'Unknown'}`,
      description: `Trial imported via ETL - ${row.file || ''}`,
      trial_code: row.id || null,
      load_number: row.load || null,
      trial_date: trialDate,
      status: 'Pending',
      location: 'ECM',
      load_data: loadData,
      recipe_data: recipeData,
      quench_data: quenchData,
      results_data: resultsData
    };
  }

  /**
   * Parse et valide une date
   */
  parseDate(dateString) {
    if (!dateString) return null;
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        // Essayer le format DD/MM/YYYY
        const parts = dateString.split('/');
        if (parts.length === 3) {
          const parsedDate = new Date(parts[2], parts[1] - 1, parts[0]);
          if (!isNaN(parsedDate.getTime())) {
            return parsedDate.toISOString().split('T')[0];
          }
        }
        return null;
      }
      return date.toISOString().split('T')[0];
    } catch (error) {
      return null;
    }
  }

  /**
   * Parse un JSON avec nettoyage des échappements
   */
  parseJSON(jsonString) {
    if (!jsonString) return null;
    
    let cleaned = jsonString.trim();
    
    // Nettoyer les triple quotes
    if (cleaned.startsWith('"""') && cleaned.endsWith('"""')) {
      cleaned = cleaned.slice(3, -3);
      cleaned = cleaned.replace(/\\"/g, '"');
    } else if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
      cleaned = cleaned.slice(1, -1);
      cleaned = cleaned.replace(/\\"/g, '"');
      cleaned = cleaned.replace(/""/g, '"');
    }
    
    return JSON.parse(cleaned);
  }

  /**
   * Affiche le résumé final
   */
  printSummary() {
    console.log('\n╔════════════════════════════════════════════════════════════════╗');
    console.log('║                     📊 RÉSUMÉ DU CHARGEMENT                    ║');
    console.log('╚════════════════════════════════════════════════════════════════╝\n');
    
    console.log('✅ Tables de référence:');
    console.log(`   - Créées: ${this.stats.references.created}`);
    console.log(`   - Existantes: ${this.stats.references.existing}`);
    
    console.log('\n✅ Clients:');
    console.log(`   - Créés: ${this.stats.clients.created}`);
    console.log(`   - Existants: ${this.stats.clients.existing}`);
    
    console.log('\n✅ Demandes d\'essai:');
    console.log(`   - Créées: ${this.stats.trialRequests.created}`);
    console.log(`   - Existantes: ${this.stats.trialRequests.existing}`);
    
    console.log('\n✅ Aciers:');
    console.log(`   - Créés: ${this.stats.steels.created}`);
    console.log(`   - Existants: ${this.stats.steels.existing}`);
    
    console.log('\n✅ Pièces:');
    console.log(`   - Créées: ${this.stats.parts.created}`);
    
    console.log('\n✅ Essais:');
    console.log(`   - Créés: ${this.stats.trials.created}`);
    console.log(`   - Erreurs: ${this.stats.trials.errors}`);
    
    if (this.errors.length > 0) {
      console.log('\n⚠️  ERREURS DÉTECTÉES:');
      this.errors.slice(0, 10).forEach((error, index) => {
        console.log(`   ${index + 1}. ${error}`);
      });
      if (this.errors.length > 10) {
        console.log(`   ... et ${this.errors.length - 10} autres erreurs`);
      }
    }
    
    console.log('\n╚════════════════════════════════════════════════════════════════╝\n');
  }
}

/**
 * Fonction principale d'exécution
 */
async function main() {
  if (process.argv.length < 3) {
    console.error('Usage: node etl-import-trials.js <chemin-vers-fichier-csv>');
    process.exit(1);
  }

  const csvFilePath = process.argv[2];
  const etlLoader = new ETLLoader();

  try {
    await etlLoader.loadData(csvFilePath);
    process.exit(0);
  } catch (error) {
    console.error('💥 Erreur fatale ETL :', error);
    process.exit(1);
  }
}

// Exécution si le script est appelé directement
if (require.main === module) {
  main();
}

module.exports = ETLLoader;

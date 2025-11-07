/**
 * Script ETL pour charger les données depuis un fichier CSV
 * Utilise les services existants pour créer clients, commandes, pièces        // Utiliser une valeur par défaut existante pour family
        family: 'Low_Alloy', // Valeur ENUM existante par défaut (DB)et tests
 */

const fs = require('fs');
const csv = require('csv-parser');
const path = require('path');

// Services
const clientService = require('../services/clientService');
const orderService = require('../services/orderService');
const partService = require('../services/partService');
const testService = require('../services/testService');
const steelService = require('../services/steelService');

// Models pour les requêtes directes si nécessaire
const { node, enum: EnumModel, sequelize } = require('../models');

class ETLLoader {
  constructor() {
    this.clientsMap = new Map(); // Map pour stocker client_name -> client_id
    this.ordersMap = new Map();  // Map pour stocker order_key -> order_id
    this.partsMap = new Map();   // Map pour stocker part_key -> part_id
    this.steelsMap = new Map();  // Map pour stocker steel_grade -> steel_id
    this.processedData = [];
    this.errors = [];
    
    // Cache des valeurs ENUM pour éviter les requêtes répétées
    this.enumCache = {
      steelFamily: new Set(),
      steelStandard: new Set(),
      clientCountry: new Set(),
      partDesignation: new Set()
    };
  }

  /**
   * Initialise le cache des valeurs ENUM existantes
   */
  async initializeEnumCache() {
    console.log('🔧 Initialisation du cache ENUM...');
    
    try {
      // Charger les familles d'acier
      const steelFamilyEnum = await EnumModel.getEnumValues('steels', 'family');
      if (steelFamilyEnum.values) {
        steelFamilyEnum.values.forEach(val => this.enumCache.steelFamily.add(val));
        console.log(`   ✓ ${this.enumCache.steelFamily.size} familles d'acier chargées`);
      }
      
      // Charger les standards d'acier
      const steelStandardEnum = await EnumModel.getEnumValues('steels', 'standard');
      if (steelStandardEnum.values) {
        steelStandardEnum.values.forEach(val => this.enumCache.steelStandard.add(val));
        console.log(`   ✓ ${this.enumCache.steelStandard.size} standards d'acier chargés`);
      }
      
      // Charger les pays clients (table CLIENTS, pas nodes !)
      const clientCountryEnum = await EnumModel.getEnumValues('clients', 'country');
      if (clientCountryEnum.values) {
        clientCountryEnum.values.forEach(val => this.enumCache.clientCountry.add(val));
        console.log(`   ✓ ${this.enumCache.clientCountry.size} pays clients chargés`);
      }
      
      // Charger les désignations de pièces
      const partDesignationEnum = await EnumModel.getEnumValues('parts', 'designation');
      if (partDesignationEnum.values) {
        partDesignationEnum.values.forEach(val => this.enumCache.partDesignation.add(val));
        console.log(`   ✓ ${this.enumCache.partDesignation.size} désignations de pièces chargées`);
      }
      
      console.log('✅ Cache ENUM initialisé avec succès');
    } catch (error) {
      console.error('❌ Erreur lors de l\'initialisation du cache ENUM:', error.message);
      throw error;
    }
  }

  /**
   * Ajoute dynamiquement une valeur à un ENUM si elle n'existe pas
   * @param {string} tableName - Nom de la table
   * @param {string} columnName - Nom de la colonne ENUM
   * @param {string} newValue - Nouvelle valeur à ajouter
   * @param {Set} cacheSet - Set du cache à mettre à jour
   * @returns {Promise<boolean>} True si ajouté, false si déjà existant
   */
  async addEnumValueIfNeeded(tableName, columnName, newValue, cacheSet) {
    // Vérifier dans le cache d'abord (insensible à la casse pour détection)
    const normalizedValue = newValue;
    const cacheValues = Array.from(cacheSet);
    const existsInCache = cacheValues.some(val => val.toLowerCase() === normalizedValue.toLowerCase());
    
    if (existsInCache) {
      // Trouver la valeur exacte dans le cache pour l'utiliser
      const exactValue = cacheValues.find(val => val.toLowerCase() === normalizedValue.toLowerCase());
      if (exactValue !== newValue) {
        console.log(`   ⚠️  Valeur ENUM "${newValue}" normalisée en "${exactValue}" (sensibilité à la casse)`);
      }
      return false; // Déjà existant
    }

    try {
      // Récupérer les valeurs actuelles depuis la DB
      const currentEnum = await EnumModel.getEnumValues(tableName, columnName);
      const currentValues = currentEnum.values || [];
      
      // Vérifier si la valeur existe déjà (insensible à la casse)
      const existsInDb = currentValues.some(val => val.toLowerCase() === normalizedValue.toLowerCase());
      if (existsInDb) {
        const exactValue = currentValues.find(val => val.toLowerCase() === normalizedValue.toLowerCase());
        cacheSet.add(exactValue);
        if (exactValue !== newValue) {
          console.log(`   ⚠️  Valeur ENUM "${newValue}" existe déjà comme "${exactValue}"`);
        }
        return false;
      }
      
      // Ajouter la nouvelle valeur
      const newValues = [...currentValues, newValue];
      const enumDefinition = newValues.map(val => `'${val.replace(/'/g, "''")}'`).join(',');
      const query = `ALTER TABLE ${tableName} MODIFY COLUMN ${columnName} ENUM(${enumDefinition})`;
      
      await sequelize.query(query);
      
      // Mettre à jour le cache
      cacheSet.add(newValue);
      
      console.log(`   ✅ Valeur ENUM ajoutée: ${tableName}.${columnName} = "${newValue}"`);
      return true;
    } catch (error) {
      console.error(`   ❌ Erreur ajout ENUM ${tableName}.${columnName} = "${newValue}": ${error.message}`);
      this.errors.push(`Erreur ajout ENUM ${tableName}.${columnName} = "${newValue}": ${error.message}`);
      return false;
    }
  }

  /**
   * Détermine automatiquement la famille d'acier basée sur le grade
   * @param {string} grade - Grade de l'acier
   * @returns {string} Famille d'acier
   */
  determineSteelFamily(grade) {
    if (!grade) return 'Low_Alloy';
    
    const gradeUpper = grade.toUpperCase();
    
    // Patterns pour détecter la famille
    const patterns = {
      'Stainless': /INOX|SS\d+|X\d+CR|STAINLESS|17-4PH/i,
      'Tool_Steel': /H13|H11|D2|A2|O1|TOOL|X\d+CRMOV/i,
      'High_Carbon': /100C|XC\d+|C\d{2,3}[^R]|52100|100CRMN/i,
      'Case_Hardening': /\d+MNC|MNC\d+|MNB\d+|\d+CRMN|\d+NICR|SCR\d+|SCM\d+/i,
      'Low_Alloy': /42CRMO|4140|4340|8620|9310|CRMO|NICR|NICRMO/i,
      'Carbon_Steel': /C\d+E|XC\d+|SAE\d{4}|ASTM/i
    };
    
    // Tester chaque pattern
    for (const [family, pattern] of Object.entries(patterns)) {
      if (pattern.test(gradeUpper)) {
        return family;
      }
    }
    
    // Par défaut
    return 'Low_Alloy';
  }

  /**
   * Détermine automatiquement le standard d'acier basé sur le grade
   * @param {string} grade - Grade de l'acier
   * @returns {string} Standard d'acier
   */
  determineSteelStandard(grade) {
    if (!grade) return 'OTHER';
    
    const gradeUpper = grade.toUpperCase();
    
    // Patterns pour détecter le standard
    const patterns = {
      'AISI_SAE': /^(AISI|SAE|[0-9]{4}[A-Z]?$)/i,
      'EN': /^(EN|[0-9]+[A-Z]+[0-9]|X[0-9]|C[0-9]{2}E)/i,
      'DIN': /^(DIN|[0-9]\.[0-9]{4})/i,
      'JIS': /^(JIS|SC[MR]|SNC)/i,
      'ASTM': /^(ASTM|A[0-9])/i,
      'BS': /^(BS|[0-9]{3}M[0-9])/i,
      'AFNOR': /^(XC|Z[0-9])/i
    };
    
    // Tester chaque pattern
    for (const [standard, pattern] of Object.entries(patterns)) {
      if (pattern.test(gradeUpper)) {
        return standard;
      }
    }
    
    // Par défaut OTHER
    return 'OTHER';
  }

  /**
   * Normalise le nom du pays selon les valeurs ENUM attendues
   * @param {string} country - Nom du pays
   * @returns {string} Pays normalisé
   */
  normalizeCountry(country) {
    if (!country || country.trim() === '') return 'OTHER';
    
    const countryMap = {
      'TAÏWAN': 'REPUBLIC_OF_CHINA',
      'TAIWAN': 'REPUBLIC_OF_CHINA',
      'FRANCE': 'FRANCE',
      'USA': 'USA',
      'UK': 'UNITED_KINGDOM',
      'GERMANY': 'GERMANY',
      'ITALY': 'ITALY',
      'SPAIN': 'SPAIN',
      'CHINA': 'CHINA',
      'JAPAN': 'JAPAN',
      'KOREA': 'SOUTH_KOREA',
      'IRELAND': 'REPUBLIC_OF_IRELAND',
      'POLAND': 'POLAND'
    };
    
    const normalized = country.toUpperCase().trim();
    return countryMap[normalized] || 'OTHER';
  }

  /**
   * Point d'entrée principal pour charger les données
   * @param {string} csvFilePath - Chemin vers le fichier CSV
   */
  async loadData(csvFilePath) {
    console.log('🚀 Début du chargement ETL...');
    
    try {
      // 0. Initialiser le cache ENUM
      await this.initializeEnumCache();

      // 1. Charger et parser le CSV
      console.log('📖 Lecture du fichier CSV...');
      const data = await this.readCSV(csvFilePath);
      console.log(`📊 ${data.length} lignes trouvées dans le CSV`);

      // 2. Créer les aciers manquants
      console.log('🔧 Création des aciers manquants...');
      await this.createMissingSteel(data);

      // 3. Créer les clients uniques
      console.log('👥 Création des clients...');
      await this.createClients(data);

      // 4. Créer les commandes (demandes d'essai)
      console.log('📋 Création des commandes...');
      await this.createOrders(data);

      // 5. Créer les pièces uniques
      console.log('🔧 Création des pièces...');
      await this.createParts(data);

      // 6. Créer les tests
      console.log('🧪 Création des tests...');
      await this.createTests(data);

      console.log('✅ Chargement ETL terminé avec succès !');
      console.log(`📈 Statistiques :`);
      console.log(`   - ${this.steelsMap.size} aciers créés/vérifiés`);
      console.log(`   - ${this.clientsMap.size} clients créés`);
      console.log(`   - ${this.ordersMap.size} commandes créées`);
      console.log(`   - ${this.partsMap.size} pièces créées`);
      console.log(`   - ${data.length} tests traités`);
      
      if (this.errors.length > 0) {
        console.log(`⚠️  ${this.errors.length} erreurs rencontrées :`);
        this.errors.forEach((error, index) => {
          console.log(`   ${index + 1}. ${error}`);
        });
      }

    } catch (error) {
      console.error('❌ Erreur lors du chargement ETL :', error);
      throw error;
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
   * Crée les aciers manquants en base
   * @param {Array} data - Données du CSV
   */
  async createMissingSteel(data) {
    // Extraire tous les aciers uniques du CSV
    const uniqueSteel = new Set();
    
    data.forEach(row => {
      const steel = row.acier_canon?.trim() || row.standard?.trim();
      if (steel) {
        uniqueSteel.add(steel);
      }
    });

    console.log(`   📊 ${uniqueSteel.size} aciers uniques trouvés dans le CSV`);

    // Vérifier quels aciers existent déjà
    const existingSteel = await steelService.getAllSteels({ limit: 1000 });
    const existingGrades = new Set(existingSteel.steels.map(s => s.steel?.grade).filter(Boolean));

    let createdCount = 0;
    let familyAddedCount = 0;
    let standardAddedCount = 0;
    
    // Créer les aciers manquants
    for (const grade of uniqueSteel) {
      try {
        if (!existingGrades.has(grade)) {
          // Déterminer automatiquement la famille et le standard
          const autoFamily = this.determineSteelFamily(grade);
          const autoStandard = this.determineSteelStandard(grade);
          
          // Vérifier si la famille existe dans les ENUM, sinon l'ajouter
          const familyAdded = await this.addEnumValueIfNeeded('steels', 'family', autoFamily, this.enumCache.steelFamily);
          if (familyAdded) {
            familyAddedCount++;
          }
          
          // Vérifier si le standard existe dans les ENUM, sinon l'ajouter
          const standardAdded = await this.addEnumValueIfNeeded('steels', 'standard', autoStandard, this.enumCache.steelStandard);
          if (standardAdded) {
            standardAddedCount++;
          }
          
          const steelData = {
            name: `Acier ${grade}`,
            grade: grade,
            family: autoFamily,
            standard: autoStandard,
            description: `Acier importé via ETL le ${new Date().toISOString().split('T')[0]}`,
            equivalents: [],
            chemistery: null,
            elements: null
          };

          const createdSteel = await steelService.createSteel(steelData);
          this.steelsMap.set(grade, createdSteel.id);
          console.log(`   ✅ Acier créé : ${grade} (Famille: ${autoFamily}, Standard: ${autoStandard}, ID: ${createdSteel.id})`);
          createdCount++;
        } else {
          // Récupérer l'ID de l'acier existant
          const existingSteelData = existingSteel.steels.find(s => s.steel?.grade === grade);
          if (existingSteelData) {
            this.steelsMap.set(grade, existingSteelData.id);
            console.log(`   ✓ Acier existant : ${grade} (ID: ${existingSteelData.id})`);
          }
        }
      } catch (error) {
        const errorMsg = `Erreur création acier "${grade}": ${error.message}`;
        console.error(`   ❌ ${errorMsg}`);
        this.errors.push(errorMsg);
      }
    }

    console.log(`   📈 ${createdCount} nouveaux aciers créés, ${uniqueSteel.size - createdCount} aciers existants`);
    if (familyAddedCount > 0) {
      console.log(`   🔧 ${familyAddedCount} nouvelles familles d'acier ajoutées aux ENUM`);
    }
    if (standardAddedCount > 0) {
      console.log(`   🔧 ${standardAddedCount} nouveaux standards d'acier ajoutés aux ENUM`);
    }
  }

  /**
   * DEPRECATED - Ne plus utiliser, géré automatiquement
   * @param {Array} data - Données du CSV
   */
  async createMissingDesignationEnums(data) {
    // Extraire toutes les désignations uniques du CSV
    const uniqueDesignations = new Set();
    
    data.forEach(row => {
      const designation = row.designation?.trim();
      if (designation) {
        uniqueDesignations.add(designation);
      }
    });

    console.log(`   📊 ${uniqueDesignations.size} désignations uniques trouvées dans le CSV`);

    if (uniqueDesignations.size === 0) {
      console.log(`   ✓ Aucune désignation à traiter`);
      return;
    }

    try {
      // Récupérer les valeurs ENUM existantes pour parts.designation
      const existingEnums = await EnumModel.getEnumValues('parts', 'designation');
      const existingValues = new Set(existingEnums.values || []);

      let addedCount = 0;
      // Ajouter les valeurs manquantes
      for (const designation of uniqueDesignations) {
        if (!existingValues.has(designation)) {
          try {
            // Construire la requête SQL pour ajouter la valeur ENUM
            const currentValues = Array.from(existingValues);
            const newValues = [...currentValues, designation];
            const enumDefinition = newValues.map(val => `'${val.replace(/'/g, "''")}'`).join(',');
            const query = `ALTER TABLE parts MODIFY COLUMN designation ENUM(${enumDefinition})`;
            
            await node.sequelize.query(query);
            existingValues.add(designation);
            
            console.log(`   ✅ ENUM designation ajouté : ${designation}`);
            addedCount++;
          } catch (error) {
            const errorMsg = `Erreur ajout ENUM designation "${designation}": ${error.message}`;
            console.error(`   ❌ ${errorMsg}`);
            this.errors.push(errorMsg);
          }
        } else {
          console.log(`   ✓ ENUM designation existant : ${designation}`);
        }
      }

      console.log(`   📈 ${addedCount} nouvelles valeurs ENUM ajoutées, ${uniqueDesignations.size - addedCount} valeurs existantes`);
    } catch (error) {
      const errorMsg = `Erreur lors de la gestion des ENUMs designation: ${error.message}`;
      console.error(`   ❌ ${errorMsg}`);
      this.errors.push(errorMsg);
    }
  }

  /**
   * Extrait et crée tous les clients uniques
   * @param {Array} data - Données du CSV
   */
  async createClients(data) {
    // Extraire les clients uniques
    const uniqueClients = new Map();
    let countryAddedCount = 0;
    
    data.forEach(row => {
      const clientName = row.client?.trim();
      const country = row.country?.trim();
      const city = row.city?.trim();
      
      if (clientName && !uniqueClients.has(clientName)) {
        // Normaliser le pays
        const normalizedCountry = this.normalizeCountry(country);
        
        uniqueClients.set(clientName, {
          name: clientName,
          country: normalizedCountry,
          city: city || null,
          client_group: null,
          address: null,
          description: `Client importé via ETL le ${new Date().toISOString().split('T')[0]}`
        });
      }
    });

    console.log(`   📊 ${uniqueClients.size} clients uniques trouvés`);

    // Créer les clients un par un
    for (const [clientName, clientData] of uniqueClients) {
      try {
        // Vérifier si le pays existe dans les ENUM, sinon l'ajouter
        const countryAdded = await this.addEnumValueIfNeeded('clients', 'country', clientData.country, this.enumCache.clientCountry);
        if (countryAdded) {
          countryAddedCount++;
        }
        
        const createdClient = await clientService.createClient(clientData);
        this.clientsMap.set(clientName, createdClient.id);
        console.log(`   ✅ Client créé : ${clientName} (Pays: ${clientData.country}, ID: ${createdClient.id})`);
      } catch (error) {
        const errorMsg = `Erreur création client "${clientName}": ${error.message}`;
        console.error(`   ❌ ${errorMsg}`);
        this.errors.push(errorMsg);
      }
    }
    
    if (countryAddedCount > 0) {
      console.log(`   🔧 ${countryAddedCount} nouveaux pays ajoutés aux ENUM`);
    }
  }

  /**
   * Crée les commandes (demandes d'essai) pour chaque client
   * @param {Array} data - Données du CSV
   */
  async createOrders(data) {
    // Grouper par client pour créer une commande par client
    const clientOrders = new Map();
    
    data.forEach(row => {
      const clientName = row.client?.trim();
      if (clientName && this.clientsMap.has(clientName)) {
        if (!clientOrders.has(clientName)) {
          clientOrders.set(clientName, {
            clientName,
            clientId: this.clientsMap.get(clientName),
            testCount: 1
          });
        } else {
          clientOrders.get(clientName).testCount++;
        }
      }
    });

    console.log(`   📊 ${clientOrders.size} commandes à créer`);

    // Créer une commande par client
    for (const [clientName, orderInfo] of clientOrders) {
      try {
        const orderData = {
          parent_id: orderInfo.clientId, // La commande est enfant du client
          name: `Demande d'essai - ${clientName}`,
          description: `Demande d'essai importée via ETL (${orderInfo.testCount} tests)`,
          order_date: new Date().toISOString().split('T')[0], // Date d'aujourd'hui
          commercial: 'ETL Import',
          contacts: null
        };

        const createdOrder = await orderService.createOrder(orderData);
        this.ordersMap.set(clientName, createdOrder.id);
        console.log(`   ✅ Commande créée pour ${clientName} (ID: ${createdOrder.id})`);
      } catch (error) {
        const errorMsg = `Erreur création commande pour "${clientName}": ${error.message}`;
        console.error(`   ❌ ${errorMsg}`);
        this.errors.push(errorMsg);
      }
    }
  }

  /**
   * Extrait et crée toutes les pièces uniques
   * @param {Array} data - Données du CSV
   */
  async createParts(data) {
    // Extraire les pièces uniques basées sur designation + client_designation
    const uniqueParts = new Map();
    
    data.forEach(row => {
      const designation = row.designation?.trim();
      const clientDesignation = row.client_designation?.trim();
      const clientName = row.client?.trim();
      
      if (designation && clientName && this.ordersMap.has(clientName)) {
        // Créer une clé unique pour la pièce
        const partKey = `${designation}_${clientDesignation || 'NO_CLIENT_DESIGNATION'}_${clientName}`;
        
        if (!uniqueParts.has(partKey)) {
          // Parser les dimensions JSON
          let dimensions = {};
          try {
            if (row.dimensions_json) {
              dimensions = JSON.parse(row.dimensions_json);
            }
          } catch (e) {
            console.warn(`   ⚠️  Erreur parsing dimensions pour ${partKey}`);
          }

          // Parser les spécifications
          let specifications = {};
          try {
            if (row.specifications) {
              if (typeof row.specifications === 'string' && row.specifications.startsWith('{')) {
                specifications = JSON.parse(row.specifications);
              } else {
                specifications = { value: row.specifications };
              }
            }
          } catch (e) {
            console.warn(`   ⚠️  Erreur parsing spécifications pour ${partKey}`);
          }

          // Utiliser une valeur ENUM valide pour designation 
          const enumDesignation = designation ? (
            designation.includes('Gear') ? 'Gear' : 
            designation.includes('Ring') ? 'Ring' :
            designation.includes('Shaft') ? 'Shaft' :
            designation.includes('Hub') ? 'Hub' :
            designation.includes('Tool') ? 'Tool' :
            designation.includes('Housing') ? 'Housing' :
            designation.includes('Clip') ? 'Clip' :
            designation.includes('Bushing') ? 'Bushing' :
            designation.includes('Piston') ? 'Piston' :
            designation.includes('Sample') ? 'Sample' :
            'Other'
          ) : 'Other';

          uniqueParts.set(partKey, {
            parent_id: this.ordersMap.get(clientName), // La pièce est enfant de la commande
            designation: enumDesignation, // Valeur ENUM valide
            clientDesignation: clientDesignation || null,
            dimensions: dimensions,
            specifications: specifications,
            steel: row.acier_canon?.trim() || row.standard?.trim() || null,
            description: `Pièce importée via ETL`,
            reference: null, // Laissé vide comme demandé
            quantity: null   // Laissé vide comme demandé
          });
        }
      }
    });

    console.log(`   📊 ${uniqueParts.size} pièces uniques trouvées`);

    let designationAddedCount = 0;
    
    // Créer les pièces une par une
    for (const [partKey, partData] of uniqueParts) {
      try {
        // Vérifier si la désignation existe dans les ENUM, sinon l'ajouter
        const designationAdded = await this.addEnumValueIfNeeded('parts', 'designation', partData.designation, this.enumCache.partDesignation);
        if (designationAdded) {
          designationAddedCount++;
        }
        
        const createdPart = await partService.createPart(partData);
        this.partsMap.set(partKey, createdPart.id);
        console.log(`   ✅ Pièce créée : ${partData.designation} (ID: ${createdPart.id})`);
      } catch (error) {
        const errorMsg = `Erreur création pièce "${partKey}": ${error.message}`;
        console.error(`   ❌ ${errorMsg}`);
        this.errors.push(errorMsg);
      }
    }
    
    if (designationAddedCount > 0) {
      console.log(`   🔧 ${designationAddedCount} nouvelles désignations ajoutées aux ENUM`);
    }
  }

  /**
   * Crée tous les tests associés à leurs pièces
   * @param {Array} data - Données du CSV
   */
  async createTests(data) {
    console.log(`   📊 ${data.length} tests à créer`);

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      
      try {
        const clientName = row.client?.trim();
        const designation = row.designation?.trim();
        const clientDesignation = row.client_designation?.trim();
        
        if (!clientName || !designation) {
          this.errors.push(`Ligne ${i + 1}: Client ou désignation manquant`);
          continue;
        }

        // Retrouver la pièce correspondante
        const partKey = `${designation}_${clientDesignation || 'NO_CLIENT_DESIGNATION'}_${clientName}`;
        const partId = this.partsMap.get(partKey);
        
        if (!partId) {
          this.errors.push(`Ligne ${i + 1}: Pièce non trouvée pour ${partKey}`);
          continue;
        }

        // Parser les données JSON
        let loadData = null;
        let recipeData = null;
        let resultsData = null;
        let quenchData = null;

        // Nettoyer et parser les JSON
        if (row.load_data) {
          try {
            let cleaned = row.load_data.trim();
            if (cleaned.startsWith('"""') && cleaned.endsWith('"""')) {
              cleaned = cleaned.slice(3, -3);
            } else if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
              cleaned = cleaned.slice(1, -1);
            }
            cleaned = cleaned.replace(/\\?""/g, '"');
            loadData = JSON.parse(cleaned);
          } catch (e) {
            console.warn(`   ⚠️  Erreur parsing load_data ligne ${i + 1}`);
          }
        }

        if (row.recipe_data) {
          try {
            let cleaned = row.recipe_data.trim();
            if (cleaned.startsWith('"""') && cleaned.endsWith('"""')) {
              cleaned = cleaned.slice(3, -3);
              cleaned = cleaned.replace(/\\"/g, '"');
            } else if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
              cleaned = cleaned.slice(1, -1);
              // Pour les quotes simples, remplacer AUSSI les antislash échappés
              cleaned = cleaned.replace(/\\"/g, '"');
              cleaned = cleaned.replace(/""/g, '"');
            }
            recipeData = JSON.parse(cleaned);
          } catch (e) {
            // Ignorer silencieusement les erreurs JSON
          }
        }

        // ✅ CORRECTION : Ajouter le numéro de recette aux données (champ "number")
        if (row.recipe) {
          if (!recipeData) {
            recipeData = {};
          }
          recipeData.number = row.recipe; // ✅ Utiliser le bon champ "number" comme dans l'interface
        }

        if (row.results_data) {
          try {
            let cleaned = row.results_data.trim();
            if (cleaned.startsWith('"""') && cleaned.endsWith('"""')) {
              cleaned = cleaned.slice(3, -3);
            } else if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
              cleaned = cleaned.slice(1, -1);
            }
            cleaned = cleaned.replace(/\\?""/g, '"');
            resultsData = JSON.parse(cleaned);
          } catch (e) {
            console.warn(`   ⚠️  Erreur parsing results_data ligne ${i + 1}`);
          }
        }

        if (row.quench_data) {
          try {
            let cleaned = row.quench_data.trim();
            if (cleaned.startsWith('"""') && cleaned.endsWith('"""')) {
              cleaned = cleaned.slice(3, -3);
              cleaned = cleaned.replace(/\\"/g, '"');
            } else if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
              cleaned = cleaned.slice(1, -1);
              // Pour les quotes simples, remplacer AUSSI les antislash échappés
              cleaned = cleaned.replace(/\\"/g, '"');
              cleaned = cleaned.replace(/""/g, '"');
            }
            quenchData = JSON.parse(cleaned);
          } catch (e) {
            // Ignorer silencieusement les erreurs JSON
          }
        }

        // Fonction pour parser et valider les dates
        const parseTestDate = (dateString) => {
          if (!dateString) return null;
          
          try {
            // Essayer différents formats de date
            const date = new Date(dateString);
            
            // Vérifier si la date est valide
            if (isNaN(date.getTime())) {
              // Essayer de parser d'autres formats
              const dateFormats = [
                // Format ISO
                /^\d{4}-\d{2}-\d{2}$/,
                // Format français
                /^\d{2}\/\d{2}\/\d{4}$/,
                // Format américain
                /^\d{2}-\d{2}-\d{4}$/
              ];
              
              for (const format of dateFormats) {
                if (format.test(dateString.trim())) {
                  let parsedDate;
                  if (dateString.includes('/')) {
                    // Format DD/MM/YYYY
                    const parts = dateString.split('/');
                    parsedDate = new Date(parts[2], parts[1] - 1, parts[0]);
                  } else if (dateString.includes('-') && dateString.length === 10) {
                    // Format DD-MM-YYYY ou YYYY-MM-DD
                    const parts = dateString.split('-');
                    if (parts[0].length === 4) {
                      // YYYY-MM-DD
                      parsedDate = new Date(parts[0], parts[1] - 1, parts[2]);
                    } else {
                      // DD-MM-YYYY
                      parsedDate = new Date(parts[2], parts[1] - 1, parts[0]);
                    }
                  }
                  
                  if (parsedDate && !isNaN(parsedDate.getTime())) {
                    return parsedDate.toISOString().split('T')[0];
                  }
                }
              }
              
              return null; // Date non parsable
            }
            
            return date.toISOString().split('T')[0];
          } catch (error) {
            return null;
          }
        };

        // Préparer les données du test
        const testData = {
          parent_id: partId, // Le test est enfant de la pièce
          name: `Test ${row.load || `Test_${i + 1}`}`,
          description: `Test importé via ETL - ${row.file || ''}`,
          test_code: row.id || null,
          load_number: row.load || null,
          test_date: parseTestDate(row.date || row.created_on), // ✅ CORRECTION : Utiliser row.date en priorité
          status: 'Pending', // Statut par défaut
          location: 'ECM',   // Location par défaut
          load_data: loadData,
          recipe_data: recipeData,
          quench_data: quenchData,
          results_data: resultsData
        };

        const createdTest = await testService.createTest(testData);
        console.log(`   ✅ Test créé : ${testData.name} (ID: ${createdTest.id})`);

      } catch (error) {
        const errorMsg = `Erreur création test ligne ${i + 1}: ${error.message}`;
        console.error(`   ❌ ${errorMsg}`);
        this.errors.push(errorMsg);
      }
    }
  }
}

/**
 * Fonction principale d'exécution
 */
async function main() {
  if (process.argv.length < 3) {
    console.error('Usage: node etl-load-data.js <chemin-vers-fichier-csv>');
    process.exit(1);
  }

  const csvFilePath = process.argv[2];
  const etlLoader = new ETLLoader();

  try {
    await etlLoader.loadData(csvFilePath);
    console.log('🎉 ETL terminé avec succès !');
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

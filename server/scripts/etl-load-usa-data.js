/**
 * Script ETL pour charger les données USA depuis un fichier CSV
 * Utilise les services existants pour créer clients, commandes, pièces et tests
 * Version adaptée pour le format de données américaines
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
const { node, enum: EnumModel } = require('../models');

class ETLUSALoader {
  constructor() {
    this.clientsMap = new Map(); // Map pour stocker client_name -> client_id
    this.ordersMap = new Map();  // Map pour stocker order_key -> order_id
    this.partsMap = new Map();   // Map pour stocker part_key -> part_id
    this.steelsMap = new Map();  // Map pour stocker steel_grade -> steel_id
    this.processedData = [];
    this.errors = [];
  }

  /**
   * Point d'entrée principal pour charger les données USA
   * @param {string} csvFilePath - Chemin vers le fichier CSV
   */
  async loadData(csvFilePath) {
    console.log('🇺🇸 Début du chargement ETL USA...');
    
    try {
      // 1. Charger et parser le CSV
      console.log('📖 Lecture du fichier CSV USA...');
      const data = await this.readCSV(csvFilePath);
      console.log(`📊 ${data.length} lignes trouvées dans le CSV`);

      // 2. Créer les aciers manquants
      console.log('🔧 Création des aciers USA manquants...');
      await this.createMissingSteel(data);

      // 3. Créer les valeurs ENUM manquantes pour designation
      console.log('📝 Création des ENUMs designation USA manquants...');
      await this.createMissingDesignationEnums(data);

      // 4. Créer tous les clients uniques (USA)
      console.log('👥 Création des clients USA...');
      await this.createClients(data);

      // 5. Créer les commandes (demandes d'essai)
      console.log('📋 Création des commandes...');
      await this.createOrders(data);

      // 6. Créer les pièces uniques
      console.log('🔧 Création des pièces...');
      await this.createParts(data);

      // 7. Créer les tests
      console.log('🧪 Création des tests...');
      await this.createTests(data);

      console.log('✅ Chargement ETL USA terminé avec succès !');
      console.log(`📈 Statistiques :`);
      console.log(`   - ${this.steelsMap.size} aciers USA créés/vérifiés`);
      console.log(`   - ${this.clientsMap.size} clients USA créés`);
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
      console.error('❌ Erreur lors du chargement ETL USA :', error);
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
   * Crée les aciers USA manquants en base
   * @param {Array} data - Données du CSV
   */
  async createMissingSteel(data) {
    // Extraire tous les aciers uniques du CSV USA
    const uniqueSteel = new Set();
    
    data.forEach(row => {
      const steel = row.acier_canon?.trim(); // ✅ Bon nom de colonne pour USA
      if (steel) {
        uniqueSteel.add(steel);
      }
    });

    console.log(`   📊 ${uniqueSteel.size} aciers USA uniques trouvés dans le CSV`);

    // Vérifier quels aciers existent déjà
    const existingSteel = await steelService.getAllSteels({ limit: 1000 });
    const existingGrades = new Set(existingSteel.steels.map(s => s.steel?.grade).filter(Boolean));

    let createdCount = 0;
    // Créer les aciers manquants
    for (const grade of uniqueSteel) {
      try {
        if (!existingGrades.has(grade)) {
          // Tronquer le grade à 50 caractères max pour respecter la contrainte DB
          const truncatedGrade = grade.length > 50 ? grade.substring(0, 47) + '...' : grade;
          
          const steelData = {
            name: `Acier USA ${truncatedGrade}`,
            grade: truncatedGrade,
            // Utiliser une valeur par défaut existante pour family
        family: 'Low_Alloy', // Valeur ENUM existante par défaut (DB)
            standard: 'AISI_SAE',  // ✅ Valeur ENUM valide selon la DB
            description: `Acier USA importé via ETL le ${new Date().toISOString().split('T')[0]}. Grade original: ${grade}`,
            equivalents: [],
            chemistery: null,
            elements: null
          };

          const createdSteel = await steelService.createSteel(steelData);
          this.steelsMap.set(grade, createdSteel.id);  // Map avec le grade original
          this.steelsMap.set(truncatedGrade, createdSteel.id);  // Map aussi avec le grade tronqué 
          console.log(`   ✅ Acier USA créé : ${truncatedGrade} (ID: ${createdSteel.id})`);
          createdCount++;
        } else {
          // Récupérer l'ID de l'acier existant
          const existingSteelData = existingSteel.steels.find(s => s.steel?.grade === grade);
          if (existingSteelData) {
            this.steelsMap.set(grade, existingSteelData.id);
            console.log(`   ✓ Acier USA existant : ${grade} (ID: ${existingSteelData.id})`);
          }
        }
      } catch (error) {
        const errorMsg = `Erreur création acier USA "${grade}": ${error.message}`;
        console.error(`   ❌ ${errorMsg}`);
        this.errors.push(errorMsg);
      }
    }

    console.log(`   📈 ${createdCount} nouveaux aciers USA créés, ${uniqueSteel.size - createdCount} aciers existants`);
  }

  /**
   * Crée les valeurs ENUM USA manquantes pour la colonne designation
   * @param {Array} data - Données du CSV
   */
  async createMissingDesignationEnums(data) {
    // Extraire toutes les désignations uniques du CSV USA
    const uniqueDesignations = new Set();
    
    data.forEach(row => {
      const designation = row.client_designation?.trim();
      if (designation) {
        uniqueDesignations.add(designation);
      }
    });

    console.log(`   📊 ${uniqueDesignations.size} désignations USA uniques trouvées dans le CSV`);

    if (uniqueDesignations.size === 0) {
      console.log(`   ✓ Aucune désignation USA à traiter`);
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
            
            console.log(`   ✅ ENUM designation USA ajouté : ${designation}`);
            addedCount++;
          } catch (error) {
            const errorMsg = `Erreur ajout ENUM designation USA "${designation}": ${error.message}`;
            console.error(`   ❌ ${errorMsg}`);
            this.errors.push(errorMsg);
          }
        } else {
          console.log(`   ✓ ENUM designation USA existant : ${designation}`);
        }
      }

      console.log(`   📈 ${addedCount} nouvelles valeurs ENUM USA ajoutées, ${uniqueDesignations.size - addedCount} valeurs existantes`);
    } catch (error) {
      const errorMsg = `Erreur lors de la gestion des ENUMs designation USA: ${error.message}`;
      console.error(`   ❌ ${errorMsg}`);
      this.errors.push(errorMsg);
    }
  }

  /**
   * Fonction utilitaire pour parser les colonnes JSON de manière robuste
   * @param {string} jsonString - Chaîne JSON à parser
   * @param {string} columnName - Nom de la colonne (pour debug)
   * @returns {Object|null} Objet parsé ou null si erreur/vide
   */
  parseJsonColumn(jsonString, columnName = '') {
    if (!jsonString || jsonString.trim() === '' || jsonString === 'NULL') {
      return null;
    }

    try {
      let cleaned = jsonString.trim();
      
      // Cas 1: Triple quotes avec antislash échappé ("""JSON""")
      if (cleaned.startsWith('"""') && cleaned.endsWith('"""')) {
        cleaned = cleaned.slice(3, -3);
        cleaned = cleaned.replace(/\\"/g, '"');
      }
      // Cas 2: Quotes simples avec double quote échappé ("JSON")
      else if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
        cleaned = cleaned.slice(1, -1);
        cleaned = cleaned.replace(/\\"/g, '"');
        cleaned = cleaned.replace(/""/g, '"');
      }
      
      return JSON.parse(cleaned);
    } catch (e) {
      // Ignorer silencieusement les erreurs JSON comme dans l'original
      return null;
    }
  }

  /**
   * Extrait et crée tous les clients uniques (USA)
   * @param {Array} data - Données du CSV
   */
  async createClients(data) {
    // Extraire les clients uniques (colonne 'clients' au lieu de 'client')
    const uniqueClients = new Map();
    
    data.forEach(row => {
      const clientName = row.clients?.trim(); // Nouveau nom de colonne
      
      if (clientName && !uniqueClients.has(clientName)) {
        uniqueClients.set(clientName, {
          name: clientName,
          country: 'USA', // Fixé à USA comme demandé
          city: null,     // Pas d'info ville dans le nouveau format
          client_group: null,
          address: null,
          description: `Client USA importé via ETL le ${new Date().toISOString().split('T')[0]}`
        });
      }
    });

    console.log(`   📊 ${uniqueClients.size} clients USA uniques trouvés`);

    // Créer les clients un par un
    for (const [clientName, clientData] of uniqueClients) {
      try {
        // Vérifier si le client existe déjà
        const existingClient = await clientService.getAllClients({ search: clientName });
        let clientId;
        
        if (existingClient.clients && existingClient.clients.length > 0) {
          // Client existe déjà, utiliser son ID
          const foundClient = existingClient.clients.find(c => c.name === clientName);
          if (foundClient) {
            clientId = foundClient.id;
            this.clientsMap.set(clientName, clientId);
            console.log(`   ✓ Client USA existant : ${clientName} (ID: ${clientId})`);
          } else {
            // Créer le client
            const createdClient = await clientService.createClient(clientData);
            clientId = createdClient.id;
            this.clientsMap.set(clientName, clientId);
            console.log(`   ✅ Client USA créé : ${clientName} (ID: ${clientId})`);
          }
        } else {
          // Créer le client
          const createdClient = await clientService.createClient(clientData);
          clientId = createdClient.id;
          this.clientsMap.set(clientName, clientId);
          console.log(`   ✅ Client USA créé : ${clientName} (ID: ${clientId})`);
        }
      } catch (error) {
        // Si erreur "déjà existant", tenter de récupérer l'ID
        if (error.message.includes('existe déjà')) {
          try {
            const existingClient = await clientService.getAllClients({ search: clientName });
            if (existingClient.clients && existingClient.clients.length > 0) {
              const foundClient = existingClient.clients.find(c => c.name === clientName);
              if (foundClient) {
                this.clientsMap.set(clientName, foundClient.id);
                console.log(`   ✓ Client USA récupéré : ${clientName} (ID: ${foundClient.id})`);
                continue;
              }
            }
          } catch (searchError) {
            console.error(`   ❌ Erreur récupération client "${clientName}": ${searchError.message}`);
          }
        }
        
        const errorMsg = `Erreur création client USA "${clientName}": ${error.message}`;
        console.error(`   ❌ ${errorMsg}`);
        this.errors.push(errorMsg);
      }
    }
  }

  /**
   * Crée les commandes (demandes d'essai) pour chaque client USA
   * @param {Array} data - Données du CSV
   */
  async createOrders(data) {
    // Grouper par client pour créer une commande par client
    const clientOrders = new Map();
    
    data.forEach(row => {
      const clientName = row.clients?.trim(); // Nouveau nom de colonne
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

    console.log(`   📊 ${clientOrders.size} commandes USA à créer`);

    // Créer une commande par client
    for (const [clientName, orderInfo] of clientOrders) {
      try {
        const orderData = {
          parent_id: orderInfo.clientId, // La commande est enfant du client
          name: `Demande d'essai USA - ${clientName}`,
          description: `Demande d'essai USA importée via ETL (${orderInfo.testCount} tests)`,
          order_date: new Date().toISOString().split('T')[0], // Date d'aujourd'hui
          commercial: 'ETL USA Import',
          contacts: null
        };

        const createdOrder = await orderService.createOrder(orderData);
        this.ordersMap.set(clientName, createdOrder.id);
        console.log(`   ✅ Commande USA créée pour ${clientName} (ID: ${createdOrder.id})`);
      } catch (error) {
        const errorMsg = `Erreur création commande USA pour "${clientName}": ${error.message}`;
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
    // Extraire les pièces uniques basées sur client_designation + client
    const uniqueParts = new Map();
    
    data.forEach(row => {
      const clientDesignation = row.client_designation?.trim();
      const clientName = row.clients?.trim(); // Nouveau nom de colonne
      const steel = row.acier_canon?.trim(); // ✅ Bon nom de colonne pour USA
      
      if (clientName && this.ordersMap.has(clientName)) {
        // Créer une clé unique pour la pièce
        const partKey = `${clientDesignation || 'NO_DESIGNATION'}_${clientName}`;
        
        if (!uniqueParts.has(partKey)) {
          // Parser les dimensions JSON
          let dimensions = {};
          try {
            if (row.dimensions) {
              dimensions = this.parseJsonColumn(row.dimensions, 'dimensions') || {};
            }
          } catch (e) {
            console.warn(`   ⚠️  Erreur parsing dimensions pour ${partKey}`);
          }

          // Parser les spécifications
          let specifications = {};
          try {
            if (row.specifications) {
              const parsed = this.parseJsonColumn(row.specifications, 'specifications');
              if (parsed) {
                specifications = parsed;
              } else if (typeof row.specifications === 'string') {
                specifications = { value: row.specifications };
              }
            }
          } catch (e) {
            console.warn(`   ⚠️  Erreur parsing spécifications pour ${partKey}`);
          }

          // Utiliser une valeur ENUM valide pour designation 
          const enumDesignation = clientDesignation ? (
            clientDesignation.includes('Gear') ? 'Gear' : 
            clientDesignation.includes('Ring') ? 'Ring' :
            clientDesignation.includes('Shaft') ? 'Shaft' :
            clientDesignation.includes('Hub') ? 'Hub' :
            clientDesignation.includes('Tool') ? 'Tool' :
            clientDesignation.includes('Housing') ? 'Housing' :
            clientDesignation.includes('Clip') ? 'Clip' :
            clientDesignation.includes('Bushing') ? 'Bushing' :
            clientDesignation.includes('Piston') ? 'Piston' :
            clientDesignation.includes('Sample') ? 'Sample' :
            'Other'
          ) : 'Other';

          uniqueParts.set(partKey, {
            parent_id: this.ordersMap.get(clientName), // La pièce est enfant de la commande
            designation: enumDesignation, // Valeur ENUM valide
            clientDesignation: clientDesignation || null,
            dimensions: dimensions,
            specifications: specifications,
            steel: steel || null, // Nouvelle colonne 'steel'
            description: `Pièce USA importée via ETL`,
            reference: row.reference || null,
            quantity: null   // Laissé vide comme demandé
          });
        }
      }
    });

    console.log(`   📊 ${uniqueParts.size} pièces USA uniques trouvées`);

    // Créer les pièces une par une
    for (const [partKey, partData] of uniqueParts) {
      try {
        const createdPart = await partService.createPart(partData);
        this.partsMap.set(partKey, createdPart.id);
        console.log(`   ✅ Pièce USA créée : ${partData.designation} (ID: ${createdPart.id})`);
      } catch (error) {
        const errorMsg = `Erreur création pièce USA "${partKey}": ${error.message}`;
        console.error(`   ❌ ${errorMsg}`);
        this.errors.push(errorMsg);
      }
    }
  }

  /**
   * Crée tous les tests associés à leurs pièces
   * @param {Array} data - Données du CSV
   */
  async createTests(data) {
    console.log(`   📊 ${data.length} tests USA à créer`);

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      
      try {
        const clientName = row.clients?.trim(); // Nouveau nom de colonne
        const clientDesignation = row.client_designation?.trim();
        
        if (!clientName) {
          this.errors.push(`Ligne ${i + 1}: Client manquant`);
          continue;
        }

        // Retrouver la pièce correspondante
        const partKey = `${clientDesignation || 'NO_DESIGNATION'}_${clientName}`;
        const partId = this.partsMap.get(partKey);
        
        if (!partId) {
          this.errors.push(`Ligne ${i + 1}: Pièce non trouvée pour ${partKey}`);
          continue;
        }

        // Parser les données JSON avec la fonction robuste
        const loadData = this.parseJsonColumn(row.load_data, 'load_data');
        const recipeData = this.parseJsonColumn(row.recipe_data, 'recipe_data');
        const resultsData = this.parseJsonColumn(row.results_data, 'results_data');
        const quenchData = this.parseJsonColumn(row.quench_data, 'quench_data');

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
          name: `Test USA ${row.load_number || `Test_${i + 1}`}`,
          description: `Test USA importé via ETL - ${row.file || ''}`,
          test_code: row.id || null,
          load_number: row.load_number || null, // Utilise la nouvelle colonne
          test_date: parseTestDate(row.created_on) || new Date().toISOString().split('T')[0],
          status: 'Pending', // Statut par défaut
          location: 'Client site',   // Valeur ENUM valide pour USA
          load_data: loadData,
          recipe_data: recipeData,
          quench_data: quenchData,
          results_data: resultsData
        };

        const createdTest = await testService.createTest(testData);
        console.log(`   ✅ Test USA créé : ${testData.name} (ID: ${createdTest.id})`);

      } catch (error) {
        const errorMsg = `Erreur création test USA ligne ${i + 1}: ${error.message}`;
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
    console.error('Usage: node etl-load-usa-data.js <chemin-vers-fichier-csv>');
    process.exit(1);
  }

  const csvFilePath = process.argv[2];
  const etlLoader = new ETLUSALoader();

  try {
    await etlLoader.loadData(csvFilePath);
    console.log('🎉 ETL USA terminé avec succès !');
    process.exit(0);
  } catch (error) {
    console.error('💥 Erreur fatale ETL USA :', error);
    process.exit(1);
  }
}

// Exécution si le script est appelé directement
if (require.main === module) {
  main();
}

module.exports = ETLUSALoader;
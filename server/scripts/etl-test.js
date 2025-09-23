/**
 * Script d'exemple pour tester le chargement ETL
 * Ce script crée un fichier CSV d'exemple et exécute le chargement
 */

const fs = require('fs');
const path = require('path');
const ETLLoader = require('./etl-load-data');

// Données d'exemple pour tester
const sampleData = [
  {
    id: 'TEST001',
    file: 'test-file-1.pdf',
    load: 'LOAD001',
    date: '2024-01-15',
    recipe: 'Recipe A',
    client: 'ACME Corp',
    country: 'FRANCE',
    city: 'Paris',
    specifications: '{"hardness": "45-50 HRC", "temperature": "850°C"}',
    acier_canon: '42CrMo4',
    standard: 'EN 10083',
    designation: 'Gear',
    client_designation: 'Gear-Type-A',
    dimensions_json: '{"diameter": 50, "length": 100, "weight": 2.5}',
    results_data: '{"hardness_measured": "47 HRC", "status": "OK"}',
    recipe_data: '{"temperature": 850, "time": 120, "atmosphere": "N2"}',
    load_data: '{"furnace": "F001", "position": "rack_1", "quantity": 10}',
    created_on: '2024-01-15',
    updated_on: '2024-01-15'
  },
  {
    id: 'TEST002',
    file: 'test-file-2.pdf',
    load: 'LOAD002',
    date: '2024-01-16',
    recipe: 'Recipe B',
    client: 'TechnoSteel',
    country: 'GERMANY',
    city: 'Munich',
    specifications: '{"hardness": "40-45 HRC", "treatment": "Quenching + Tempering"}',
    acier_canon: '16MnCr5',
    standard: 'DIN 17210',
    designation: 'Shaft',
    client_designation: 'Drive-Shaft-B12',
    dimensions_json: '{"diameter": 30, "length": 200, "weight": 1.8}',
    results_data: '{"hardness_measured": "43 HRC", "status": "OK"}',
    recipe_data: '{"temperature": 820, "time": 90, "atmosphere": "Air"}',
    load_data: '{"furnace": "F002", "position": "hanging", "quantity": 5}',
    created_on: '2024-01-16',
    updated_on: '2024-01-16'
  },
  {
    id: 'TEST003',
    file: 'test-file-3.pdf',
    load: 'LOAD001',
    date: '2024-01-15',
    recipe: 'Recipe A',
    client: 'ACME Corp',
    country: 'FRANCE',
    city: 'Paris',
    specifications: '{"hardness": "45-50 HRC", "temperature": "850°C"}',
    acier_canon: '42CrMo4',
    standard: 'EN 10083',
    designation: 'Hub',
    client_designation: 'Hub-Type-C',
    dimensions_json: '{"outer_diameter": 80, "inner_diameter": 40, "height": 60}',
    results_data: '{"hardness_measured": "48 HRC", "status": "OK"}',
    recipe_data: '{"temperature": 850, "time": 120, "atmosphere": "N2"}',
    load_data: '{"furnace": "F001", "position": "rack_2", "quantity": 8}',
    created_on: '2024-01-15',
    updated_on: '2024-01-15'
  }
];

/**
 * Crée un fichier CSV d'exemple
 */
function createSampleCSV() {
  const csvPath = path.join(__dirname, 'sample-data.csv');
  
  // En-têtes CSV
  const headers = [
    'id', 'file', 'load', 'date', 'recipe', 'client', 'country', 'city',
    'specifications', 'acier_canon', 'standard', 'designation',
    'client_designation', 'dimensions_json', 'results_data', 'recipe_data',
    'load_data', 'created_on', 'updated_on'
  ];
  
  // Convertir les données en CSV
  const csvContent = [
    headers.join(','),
    ...sampleData.map(row => 
      headers.map(header => {
        const value = row[header] || '';
        // Échapper les guillemets et entourer de guillemets si nécessaire
        if (value.includes(',') || value.includes('"') || value.includes('\n')) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }).join(',')
    )
  ].join('\n');
  
  fs.writeFileSync(csvPath, csvContent, 'utf8');
  console.log(`✅ Fichier CSV d'exemple créé : ${csvPath}`);
  
  return csvPath;
}

/**
 * Exécute le test complet
 */
async function runETLTest() {
  try {
    console.log('🧪 Test du chargement ETL...\n');
    
    // 1. Créer le fichier CSV d'exemple
    const csvPath = createSampleCSV();
    
    // 2. Exécuter le chargement ETL
    const etlLoader = new ETLLoader();
    await etlLoader.loadData(csvPath);
    
    console.log('\n🎉 Test ETL terminé avec succès !');
    
    // 3. Nettoyer le fichier temporaire
    fs.unlinkSync(csvPath);
    console.log('🧹 Fichier temporaire supprimé');
    
  } catch (error) {
    console.error('❌ Erreur pendant le test ETL :', error);
    process.exit(1);
  }
}

// Exécution si le script est appelé directement
if (require.main === module) {
  runETLTest();
}

module.exports = {
  createSampleCSV,
  runETLTest,
  sampleData
};

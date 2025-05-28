// Script simplifié pour debugger les fichiers
console.log('Démarrage du script de debug...');

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

console.log('Variables d\'environnement chargées');

try {
  const models = require('../models');
  console.log('Modèles chargés avec succès');
  
  const { Node, Order, File, Closure } = models;
  console.log('Modèles extraits:', { Node: !!Node, Order: !!Order, File: !!File, Closure: !!Closure });
  
  async function simpleDebug() {
    try {
      console.log('Test de connexion à la base de données...');
      
      const orderCount = await Node.count({ where: { type: 'order' } });
      console.log(`Nombre d'ordres dans la base: ${orderCount}`);
      
      const fileCount = await File.count();
      console.log(`Nombre de fichiers dans la base: ${fileCount}`);
      
      const tempFileCount = await File.count({ where: { parent_id: null } });
      console.log(`Nombre de fichiers temporaires (sans parent): ${tempFileCount}`);
      
      // Lister les 3 derniers ordres
      console.log('\nDerniers ordres créés:');
      const recentOrders = await Node.findAll({
        where: { type: 'order' },
        include: [{ model: Order, required: false }],
        order: [['created_at', 'DESC']],
        limit: 3
      });
      
      recentOrders.forEach((order, index) => {
        console.log(`${index + 1}. Ordre ID: ${order.id}`);
        console.log(`   Nom: ${order.name}`);
        console.log(`   Parent: ${order.parent_id}`);
        console.log(`   Créé: ${order.created_at}`);
        if (order.Order) {
          console.log(`   Numéro: ${order.Order.order_number}`);
        }
        console.log('');
      });
      
      // Lister les fichiers temporaires récents
      console.log('Fichiers temporaires récents:');
      const tempFiles = await File.findAll({
        where: { parent_id: null },
        order: [['created_at', 'DESC']],
        limit: 5
      });
      
      tempFiles.forEach((file, index) => {
        console.log(`${index + 1}. Fichier ID: ${file.id}`);
        console.log(`   Nom: ${file.original_name}`);
        console.log(`   TempId: ${file.temp_id}`);
        console.log(`   Category: ${file.category}/${file.subcategory}`);
        console.log(`   Créé: ${file.created_at}`);
        console.log('');
      });
      
    } catch (error) {
      console.error('Erreur dans simpleDebug:', error.message);
      console.error('Stack:', error.stack);
    }
  }
  
  simpleDebug().then(() => {
    console.log('Debug terminé');
    process.exit(0);
  }).catch(error => {
    console.error('Erreur fatale:', error);
    process.exit(1);
  });
  
} catch (error) {
  console.error('Erreur lors du chargement des modèles:', error.message);
  process.exit(1);
}

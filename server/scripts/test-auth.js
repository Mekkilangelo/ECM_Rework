/**
 * Script de test pour l'authentification
 * Vérifie la génération et la validation des tokens JWT
 */

const jwt = require('jsonwebtoken');
const config = require('../config/config');
const { generateToken } = require('../config/auth');
const logger = require('../utils/logger');

// Test de génération de token
console.log('=== TEST DE GÉNÉRATION DE TOKEN ===');

// Vérifier que le secret JWT est défini
const JWT_SECRET = config.JWT.SECRET;
console.log(`JWT_SECRET défini: ${!!JWT_SECRET}`);
console.log(`Longueur JWT_SECRET: ${JWT_SECRET ? JWT_SECRET.length : 0} caractères`);

// Créer un utilisateur de test
const testUser = {
  id: 999,
  username: 'test_user',
  role: 'admin'
};

// Générer un token avec l'utilisateur de test
try {
  console.log('Génération d\'un token pour:', testUser.username);
  const token = generateToken(testUser);
  
  // Vérifier le format du token
  const tokenParts = token.split('.');
  console.log(`Token généré: ${token.substring(0, 20)}...${token.substring(token.length - 10)}`);
  console.log(`Structure du token: ${tokenParts.length} segments`);
  
  // Décoder le token pour vérification
  console.log('\n=== VÉRIFICATION DU TOKEN ===');
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log('Token vérifié avec succès:');
    console.log('- ID utilisateur:', decoded.id);
    console.log('- Nom d\'utilisateur:', decoded.username);
    console.log('- Rôle:', decoded.role);
    console.log('- Dernière activité:', new Date(decoded.lastActivity).toISOString());
    console.log('- Date d\'expiration:', new Date(decoded.exp * 1000).toISOString());
  } catch (verifyError) {
    console.error('Erreur de vérification du token:', verifyError.message);
  }
} catch (error) {
  console.error('Erreur lors de la génération du token:', error.message);
}

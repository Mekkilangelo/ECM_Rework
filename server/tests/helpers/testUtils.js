const request = require('supertest');
const { generateToken } = require('../../config/auth');

/**
 * Créer un utilisateur de test
 */
const createTestUser = async (userData = {}) => {
  const User = global.User;
  if (!User) {
    throw new Error('User model not initialized. Make sure setupTestDatabase is called first.');
  }

  const defaultUserData = {
    username: 'testuser',
    password_hash: 'password123',
    role: 'user'
  };

  const user = await User.create({
    ...defaultUserData,
    ...userData
  });

  return user;
};

/**
 * Créer un utilisateur admin de test
 */
const createTestAdmin = async (userData = {}) => {
  return createTestUser({
    username: 'admin',
    role: 'admin',
    ...userData
  });
};

/**
 * Créer un super utilisateur de test
 */
const createTestSuperUser = async (userData = {}) => {
  return createTestUser({
    username: 'superuser',
    role: 'superuser',
    ...userData
  });
};

/**
 * Générer un token JWT pour un utilisateur de test
 */
const getAuthToken = (user) => {
  return generateToken(user);
};

/**
 * Faire une requête authentifiée
 */
const authenticatedRequest = (app, method, url, user) => {
  const token = getAuthToken(user);
  return request(app)[method](url).set('Authorization', `Bearer ${token}`);
};

/**
 * Données utilisateur valides pour les tests
 */
const validUserData = {
  username: 'newuser',
  password: 'password123',
  role: 'user'
};

/**
 * Données utilisateur invalides pour les tests
 */
const invalidUserData = {
  shortPassword: {
    username: 'user1',
    password: '123', // Trop court
    role: 'user'
  },
  missingUsername: {
    password: 'password123',
    role: 'user'
  },
  missingPassword: {
    username: 'user2',
    role: 'user'
  },
  invalidRole: {
    username: 'user3',
    password: 'password123',
    role: 'invalidrole'
  }
};

module.exports = {
  createTestUser,
  createTestAdmin,
  createTestSuperUser,
  getAuthToken,
  authenticatedRequest,
  validUserData,
  invalidUserData
};

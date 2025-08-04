const request = require('supertest');
const { Sequelize } = require('sequelize');
const bcrypt = require('bcrypt');

// Configuration de la base de données de test
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: ':memory:',
  logging: false
});

// Modèle User pour les tests
const User = sequelize.define('User', {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  username: {
    type: Sequelize.STRING(50),
    allowNull: false,
    unique: true
  },
  password_hash: {
    type: Sequelize.STRING(255),
    allowNull: false
  },
  role: {
    type: Sequelize.ENUM('admin', 'user', 'superuser'),
    allowNull: false,
    defaultValue: 'user'
  },
  created_at: {
    type: Sequelize.DATE,
    defaultValue: Sequelize.NOW
  }
}, {
  tableName: 'users',
  timestamps: false,
  hooks: {
    beforeCreate: async (user) => {
      if (user.password_hash && !user.password_hash.startsWith('$2b$')) {
        const salt = await bcrypt.genSalt(10);
        user.password_hash = await bcrypt.hash(user.password_hash, salt);
      }
    }
  }
});

// Application Express simple pour les tests
const express = require('express');
const jwt = require('jsonwebtoken');

const app = express();
app.use(express.json());

// Fonction utilitaires
const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    process.env.JWT_SECRET || 'test-secret',
    { expiresIn: '1h' }
  );
};

const verifyPassword = async (password, hash) => {
  return await bcrypt.compare(password, hash);
};

// Route de login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(401).json({
        success: false,
        message: 'Identifiants invalides'
      });
    }

    const user = await User.findOne({ where: { username } });
    if (!user || !(await verifyPassword(password, user.password_hash))) {
      // Délai pour la sécurité
      await new Promise(resolve => setTimeout(resolve, 2000));
      return res.status(401).json({
        success: false,
        message: 'Identifiants invalides'
      });
    }

    const token = generateToken(user);
    
    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          role: user.role
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
});

// Route de registration
app.post('/api/users/register', async (req, res) => {
  try {
    const { username, password, role } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username et password requis'
      });
    }
    
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Le mot de passe doit contenir au moins 6 caractères'
      });
    }
    
    // Vérifier si c'est le premier utilisateur
    const userCount = await User.count();
    let userRole = role || 'user';
    
    if (userCount === 0) {
      userRole = 'superuser';
    }
    
    try {
      const user = await User.create({
        username,
        password_hash: password, // Sera haché par le hook
        role: userRole
      });
      
      const { password_hash, ...userWithoutPassword } = user.toJSON();
      
      res.status(201).json({
        success: true,
        data: userWithoutPassword,
        message: userCount === 0 ? 'Premier utilisateur créé avec succès' : 'Utilisateur créé avec succès'
      });
    } catch (error) {
      if (error.name === 'SequelizeUniqueConstraintError') {
        return res.status(400).json({
          success: false,
          message: 'Ce nom d\'utilisateur existe déjà'
        });
      }
      throw error;
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
});

describe('Simple Authentication Tests', () => {
  beforeAll(async () => {
    await sequelize.sync({ force: true });
  });

  beforeEach(async () => {
    await User.destroy({ where: {}, truncate: true });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('POST /api/users/register', () => {
    test('should register first user as superuser', async () => {
      const userData = {
        username: 'firstuser',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/users/register')
        .send(userData)
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('username', 'firstuser');
      expect(response.body.data).toHaveProperty('role', 'superuser');
      expect(response.body.data).not.toHaveProperty('password_hash');
    });

    test('should fail with short password', async () => {
      const userData = {
        username: 'user1',
        password: '123'
      };

      const response = await request(app)
        .post('/api/users/register')
        .send(userData)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });

    test('should fail with missing username', async () => {
      const userData = {
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/users/register')
        .send(userData)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      await User.create({
        username: 'testuser',
        password_hash: 'password123',
        role: 'user'
      });
    });

    test('should login with valid credentials', async () => {
      const loginData = {
        username: 'testuser',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data.user).toHaveProperty('username', 'testuser');
    });

    test('should fail with invalid password', async () => {
      const loginData = {
        username: 'testuser',
        password: 'wrongpassword'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
    });

    test('should fail with missing credentials', async () => {
      const loginData = {
        username: 'testuser'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
    });
  });
});

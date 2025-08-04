// Mock des services pour les tests
const bcrypt = require('bcrypt');

const createMockUserService = () => ({
  getUserCount: async () => {
    const User = global.User;
    if (!User) return 0;
    return await User.count();
  },
  
  createFirstUser: async (userData) => {
    const User = global.User;
    if (!User) throw new Error('User model not available');
    
    // Hacher le mot de passe
    if (userData.password) {
      const salt = await bcrypt.genSalt(10);
      userData.password_hash = await bcrypt.hash(userData.password, salt);
      delete userData.password;
    }
    
    const user = await User.create(userData);
    
    // Retourner sans le mot de passe
    const { password_hash, ...userWithoutPassword } = user.toJSON();
    return userWithoutPassword;
  },
  
  createUser: async (userData, currentUser) => {
    const User = global.User;
    if (!User) throw new Error('User model not available');
    
    // Vérifier les autorisations
    if (!currentUser || !['admin', 'superuser'].includes(currentUser.role)) {
      throw new Error('Insufficient permissions');
    }
    
    // Hacher le mot de passe
    if (userData.password) {
      const salt = await bcrypt.genSalt(10);
      userData.password_hash = await bcrypt.hash(userData.password, salt);
      delete userData.password;
    }
    
    const user = await User.create(userData);
    
    // Retourner sans le mot de passe
    const { password_hash, ...userWithoutPassword } = user.toJSON();
    return userWithoutPassword;
  }
});

const createMockLoggingService = () => ({
  logUserLogin: async (userId, username, success, metadata) => {
    // Mock implementation - ne fait rien pour les tests
    return Promise.resolve();
  }
});

module.exports = {
  userService: createMockUserService(),
  loggingService: createMockLoggingService()
};

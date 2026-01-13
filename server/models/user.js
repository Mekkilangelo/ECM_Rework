const { DataTypes } = require('sequelize');
const bcrypt = require('bcrypt');

/**
 * Modèle User - Utilisateurs du système
 * Philosophie Synergia : role ENUM → FK vers ref_roles
 */
module.exports = (sequelize) => {
  const User = sequelize.define('user', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    username: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: 'Nom d\'utilisateur unique'
    },
    password_hash: {
      type: DataTypes.STRING(255),
      allowNull: false,
      comment: 'Hash du mot de passe'
    },
    role: {
      type: DataTypes.STRING(100),
      allowNull: false,
      references: {
        model: 'ref_roles',
        key: 'name'
      },
      comment: 'Rôle de l\'utilisateur - FK vers ref_roles.name'
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      comment: 'Date de création du compte'
    }
  }, {
    tableName: 'users',
    timestamps: false,
    hooks: {
      beforeCreate: async (user) => {
        if (user.password_hash) {
          const salt = await bcrypt.genSalt(10);
          user.password_hash = await bcrypt.hash(user.password_hash, salt);
        }
      },
      beforeUpdate: async (user) => {
        if (user.changed('password_hash')) {
          const salt = await bcrypt.genSalt(10);
          user.password_hash = await bcrypt.hash(user.password_hash, salt);
        }
      }
    },
    indexes: [
      {
        unique: true,
        fields: ['username'],
        name: 'unique_username'
      },
      {
        fields: ['role'],
        name: 'fk_users_role'
      }
    ]
  });

  User.prototype.validatePassword = async function(password) {
    return await bcrypt.compare(password, this.password_hash);
  };

  User.associate = function(models) {
    // Relation avec table de référence role
    User.belongsTo(models.ref_roles, {
      foreignKey: 'role',
      targetKey: 'name',
      as: 'roleRef',
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE'
    });
  };

  return User;
};
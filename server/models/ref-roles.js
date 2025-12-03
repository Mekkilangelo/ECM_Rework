const { DataTypes } = require('sequelize');

/**
 * Table de référence pour les rôles utilisateurs
 */
module.exports = (sequelize) => {
  const RefRoles = sequelize.define('ref_roles', {
    name: {
      type: DataTypes.STRING(100),
      primaryKey: true,
      allowNull: false,
      comment: 'Nom du rôle - Clé primaire'
    }
  }, {
    tableName: 'ref_roles',
    timestamps: false
  });

  RefRoles.associate = function(models) {
    RefRoles.hasMany(models.user, {
      foreignKey: 'role',
      sourceKey: 'name',
      as: 'users'
    });
  };

  return RefRoles;
};

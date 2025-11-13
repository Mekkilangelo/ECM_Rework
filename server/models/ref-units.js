const { DataTypes } = require('sequelize');

/**
 * Table de référence pour les unités de mesure
 * Utilisée partout (parts, trials, recipes, specs...)
 */
module.exports = (sequelize) => {
  const RefUnits = sequelize.define('ref_units', {
    name: {
      type: DataTypes.STRING(100),
      primaryKey: true,
      allowNull: false,
      comment: 'Nom de l\'unité - Clé primaire'
    },
    unit_type: {
      type: DataTypes.STRING(100),
      allowNull: true,
      references: {
        model: 'ref_unit_types',
        key: 'type_name'
      },
      comment: 'Type d\'unité (longueur, poids, température...)'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Description de l\'unité'
    }
  }, {
    tableName: 'ref_units',
    timestamps: false
  });

  RefUnits.associate = function(models) {
    RefUnits.belongsTo(models.ref_unit_types, {
      foreignKey: 'unit_type',
      targetKey: 'type_name',
      as: 'unitType'
    });
    
    // Cette table est référencée par de nombreuses autres tables
    // Les associations inverses seront définies dans chaque modèle
  };

  return RefUnits;
};

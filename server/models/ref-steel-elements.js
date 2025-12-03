const { DataTypes } = require('sequelize');

/**
 * Table de référence pour les éléments chimiques dans l'acier
 * Remplace l'ancien ENUM elements dans steels
 */
module.exports = (sequelize) => {
  const RefSteelElements = sequelize.define('ref_steel_elements', {
    name: {
      type: DataTypes.STRING(100),
      primaryKey: true,
      allowNull: false,
      comment: 'Nom de l\'élément chimique - Clé primaire'
    }
  }, {
    tableName: 'ref_steel_elements',
    timestamps: false
  });

  RefSteelElements.associate = function(models) {
    RefSteelElements.hasMany(models.steel, {
      foreignKey: 'elements',
      sourceKey: 'name',
      as: 'steels'
    });
  };

  return RefSteelElements;
};

const { DataTypes } = require('sequelize');

/**
 * Table de référence pour les types d'unités
 * Parent de ref_units
 */
module.exports = (sequelize) => {
  const RefUnitTypes = sequelize.define('ref_unit_types', {
    type_name: {
      type: DataTypes.STRING(100),
      primaryKey: true,
      allowNull: false,
      comment: 'Nom du type d\'unité - Clé primaire'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Description du type'
    }
  }, {
    tableName: 'ref_unit_types',
    timestamps: false
  });

  RefUnitTypes.associate = function(models) {
    RefUnitTypes.hasMany(models.ref_units, {
      foreignKey: 'unit_type',
      sourceKey: 'type_name',
      as: 'units'
    });
  };

  return RefUnitTypes;
};

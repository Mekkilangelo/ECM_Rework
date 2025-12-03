const { DataTypes } = require('sequelize');

/**
 * Table de référence pour les pays
 * Remplace l'ancien ENUM country dans clients
 * Structure simple : PK = name (VARCHAR)
 */
module.exports = (sequelize) => {
  const RefCountry = sequelize.define('ref_country', {
    name: {
      type: DataTypes.STRING(100),
      primaryKey: true,
      allowNull: false,
      comment: 'Nom du pays - Clé primaire'
    }
  }, {
    tableName: 'ref_country',
    timestamps: false
  });

  RefCountry.associate = function(models) {
    RefCountry.hasMany(models.client, {
      foreignKey: 'country',
      sourceKey: 'name',
      as: 'clients'
    });
  };

  return RefCountry;
};

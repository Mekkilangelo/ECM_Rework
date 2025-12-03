const { DataTypes } = require('sequelize');

/**
 * Table de référence pour les emplacements de test
 * Valeurs: ECM, Client site
 */
module.exports = (sequelize) => {
  const RefLocation = sequelize.define('ref_location', {
    name: {
      type: DataTypes.STRING(100),
      primaryKey: true,
      allowNull: false,
      comment: 'Nom de l\'emplacement - Clé primaire'
    }
  }, {
    tableName: 'ref_location',
    timestamps: false
  });

  RefLocation.associate = function(models) {
    // ⚠️ TEMPORAIREMENT COMMENTÉ : models.trial n'existe pas encore
    // TODO: Décommenter après création de models/trial.js
    // RefLocation.hasMany(models.trial, {
    //   foreignKey: 'location',
    //   sourceKey: 'name',
    //   as: 'trials'
    // });
  };

  return RefLocation;
};

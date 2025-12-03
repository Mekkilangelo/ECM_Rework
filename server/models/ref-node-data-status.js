const { DataTypes } = require('sequelize');

/**
 * Table de référence pour les statuts de données des nœuds
 * Valeurs typiques: 'new', 'old', 'opened'
 * Nouvelle philosophie Synergia : Tables de référence simples avec PK = name
 */
module.exports = (sequelize) => {
  const RefNodeDataStatus = sequelize.define('ref_node_data_status', {
    name: {
      type: DataTypes.STRING(100),
      primaryKey: true,
      allowNull: false,
      comment: 'Code du statut (ex: new, old, opened) - Clé primaire'
    }
  }, {
    tableName: 'ref_node_data_status',
    timestamps: false
  });

  RefNodeDataStatus.associate = function(models) {
    // Un statut peut être utilisé par plusieurs nœuds
    RefNodeDataStatus.hasMany(models.node, {
      foreignKey: 'data_status',
      sourceKey: 'name',
      as: 'nodes'
    });
  };

  return RefNodeDataStatus;
};

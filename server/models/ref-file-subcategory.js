const { DataTypes } = require('sequelize');

/**
 * Table de référence pour les sous-catégories de fichiers
 */
module.exports = (sequelize) => {
  const RefFileSubcategory = sequelize.define('ref_file_subcategory', {
    name: {
      type: DataTypes.STRING(100),
      primaryKey: true,
      allowNull: false,
      comment: 'Nom de la sous-catégorie - Clé primaire'
    }
  }, {
    tableName: 'ref_file_subcategory',
    timestamps: false
  });

  RefFileSubcategory.associate = function(models) {
    RefFileSubcategory.hasMany(models.file, {
      foreignKey: 'subcategory',
      sourceKey: 'name',
      as: 'files'
    });
  };

  return RefFileSubcategory;
};

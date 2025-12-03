const { DataTypes } = require('sequelize');

/**
 * Table de référence pour les catégories de fichiers
 */
module.exports = (sequelize) => {
  const RefFileCategory = sequelize.define('ref_file_category', {
    name: {
      type: DataTypes.STRING(100),
      primaryKey: true,
      allowNull: false,
      comment: 'Nom de la catégorie - Clé primaire'
    }
  }, {
    tableName: 'ref_file_category',
    timestamps: false
  });

  RefFileCategory.associate = function(models) {
    RefFileCategory.hasMany(models.file, {
      foreignKey: 'category',
      sourceKey: 'name',
      as: 'files'
    });
  };

  return RefFileCategory;
};

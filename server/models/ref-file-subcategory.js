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
    // ⚠️ PAS d'association avec files.subcategory
    // Les subcategories sont dynamiques (ex: result-0-sample-0-x1000)
    // et ne doivent PAS avoir de contrainte FK
    // Garder cette table uniquement pour référence documentaire
  };

  return RefFileSubcategory;
};

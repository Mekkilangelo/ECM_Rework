/**
 * Modèle Recipe
 * Représente une recette de traitement thermique
 */

module.exports = (sequelize, DataTypes) => {
  const Recipe = sequelize.define('recipe', {
    recipe_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    recipe_number: {
      type: DataTypes.STRING(100),
      allowNull: true
    }
  }, {
    tableName: 'recipes',
    timestamps: false,
    indexes: [
      {
        unique: true,
        fields: ['recipe_number'],
        name: 'unique_recipe_number'
      }
    ]
  });

  Recipe.associate = (models) => {
    // Relation avec les cycles
    Recipe.hasOne(models.recipe_preox_cycle, {
      foreignKey: 'recipe_id',
      as: 'preoxCycle',
      onDelete: 'CASCADE'
    });

    Recipe.hasMany(models.recipe_thermal_cycle, {
      foreignKey: 'recipe_id',
      as: 'thermalCycle',
      onDelete: 'CASCADE'
    });

    Recipe.hasOne(models.recipe_chemical_cycle, {
      foreignKey: 'recipe_id',
      as: 'chemicalCycle',
      onDelete: 'CASCADE'
    });

    Recipe.hasOne(models.recipe_gas_quench, {
      foreignKey: 'recipe_id',
      as: 'gasQuench',
      onDelete: 'CASCADE'
    });

    Recipe.hasOne(models.recipe_oil_quench, {
      foreignKey: 'recipe_id',
      as: 'oilQuench',
      onDelete: 'CASCADE'
    });

    // Relation avec trials
    Recipe.hasMany(models.trial, {
      foreignKey: 'recipe_id',
      as: 'trials'
    });
  };

  return Recipe;
};

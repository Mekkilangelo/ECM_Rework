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
      unique: true,
      allowNull: true
    }
  }, {
    tableName: 'recipes',
    timestamps: false
  });

  Recipe.associate = (models) => {
    // Relation avec les cycles
    Recipe.hasOne(models.recipe_preox_cycle, {
      foreignKey: 'recipe_id',
      as: 'preoxCycle'
    });

    Recipe.hasMany(models.recipe_thermal_cycle, {
      foreignKey: 'recipe_id',
      as: 'thermalCycle'
    });

    Recipe.hasOne(models.recipe_chemical_cycle, {
      foreignKey: 'recipe_id',
      as: 'chemicalCycle'
    });

    Recipe.hasOne(models.recipe_gas_quench, {
      foreignKey: 'recipe_id',
      as: 'gasQuench'
    });

    Recipe.hasOne(models.recipe_oil_quench, {
      foreignKey: 'recipe_id',
      as: 'oilQuench'
    });

    // Relation avec trials
    Recipe.hasMany(models.trial, {
      foreignKey: 'recipe_id',
      as: 'trials'
    });
  };

  return Recipe;
};

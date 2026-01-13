/**
 * Modèle RecipeGasQuench
 * Représente la trempe gazeuse d'une recette
 */

module.exports = (sequelize, DataTypes) => {
  const RecipeGasQuench = sequelize.define('recipe_gas_quench', {
    gas_quench_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    recipe_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'recipes',
        key: 'recipe_id'
      }
    }
  }, {
    tableName: 'recipe_gas_quench',
    timestamps: false,
    indexes: [
      {
        unique: true,
        fields: ['recipe_id'],
        name: 'unique_recipe_gas_quench'
      }
    ]
  });

  RecipeGasQuench.associate = (models) => {
    RecipeGasQuench.belongsTo(models.recipe, {
      foreignKey: 'recipe_id',
      as: 'recipe'
    });

    RecipeGasQuench.hasMany(models.recipe_gas_quench_speed, {
      foreignKey: 'gas_quench_id',
      as: 'speedSteps',
      onDelete: 'CASCADE'
    });

    RecipeGasQuench.hasMany(models.recipe_gas_quench_pressure, {
      foreignKey: 'gas_quench_id',
      as: 'pressureSteps',
      onDelete: 'CASCADE'
    });
  };

  return RecipeGasQuench;
};

/**
 * Modèle RecipeThermalCycle
 * Représente une étape du cycle thermique d'une recette
 */

module.exports = (sequelize, DataTypes) => {
  const RecipeThermalCycle = sequelize.define('recipe_thermal_cycle', {
    step_id: {
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
    },
    step_number: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    ramp: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    duration: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    setpoint: {
      type: DataTypes.STRING(50),
      allowNull: true
    }
  }, {
    tableName: 'recipe_thermal_cycle',
    timestamps: false,
    indexes: [
      { fields: ['recipe_id'], name: 'idx_thermal_cycle_recipe' }
    ]
  });

  RecipeThermalCycle.associate = (models) => {
    RecipeThermalCycle.belongsTo(models.recipe, {
      foreignKey: 'recipe_id',
      as: 'recipe'
    });
  };

  return RecipeThermalCycle;
};

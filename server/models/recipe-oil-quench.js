/**
 * Modèle RecipeOilQuench
 * Représente la trempe à l'huile d'une recette
 */

module.exports = (sequelize, DataTypes) => {
  const RecipeOilQuench = sequelize.define('recipe_oil_quench', {
    oil_quench_id: {
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
    pressure: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    temperature_unit: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    temperature_value: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    dripping_time_unit: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    dripping_time_value: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    inerting_delay_unit: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    inerting_delay_value: {
      type: DataTypes.STRING(50),
      allowNull: true
    }
  }, {
    tableName: 'recipe_oil_quench',
    timestamps: false,
    indexes: [
      {
        unique: true,
        fields: ['recipe_id'],
        name: 'unique_recipe_oil_quench'
      }
    ]
  });

  RecipeOilQuench.associate = (models) => {
    RecipeOilQuench.belongsTo(models.recipe, {
      foreignKey: 'recipe_id',
      as: 'recipe'
    });

    RecipeOilQuench.hasMany(models.recipe_oil_quench_speed, {
      foreignKey: 'oil_quench_id',
      as: 'speedSteps',
      onDelete: 'CASCADE'
    });
  };

  return RecipeOilQuench;
};

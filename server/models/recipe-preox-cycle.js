/**
 * Modèle RecipePreoxCycle
 * Représente le cycle de préoxydation d'une recette
 */

module.exports = (sequelize, DataTypes) => {
  const RecipePreoxCycle = sequelize.define('recipe_preox_cycle', {
    preox_cycle_id: {
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
    media: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    duration_unit: {
      type: DataTypes.STRING(100),
      allowNull: true,
      references: {
        model: 'ref_units',
        key: 'name'
      }
    },
    duration_value: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    temperature_unit: {
      type: DataTypes.STRING(100),
      allowNull: true,
      references: {
        model: 'ref_units',
        key: 'name'
      }
    },
    temperature_value: {
      type: DataTypes.STRING(50),
      allowNull: true
    }
  }, {
    tableName: 'recipe_preox_cycle',
    timestamps: false,
    indexes: [
      {
        unique: true,
        fields: ['recipe_id'],
        name: 'unique_recipe_preox_cycle'
      }
    ]
  });

  RecipePreoxCycle.associate = (models) => {
    RecipePreoxCycle.belongsTo(models.recipe, {
      foreignKey: 'recipe_id',
      as: 'recipe'
    });
  };

  return RecipePreoxCycle;
};

/**
 * Modèle RecipeChemicalCycle
 * Représente le cycle chimique d'une recette
 */

module.exports = (sequelize, DataTypes) => {
  const RecipeChemicalCycle = sequelize.define('recipe_chemical_cycle', {
    chemical_cycle_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    recipe_id: {
      type: DataTypes.INTEGER,
      unique: true,
      allowNull: true,
      references: {
        model: 'recipes',
        key: 'recipe_id'
      }
    },
    wait_time_unit: {
      type: DataTypes.STRING(100),
      allowNull: true,
      references: {
        model: 'ref_units',
        key: 'name'
      }
    },
    wait_time_value: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    wait_pressure_unit: {
      type: DataTypes.STRING(100),
      allowNull: true,
      references: {
        model: 'ref_units',
        key: 'name'
      }
    },
    wait_pressure_value: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    selected_gas1: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    selected_gas2: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    selected_gas3: {
      type: DataTypes.STRING(50),
      allowNull: true
    }
  }, {
    tableName: 'recipe_chemical_cycle',
    timestamps: false
  });

  RecipeChemicalCycle.associate = (models) => {
    RecipeChemicalCycle.belongsTo(models.recipe, {
      foreignKey: 'recipe_id',
      as: 'recipe'
    });

    RecipeChemicalCycle.hasMany(models.recipe_chemical_step, {
      foreignKey: 'chemical_cycle_id',
      as: 'steps',
      onDelete: 'CASCADE'
    });
  };

  return RecipeChemicalCycle;
};

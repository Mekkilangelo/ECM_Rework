/**
 * Modèle RecipeChemicalStep
 * Représente une étape du cycle chimique
 */

module.exports = (sequelize, DataTypes) => {
  const RecipeChemicalStep = sequelize.define('recipe_chemical_step', {
    step_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    chemical_cycle_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'recipe_chemical_cycle',
        key: 'chemical_cycle_id'
      }
    },
    step_number: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    time: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    turbine: {
      type: DataTypes.BOOLEAN,
      allowNull: true
    },
    pressure: {
      type: DataTypes.STRING(50),
      allowNull: true
    }
  }, {
    tableName: 'recipe_chemical_steps',
    timestamps: false
  });

  RecipeChemicalStep.associate = (models) => {
    RecipeChemicalStep.belongsTo(models.recipe_chemical_cycle, {
      foreignKey: 'chemical_cycle_id',
      as: 'chemicalCycle'
    });

    RecipeChemicalStep.hasMany(models.recipe_chemical_gas, {
      foreignKey: 'step_id',
      as: 'gases'
    });
  };

  return RecipeChemicalStep;
};

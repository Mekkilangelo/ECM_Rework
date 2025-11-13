/**
 * Modèle RecipeChemicalGas
 * Représente un gaz dans une étape du cycle chimique
 */

module.exports = (sequelize, DataTypes) => {
  const RecipeChemicalGas = sequelize.define('recipe_chemical_gas', {
    gas_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    step_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'recipe_chemical_steps',
        key: 'step_id'
      }
    },
    gas_name: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    debit: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    gas_index: {
      type: DataTypes.INTEGER,
      allowNull: true
    }
  }, {
    tableName: 'recipe_chemical_gases',
    timestamps: false
  });

  RecipeChemicalGas.associate = (models) => {
    RecipeChemicalGas.belongsTo(models.recipe_chemical_step, {
      foreignKey: 'step_id',
      as: 'step'
    });
  };

  return RecipeChemicalGas;
};

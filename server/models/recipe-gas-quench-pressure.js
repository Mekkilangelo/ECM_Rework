/**
 * Modèle RecipeGasQuenchPressure
 * Représente une étape de pression de trempe gazeuse
 */

module.exports = (sequelize, DataTypes) => {
  const RecipeGasQuenchPressure = sequelize.define('recipe_gas_quench_pressure', {
    pressure_step_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    gas_quench_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'recipe_gas_quench',
        key: 'gas_quench_id'
      }
    },
    step: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    duration: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    pressure: {
      type: DataTypes.STRING(50),
      allowNull: true
    }
  }, {
    tableName: 'recipe_gas_quench_pressure',
    timestamps: false,
    indexes: [
      { fields: ['gas_quench_id'], name: 'idx_gq_pressure_quench' }
    ]
  });

  RecipeGasQuenchPressure.associate = (models) => {
    RecipeGasQuenchPressure.belongsTo(models.recipe_gas_quench, {
      foreignKey: 'gas_quench_id',
      as: 'gasQuench'
    });
  };

  return RecipeGasQuenchPressure;
};

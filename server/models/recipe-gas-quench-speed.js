/**
 * Modèle RecipeGasQuenchSpeed
 * Représente une étape de vitesse de trempe gazeuse
 */

module.exports = (sequelize, DataTypes) => {
  const RecipeGasQuenchSpeed = sequelize.define('recipe_gas_quench_speed', {
    speed_step_id: {
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
    speed: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    duration: {
      type: DataTypes.STRING(50),
      allowNull: true
    }
  }, {
    tableName: 'recipe_gas_quench_speed',
    timestamps: false,
    indexes: [
      { fields: ['gas_quench_id'], name: 'idx_gq_speed_quench' }
    ]
  });

  RecipeGasQuenchSpeed.associate = (models) => {
    RecipeGasQuenchSpeed.belongsTo(models.recipe_gas_quench, {
      foreignKey: 'gas_quench_id',
      as: 'gasQuench'
    });
  };

  return RecipeGasQuenchSpeed;
};

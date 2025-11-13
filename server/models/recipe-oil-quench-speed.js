/**
 * Modèle RecipeOilQuenchSpeed
 * Représente une étape de vitesse de trempe à l'huile
 */

module.exports = (sequelize, DataTypes) => {
  const RecipeOilQuenchSpeed = sequelize.define('recipe_oil_quench_speed', {
    speed_step_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    oil_quench_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'recipe_oil_quench',
        key: 'oil_quench_id'
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
    tableName: 'recipe_oil_quench_speed',
    timestamps: false
  });

  RecipeOilQuenchSpeed.associate = (models) => {
    RecipeOilQuenchSpeed.belongsTo(models.recipe_oil_quench, {
      foreignKey: 'oil_quench_id',
      as: 'oilQuench'
    });
  };

  return RecipeOilQuenchSpeed;
};

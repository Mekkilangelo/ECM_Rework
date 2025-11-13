/**
 * Modèle ResultsHardnessPoint
 * Représente un point de dureté
 */

module.exports = (sequelize, DataTypes) => {
  const ResultsHardnessPoint = sequelize.define('results_hardness_point', {
    hardness_point_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    sample_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'results_samples',
        key: 'sample_id'
      }
    },
    unit: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    value: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    location: {
      type: DataTypes.STRING(255),
      allowNull: true
    }
  }, {
    tableName: 'results_hardness_points',
    timestamps: false
  });

  ResultsHardnessPoint.associate = (models) => {
    ResultsHardnessPoint.belongsTo(models.results_sample, {
      foreignKey: 'sample_id',
      as: 'sample'
    });
  };

  return ResultsHardnessPoint;
};

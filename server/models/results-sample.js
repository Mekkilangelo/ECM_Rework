/**
 * Modèle ResultsSample
 * Représente un échantillon de résultats
 */

module.exports = (sequelize, DataTypes) => {
  const ResultsSample = sequelize.define('results_sample', {
    sample_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    result_step_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'results_steps',
        key: 'result_step_id'
      }
    },
    sample_number: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    ecd_hardness_unit: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    ecd_hardness_value: {
      type: DataTypes.STRING(50),
      allowNull: true
    }
  }, {
    tableName: 'results_samples',
    timestamps: false
  });

  ResultsSample.associate = (models) => {
    ResultsSample.belongsTo(models.results_step, {
      foreignKey: 'result_step_id',
      as: 'resultStep'
    });

    ResultsSample.hasMany(models.results_hardness_point, {
      foreignKey: 'sample_id',
      as: 'hardnessPoints'
    });

    ResultsSample.hasMany(models.results_ecd_position, {
      foreignKey: 'sample_id',
      as: 'ecdPositions'
    });

    ResultsSample.hasMany(models.results_curve_series, {
      foreignKey: 'sample_id',
      as: 'curveSeries'
    });
  };

  return ResultsSample;
};

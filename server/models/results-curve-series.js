/**
 * Modèle ResultsCurveSeries
 * Représente une série de courbes de dureté
 */

module.exports = (sequelize, DataTypes) => {
  const ResultsCurveSeries = sequelize.define('results_curve_series', {
    series_id: {
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
    name: {
      type: DataTypes.STRING(255),
      allowNull: true
    }
  }, {
    tableName: 'results_curve_series',
    timestamps: false,
    indexes: [
      { fields: ['sample_id'], name: 'idx_curve_series_sample' }
    ]
  });

  ResultsCurveSeries.associate = (models) => {
    ResultsCurveSeries.belongsTo(models.results_sample, {
      foreignKey: 'sample_id',
      as: 'sample'
    });

    ResultsCurveSeries.hasMany(models.results_curve_point, {
      foreignKey: 'series_id',
      as: 'points',
      onDelete: 'CASCADE'
    });
  };

  return ResultsCurveSeries;
};

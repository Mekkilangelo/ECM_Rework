/**
 * Modèle ResultsCurvePoint
 * Représente un point dans une courbe de dureté
 */

module.exports = (sequelize, DataTypes) => {
  const ResultsCurvePoint = sequelize.define('results_curve_point', {
    point_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    series_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'results_curve_series',
        key: 'series_id'
      }
    },
    distance: {
      type: DataTypes.DOUBLE,
      allowNull: true
    },
    value: {
      type: DataTypes.DOUBLE,
      allowNull: true
    }
  }, {
    tableName: 'results_curve_points',
    timestamps: false,
    indexes: [
      { fields: ['series_id'], name: 'idx_curve_point_series' }
    ]
  });

  ResultsCurvePoint.associate = (models) => {
    ResultsCurvePoint.belongsTo(models.results_curve_series, {
      foreignKey: 'series_id',
      as: 'series'
    });
  };

  return ResultsCurvePoint;
};

/**
 * Modèle ResultsEcdPosition
 * Représente une position ECD (Effective Case Depth)
 */

module.exports = (sequelize, DataTypes) => {
  const ResultsEcdPosition = sequelize.define('results_ecd_position', {
    ecd_position_id: {
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
    distance: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    location: {
      type: DataTypes.STRING(255),
      allowNull: true
    }
  }, {
    tableName: 'results_ecd_positions',
    timestamps: false
  });

  ResultsEcdPosition.associate = (models) => {
    ResultsEcdPosition.belongsTo(models.results_sample, {
      foreignKey: 'sample_id',
      as: 'sample'
    });
  };

  return ResultsEcdPosition;
};

/**
 * Modèle ResultsStep
 * Représente une étape de résultats d'un trial
 */

module.exports = (sequelize, DataTypes) => {
  const ResultsStep = sequelize.define('results_step', {
    result_step_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    trial_node_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'trials',
        key: 'node_id'
      }
    },
    step_number: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    tableName: 'results_steps',
    timestamps: false
  });

  ResultsStep.associate = (models) => {
    ResultsStep.belongsTo(models.trial, {
      foreignKey: 'trial_node_id',
      as: 'trial'
    });

    ResultsStep.hasMany(models.results_sample, {
      foreignKey: 'result_step_id',
      as: 'samples',
      onDelete: 'CASCADE'
    });
  };

  return ResultsStep;
};

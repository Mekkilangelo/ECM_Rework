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
    },
    hardness: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      comment: 'Valeur de dureté à cette profondeur ECD'
    },
    hardness_unit: {
      type: DataTypes.STRING(100),
      allowNull: true,
      references: {
        model: 'ref_units',
        key: 'name'
      },
      comment: 'Unité de dureté - FK vers ref_units.name'
    }
  }, {
    tableName: 'results_ecd_positions',
    timestamps: false,
    indexes: [
      { fields: ['sample_id'], name: 'idx_ecd_pos_sample' },
      {
        fields: ['hardness_unit'],
        name: 'fk_ecd_pos_hardness_unit'
      }
    ]
  });

  ResultsEcdPosition.associate = (models) => {
    ResultsEcdPosition.belongsTo(models.results_sample, {
      foreignKey: 'sample_id',
      as: 'sample'
    });

    // Relation vers l'unité de dureté
    ResultsEcdPosition.belongsTo(models.ref_units, {
      foreignKey: 'hardness_unit',
      targetKey: 'name',
      as: 'hardnessUnitRef',
      onDelete: 'RESTRICT'
    });
  };

  return ResultsEcdPosition;
};

const { DataTypes } = require('sequelize');

/**
 * Modèle Specs ECD - Spécifications de profondeur de couche carburée (Effective Case Depth)
 * Table normalisée pour remplacer l'ancien champ JSON specifications.ecd
 */
module.exports = (sequelize) => {
  const SpecsEcd = sequelize.define('specs_ecd', {
    spec_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
      comment: 'ID unique de la spécification ECD'
    },
    part_node_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'parts',
        key: 'node_id'
      },
      comment: 'FK vers la pièce concernée'
    },
    name: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Nom/description de la spécification'
    },
    depthMin: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: 'Profondeur minimale de la couche'
    },
    depthMax: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: 'Profondeur maximale de la couche'
    },
    depthUnit: {
      type: DataTypes.STRING(100),
      allowNull: true,
      references: {
        model: 'ref_units',
        key: 'name'
      },
      comment: 'Unité de profondeur - FK vers ref_units.name'
    },
    hardness: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: 'Valeur de dureté en surface'
    },
    hardnessUnit: {
      type: DataTypes.STRING(100),
      allowNull: true,
      references: {
        model: 'ref_units',
        key: 'name'
      },
      comment: 'Unité de dureté - FK vers ref_units.name'
    }
  }, {
    tableName: 'specs_ecd',
    timestamps: false,
    indexes: [
      {
        fields: ['part_node_id'],
        name: 'idx_specs_ecd_part'
      },
      {
        fields: ['depthUnit'],
        name: 'fk_spec_ecd_depth_unit'
      },
      {
        fields: ['hardnessUnit'],
        name: 'fk_spec_ecd_hard_unit'
      }
    ]
  });

  SpecsEcd.associate = function(models) {
    // Relation vers la pièce
    SpecsEcd.belongsTo(models.part, {
      foreignKey: 'part_node_id',
      targetKey: 'node_id',
      as: 'part',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });
    
    // Relation vers l'unité de profondeur
    SpecsEcd.belongsTo(models.ref_units, {
      foreignKey: 'depthUnit',
      targetKey: 'name',
      as: 'depthUnitRef',
      onDelete: 'RESTRICT'
    });
    
    // Relation vers l'unité de dureté
    SpecsEcd.belongsTo(models.ref_units, {
      foreignKey: 'hardnessUnit',
      targetKey: 'name',
      as: 'hardnessUnitRef',
      onDelete: 'RESTRICT'
    });
  };

  return SpecsEcd;
};

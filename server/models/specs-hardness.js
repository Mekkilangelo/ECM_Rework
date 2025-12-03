const { DataTypes } = require('sequelize');

/**
 * Modèle Specs Hardness - Spécifications de dureté des pièces
 * Table normalisée pour remplacer l'ancien champ JSON specifications.hardness
 */
module.exports = (sequelize) => {
  const SpecsHardness = sequelize.define('specs_hardness', {
    spec_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
      comment: 'ID unique de la spécification de dureté'
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
    min: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: 'Valeur minimale de dureté'
    },
    max: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: 'Valeur maximale de dureté'
    },
    unit: {
      type: DataTypes.STRING(100),
      allowNull: true,
      references: {
        model: 'ref_units',
        key: 'name'
      },
      comment: 'Unité de dureté - FK vers ref_units.name'
    }
  }, {
    tableName: 'specs_hardness',
    timestamps: false,
    indexes: [
      {
        fields: ['part_node_id'],
        name: 'idx_specs_hardness_part'
      },
      {
        fields: ['unit'],
        name: 'fk_spec_hard_unit'
      }
    ]
  });

  SpecsHardness.associate = function(models) {
    // Relation vers la pièce
    SpecsHardness.belongsTo(models.part, {
      foreignKey: 'part_node_id',
      targetKey: 'node_id',
      as: 'part',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });
    
    // Relation vers l'unité
    SpecsHardness.belongsTo(models.ref_units, {
      foreignKey: 'unit',
      targetKey: 'name',
      as: 'unitRef',
      onDelete: 'RESTRICT'
    });
  };

  return SpecsHardness;
};

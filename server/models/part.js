const { DataTypes } = require('sequelize');

/**
 * Modèle Part - Données spécifiques aux pièces
 * Philosophie Synergia : JSON décomposé, ENUM → Tables de référence
 * CHANGEMENTS MAJEURS:
 * - dimensions (JSON) → Champs séparés (dim_weight_*, dim_rect_*, dim_circ_*)
 * - specifications (JSON) → Supprimé (géré par specs_hardness, specs_ecd)
 * - steel (STRING) → steel_node_id (FK)
 * - designation (ENUM) → FK vers ref_designation
 */
module.exports = (sequelize) => {
  const Part = sequelize.define('part', {
    node_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      references: {
        model: 'nodes',
        key: 'id'
      },
      comment: '🔗 RELATION FONDAMENTALE : Référence au nœud parent'
    },
    designation: {
      type: DataTypes.STRING(100),
      allowNull: true,
      references: {
        model: 'ref_designation',
        key: 'name'
      },
      comment: 'Type de pièce - FK vers ref_designation.name'
    },
    steel_node_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'steels',
        key: 'node_id'
      },
      comment: 'Référence vers l\'acier utilisé - FK vers steels.node_id'
    },
    client_designation: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: 'Désignation client de la pièce'
    },
    reference: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: 'Référence de la pièce'
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Quantité de pièces'
    },
    // Dimensions - Poids
    dim_weight_value: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: 'Valeur du poids'
    },
    dim_weight_unit: {
      type: DataTypes.STRING(100),
      allowNull: true,
      references: {
        model: 'ref_units',
        key: 'name'
      },
      comment: 'Unité de poids - FK vers ref_units.name'
    },
    // Dimensions - Rectangulaires
    dim_rect_length: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: 'Longueur (rectangulaire)'
    },
    dim_rect_width: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: 'Largeur (rectangulaire)'
    },
    dim_rect_height: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: 'Hauteur (rectangulaire)'
    },
    dim_rect_unit: {
      type: DataTypes.STRING(100),
      allowNull: true,
      references: {
        model: 'ref_units',
        key: 'name'
      },
      comment: 'Unité dimensions rectangulaires - FK vers ref_units.name'
    },
    // Dimensions - Circulaires
    dim_circ_diameterIn: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: 'Diamètre intérieur (circulaire)'
    },
    dim_circ_diameterOut: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: 'Diamètre extérieur (circulaire)'
    },
    dim_circ_unit: {
      type: DataTypes.STRING(100),
      allowNull: true,
      references: {
        model: 'ref_units',
        key: 'name'
      },
      comment: 'Unité dimensions circulaires - FK vers ref_units.name'
    }
  }, {
    tableName: 'parts',
    timestamps: false,
    indexes: [
      {
        fields: ['designation'],
        name: 'fk_parts_designation'
      },
      {
        fields: ['steel_node_id'],
        name: 'fk_parts_steel'
      },
      {
        fields: ['dim_weight_unit'],
        name: 'fk_parts_weight_unit'
      },
      {
        fields: ['dim_rect_unit'],
        name: 'fk_parts_rect_unit'
      },
      {
        fields: ['dim_circ_unit'],
        name: 'fk_parts_circ_unit'
      }
    ]
  });

  Part.associate = function(models) {
    // 🔗 RELATION CRITIQUE : Chaque Part DOIT appartenir à un Node
    Part.belongsTo(models.node, { 
      foreignKey: 'node_id',
      as: 'node',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });
    
    // Relation avec table de référence designation
    Part.belongsTo(models.ref_designation, {
      foreignKey: 'designation',
      targetKey: 'name',
      as: 'designationRef',
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE'
    });
    
    // Relation vers l'acier
    Part.belongsTo(models.steel, {
      foreignKey: 'steel_node_id',
      targetKey: 'node_id',
      as: 'steel',
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    });
    
    // Relations avec les unités
    Part.belongsTo(models.ref_units, {
      foreignKey: 'dim_weight_unit',
      targetKey: 'name',
      as: 'weightUnit',
      onDelete: 'RESTRICT'
    });
    
    Part.belongsTo(models.ref_units, {
      foreignKey: 'dim_rect_unit',
      targetKey: 'name',
      as: 'rectUnit',
      onDelete: 'RESTRICT'
    });
    
    Part.belongsTo(models.ref_units, {
      foreignKey: 'dim_circ_unit',
      targetKey: 'name',
      as: 'circUnit',
      onDelete: 'RESTRICT'
    });
    
    // Relations avec les spécifications (tables normalisées)
    Part.hasMany(models.specs_hardness, {
      foreignKey: 'part_node_id',
      sourceKey: 'node_id',
      as: 'hardnessSpecs',
      onDelete: 'CASCADE'
    });
    
    Part.hasMany(models.specs_ecd, {
      foreignKey: 'part_node_id',
      sourceKey: 'node_id',
      as: 'ecdSpecs',
      onDelete: 'CASCADE'
    });
  };

  return Part;
};
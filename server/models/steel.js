const { DataTypes } = require('sequelize');

/**
 * Modèle Steel - Données spécifiques aux aciers
 * Philosophie Synergia : ENUM → Tables de référence, equivalents JSON → table steel_equivalents
 * CHANGEMENTS:
 * - family, standard, elements (ENUM) → FK vers ref_steel_*
 * - equivalents (JSON) → Table steel_equivalents (many-to-many)
 * - chemistery (JSON) → CONSERVÉ
 */
module.exports = (sequelize) => {
  const Steel = sequelize.define('steel', {
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
    grade: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: 'Grade de l\'acier'
    },
    family: {
      type: DataTypes.STRING(100),
      allowNull: true,
      references: {
        model: 'ref_steel_family',
        key: 'name'
      },
      comment: 'Famille d\'acier - FK vers ref_steel_family.name'
    },
    standard: {
      type: DataTypes.STRING(100),
      allowNull: true,
      references: {
        model: 'ref_steel_standard',
        key: 'name'
      },
      comment: 'Standard de l\'acier - FK vers ref_steel_standard.name'
    },
    elements: {
      type: DataTypes.STRING(100),
      allowNull: true,
      references: {
        model: 'ref_steel_elements',
        key: 'name'
      },
      comment: 'Éléments chimiques - FK vers ref_steel_elements.name'
    },
    chemistery: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Composition chimique détaillée (JSON conservé)'
    }
    // NOTE: 'equivalents' n'est PAS une colonne de cette table !
    // Les équivalents sont dans la table steel_equivalents (many-to-many)
  }, {
    tableName: 'steels',
    timestamps: false,
    indexes: [
      {
        fields: ['grade'],
        name: 'idx_steel_grade'
      },
      {
        fields: ['family'],
        name: 'fk_steels_family'
      },
      {
        fields: ['standard'],
        name: 'fk_steels_standard'
      },
      {
        fields: ['elements'],
        name: 'fk_steels_elements'
      }
    ]
  });

  Steel.associate = function(models) {
    // 🔗 RELATION CRITIQUE : Chaque Steel DOIT appartenir à un Node
    Steel.belongsTo(models.node, { 
      foreignKey: 'node_id',
      as: 'node',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });
    
    // Relations avec les tables de référence
    Steel.belongsTo(models.ref_steel_family, {
      foreignKey: 'family',
      targetKey: 'name',
      as: 'familyRef',
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE'
    });
    
    Steel.belongsTo(models.ref_steel_standard, {
      foreignKey: 'standard',
      targetKey: 'name',
      as: 'standardRef',
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE'
    });
    
    Steel.belongsTo(models.ref_steel_elements, {
      foreignKey: 'elements',
      targetKey: 'name',
      as: 'elementsRef',
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE'
    });
    
    // Relation inverse avec Parts
    Steel.hasMany(models.part, {
      foreignKey: 'steel_node_id',
      sourceKey: 'node_id',
      as: 'parts'
    });
    
    // 🔗 RELATION MANY-TO-MANY : Équivalents d'aciers via la table steel_equivalents
    Steel.belongsToMany(models.steel, {
      through: 'steel_equivalents',
      foreignKey: 'steel_node_id',
      otherKey: 'equivalent_steel_node_id',
      sourceKey: 'node_id',
      targetKey: 'node_id',
      as: 'equivalents'
    });
  };

  return Steel;
};
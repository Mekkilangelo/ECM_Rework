const { DataTypes } = require('sequelize');

/**
 * Modèle Trial (anciennement Test)
 * Renommé pour correspondre à la nouvelle structure DB
 * Migration ENUM → FK vers tables de référence
 */
module.exports = (sequelize) => {
  const Trial = sequelize.define('trial', {
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
    recipe_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'recipes',
        key: 'recipe_id'
      },
      comment: 'Référence vers la recette utilisée'
    },
    furnace_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'furnaces',
        key: 'furnace_id'
      },
      comment: 'Référence vers le four utilisé'
    },
    trial_code: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: 'Code de l\'essai'
    },
    load_number: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: 'Numéro de charge'
    },
    trial_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      comment: 'Date de l\'essai'
    },
    status: {
      type: DataTypes.STRING(100),
      allowNull: true,
      references: {
        model: 'ref_status',
        key: 'name'
      },
      comment: 'Statut de l\'essai - FK vers ref_status.name'
    },
    location: {
      type: DataTypes.STRING(100),
      allowNull: true,
      references: {
        model: 'ref_location',
        key: 'name'
      },
      comment: 'Lieu de l\'essai - FK vers ref_location.name'
    },
    // Load Data - Poids
    load_weight_unit: {
      type: DataTypes.STRING(100),
      allowNull: true,
      references: {
        model: 'ref_units',
        key: 'name'
      },
      comment: 'Unité de poids de la charge - FK vers ref_units.name'
    },
    load_weight_value: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: 'Valeur du poids de la charge'
    },
    // Load Data - Dimensions (Largeur)
    load_size_width_unit: {
      type: DataTypes.STRING(100),
      allowNull: true,
      references: {
        model: 'ref_units',
        key: 'name'
      },
      comment: 'Unité largeur - FK vers ref_units.name'
    },
    load_size_width_value: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: 'Valeur largeur'
    },
    // Load Data - Dimensions (Hauteur)
    load_size_height_unit: {
      type: DataTypes.STRING(100),
      allowNull: true,
      references: {
        model: 'ref_units',
        key: 'name'
      },
      comment: 'Unité hauteur - FK vers ref_units.name'
    },
    load_size_height_value: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: 'Valeur hauteur'
    },
    // Load Data - Dimensions (Longueur)
    load_size_length_unit: {
      type: DataTypes.STRING(100),
      allowNull: true,
      references: {
        model: 'ref_units',
        key: 'name'
      },
      comment: 'Unité longueur - FK vers ref_units.name'
    },
    load_size_length_value: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: 'Valeur longueur'
    },
    load_part_count: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Nombre de pièces dans la charge'
    },
    load_floor_count: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Nombre d\'étages dans la charge'
    },
    load_comments: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Commentaires sur la charge'
    },
    mounting_type: {
      type: DataTypes.STRING(100),
      allowNull: true,
      references: {
        model: 'ref_mounting_type',
        key: 'name'
      },
      comment: 'Type de montage - FK vers ref_mounting_type.name'
    },
    position_type: {
      type: DataTypes.STRING(100),
      allowNull: true,
      references: {
        model: 'ref_position_type',
        key: 'name'
      },
      comment: 'Type de position - FK vers ref_position_type.name'
    },
    process_type: {
      type: DataTypes.STRING(100),
      allowNull: true,
      references: {
        model: 'ref_process_type',
        key: 'name'
      },
      comment: 'Type de processus - FK vers ref_process_type.name'
    }
  }, {
    tableName: 'trials',
    timestamps: false,
    indexes: [
      {
        fields: ['recipe_id'],
        name: 'idx_trials_recipe'
      },
      {
        fields: ['furnace_id'],
        name: 'idx_trials_furnace'
      },
      {
        fields: ['status'],
        name: 'fk_trials_status'
      },
      {
        fields: ['location'],
        name: 'fk_trials_location'
      },
      {
        fields: ['mounting_type'],
        name: 'fk_trials_mounting_type'
      },
      {
        fields: ['position_type'],
        name: 'fk_trials_position_type'
      },
      {
        fields: ['process_type'],
        name: 'fk_trials_process_type'
      }
    ]
  });

  Trial.associate = function(models) {
    // 🔗 RELATION CRITIQUE : Chaque Trial DOIT appartenir à un Node
    Trial.belongsTo(models.node, { 
      foreignKey: 'node_id',
      as: 'node',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });
    
    // Relations avec tables de référence
    Trial.belongsTo(models.ref_status, {
      foreignKey: 'status',
      targetKey: 'name',
      as: 'statusRef',
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE'
    });
    
    Trial.belongsTo(models.ref_location, {
      foreignKey: 'location',
      targetKey: 'name',
      as: 'locationRef',
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE'
    });
    
    Trial.belongsTo(models.ref_mounting_type, {
      foreignKey: 'mounting_type',
      targetKey: 'name',
      as: 'mountingTypeRef',
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE'
    });
    
    Trial.belongsTo(models.ref_position_type, {
      foreignKey: 'position_type',
      targetKey: 'name',
      as: 'positionTypeRef',
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE'
    });
    
    Trial.belongsTo(models.ref_process_type, {
      foreignKey: 'process_type',
      targetKey: 'name',
      as: 'processTypeRef',
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE'
    });
    
    // Relations avec recipe et furnace
    Trial.belongsTo(models.recipe, {
      foreignKey: 'recipe_id',
      as: 'recipe',
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    });
    
    Trial.belongsTo(models.furnace, {
      foreignKey: 'furnace_id',
      as: 'furnace',
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    });
    
    // Relation avec les résultats
    Trial.hasMany(models.results_step, {
      foreignKey: 'trial_node_id',
      as: 'resultSteps',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });
    
    // Relations avec unités
    Trial.belongsTo(models.ref_units, {
      foreignKey: 'load_weight_unit',
      targetKey: 'name',
      as: 'weightUnit',
      onDelete: 'RESTRICT'
    });
    
    Trial.belongsTo(models.ref_units, {
      foreignKey: 'load_size_width_unit',
      targetKey: 'name',
      as: 'widthUnit',
      onDelete: 'RESTRICT'
    });
    
    Trial.belongsTo(models.ref_units, {
      foreignKey: 'load_size_height_unit',
      targetKey: 'name',
      as: 'heightUnit',
      onDelete: 'RESTRICT'
    });
    
    Trial.belongsTo(models.ref_units, {
      foreignKey: 'load_size_length_unit',
      targetKey: 'name',
      as: 'lengthUnit',
      onDelete: 'RESTRICT'
    });
  };

  return Trial;
};

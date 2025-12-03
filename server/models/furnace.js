const { DataTypes } = require('sequelize');

/**
 * Modèle Furnace - Table indépendante (PAS lié à nodes!)
 * ⚠️ CHANGEMENT RADICAL : Furnace n'est PLUS un type de nœud
 * C'est maintenant une table de référence pour les configurations de fours
 * CHANGEMENTS:
 * - node_id → furnace_id (auto-increment)
 * - Plus de relation avec nodes
 * - Tous les ENUM → FK vers ref_furnace_*
 */
module.exports = (sequelize) => {
  const Furnace = sequelize.define('furnace', {
    furnace_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
      comment: 'ID unique du four (auto-increment) - PLUS lié aux nodes!'
    },
    furnace_type: {
      type: DataTypes.STRING(100),
      allowNull: true,
      references: {
        model: 'ref_furnace_types',
        key: 'name'
      },
      comment: 'Type de four - FK vers ref_furnace_types.name'
    },
    furnace_size: {
      type: DataTypes.STRING(100),
      allowNull: true,
      references: {
        model: 'ref_furnace_sizes',
        key: 'name'
      },
      comment: 'Taille du four - FK vers ref_furnace_sizes.name'
    },
    heating_cell: {
      type: DataTypes.STRING(100),
      allowNull: true,
      references: {
        model: 'ref_heating_cells',
        key: 'name'
      },
      comment: 'Cellule de chauffage - FK vers ref_heating_cells.name'
    },
    cooling_media: {
      type: DataTypes.STRING(100),
      allowNull: true,
      references: {
        model: 'ref_cooling_media',
        key: 'name'
      },
      comment: 'Média de refroidissement - FK vers ref_cooling_media.name'
    },
    quench_cell: {
      type: DataTypes.STRING(100),
      allowNull: true,
      references: {
        model: 'ref_quench_cells',
        key: 'name'
      },
      comment: 'Cellule de trempe - FK vers ref_quench_cells.name'
    }
  }, {
    tableName: 'furnaces',
    timestamps: false,
    indexes: [
      {
        unique: true,
        fields: ['furnace_type', 'furnace_size', 'heating_cell', 'cooling_media', 'quench_cell'],
        name: 'uq_furnace_config'
      },
      {
        fields: ['furnace_size'],
        name: 'fk_furnace_size'
      },
      {
        fields: ['heating_cell'],
        name: 'fk_heating_cell'
      },
      {
        fields: ['cooling_media'],
        name: 'fk_cooling_media'
      },
      {
        fields: ['quench_cell'],
        name: 'fk_quench_cell'
      }
    ]
  });

  Furnace.associate = function(models) {
    // ⚠️ PLUS de relation avec Node!
    // Furnace est maintenant une table de configuration indépendante
    
    // Relations avec les tables de référence
    Furnace.belongsTo(models.ref_furnace_types, {
      foreignKey: 'furnace_type',
      targetKey: 'name',
      as: 'typeRef',
      onDelete: 'RESTRICT'
    });
    
    Furnace.belongsTo(models.ref_furnace_sizes, {
      foreignKey: 'furnace_size',
      targetKey: 'name',
      as: 'sizeRef',
      onDelete: 'RESTRICT'
    });
    
    Furnace.belongsTo(models.ref_heating_cells, {
      foreignKey: 'heating_cell',
      targetKey: 'name',
      as: 'heatingCellRef',
      onDelete: 'RESTRICT'
    });
    
    Furnace.belongsTo(models.ref_cooling_media, {
      foreignKey: 'cooling_media',
      targetKey: 'name',
      as: 'coolingMediaRef',
      onDelete: 'RESTRICT'
    });
    
    Furnace.belongsTo(models.ref_quench_cells, {
      foreignKey: 'quench_cell',
      targetKey: 'name',
      as: 'quenchCellRef',
      onDelete: 'RESTRICT'
    });
    
    // Relation inverse avec Trials
    Furnace.hasMany(models.trial, {
      foreignKey: 'furnace_id',
      sourceKey: 'furnace_id',
      as: 'trials'
    });
  };

  return Furnace;
};
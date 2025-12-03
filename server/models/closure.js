const { DataTypes } = require('sequelize');

/**
 * Modèle Closure - Closure Table Pattern pour hiérarchie complète
 * Stocke TOUTES les relations ancêtre-descendant (directes et indirectes)
 * Philosophie Synergia : La DB gère la complexité des requêtes hiérarchiques
 */
module.exports = (sequelize) => {
  const Closure = sequelize.define('closure', {
    ancestor_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      references: {
        model: 'nodes',
        key: 'id'
      },
      comment: 'ID du nœud ancêtre'
    },
    descendant_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      references: {
        model: 'nodes',
        key: 'id'
      },
      comment: 'ID du nœud descendant'
    },
    depth: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: 'Profondeur de la relation (0 = nœud lui-même, 1 = enfant direct, etc.)'
    }
  }, {
    tableName: 'closure',
    timestamps: false,
    indexes: [
      {
        fields: ['ancestor_id'],
        name: 'idx_closure_ancestor'
      },
      {
        fields: ['descendant_id'],
        name: 'idx_closure_descendant'
      },
      {
        fields: ['depth'],
        name: 'idx_closure_depth'
      }
    ]
  });

  Closure.associate = function(models) {
    // 🔗 Relations vers Node : Les deux côtés de la relation hiérarchique
    Closure.belongsTo(models.node, { 
      as: 'ancestor', 
      foreignKey: 'ancestor_id',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });
    
    Closure.belongsTo(models.node, { 
      as: 'descendant', 
      foreignKey: 'descendant_id',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });
  };

  return Closure;
};
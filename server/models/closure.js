const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Closure = sequelize.define('closure', {
    ancestor_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      references: {
        model: 'nodes',
        key: 'id'
      }
    },
    descendant_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      references: {
        model: 'nodes',
        key: 'id'
      }
    },
    depth: {
      type: DataTypes.INTEGER,
      allowNull: true
    }
  }, {
    tableName: 'closure',
    timestamps: false
  });

  Closure.associate = function(models) {
    Closure.belongsTo(models.node, { 
      as: 'ancestor', 
      foreignKey: 'ancestor_id',
      onDelete: 'CASCADE'
    });
    
    Closure.belongsTo(models.node, { 
      as: 'descendant', 
      foreignKey: 'descendant_id',
      onDelete: 'CASCADE'
    });
  };

  return Closure;
};
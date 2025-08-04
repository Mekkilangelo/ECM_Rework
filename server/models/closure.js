const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Closure = sequelize.define('Closure', {
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
    Closure.belongsTo(models.Node, { as: 'ancestor', foreignKey: 'ancestor_id' });
    Closure.belongsTo(models.Node, { as: 'descendant', foreignKey: 'descendant_id' });
  };

  return Closure;
};
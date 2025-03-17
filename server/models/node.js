const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Node = sequelize.define('Node', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    path: {
      type: DataTypes.STRING(1000),
      allowNull: false
    },
    type: {
      type: DataTypes.ENUM('client', 'order', 'test', 'file', 'part', 'furnace', 'steel'),
      allowNull: false
    },
    parent_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Nodes',
        key: 'id'
      }
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    modified_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    data_status: {
      type: DataTypes.ENUM('new', 'old', 'opened'),
      allowNull: false,
      defaultValue: 'old'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    tableName: 'nodes',
    timestamps: false
  });

  Node.associate = function(models) {
    Node.hasMany(models.Node, { as: 'children', foreignKey: 'parent_id' });
    Node.belongsTo(models.Node, { as: 'parent', foreignKey: 'parent_id' });
    
    // Associations avec les tables spécifiques
    Node.hasOne(models.Client, { foreignKey: 'node_id' });
    Node.hasOne(models.Order, { foreignKey: 'node_id' });
    Node.hasOne(models.Part, { foreignKey: 'node_id' });
    Node.hasOne(models.Test, { foreignKey: 'node_id' });
    Node.hasOne(models.File, { foreignKey: 'node_id' });
    Node.hasOne(models.Steel, { foreignKey: 'node_id' });
    Node.hasOne(models.Furnace, { foreignKey: 'node_id' });
  };

  return Node;
};
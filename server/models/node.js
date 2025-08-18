const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Node = sequelize.define('node', {
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
        model: 'nodes',
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
    timestamps: false,
    indexes: [
      {
        fields: ['parent_id'],
        name: 'idx_parent_id'
      }
    ]
  });
  Node.associate = function(models) {
    Node.hasMany(models.node, { as: 'children', foreignKey: 'parent_id' });
    Node.belongsTo(models.node, { as: 'parent', foreignKey: { name: 'parent_id', allowNull: true }, onDelete: 'SET NULL', onUpdate: 'CASCADE' });
    
    // Associations avec les tables spécifiques
    Node.hasOne(models.client, { foreignKey: 'node_id' });
    Node.hasOne(models.order, { foreignKey: 'node_id' });
    Node.hasOne(models.part, { foreignKey: 'node_id' });
    Node.hasOne(models.test, { foreignKey: 'node_id' });
    Node.hasOne(models.file, { foreignKey: 'node_id' });
    Node.hasOne(models.steel, { foreignKey: 'node_id' });
    Node.hasOne(models.furnace, { foreignKey: 'node_id' });
    
    // Associations avec Closure pour les relations hiérarchiques
    Node.hasMany(models.closure, { as: 'AncestorClosures', foreignKey: 'ancestor_id' });
    Node.hasMany(models.closure, { as: 'DescendantClosures', foreignKey: 'descendant_id' });
  };

  return Node;
};
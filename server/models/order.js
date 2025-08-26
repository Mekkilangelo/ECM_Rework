const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Order = sequelize.define('order', {
    node_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      references: {
        model: 'nodes',
        key: 'id'
      }
    },
    order_number: {
      type: DataTypes.STRING(50),
      unique: true,
      allowNull: true
    },
    order_date: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    commercial: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    contacts: {
      type: DataTypes.JSON,
      allowNull: true
    }
  }, {
    tableName: 'orders',
    timestamps: false,
    indexes: [
      {
        unique: true,
        fields: ['order_number'],
        name: 'unique_order_number'
      }
    ]
  });

  Order.associate = function(models) {
    Order.belongsTo(models.node, { 
      foreignKey: 'node_id', 
      onDelete: 'CASCADE' 
    });
  };

  return Order;
};
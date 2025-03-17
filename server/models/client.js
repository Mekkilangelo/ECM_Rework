const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Client = sequelize.define('Client', {
    node_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      references: {
        model: 'Nodes',
        key: 'id'
      }
    },
    client_code: {
      type: DataTypes.STRING(50),
      unique: true,
      allowNull: true
    },
    city: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    country: {
      type: DataTypes.ENUM('USA', '...'),
      allowNull: true
    },
    client_group: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    address: {
      type: DataTypes.STRING(50),
      allowNull: true
    }
  }, {
    tableName: 'clients',
    timestamps: false
  });

  Client.associate = function(models) {
    Client.belongsTo(models.Node, { foreignKey: 'node_id', onDelete: 'CASCADE' });
  };

  return Client;
};
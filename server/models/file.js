const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const File = sequelize.define('File', {
    node_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      references: {
        model: 'Nodes',
        key: 'id'
      }
    },
    size: {
      type: DataTypes.BIGINT,
      allowNull: true
    },
    mime_type: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    checksum: {
      type: DataTypes.STRING(64),
      allowNull: true
    },
    additional_info: {
      type: DataTypes.JSON,
      allowNull: true
    }
  }, {
    tableName: 'files',
    timestamps: false
  });

  File.associate = function(models) {
    File.belongsTo(models.Node, { foreignKey: 'node_id', onDelete: 'CASCADE' });
  };

  return File;
};
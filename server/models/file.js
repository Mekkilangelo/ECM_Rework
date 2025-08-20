const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const File = sequelize.define('file', {
    node_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      references: {
        model: 'nodes',
        key: 'id'
      }
    },
    original_name: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    file_path: {
      type: DataTypes.STRING(1000),
      allowNull: false
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
    category: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    subcategory: {
      type: DataTypes.STRING(50),
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
    File.belongsTo(models.node, {
      foreignKey: 'node_id',
      onDelete: 'CASCADE'
    });
  };

  return File;
};
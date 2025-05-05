// models/file.js
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
      allowNull: true,
      comment: 'Pour organiser par type: "general", "photos", "curves", etc.'
    },
    subcategory: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: 'Pour préciser: "top_view", "heating_curve", etc.'
    },
    additional_info: {
      type: DataTypes.JSON,
      allowNull: true
    }
  }, {
    tableName: 'files',
    timestamps: false
  });

  return File;
};
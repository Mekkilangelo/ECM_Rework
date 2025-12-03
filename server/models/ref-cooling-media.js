const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const RefCoolingMedia = sequelize.define('ref_cooling_media', {
    name: {
      type: DataTypes.STRING(100),
      primaryKey: true,
      allowNull: false
    }
  }, {
    tableName: 'ref_cooling_media',
    timestamps: false
  });

  RefCoolingMedia.associate = function(models) {
    RefCoolingMedia.hasMany(models.furnace, {
      foreignKey: 'cooling_media',
      sourceKey: 'name',
      as: 'furnaces'
    });
  };

  return RefCoolingMedia;
};

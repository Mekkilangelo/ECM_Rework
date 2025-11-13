const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const RefFurnaceSizes = sequelize.define('ref_furnace_sizes', {
    name: {
      type: DataTypes.STRING(100),
      primaryKey: true,
      allowNull: false
    }
  }, {
    tableName: 'ref_furnace_sizes',
    timestamps: false
  });

  RefFurnaceSizes.associate = function(models) {
    RefFurnaceSizes.hasMany(models.furnace, {
      foreignKey: 'furnace_size',
      sourceKey: 'name',
      as: 'furnaces'
    });
  };

  return RefFurnaceSizes;
};

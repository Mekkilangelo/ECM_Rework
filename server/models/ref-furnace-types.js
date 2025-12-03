const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const RefFurnaceTypes = sequelize.define('ref_furnace_types', {
    name: {
      type: DataTypes.STRING(100),
      primaryKey: true,
      allowNull: false
    }
  }, {
    tableName: 'ref_furnace_types',
    timestamps: false
  });

  RefFurnaceTypes.associate = function(models) {
    RefFurnaceTypes.hasMany(models.furnace, {
      foreignKey: 'furnace_type',
      sourceKey: 'name',
      as: 'furnaces'
    });
  };

  return RefFurnaceTypes;
};

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const RefHeatingCells = sequelize.define('ref_heating_cells', {
    name: {
      type: DataTypes.STRING(100),
      primaryKey: true,
      allowNull: false
    }
  }, {
    tableName: 'ref_heating_cells',
    timestamps: false
  });

  RefHeatingCells.associate = function(models) {
    RefHeatingCells.hasMany(models.furnace, {
      foreignKey: 'heating_cell',
      sourceKey: 'name',
      as: 'furnaces'
    });
  };

  return RefHeatingCells;
};

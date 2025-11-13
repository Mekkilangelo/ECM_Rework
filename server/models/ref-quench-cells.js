const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const RefQuenchCells = sequelize.define('ref_quench_cells', {
    name: {
      type: DataTypes.STRING(100),
      primaryKey: true,
      allowNull: false
    }
  }, {
    tableName: 'ref_quench_cells',
    timestamps: false
  });

  RefQuenchCells.associate = function(models) {
    RefQuenchCells.hasMany(models.furnace, {
      foreignKey: 'quench_cell',
      sourceKey: 'name',
      as: 'furnaces'
    });
  };

  return RefQuenchCells;
};

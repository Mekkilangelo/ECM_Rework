const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Furnace = sequelize.define('furnace', {
    node_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      references: {
        model: 'nodes',
        key: 'id'
      }
    },
    furnace_type: {
      type: DataTypes.ENUM('Eco', 'Nano', 'Flex', 'Jumbo', 'PREO', 'Temper', 'FOUR', 'furnace'),
      allowNull: true
    },
    furnace_size: {
      type: DataTypes.ENUM('6-4-4', '6-5-2', '9-6-6', '1-2-9-9'),
      allowNull: true
    },
    heating_cell_type: {
      type: DataTypes.ENUM('CRV', 'CCF', 'CCN'),
      allowNull: true
    },
    cooling_media: {
      type: DataTypes.ENUM('Oil', 'N2', 'He'),
      allowNull: true
    },
    process_type: {
      type: DataTypes.ENUM('Annealing', 'Preox', 'Hardening', 'Nitiring', 'Nitrocarburizing', 'Post ox', 'Carburizing', 'Cabonitriding', 'Tempering', 'Brazing', 'Sintering', 'Oxidizing', 'Debinding', 'Melting', 'Step Quenching', 'DATAPAQ'),
      allowNull: true
    },
    quench_cell: {
      type: DataTypes.ENUM('CTG 21H', 'CTG 27H'),
      allowNull: true
    }
  }, {
    tableName: 'furnaces',
    timestamps: false
  });

  Furnace.associate = function(models) {
    Furnace.belongsTo(models.node, { 
      foreignKey: 'node_id', 
      onDelete: 'CASCADE' 
    });
  };

  return Furnace;
};
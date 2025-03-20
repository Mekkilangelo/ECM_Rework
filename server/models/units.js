const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Unit = sequelize.define('Unit', {
    length_units: {
      type: DataTypes.ENUM('mm', 'inch'),
      allowNull: true,
      defaultValue: null
    },
    weight_units: {
      type: DataTypes.ENUM('kg', 'pound'),
      allowNull: true,
      defaultValue: null
    },
    hardness_units: {
      type: DataTypes.ENUM('HC_20', 'HC_30', 'HC_45', 'HC_60', 'HV_200', 'HV_300', 'HV_500'),
      allowNull: true,
      defaultValue: null
    },
    temperature_units: {
      type: DataTypes.ENUM('°C', '°F'),
      allowNull: true,
      defaultValue: null
    },
    time_units: {
      type: DataTypes.ENUM('s', 'min', 'h'),
      allowNull: true,
      defaultValue: null
    },
    pressure_units: {
      type: DataTypes.ENUM('mbar', 'N'),
      allowNull: true,
      defaultValue: null
    }
  }, {
    tableName: 'units',
    timestamps: false,
  });

  return Unit;
};

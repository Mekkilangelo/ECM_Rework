const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Test = sequelize.define('test', {
    node_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      references: {
        model: 'nodes',
        key: 'id'
      }
    },
    test_code: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    load_number: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    test_date: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('OK', 'NOK', 'Pending'),
      allowNull: true
    },
    location: {
      type: DataTypes.ENUM('ECM', 'Client site'),
      allowNull: true
    },
    furnace_data: {
      type: DataTypes.JSON,
      allowNull: true
    },
    load_data: {
      type: DataTypes.JSON,
      allowNull: true
    },
    recipe_data: {
      type: DataTypes.JSON,
      allowNull: true
    },
    quench_data: {
      type: DataTypes.JSON,
      allowNull: true
    },
    results_data: {
      type: DataTypes.JSON,
      allowNull: true
    },
    mounting_type: {
      type: DataTypes.ENUM('Support_Rack', 'Hanging', 'Fixture', 'Tray', 'Conveyor_Belt'),
      allowNull: true
    },
    position_type: {
      type: DataTypes.ENUM('Horizontal', 'Vertical', 'Rotary', 'Stationary', 'Oscillating'),
      allowNull: true
    },
    process_type: {
      type: DataTypes.ENUM('Annealing', 'Quenching', 'Tempering', 'Carburizing', 'Nitriding'),
      allowNull: true
    },
    preox_media: {
      type: DataTypes.ENUM('Water', 'Air', 'N2'),
      allowNull: true
    }
  }, {
    tableName: 'tests',
    timestamps: false
  });

  Test.associate = function(models) {
    Test.belongsTo(models.node, { foreignKey: 'node_id', onDelete: 'CASCADE' });
  };

  return Test;
};

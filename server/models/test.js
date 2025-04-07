const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Test = sequelize.define('Test', {
    node_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      references: {
        model: 'Nodes',
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
      type: DataTypes.ENUM('passe', 'echoue', 'en_cours', 'planned'),
      allowNull: true
    },
    location: {
      type: DataTypes.ENUM('ECM', 'site'),
      allowNull: true
    },
    is_mesured: {
      type: DataTypes.ENUM('Oui', 'Non'),
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
    }
  }, {
    tableName: 'tests',
    timestamps: false
  });

  Test.associate = function(models) {
    Test.belongsTo(models.Node, { foreignKey: 'node_id', onDelete: 'CASCADE' });
  };

  return Test;
};

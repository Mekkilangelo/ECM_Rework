const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Steel = sequelize.define('Steel', {
    node_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      references: {
        model: 'Nodes',
        key: 'id'
      }
    },
    grade: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    family: {
      type: DataTypes.ENUM('Low_alloyed', 'Stainless_steel', 'Tool_steel', 'Construction_steel', 'Austenitic', 'Ferritic', 'Martensitic', 'Duplex', 'HSS', 'HCC'),
      allowNull: true
    },
    standard: {
      type: DataTypes.ENUM('GOST_1050', 'EN_10020', 'ASTM_AISI'),
      allowNull: true
    },
    equivalents: {
      type: DataTypes.JSON,
      allowNull: true
    },
    chemistery: {
      type: DataTypes.JSON,
      allowNull: true
    },
    elements: {
      type: DataTypes.ENUM('C - Carbon', 'Si - Silicon', 'Mn - Manganese', 'P - Phosphorus', 'S - Sulfur', 'Cr - Chromium', 'Ni - Nickel', 'Mo - Molybdenum', 'V - Vanadium', 'W - Tungsten', 'Co - Cobalt', 'Ti - Titanium', 'Al - Aluminum', 'Nb - Niobium', 'Zr - Zirconium', 'Cu - Copper', 'N - Nitrogen', 'O - Oxygen', 'H - Hydrogen', 'B - Boron', 'Pb - Lead', 'Sn - Tin', 'Zn - Zinc', 'Fe - Iron', 'As - Arsenic', 'Mg - Magnesium', 'Ca - Calcium', 'Ta - Tantalum', 'Re - Rhenium'),
      allowNull: true
    }
  }, {
    tableName: 'steels',
    timestamps: false
  });

  Steel.associate = function(models) {
    Steel.belongsTo(models.Node, { foreignKey: 'node_id', onDelete: 'CASCADE' });
  };

  return Steel;
};

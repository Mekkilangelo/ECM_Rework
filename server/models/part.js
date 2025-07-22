const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Part = sequelize.define('Part', {
    node_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      references: {
        model: 'Nodes',
        key: 'id'
      }
    },
    designation: {
      type: DataTypes.ENUM('Other','Gear','Hub','Clip','Tool','Misc','Housing','Ring','Shaft','Sample','Bushing','Piston'),
      allowNull: true
    },
    client_designation: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    reference: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    dimensions: {
      type: DataTypes.JSON,
      allowNull: true
    },
    specifications: {
      type: DataTypes.JSON,
      allowNull: true
    },
    steel: {
      type: DataTypes.STRING(255),
      allowNull: true
    }
  }, {
    tableName: 'parts',
    timestamps: false
  });

  Part.associate = function(models) {
    Part.belongsTo(models.Node, { foreignKey: 'node_id', onDelete: 'CASCADE' });
  };

  return Part;
};
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Inquiry = sequelize.define('Inquiry', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    services: { type: DataTypes.TEXT, allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    company: { type: DataTypes.STRING(255), allowNull: true },
    name: { type: DataTypes.STRING(255), allowNull: false },
    email: { type: DataTypes.STRING(255), allowNull: false },
    status: {
      type: DataTypes.STRING(20),
      defaultValue: 'new',
      allowNull: false,
      validate: { isIn: [['new', 'read', 'archived']] },
    },
    deadline: { type: DataTypes.DATEONLY, allowNull: true },
  }, {
    tableName: 'inquiries',
    indexes: [
      { fields: ['status'] },
    ],
  });

  return Inquiry;
};

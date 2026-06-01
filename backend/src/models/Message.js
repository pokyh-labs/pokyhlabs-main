const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Message = sequelize.define('Message', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    inquiry_id: { type: DataTypes.INTEGER, allowNull: false },
    // 'inbound'  = from the customer to us
    // 'outbound' = a reply we sent from the dashboard
    direction: {
      type: DataTypes.STRING(10),
      allowNull: false,
      defaultValue: 'outbound',
      validate: { isIn: [['inbound', 'outbound']] },
    },
    author: { type: DataTypes.STRING(255), allowNull: true },   // username (outbound) or customer name (inbound)
    from_email: { type: DataTypes.STRING(255), allowNull: true },
    to_email: { type: DataTypes.STRING(255), allowNull: true },
    subject: { type: DataTypes.STRING(255), allowNull: true },
    body: { type: DataTypes.TEXT, allowNull: false },
    emailed: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false }, // whether an email was actually dispatched
  }, {
    tableName: 'messages',
    indexes: [
      { fields: ['inquiry_id'] },
    ],
  });

  return Message;
};

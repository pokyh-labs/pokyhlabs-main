const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('ErrorLog', {
    id:          { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    message:     { type: DataTypes.TEXT },
    stack:       { type: DataTypes.TEXT },
    endpoint:    { type: DataTypes.STRING(500) },
    method:      { type: DataTypes.STRING(10) },
    status_code: { type: DataTypes.INTEGER },
    user_id:     { type: DataTypes.INTEGER, allowNull: true },
  }, {
    tableName: 'error_logs',
    updatedAt: false,
    indexes: [
      { fields: ['created_at'] },
      { fields: ['status_code'] },
      { fields: ['endpoint'] },
    ],
  });
};

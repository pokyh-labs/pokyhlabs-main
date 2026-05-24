const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('AuthLog', {
    id:           { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    event_type:   { type: DataTypes.STRING(30) }, // login_success|login_failed|logout|token_refresh|account_locked
    ip:           { type: DataTypes.STRING(45) },
    user_agent:   { type: DataTypes.STRING(500) },
    user_id:      { type: DataTypes.INTEGER },
    username:     { type: DataTypes.STRING(100) },
    details:      { type: DataTypes.STRING(500) },
    country_code: { type: DataTypes.STRING(5) },
    country:      { type: DataTypes.STRING(100) },
    success:      { type: DataTypes.BOOLEAN, defaultValue: false },
  }, {
    tableName: 'auth_logs',
    updatedAt: false,
    indexes: [
      { fields: ['created_at'] },
      { fields: ['event_type'] },
      { fields: ['ip'] },
      { fields: ['user_id'] },
    ],
  });
};

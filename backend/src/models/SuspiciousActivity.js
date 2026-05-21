const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const SuspiciousActivity = sequelize.define('SuspiciousActivity', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    ip_address: { type: DataTypes.STRING(45), allowNull: false },
    event_type: {
      type: DataTypes.ENUM(
        'failed_login', 'brute_force', 'invalid_token', 'rate_limit_hit',
        'sql_injection_attempt', 'xss_attempt', 'path_traversal', 'suspicious_ua'
      ),
      allowNull: false,
    },
    details: { type: DataTypes.TEXT, allowNull: true },
    user_agent: { type: DataTypes.STRING(500), allowNull: true },
    url: { type: DataTypes.STRING(500), allowNull: true },
    user_id: { type: DataTypes.INTEGER, allowNull: true },
  }, {
    tableName: 'suspicious_activities',
    indexes: [
      { fields: ['ip_address'] },
      { fields: ['event_type'] },
      { fields: ['created_at'] },
    ],
  });

  return SuspiciousActivity;
};

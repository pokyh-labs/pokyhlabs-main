const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const TunnelConfig = sequelize.define('TunnelConfig', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    tunnel_name: { type: DataTypes.STRING(255), allowNull: false },
    tunnel_id: { type: DataTypes.STRING(255), allowNull: true },
    tunnel_token_encrypted: { type: DataTypes.TEXT, allowNull: true },
    cf_account_id: { type: DataTypes.STRING(255), allowNull: true },
    cf_api_token_encrypted: { type: DataTypes.TEXT, allowNull: true },
    cf_zone_id: { type: DataTypes.STRING(255), allowNull: true },
    hostname: { type: DataTypes.STRING(255), allowNull: true },
    local_service: { type: DataTypes.STRING(255), allowNull: true },
    status: {
      type: DataTypes.ENUM('stopped', 'running', 'error'),
      defaultValue: 'stopped',
    },
    service_installed: { type: DataTypes.BOOLEAN, defaultValue: false },
  }, {
    tableName: 'tunnel_configs',
  });

  return TunnelConfig;
};

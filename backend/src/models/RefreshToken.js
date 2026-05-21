const { DataTypes } = require('sequelize');
const crypto = require('crypto');

module.exports = (sequelize) => {
  const RefreshToken = sequelize.define('RefreshToken', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    user_id: { type: DataTypes.INTEGER, allowNull: false },
    token_hash: { type: DataTypes.STRING(255), allowNull: false, unique: true },
    expires_at: { type: DataTypes.DATE, allowNull: false },
    ip_address: { type: DataTypes.STRING(45), allowNull: true },
    user_agent: { type: DataTypes.STRING(500), allowNull: true },
    is_revoked: { type: DataTypes.BOOLEAN, defaultValue: false },
  }, {
    tableName: 'refresh_tokens',
    indexes: [
      { fields: ['token_hash'] },
      { fields: ['user_id'] },
      { fields: ['expires_at'] },
    ],
  });

  RefreshToken.hashToken = (token) =>
    crypto.createHash('sha256').update(token).digest('hex');

  RefreshToken.prototype.isValid = function () {
    return !this.is_revoked && new Date(this.expires_at) > new Date();
  };

  return RefreshToken;
};

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('AccessLog', {
    id:            { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    method:        { type: DataTypes.STRING(10) },
    url:           { type: DataTypes.STRING(500) },
    status:        { type: DataTypes.INTEGER },
    response_time: { type: DataTypes.INTEGER },  // ms
    ip:            { type: DataTypes.STRING(45) },
    user_agent:    { type: DataTypes.STRING(500) },
    user_id:       { type: DataTypes.INTEGER },
    username:      { type: DataTypes.STRING(100) },
    country_code:  { type: DataTypes.STRING(5) },
    country:       { type: DataTypes.STRING(100) },
    city:          { type: DataTypes.STRING(100) },
    lat:           { type: DataTypes.FLOAT },
    lng:           { type: DataTypes.FLOAT },
  }, {
    tableName: 'access_logs',
    updatedAt: false,
    indexes: [
      { fields: ['created_at'] },
      { fields: ['ip'] },
      { fields: ['status'] },
      { fields: ['user_id'] },
      { fields: ['country_code'] },
    ],
  });
};

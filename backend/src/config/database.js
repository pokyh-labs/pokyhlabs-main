const { Sequelize } = require('sequelize');
const path = require('path');
const fs = require('fs');
const logger = require('../utils/logger');

let sequelize;

if (process.env.DB_HOST) {
  sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '3306', 10),
      dialect: 'mysql',
      logging: (sql) => logger.debug(sql),
      define: {
        underscored: true,
        timestamps: true,
      },
      pool: {
        max: 10,
        min: 0,
        acquire: 30000,
        idle: 10000,
      },
    }
  );
} else {
  const storagePath = path.resolve(
    process.env.SQLITE_PATH || path.join(__dirname, '../../data/database.sqlite')
  );
  fs.mkdirSync(path.dirname(storagePath), { recursive: true });
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: storagePath,
    logging: (sql) => logger.debug(sql),
    define: {
      underscored: true,
      timestamps: true,
    },
  });
}

module.exports = sequelize;

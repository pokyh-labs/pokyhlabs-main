const { Sequelize } = require('sequelize');
const path = require('path');
const fs = require('fs');
const logger = require('../utils/logger');

const storagePath = path.resolve(
  process.env.SQLITE_PATH || path.join(__dirname, '../../data/database.sqlite')
);

fs.mkdirSync(path.dirname(storagePath), { recursive: true });

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: storagePath,
  logging: (sql) => logger.debug(sql),
  define: {
    underscored: true,
    timestamps: true,
  },
});

module.exports = sequelize;

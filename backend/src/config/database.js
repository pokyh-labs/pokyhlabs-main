const { Sequelize } = require('sequelize');
const path = require('path');
const fs = require('fs');
const logger = require('../utils/logger');

let sequelize;

// Default TCP ports per dialect — used only when DB_PORT is not provided.
const DEFAULT_PORTS = { postgres: 5432, mysql: 3306, mariadb: 3306 };

if (process.env.DB_HOST) {
  // Dialect is configurable (default: postgres). Nothing hardcoded — switch
  // back to mysql/mariadb purely via the DB_DIALECT env var if ever needed.
  const dialect = (process.env.DB_DIALECT || 'postgres').toLowerCase();
  const port = parseInt(
    process.env.DB_PORT || String(DEFAULT_PORTS[dialect] || 5432),
    10
  );

  // Optional TLS — enable with DB_SSL=true. DB_SSL_REJECT_UNAUTHORIZED=false
  // allows self-signed certs (common for managed/internal DBs like Dokploy).
  const useSSL = String(process.env.DB_SSL || '').toLowerCase() === 'true';
  const rejectUnauthorized =
    String(process.env.DB_SSL_REJECT_UNAUTHORIZED || 'true').toLowerCase() !== 'false';

  const dialectOptions = {};
  if (useSSL) {
    dialectOptions.ssl = { require: true, rejectUnauthorized };
  }

  sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
      host: process.env.DB_HOST,
      port,
      dialect,
      dialectOptions,
      logging: (sql) => logger.debug(sql),
      define: {
        underscored: true,
        timestamps: true,
      },
      pool: {
        max: parseInt(process.env.DB_POOL_MAX || '10', 10),
        min: parseInt(process.env.DB_POOL_MIN || '0', 10),
        acquire: parseInt(process.env.DB_POOL_ACQUIRE || '30000', 10),
        idle: parseInt(process.env.DB_POOL_IDLE || '10000', 10),
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

const winston = require('winston');
require('winston-daily-rotate-file');
const path = require('path');

const LOG_DIR = path.join(__dirname, '../../logs');

const fmt = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.printf(({ level, message, timestamp, ...meta }) => {
    const extra = Object.keys(meta).length ? ' ' + JSON.stringify(meta) : '';
    return `${timestamp} ${level}: ${message}${extra}`;
  })
);

const rotateTransport = new winston.transports.DailyRotateFile({
  dirname: LOG_DIR,
  filename: 'app-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  maxSize: '20m',
  maxFiles: '30d',
  format: fmt,
});

const securityRotate = new winston.transports.DailyRotateFile({
  dirname: LOG_DIR,
  filename: 'security-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  maxSize: '20m',
  maxFiles: '90d',
  level: 'warn',
  format: fmt,
});

const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  transports: [
    rotateTransport,
    securityRotate,
    ...(process.env.NODE_ENV !== 'production'
      ? [new winston.transports.Console({ format: consoleFormat })]
      : [new winston.transports.Console({ format: fmt })])
  ],
});

module.exports = logger;

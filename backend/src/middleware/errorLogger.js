const { ErrorLog } = require('../models');
const logger = require('../utils/logger');

module.exports = function errorLogger(err, req, res, next) {
  const status = err.status || err.statusCode || 500;

  if (status >= 500) {
    logger.error('Unhandled server error', {
      message: err.message,
      stack: err.stack,
      url: req.originalUrl,
      method: req.method,
    });

    ErrorLog.create({
      message: (err.message || 'Unknown error').slice(0, 2000),
      stack:   err.stack?.slice(0, 5000),
      endpoint: req.path?.slice(0, 1000),
      method:  req.method?.slice(0, 10),
      status_code: status,
      user_id: req.user?.id ?? null,
    }).catch(() => {});
  }

  next(err);
};

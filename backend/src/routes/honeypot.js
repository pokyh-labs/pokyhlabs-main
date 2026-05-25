const router = require('express').Router();
const { responses, paths } = require('../config/honeypot');

function pick() {
  return responses[Math.floor(Math.random() * responses.length)];
}

// Catch every HTTP method on every configured path
paths.forEach(p => {
  router.all(p, (req, res) => {
    res.status(418).json({ message: pick() });
  });
});

module.exports = router;

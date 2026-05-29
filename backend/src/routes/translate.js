const router = require('express').Router();
const { body, validationResult } = require('express-validator');
const { authenticate } = require('../middleware/authenticate');
const { authorize } = require('../middleware/authorize');
const { adminRateLimiter } = require('../middleware/rateLimiter');
const { translateMany, SUPPORTED } = require('../utils/translate');
const logger = require('../utils/logger');

const MAX_TEXTS = 60;
const MAX_TOTAL_CHARS = 50000;

router.post('/',
  authenticate,
  authorize('admin', 'editor'),
  adminRateLimiter,
  body('from').isIn(SUPPORTED),
  body('to').isIn(SUPPORTED),
  body('texts').isArray({ min: 1, max: MAX_TEXTS }),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Ungültige Anfrage', errors: errors.array() });
    }

    const { from, to } = req.body;
    if (from === to) return res.status(400).json({ error: 'Quell- und Zielsprache sind identisch' });

    const texts = req.body.texts.map(t => (typeof t === 'string' ? t : ''));
    const total = texts.reduce((sum, t) => sum + t.length, 0);
    if (total > MAX_TOTAL_CHARS) {
      return res.status(413).json({ error: 'Zu viel Text auf einmal zum Übersetzen' });
    }

    try {
      const translated = await translateMany(texts, from, to);
      return res.json({ texts: translated });
    } catch (err) {
      logger.error('translate route failed', { err: err.message });
      return res.status(502).json({ error: 'Übersetzungsdienst nicht erreichbar' });
    }
  }
);

module.exports = router;

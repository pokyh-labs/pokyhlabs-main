const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { ALLOWED_IMAGE_MIMES, validateMagicBytes } = require('../config/security');
const logger = require('../utils/logger');

const BACKEND_ROOT = path.resolve(__dirname, '../..');
const _rawUploadPath = process.env.UPLOAD_PATH || 'uploads';
const UPLOAD_DIR = path.isAbsolute(_rawUploadPath)
  ? _rawUploadPath
  : path.resolve(BACKEND_ROOT, _rawUploadPath);
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const TOKEN_TTL_MS = 10 * 60 * 1000; // 10 minutes
const MAX_SIZE = parseInt(process.env.MAX_FILE_SIZE_MB || '15') * 1024 * 1024;

// Determine extension from validated MIME type — never trust original filename
const MIME_TO_EXT = {
  'image/jpeg': '.jpg',
  'image/png':  '.png',
  'image/gif':  '.gif',
  'image/webp': '.webp',
};

// In-memory one-time token store
const tokens = new Map(); // token -> { expiresAt, claimed, userId }

// Evict expired tokens every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [tok, data] of tokens) {
    if (data.expiresAt < now) tokens.delete(tok);
  }
}, 5 * 60 * 1000).unref();

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = MIME_TO_EXT[file.mimetype] || '.bin';
    cb(null, `${crypto.randomBytes(16).toString('hex')}${ext}`);
  },
});

const multerUpload = multer({
  storage,
  limits: { fileSize: MAX_SIZE, files: 1 },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_IMAGE_MIMES.has(file.mimetype)) {
      return cb(new Error('Nur Bilder erlaubt (JPEG, PNG, GIF, WebP)'), false);
    }
    cb(null, true);
  },
});

// POST /api/upload/presign — authenticated, returns a one-time upload token
async function presign(req, res) {
  const token = crypto.randomBytes(32).toString('hex');
  tokens.set(token, {
    expiresAt: Date.now() + TOKEN_TTL_MS,
    claimed: false,
    userId: req.user.id,
  });
  logger.info('Upload presigned', { event: 'upload_presign', userId: req.user.id });
  res.json({
    token,
    uploadUrl: `/api/upload/${token}`,
    expiresAt: new Date(Date.now() + TOKEN_TTL_MS).toISOString(),
  });
}

// Middleware: validate token atomically before multer touches the request
function validateToken(req, res, next) {
  const { token } = req.params;
  const data = tokens.get(token);

  if (!data)         return res.status(404).json({ error: 'Ungültiger oder abgelaufener Upload-Token' });
  if (data.claimed)  return res.status(410).json({ error: 'Upload-Token wurde bereits verwendet' });
  if (data.expiresAt < Date.now()) {
    tokens.delete(token);
    return res.status(410).json({ error: 'Upload-Token ist abgelaufen' });
  }

  // Claim the token before multer runs — prevents double-use even under concurrent requests
  data.claimed = true;
  req._uploadUserId = data.userId;
  next();
}

// PUT /api/upload/:token — consume the token, process and save the image
async function consumeUpload(req, res) {
  const { token } = req.params;

  if (!req.file) {
    tokens.delete(token);
    return res.status(400).json({ error: 'Keine Datei hochgeladen' });
  }

  try {
    const sharp = require('sharp');
    const buffer = fs.readFileSync(req.file.path);

    if (!validateMagicBytes(buffer)) {
      fs.unlinkSync(req.file.path);
      tokens.delete(token);
      return res.status(400).json({ error: 'Ungültige Bilddatei (Magic-Bytes fehlerhaft)' });
    }

    const outputPath = req.file.path + '_processed';
    await sharp(req.file.path)
      .resize(1920, 1080, { fit: 'inside', withoutEnlargement: true })
      .withMetadata(false) // strip EXIF
      .toFile(outputPath);

    fs.unlinkSync(req.file.path);
    fs.renameSync(outputPath, req.file.path);

    tokens.delete(token);
    const url = `/uploads/${req.file.filename}`;
    logger.info('Upload consumed', { event: 'upload_consume', userId: req._uploadUserId, url });
    res.json({ url });
  } catch (err) {
    if (req.file?.path && fs.existsSync(req.file.path)) {
      try { fs.unlinkSync(req.file.path); } catch (_) {}
    }
    tokens.delete(token);
    logger.error('Upload processing failed', { err: err.message });
    res.status(500).json({ error: 'Bildverarbeitung fehlgeschlagen' });
  }
}

module.exports = { presign, validateToken, multerUpload, consumeUpload };

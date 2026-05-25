const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { ALLOWED_IMAGE_MIMES, validateMagicBytes } = require('../config/security');

const UPLOAD_DIR = path.resolve(process.env.UPLOAD_PATH || './uploads');
const MAX_SIZE = parseInt(process.env.MAX_FILE_SIZE_MB || '15') * 1024 * 1024;

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const safe = crypto.randomBytes(16).toString('hex');
    cb(null, `${safe}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  if (!ALLOWED_IMAGE_MIMES.has(file.mimetype)) {
    return cb(new Error('Only image files are allowed (JPEG, PNG, GIF, WebP)'), false);
  }
  cb(null, true);
};

const upload = multer({
  storage,
  limits: { fileSize: MAX_SIZE, files: 1 },
  fileFilter,
});

// Validate magic bytes after upload + resize with sharp
async function processUpload(req, res, next) {
  if (!req.file) return next();

  try {
    const sharp = require('sharp');
    const { validateMagicBytes } = require('../config/security');

    const buffer = fs.readFileSync(req.file.path);

    if (!validateMagicBytes(buffer)) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: 'Invalid image file' });
    }

    // Resize and strip EXIF metadata for security
    const outputPath = req.file.path + '_processed';
    await sharp(req.file.path)
      .resize(1920, 1080, { fit: 'inside', withoutEnlargement: true })
      .withMetadata(false) // strip EXIF
      .toFile(outputPath);

    fs.unlinkSync(req.file.path);
    fs.renameSync(outputPath, req.file.path);

    next();
  } catch (err) {
    if (req.file?.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    next(new Error('Image processing failed'));
  }
}

const pdfStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const safe = crypto.randomBytes(16).toString('hex');
    cb(null, `${safe}.pdf`);
  },
});

const uploadPdf = multer({
  storage: pdfStorage,
  limits: { fileSize: 20 * 1024 * 1024, files: 1 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== 'application/pdf') {
      return cb(new Error('Only PDF files are allowed'), false);
    }
    cb(null, true);
  },
});

const uploadHtml = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, UPLOAD_DIR),
    filename: (req, file, cb) => cb(null, `${crypto.randomBytes(16).toString('hex')}.html`),
  }),
  limits: { fileSize: 10 * 1024 * 1024, files: 1 },
  fileFilter: (req, file, cb) => {
    const okMime = ['text/html', 'application/xhtml+xml', 'text/plain'].includes(file.mimetype);
    const okExt = /\.(html?|xhtml)$/i.test(file.originalname);
    if (okMime || okExt) return cb(null, true);
    cb(new Error('Only HTML files are allowed'), false);
  },
});

module.exports = { upload, processUpload, uploadPdf, uploadHtml };

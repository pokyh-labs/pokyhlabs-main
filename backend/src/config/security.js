const crypto = require('crypto');

const SALT_ROUNDS = 12;
const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_DURATION_MS = 15 * 60 * 1000; // 15 minutes

const ALLOWED_IMAGE_MIMES = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
]);

// Magic bytes for file type validation (first bytes of file)
const IMAGE_SIGNATURES = [
  { mime: 'image/jpeg', bytes: [0xFF, 0xD8, 0xFF] },
  { mime: 'image/png',  bytes: [0x89, 0x50, 0x4E, 0x47] },
  { mime: 'image/gif',  bytes: [0x47, 0x49, 0x46] },
  { mime: 'image/webp', bytes: [0x52, 0x49, 0x46, 0x46] },
];

function validateMagicBytes(buffer) {
  return IMAGE_SIGNATURES.some(sig =>
    sig.bytes.every((byte, i) => buffer[i] === byte)
  );
}

function encryptSecret(text) {
  if (!process.env.ENCRYPTION_KEY) throw new Error('ENCRYPTION_KEY not set');
  const key = Buffer.from(process.env.ENCRYPTION_KEY, 'hex');
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted.toString('hex')}`;
}

function decryptSecret(encryptedText) {
  if (!process.env.ENCRYPTION_KEY) throw new Error('ENCRYPTION_KEY not set');
  const key = Buffer.from(process.env.ENCRYPTION_KEY, 'hex');
  const [ivHex, tagHex, dataHex] = encryptedText.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const tag = Buffer.from(tagHex, 'hex');
  const data = Buffer.from(dataHex, 'hex');
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  return decipher.update(data, 'binary', 'utf8') + decipher.final('utf8');
}

module.exports = {
  SALT_ROUNDS,
  MAX_LOGIN_ATTEMPTS,
  LOCK_DURATION_MS,
  ALLOWED_IMAGE_MIMES,
  validateMagicBytes,
  encryptSecret,
  decryptSecret,
};

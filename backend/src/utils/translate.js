/**
 * translate.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Lightweight machine-translation helper used by the admin dashboard to
 * pre-fill blog/project content in other languages.
 *
 * Uses the keyless MyMemory API (https://mymemory.translated.net/doc/spec.php).
 * It runs server-side because the admin CSP only allows connect-src 'self'.
 *
 * Set TRANSLATE_EMAIL in the environment to raise the anonymous daily quota
 * (the address is sent as the `de` param, per MyMemory's spec).
 */

const logger = require('./logger');

const ENDPOINT = 'https://api.mymemory.translated.net/get';
const MAX_CHUNK = 480; // MyMemory rejects single requests longer than 500 chars
const CONTACT_EMAIL = process.env.TRANSLATE_EMAIL || '';

const SUPPORTED = ['de', 'en', 'it'];

/** Translate a single chunk (<= MAX_CHUNK chars) via MyMemory. */
async function translateChunk(text, from, to) {
  const params = new URLSearchParams({ q: text, langpair: `${from}|${to}` });
  if (CONTACT_EMAIL) params.set('de', CONTACT_EMAIL);

  const res = await fetch(`${ENDPOINT}?${params.toString()}`, {
    headers: { 'User-Agent': 'pokyhlabs-admin/1.0' },
  });
  if (!res.ok) throw new Error(`translation service responded ${res.status}`);

  const data = await res.json();
  const out = data?.responseData?.translatedText;
  const status = data?.responseStatus;
  if (!out || (status && Number(status) !== 200)) {
    throw new Error(data?.responseDetails || 'translation failed');
  }
  return out;
}

/** Split a long line into <= MAX_CHUNK pieces on sentence / word boundaries. */
function splitLong(line) {
  if (line.length <= MAX_CHUNK) return [line];
  const pieces = [];
  let rest = line;
  while (rest.length > MAX_CHUNK) {
    let cut = rest.lastIndexOf('. ', MAX_CHUNK);
    if (cut < MAX_CHUNK * 0.5) cut = rest.lastIndexOf(' ', MAX_CHUNK);
    if (cut <= 0) cut = MAX_CHUNK;
    else cut += 1; // keep the delimiter with the left piece
    pieces.push(rest.slice(0, cut));
    rest = rest.slice(cut);
  }
  if (rest) pieces.push(rest);
  return pieces;
}

/**
 * Translate a full text while preserving its line structure (so markdown
 * headings, lists and HTML tags stay on their own lines). Blank lines and
 * whitespace-only lines pass through untouched.
 */
async function translateText(text, from, to) {
  if (!text || !text.trim()) return text || '';

  const lines = text.split('\n');
  const out = [];
  for (const line of lines) {
    if (!line.trim()) { out.push(line); continue; }
    try {
      const parts = splitLong(line);
      const translatedParts = [];
      for (const p of parts) {
        // eslint-disable-next-line no-await-in-loop
        translatedParts.push(await translateChunk(p, from, to));
      }
      out.push(translatedParts.join(''));
    } catch (err) {
      logger.warn('translate: line failed, keeping original', { err: err.message });
      out.push(line); // graceful fallback — never lose content
    }
  }
  return out.join('\n');
}

/** Translate an array of independent strings. */
async function translateMany(texts, from, to) {
  const result = [];
  for (const t of texts) {
    // eslint-disable-next-line no-await-in-loop
    result.push(await translateText(t, from, to));
  }
  return result;
}

module.exports = { translateText, translateMany, SUPPORTED };

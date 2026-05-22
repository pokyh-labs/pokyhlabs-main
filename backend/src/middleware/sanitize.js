const sanitizeHtml = require('sanitize-html');
const { SuspiciousActivity } = require('../models');
const logger = require('../utils/logger');

const ALLOWED_HTML_TAGS = [
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'p', 'br', 'strong', 'em', 'u', 's',
  'ul', 'ol', 'li', 'blockquote', 'code', 'pre',
  'a', 'img', 'figure', 'figcaption',
  'table', 'thead', 'tbody', 'tr', 'th', 'td',
  'div', 'span', 'hr',
];

const ALLOWED_ATTRIBUTES = {
  'a': ['href', 'title', 'target', 'rel'],
  'img': ['src', 'alt', 'title', 'width', 'height', 'style'],
  'td': ['colspan', 'rowspan', 'style'],
  'th': ['colspan', 'rowspan', 'style'],
  'table': ['style'],
  'tr': ['style'],
  '*': ['class', 'style'],
};

// Force rel="noopener noreferrer" on any link with target="_blank"
function enforceNoOpener(tagName, attribs) {
  if (attribs.target === '_blank') {
    return { tagName, attribs: { ...attribs, rel: 'noopener noreferrer' } };
  }
  return { tagName, attribs };
}

function sanitizeBlogContent(dirty) {
  return sanitizeHtml(dirty, {
    allowedTags: ALLOWED_HTML_TAGS,
    allowedAttributes: ALLOWED_ATTRIBUTES,
    allowedSchemes: ['http', 'https', 'mailto', 'data'],
    allowedSchemesAppliedToAttributes: ['href'],
    allowProtocolRelative: false,
    enforceHtmlBoundary: true,
    transformTags: { a: enforceNoOpener },
  });
}

function sanitizeText(str) {
  if (typeof str !== 'string') return str;
  return sanitizeHtml(str, { allowedTags: [], allowedAttributes: {} });
}

// Detect common injection patterns
const SUSPICIOUS_PATTERNS = [
  /(\bunion\b.*\bselect\b)/i,
  /(\bselect\b.*\bfrom\b)/i,
  /(\bdrop\b.*\btable\b)/i,
  /(\binsert\b.*\binto\b)/i,
  /(<script[\s\S]*?>)/i,
  /(javascript\s*:)/i,
  /(on\w+\s*=)/i,
  /(\.\.\/)|(\.\.\\)/,
  /(%2e%2e%2f)/i,
];

function detectSuspiciousInput(req, res, next) {
  const body = JSON.stringify(req.body || {});
  const query = JSON.stringify(req.query || {});
  const url = req.originalUrl;
  const combined = body + query + url;

  for (const pattern of SUSPICIOUS_PATTERNS) {
    if (pattern.test(combined)) {
      const ip = req.ip || req.socket.remoteAddress;
      const eventType = /(union|select|drop|insert)/i.test(combined)
        ? 'sql_injection_attempt'
        : /(script|javascript|on\w+=)/i.test(combined)
        ? 'xss_attempt'
        : 'path_traversal';

      logger.warn('Suspicious request', { event: eventType, ip, url, pattern: pattern.toString() });

      SuspiciousActivity.create({
        ip_address: ip,
        event_type: eventType,
        details: `Pattern: ${pattern.toString()} | URL: ${url}`,
        user_agent: req.headers['user-agent']?.slice(0, 500),
        url: url,
        user_id: req.user?.id || null,
      }).catch(() => {});

      return res.status(400).json({ error: 'Invalid request' });
    }
  }
  next();
}

function detectSuspiciousUA(req, res, next) {
  const ua = req.headers['user-agent'] || '';
  const suspiciousUA = [
    /sqlmap/i, /nikto/i, /nessus/i, /burpsuite/i,
    /masscan/i, /nmap/i, /dirbuster/i, /gobuster/i,
  ];
  if (suspiciousUA.some(p => p.test(ua))) {
    const ip = req.ip || req.socket.remoteAddress;
    logger.warn('Scanner detected', { event: 'suspicious_ua', ip, ua });
    SuspiciousActivity.create({
      ip_address: ip,
      event_type: 'suspicious_ua',
      details: ua,
      url: req.originalUrl,
    }).catch(() => {});
    return res.status(403).json({ error: 'Forbidden' });
  }
  next();
}

module.exports = { sanitizeBlogContent, sanitizeText, detectSuspiciousInput, detectSuspiciousUA };

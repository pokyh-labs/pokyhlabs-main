const fs   = require('fs');
const path = require('path');

const VALID_FREQS = ['always', 'hourly', 'daily', 'weekly', 'monthly', 'yearly', 'never'];

const DEFAULT_CONFIG = {
  name:         '',
  url:          '',
  locale:       'de_DE',
  lang:         'de',
  title:        { default: '', en: '', template: '' },
  description:  { de: '', en: '', it: '' },
  keywords:     [],
  verification: { google: '', bing: '' },
  pages:        [],
};

function getDataDir() {
  if (process.env.SQLITE_PATH) return path.resolve(path.dirname(process.env.SQLITE_PATH));
  return path.resolve(__dirname, '../../../data');
}

function getSeoPath() {
  return path.join(getDataDir(), 'seo-override.json');
}

function readConfig() {
  const p = getSeoPath();
  if (!fs.existsSync(p)) return { ...DEFAULT_CONFIG };
  try {
    return { ...DEFAULT_CONFIG, ...JSON.parse(fs.readFileSync(p, 'utf8')) };
  } catch {
    return { ...DEFAULT_CONFIG };
  }
}

function validateBody(body) {
  const errors = [];
  if (body.name        !== undefined && typeof body.name !== 'string')         errors.push('name muss ein String sein');
  if (body.url         !== undefined && typeof body.url  !== 'string')         errors.push('url muss ein String sein');
  if (body.keywords    !== undefined && !Array.isArray(body.keywords))         errors.push('keywords muss ein Array sein');
  if (body.pages       !== undefined && !Array.isArray(body.pages))            errors.push('pages muss ein Array sein');
  if (body.title       !== undefined && typeof body.title !== 'object')        errors.push('title muss ein Objekt sein');
  if (body.description !== undefined && typeof body.description !== 'object')  errors.push('description muss ein Objekt sein');

  if (Array.isArray(body.keywords) && body.keywords.some(k => typeof k !== 'string')) {
    errors.push('Alle keywords müssen Strings sein');
  }

  if (Array.isArray(body.pages)) {
    body.pages.forEach((p, i) => {
      if (typeof p.path !== 'string') errors.push(`pages[${i}].path muss ein String sein`);
      if (p.priority !== undefined && (typeof p.priority !== 'number' || p.priority < 0 || p.priority > 1)) {
        errors.push(`pages[${i}].priority muss zwischen 0 und 1 liegen`);
      }
      if (p.changeFreq !== undefined && !VALID_FREQS.includes(p.changeFreq)) {
        errors.push(`pages[${i}].changeFreq: ungültiger Wert`);
      }
    });
  }
  return errors;
}

async function getSeoConfig(req, res) {
  res.json(readConfig());
}

async function updateSeoConfig(req, res) {
  const errors = validateBody(req.body);
  if (errors.length) return res.status(400).json({ error: 'Validierungsfehler', details: errors });

  const existing = readConfig();
  const b = req.body;

  const updated = {
    ...existing,
    ...(b.name         !== undefined && { name:         b.name }),
    ...(b.url          !== undefined && { url:          b.url }),
    ...(b.locale       !== undefined && { locale:       b.locale }),
    ...(b.lang         !== undefined && { lang:         b.lang }),
    ...(b.title        !== undefined && { title:        { ...existing.title,        ...b.title } }),
    ...(b.description  !== undefined && { description:  { ...existing.description,  ...b.description } }),
    ...(b.keywords     !== undefined && { keywords:     b.keywords }),
    ...(b.verification !== undefined && { verification: { ...existing.verification, ...b.verification } }),
    ...(b.pages        !== undefined && { pages:        b.pages }),
  };

  const seoPath = getSeoPath();
  const tmpPath = seoPath + '.tmp';

  try {
    const dataDir = path.dirname(seoPath);
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
    fs.writeFileSync(tmpPath, JSON.stringify(updated, null, 2), 'utf8');
    fs.renameSync(tmpPath, seoPath);
  } catch (err) {
    try { fs.unlinkSync(tmpPath); } catch {}
    throw err;
  }

  res.json({ success: true, config: updated });
}

async function getSitemapPreview(req, res) {
  const config  = readConfig();
  const pages   = config.pages || [];
  const baseUrl = config.url || '';

  const lines = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...pages.flatMap(p => [
      '  <url>',
      `    <loc>${baseUrl}${p.path}</loc>`,
      ...(p.priority  != null ? [`    <priority>${p.priority}</priority>`]        : []),
      ...(p.changeFreq         ? [`    <changefreq>${p.changeFreq}</changefreq>`] : []),
      '  </url>',
    ]),
    '</urlset>',
  ];

  res.json({ xml: lines.join('\n') });
}

async function getRobotsPreview(req, res) {
  const projectRoot = process.env.PROJECT_ROOT || path.resolve(__dirname, '../../../');
  const robotsPath  = path.join(projectRoot, 'app', 'robots.ts');

  const defaultContent = `User-agent: *\nAllow: /\n\nUser-agent: GPTBot\nDisallow: /\n\nUser-agent: Claude-Web\nDisallow: /\n\nUser-agent: CCBot\nDisallow: /\n\nDisallow: /api/\nDisallow: /_next/\nDisallow: /admin\nDisallow: /uploads/`;

  let content = defaultContent;
  let isSource = false;
  if (fs.existsSync(robotsPath)) {
    try { content = fs.readFileSync(robotsPath, 'utf8'); isSource = true; } catch {}
  }

  res.json({ content, path: robotsPath, isSource });
}

module.exports = { getSeoConfig, updateSeoConfig, getSitemapPreview, getRobotsPreview };

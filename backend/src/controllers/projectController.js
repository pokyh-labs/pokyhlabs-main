const { body, validationResult } = require('express-validator');
const path = require('path');
const fs = require('fs');
const { Project } = require('../models');
const { sanitizeText } = require('../middleware/sanitize');
const { cache, KEYS, PROJECT_LIST_TTL, invalidateProjectCache } = require('../config/cache');
const logger = require('../utils/logger');

const VALID_STATUSES = ['live', 'wip', 'concept'];
const MAX_TAGS = 15;
const MAX_TAG_LEN = 50;
const MAX_GALLERY = 12;
const UPLOAD_DIR = path.resolve(process.env.UPLOAD_PATH || './uploads');

const SAFE_UPLOAD_URL = /^\/uploads\/[a-zA-Z0-9_-]+\.(jpg|jpeg|png|gif|webp)$/;

const LANGS = ['de', 'en', 'it'];
const DEFAULT_LANG = 'de';
const pickLang = (q) => LANGS.includes(q) ? q : DEFAULT_LANG;

// Flatten a full Project row to the public API shape for a given language.
// Fallback chain: requested lang → DE → any available lang slot → legacy flat columns.
function flattenProjectForLang(project, lang) {
  const t = project.translations || {};
  let slot = null;
  if (t[lang] && t[lang].title) {
    slot = t[lang];
  } else if (t[DEFAULT_LANG] && t[DEFAULT_LANG].title) {
    slot = t[DEFAULT_LANG];
  } else {
    for (const l of LANGS) {
      if (t[l] && t[l].title) { slot = t[l]; break; }
    }
  }
  // Legacy rows with no translations at all — use flat columns
  if (!slot) {
    slot = {
      title: project.title || '',
      description: project.description || '',
      image_alt: project.image_alt || null,
    };
  }
  return {
    id: project.id,
    title: slot.title || '',
    description: slot.description || '',
    image_alt: slot.image_alt || null,
    tags: project.tags,
    url: project.url,
    image_url: project.image_url,
    gallery: project.gallery,
    year: project.year,
    status: project.status,
  };
}

// Each gallery item is { url: string (must match SAFE_UPLOAD_URL), alt?: string<=255 }.
function isValidGalleryItem(it) {
  if (!it || typeof it !== 'object') return false;
  if (typeof it.url !== 'string' || !SAFE_UPLOAD_URL.test(it.url)) return false;
  if (it.alt != null && (typeof it.alt !== 'string' || it.alt.length > 255)) return false;
  return true;
}

// Auto-fill empty EN/IT slots from DE so admins can write German only.
function fillMissingSlots(translations) {
  const de = translations[DEFAULT_LANG] || {};
  const result = {};
  for (const l of LANGS) {
    const slot = translations[l] || {};
    result[l] = {
      title:       (slot.title?.trim()       || de.title       || ''),
      description: (slot.description?.trim() || de.description || ''),
      image_alt:   (slot.image_alt?.trim()   || de.image_alt   || ''),
    };
  }
  return result;
}

const projectValidators = [
  body('translations').custom(t => {
    if (!t || typeof t !== 'object') throw new Error('translations ist erforderlich');
    const de = t[DEFAULT_LANG];
    if (!de || !String(de.title || '').trim()) throw new Error('translations.de.title ist erforderlich');
    if (!de || !String(de.description || '').trim()) throw new Error('translations.de.description ist erforderlich');
    // EN/IT are optional — filled from DE if missing
    for (const l of LANGS) {
      const s = t[l] || {};
      if (String(s.description || '').length > 2000) throw new Error(`translations.${l}.description max. 2000 Zeichen`);
    }
    return true;
  }),
  body('tags').optional({ checkFalsy: true })
    .isArray({ max: MAX_TAGS }).withMessage(`Maximal ${MAX_TAGS} Tags`)
    .custom(tags => tags.every(t => typeof t === 'string' && t.length <= MAX_TAG_LEN))
    .withMessage(`Jeder Tag darf max. ${MAX_TAG_LEN} Zeichen haben`),
  body('url').optional({ checkFalsy: true }).trim().isLength({ max: 500 }),
  body('image_url').optional({ nullable: true }).custom(v => !v || SAFE_UPLOAD_URL.test(v)).withMessage('Ungültige Bild-URL'),
  body('gallery').optional({ nullable: true })
    .isArray({ max: MAX_GALLERY }).withMessage(`Maximal ${MAX_GALLERY} Galerie-Bilder`)
    .custom(arr => arr.every(isValidGalleryItem))
    .withMessage('Ungültiges Galerie-Element'),
  body('year').isInt({ min: 1900, max: new Date().getFullYear() + 5 }),
  body('status').optional().isIn(VALID_STATUSES),
  body('sort_order').optional().isInt({ min: 0, max: 9999 }),
];

function fail(res, status, msg) { return res.status(status).json({ error: msg }); }

function deleteImage(imageUrl) {
  if (!imageUrl) return;
  try {
    const file = path.join(UPLOAD_DIR, path.basename(imageUrl));
    if (fs.existsSync(file)) fs.unlinkSync(file);
  } catch {}
}

// Normalise an incoming gallery payload: drop invalid entries, trim alt text,
// and dedupe by url so the same file can't appear twice.
function normaliseGallery(input) {
  if (!Array.isArray(input)) return [];
  const seen = new Set();
  const out = [];
  for (const raw of input) {
    if (!isValidGalleryItem(raw)) continue;
    if (seen.has(raw.url)) continue;
    seen.add(raw.url);
    out.push({
      url: raw.url,
      alt: raw.alt ? sanitizeText(String(raw.alt).trim()) : null,
    });
    if (out.length >= MAX_GALLERY) break;
  }
  return out;
}

// Files referenced by `previous` but not `next` — these are safe to delete.
function galleryImagesToRemove(previous, next) {
  const keep = new Set(next.map(it => it.url));
  return previous.filter(it => !keep.has(it.url)).map(it => it.url);
}

// Public: list all live projects (language-aware)
async function getPublic(req, res) {
  const lang = pickLang(req.query.lang);
  const cacheKey = `${KEYS.PROJECT_LIST}:${lang}`;
  const cached = cache.get(cacheKey);
  if (cached) {
    res.setHeader('X-Cache', 'HIT');
    return res.json(cached);
  }

  const projects = await Project.findAll({
    where: { status: 'live' },
    order: [['sort_order', 'ASC'], ['year', 'DESC']],
  });

  const result = { projects: projects.map(p => flattenProjectForLang(p, lang)) };
  cache.set(cacheKey, result, PROJECT_LIST_TTL);
  res.setHeader('X-Cache', 'MISS');
  res.json(result);
}

// Admin: list all projects
async function getAll(req, res) {
  const cached = cache.get(KEYS.PROJECT_ALL);
  if (cached) {
    res.setHeader('X-Cache', 'HIT');
    return res.json(cached);
  }

  const projects = await Project.findAll({
    order: [['sort_order', 'ASC'], ['year', 'DESC']],
  });

  cache.set(KEYS.PROJECT_ALL, { projects }, 30);
  res.setHeader('X-Cache', 'MISS');
  res.json({ projects });
}

// Admin: create project
async function create(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { translations, tags, url, image_url, gallery, year, status, sort_order } = req.body;

  const filled = fillMissingSlots(translations);
  const sanitizedTranslations = {};
  for (const l of LANGS) {
    const slot = filled[l];
    sanitizedTranslations[l] = {
      title:       sanitizeText(slot.title),
      description: sanitizeText(slot.description),
      image_alt:   slot.image_alt ? sanitizeText(slot.image_alt) : '',
    };
  }

  const project = await Project.create({
    translations: sanitizedTranslations,
    tags:         Array.isArray(tags) ? tags.map(t => sanitizeText(String(t).trim())).filter(Boolean) : [],
    url:          url ? url.trim() : null,
    image_url:    image_url || null,
    gallery:      normaliseGallery(gallery),
    year:         parseInt(year, 10),
    status:       status || 'live',
    sort_order:   sort_order !== undefined ? parseInt(sort_order, 10) : 0,
  });

  invalidateProjectCache();
  logger.info('Project created', { event: 'project_create', projectId: project.id, userId: req.user.id });
  res.status(201).json(project);
}

// Admin: update project
async function update(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const project = await Project.findByPk(req.params.id);
  if (!project) return fail(res, 404, 'Projekt nicht gefunden');

  const { translations, tags, url, image_url, gallery, year, status, sort_order, remove_image } = req.body;
  const updates = {};

  if (translations !== undefined) {
    const merged = {};
    for (const l of LANGS) {
      merged[l] = { ...(project.translations?.[l] || {}), ...(translations[l] || {}) };
    }
    const filled = fillMissingSlots(merged);
    const sanitizedTranslations = {};
    for (const l of LANGS) {
      const slot = filled[l];
      sanitizedTranslations[l] = {
        title:       sanitizeText(slot.title),
        description: sanitizeText(slot.description),
        image_alt:   slot.image_alt ? sanitizeText(slot.image_alt) : '',
      };
    }
    updates.translations = sanitizedTranslations;
  }
  if (tags !== undefined)        updates.tags        = Array.isArray(tags) ? tags.map(t => sanitizeText(String(t).trim())).filter(Boolean) : [];
  if (url !== undefined)         updates.url         = url ? url.trim() : null;
  if (year !== undefined)        updates.year        = parseInt(year, 10);
  if (status !== undefined)      updates.status      = status;
  if (sort_order !== undefined)  updates.sort_order  = parseInt(sort_order, 10);

  if (image_url !== undefined) {
    // New image uploaded via presign token — delete old if replaced
    if (image_url && image_url !== project.image_url) deleteImage(project.image_url);
    updates.image_url = image_url || null;
  } else if (remove_image === 'true' || remove_image === true) {
    deleteImage(project.image_url);
    updates.image_url = null;
    updates.image_alt = null;
  }

  if (gallery !== undefined) {
    const nextGallery = normaliseGallery(gallery);
    // Delete files for items dropped from the gallery in this update.
    for (const removedUrl of galleryImagesToRemove(project.gallery, nextGallery)) {
      deleteImage(removedUrl);
    }
    updates.gallery = nextGallery;
  }

  await project.update(updates);
  invalidateProjectCache();
  logger.info('Project updated', { event: 'project_update', projectId: project.id, userId: req.user.id });
  res.json(project);
}

// Admin: delete project
async function deleteProject(req, res) {
  const project = await Project.findByPk(req.params.id);
  if (!project) return fail(res, 404, 'Projekt nicht gefunden');

  deleteImage(project.image_url);
  for (const item of (project.gallery || [])) deleteImage(item.url);
  await project.destroy();
  invalidateProjectCache();
  logger.info('Project deleted', { event: 'project_delete', projectId: req.params.id, userId: req.user.id });
  res.json({ message: 'Projekt gelöscht' });
}

// Admin: reorder
async function reorder(req, res) {
  const items = req.body.items;
  if (!Array.isArray(items)) return fail(res, 400, 'items muss ein Array sein');

  for (const item of items) {
    if (!Number.isInteger(item.id) || !Number.isInteger(item.sort_order)) {
      return fail(res, 400, 'Jedes Item braucht id und sort_order als Integer');
    }
  }

  await Promise.all(
    items.map(({ id, sort_order }) => Project.update({ sort_order }, { where: { id } }))
  );

  invalidateProjectCache();
  logger.info('Projects reordered', { event: 'project_reorder', userId: req.user.id });
  res.json({ message: 'Reihenfolge gespeichert' });
}

module.exports = { getPublic, getAll, create, update, deleteProject, reorder, projectValidators };

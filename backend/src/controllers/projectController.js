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
const UPLOAD_DIR = path.resolve(process.env.UPLOAD_PATH || './uploads');

const SAFE_UPLOAD_URL = /^\/uploads\/[a-zA-Z0-9_-]+\.(jpg|jpeg|png|gif|webp)$/;

const projectValidators = [
  body('title').trim().notEmpty().withMessage('Titel darf nicht leer sein').isLength({ max: 255 }),
  body('description').trim().notEmpty().withMessage('Beschreibung darf nicht leer sein').isLength({ max: 2000 }),
  body('tags').optional({ checkFalsy: true })
    .isArray({ max: MAX_TAGS }).withMessage(`Maximal ${MAX_TAGS} Tags`)
    .custom(tags => tags.every(t => typeof t === 'string' && t.length <= MAX_TAG_LEN))
    .withMessage(`Jeder Tag darf max. ${MAX_TAG_LEN} Zeichen haben`),
  body('url').optional({ checkFalsy: true }).trim().isLength({ max: 500 }),
  body('image_url').optional({ nullable: true }).custom(v => !v || SAFE_UPLOAD_URL.test(v)).withMessage('Ungültige Bild-URL'),
  body('image_alt').optional({ checkFalsy: true }).trim().isLength({ max: 255 }),
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

// Public: list all live projects
async function getPublic(req, res) {
  const cached = cache.get(KEYS.PROJECT_LIST);
  if (cached) {
    res.setHeader('X-Cache', 'HIT');
    return res.json(cached);
  }

  const projects = await Project.findAll({
    where: { status: 'live' },
    order: [['sort_order', 'ASC'], ['year', 'DESC']],
    attributes: ['id', 'title', 'description', 'tags', 'url', 'image_url', 'image_alt', 'year', 'status'],
  });

  const result = { projects };
  cache.set(KEYS.PROJECT_LIST, result, PROJECT_LIST_TTL);
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

  const { title, description, tags, url, image_url, image_alt, year, status, sort_order } = req.body;

  const project = await Project.create({
    title:       sanitizeText(title),
    description: sanitizeText(description),
    tags:        Array.isArray(tags) ? tags.map(t => sanitizeText(String(t).trim())).filter(Boolean) : [],
    url:         url ? url.trim() : null,
    image_url:   image_url || null,
    image_alt:   image_alt ? sanitizeText(image_alt) : null,
    year:        parseInt(year, 10),
    status:      status || 'live',
    sort_order:  sort_order !== undefined ? parseInt(sort_order, 10) : 0,
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

  const { title, description, tags, url, image_url, image_alt, year, status, sort_order, remove_image } = req.body;
  const updates = {};

  if (title !== undefined)       updates.title       = sanitizeText(title);
  if (description !== undefined) updates.description = sanitizeText(description);
  if (tags !== undefined)        updates.tags        = Array.isArray(tags) ? tags.map(t => sanitizeText(String(t).trim())).filter(Boolean) : [];
  if (url !== undefined)         updates.url         = url ? url.trim() : null;
  if (image_alt !== undefined)   updates.image_alt   = image_alt ? sanitizeText(image_alt) : null;
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

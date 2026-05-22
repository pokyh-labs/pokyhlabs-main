const { body, param, query, validationResult } = require('express-validator');
const { Op } = require('sequelize');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const pdfParse = require('pdf-parse');
const { Blog, User } = require('../models');
const { sanitizeBlogContent, sanitizeText } = require('../middleware/sanitize');
const { validateMagicBytes } = require('../config/security');
const { cache, KEYS, BLOG_SINGLE_TTL, BLOG_LIST_TTL, STATS_TTL, invalidateBlogCache } = require('../config/cache');
const logger = require('../utils/logger');

// 'canvas' is aliased to '@napi-rs/canvas' in package.json so pdfjs-dist can find it.
const { createCanvas, DOMMatrix, Path2D } = require('canvas');
if (typeof global.DOMMatrix === 'undefined') global.DOMMatrix = DOMMatrix;
if (typeof global.Path2D === 'undefined') global.Path2D = Path2D;
const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.js');
const cheerio = require('cheerio');

const UPLOAD_DIR = path.resolve(process.env.UPLOAD_PATH || './uploads');
const PDF_SCALE = 2.0;   // 144 DPI — high quality
const PDF_MAX_PAGES = 30;

const blogValidators = [
  body('title').trim().notEmpty().isLength({ min: 3, max: 255 }),
  body('content').trim().notEmpty().isLength({ min: 10 }),
  body('excerpt').optional().trim().isLength({ max: 500 }),
  body('image_alt').optional().trim().isLength({ max: 255 }),
  body('status').optional().isIn(['draft', 'published']),
];

function ok(res) { return (data) => res.json(data); }
function err(res, status, msg) { return res.status(status).json({ error: msg }); }

// Public: get published blogs (paginated, cached)
async function getPublished(req, res) {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(20, Math.max(1, parseInt(req.query.limit) || 10));
  const offset = (page - 1) * limit;

  const cacheKey = `${KEYS.BLOG_LIST}:p${page}:l${limit}`;
  const cached = cache.get(cacheKey);
  if (cached) {
    res.setHeader('X-Cache', 'HIT');
    return res.json(cached);
  }

  const { count, rows } = await Blog.findAndCountAll({
    where: { status: 'published' },
    include: [{ model: User, as: 'author', attributes: ['username'] }],
    order: [['published_at', 'DESC']],
    limit,
    offset,
    attributes: ['id', 'title', 'slug', 'excerpt', 'image_url', 'image_alt', 'published_at', 'views', 'author_id'],
  });

  const result = {
    blogs: rows,
    pagination: { page, limit, total: count, pages: Math.ceil(count / limit) },
  };

  cache.set(cacheKey, result, BLOG_LIST_TTL);
  res.setHeader('X-Cache', 'MISS');
  res.json(result);
}

// Public: get single blog by slug
async function getBySlug(req, res) {
  const { slug } = req.params;
  const cacheKey = KEYS.BLOG_SLUG(slug);

  const cached = cache.get(cacheKey);
  if (cached) {
    res.setHeader('X-Cache', 'HIT');
    // Increment views asynchronously without cache invalidation
    Blog.increment('views', { where: { slug, status: 'published' } }).catch(() => {});
    return res.json(cached);
  }

  const blog = await Blog.findOne({
    where: { slug, status: 'published' },
    include: [{ model: User, as: 'author', attributes: ['username'] }],
  });
  if (!blog) return err(res, 404, 'Blog not found');

  await blog.increment('views');
  cache.set(cacheKey, blog, BLOG_SINGLE_TTL);
  res.setHeader('X-Cache', 'MISS');
  res.json(blog);
}

// Admin: get all blogs
async function getAll(req, res) {
  const cached = cache.get(KEYS.BLOG_ALL);
  if (cached) {
    res.setHeader('X-Cache', 'HIT');
    return res.json(cached);
  }

  const blogs = await Blog.findAll({
    include: [{ model: User, as: 'author', attributes: ['username'] }],
    order: [['created_at', 'DESC']],
  });
  cache.set(KEYS.BLOG_ALL, blogs, 30); // 30s for admin list
  res.setHeader('X-Cache', 'MISS');
  res.json(blogs);
}

// Admin: create blog
async function create(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { title, content, excerpt, status, image_alt } = req.body;
  const image_url = req.file ? `/uploads/${req.file.filename}` : null;

  const blog = await Blog.create({
    title: sanitizeText(title),
    content: sanitizeBlogContent(content),
    excerpt: excerpt ? sanitizeText(excerpt) : null,
    image_url,
    image_alt: image_alt ? sanitizeText(image_alt) : null,
    status: status || 'draft',
    author_id: req.user.id,
  });

  invalidateBlogCache();
  logger.info('Blog created', { event: 'blog_create', blogId: blog.id, userId: req.user.id });
  res.status(201).json(blog);
}

// Admin: update blog
async function update(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const blog = await Blog.findByPk(req.params.id);
  if (!blog) return err(res, 404, 'Blog not found');

  const { title, content, excerpt, status, image_alt } = req.body;
  const updates = {};

  if (title !== undefined) updates.title = sanitizeText(title);
  if (content !== undefined) updates.content = sanitizeBlogContent(content);
  if (excerpt !== undefined) updates.excerpt = sanitizeText(excerpt);
  if (status !== undefined) updates.status = status;
  if (image_alt !== undefined) updates.image_alt = sanitizeText(image_alt);

  if (req.file) {
    // Delete old image
    if (blog.image_url) {
      const oldPath = path.join(process.env.UPLOAD_PATH || './uploads', path.basename(blog.image_url));
      fs.unlink(oldPath, () => {});
    }
    updates.image_url = `/uploads/${req.file.filename}`;
  }

  await blog.update(updates);
  invalidateBlogCache();
  logger.info('Blog updated', { event: 'blog_update', blogId: blog.id, userId: req.user.id });
  res.json(blog);
}

// Admin: delete blog
async function deleteBlog(req, res) {
  const blog = await Blog.findByPk(req.params.id);
  if (!blog) return err(res, 404, 'Blog not found');

  if (blog.image_url) {
    const imgPath = path.join(process.env.UPLOAD_PATH || './uploads', path.basename(blog.image_url));
    fs.unlink(imgPath, () => {});
  }

  await blog.destroy();
  invalidateBlogCache();
  logger.info('Blog deleted', { event: 'blog_delete', blogId: req.params.id, userId: req.user.id });
  res.json({ message: 'Blog deleted' });
}

// Admin: stats
async function stats(req, res) {
  const cached = cache.get(KEYS.STATS);
  if (cached) return res.json(cached);

  const [total, published, drafts] = await Promise.all([
    Blog.count(),
    Blog.count({ where: { status: 'published' } }),
    Blog.count({ where: { status: 'draft' } }),
  ]);

  const result = { total, published, drafts };
  cache.set(KEYS.STATS, result, STATS_TTL);
  res.json(result);
}

// Render all pages of a PDF as PNG images with transparent background
async function renderPdfToImages(buffer) {
  const uint8 = new Uint8Array(buffer);
  const pdf = await pdfjsLib.getDocument({ data: uint8, verbosity: 0 }).promise;
  const totalPages = Math.min(pdf.numPages, PDF_MAX_PAGES);
  const results = [];

  for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale: PDF_SCALE });
    const w = Math.round(viewport.width);
    const h = Math.round(viewport.height);

    // Canvas starts transparent — no white pre-fill → background stays transparent
    const canvas = createCanvas(w, h);
    const ctx = canvas.getContext('2d');

    await page.render({ canvasContext: ctx, viewport }).promise;
    page.cleanup();

    // Save as PNG (transparent background preserved)
    const filename = `pdf-${crypto.randomBytes(8).toString('hex')}-p${pageNum}.png`;
    const filepath = path.join(UPLOAD_DIR, filename);
    fs.writeFileSync(filepath, canvas.toBuffer('image/png'));
    results.push({ page: pageNum, url: `/uploads/${filename}` });
  }

  return { total: pdf.numPages, rendered: totalPages, pages: results };
}

// Strip background colors from an inline style string
function stripBgFromStyle(style) {
  return (style || '')
    .replace(/background(?:-color)?\s*:[^;]+;?/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

// Admin: import PDF — renders every page as transparent-bg PNG → embeds in HTML
async function importPdf(req, res) {
  if (!req.file) return err(res, 400, 'No PDF file uploaded');

  const filePath = req.file.path;
  let cleaned = false;
  const cleanup = () => {
    if (!cleaned && fs.existsSync(filePath)) {
      try { fs.unlinkSync(filePath); } catch (_) {}
      cleaned = true;
    }
  };

  try {
    const buffer = fs.readFileSync(filePath);
    cleanup();

    // Validate PDF magic bytes: %PDF
    if (buffer[0] !== 0x25 || buffer[1] !== 0x50 || buffer[2] !== 0x44 || buffer[3] !== 0x46) {
      return err(res, 400, 'Invalid PDF file');
    }

    const { total, rendered, pages } = await renderPdfToImages(buffer);

    // Build HTML: one <figure> per page, image is the full rendered page
    const html = pages.map(({ page, url }) =>
      `<figure><img src="${url}" alt="Seite ${page}"></figure>`
    ).join('\n');

    const truncatedNote = total > rendered
      ? `\n<p><em>Hinweis: Nur die ersten ${rendered} von ${total} Seiten wurden importiert.</em></p>`
      : '';

    logger.info('PDF imported', { event: 'pdf_import', userId: req.user.id, pages: total });
    res.json({ content: sanitizeBlogContent(html + truncatedNote), pages: total });
  } catch (parseErr) {
    cleanup();
    logger.error('PDF parse error', { err: parseErr.message, stack: parseErr.stack?.split('\n').slice(0, 3).join(' | ') });
    err(res, 500, 'Failed to parse PDF');
  }
}

// Admin: import HTML file — saves embedded images to disk, strips backgrounds
async function importHtml(req, res) {
  if (!req.file) return err(res, 400, 'No HTML file uploaded');

  const filePath = req.file.path;
  let cleaned = false;
  const cleanup = () => {
    if (!cleaned && fs.existsSync(filePath)) {
      try { fs.unlinkSync(filePath); } catch (_) {}
      cleaned = true;
    }
  };

  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    cleanup();

    const $ = cheerio.load(raw, { decodeEntities: false });

    // Allowed MIME types and their canonical extensions for embedded images
    const EMBED_MIME_TO_EXT = {
      'image/jpeg': 'jpg',
      'image/jpg': 'jpg',
      'image/png': 'png',
      'image/gif': 'gif',
      'image/webp': 'webp',
    };
    // Max size per embedded image: 5 MB
    const MAX_EMBED_BYTES = 5 * 1024 * 1024;

    // Extract base64-embedded images → save to uploads → swap src
    $('img').each((_, el) => {
      const src = $(el).attr('src') || '';
      const m = src.match(/^data:(image\/[\w+-]+);base64,([A-Za-z0-9+/=]+)$/i);
      if (!m) return;
      const mime = m[1].toLowerCase();
      const ext = EMBED_MIME_TO_EXT[mime];
      if (!ext) return; // reject unknown/disallowed MIME types
      const data = Buffer.from(m[2], 'base64');
      if (data.length > MAX_EMBED_BYTES) return; // skip oversized images
      if (!validateMagicBytes(data)) return; // reject non-image content
      const filename = `html-img-${crypto.randomBytes(8).toString('hex')}.${ext}`;
      fs.writeFileSync(path.join(UPLOAD_DIR, filename), data);
      $(el).attr('src', `/uploads/${filename}`);
    });

    // Remove background colors from inline styles and bgcolor attributes
    $('[style]').each((_, el) => {
      const cleaned = stripBgFromStyle($(el).attr('style'));
      if (cleaned) $(el).attr('style', cleaned);
      else $(el).removeAttr('style');
    });
    $('[bgcolor]').removeAttr('bgcolor');
    $('[background]').removeAttr('background');

    // Extract body content (or full html if no body tag)
    const bodyContent = $('body').length ? $('body').html() : $.html();
    const content = sanitizeBlogContent(bodyContent || '');

    logger.info('HTML imported', { event: 'html_import', userId: req.user.id });
    res.json({ content });
  } catch (parseErr) {
    cleanup();
    logger.error('HTML parse error', { err: parseErr.message });
    err(res, 500, 'Failed to parse HTML');
  }
}

module.exports = { getPublished, getBySlug, getAll, create, update, deleteBlog, stats, blogValidators, importPdf, importHtml };

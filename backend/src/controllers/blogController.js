const { body, param, query, validationResult } = require('express-validator');
const { Op } = require('sequelize');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { Blog, User } = require('../models');
const { sanitizeBlogContent, sanitizeText } = require('../middleware/sanitize');
const { validateMagicBytes } = require('../config/security');
const { cache, KEYS, BLOG_SINGLE_TTL, BLOG_LIST_TTL, STATS_TTL, invalidateBlogCache } = require('../config/cache');
const logger = require('../utils/logger');
const juice = require('juice');
const { marked } = require('marked');

// 'canvas' is aliased to '@napi-rs/canvas' in package.json so pdfjs-dist can find it.
let createCanvas, DOMMatrix, Path2D, pdfjsLib;
try {
  const canvas = require('canvas');
  createCanvas = canvas.createCanvas;
  DOMMatrix = canvas.DOMMatrix;
  Path2D = canvas.Path2D;
  if (typeof global.DOMMatrix === 'undefined' && DOMMatrix) global.DOMMatrix = DOMMatrix;
  if (typeof global.Path2D === 'undefined' && Path2D) global.Path2D = Path2D;
  try { pdfjsLib = require('pdfjs-dist/legacy/build/pdf.js'); }
  catch { pdfjsLib = require('pdfjs-dist'); }
  pdfjsLib.GlobalWorkerOptions.workerSrc = '';
} catch (e) {
  logger.warn('PDF rendering dependencies not available', { err: e.message });
}

const cheerio = require('cheerio');

const BACKEND_ROOT = path.resolve(__dirname, '../..');
const _rawUploadPath = process.env.UPLOAD_PATH || 'uploads';
const UPLOAD_DIR = path.isAbsolute(_rawUploadPath)
  ? _rawUploadPath
  : path.resolve(BACKEND_ROOT, _rawUploadPath);
const PDF_SCALE = 2.0;
const PDF_MAX_PAGES = 30;

// Configure marked for safe HTML rendering
marked.setOptions({ breaks: true, gfm: true });

const SAFE_UPLOAD_URL = /^\/uploads\/[a-zA-Z0-9_-]+\.(jpg|jpeg|png|gif|webp)$/;

const blogValidators = [
  body('title').trim().notEmpty().isLength({ min: 3, max: 255 }),
  body('content').trim().notEmpty().isLength({ min: 10 }),
  body('excerpt').optional().trim().isLength({ max: 500 }),
  body('image_url').optional({ nullable: true }).custom(v => !v || SAFE_UPLOAD_URL.test(v)).withMessage('Ungültige Bild-URL'),
  body('image_alt').optional().trim().isLength({ max: 255 }),
  body('status').optional().isIn(['draft', 'published']),
  body('content_format').optional().isIn(['html', 'markdown', 'blocks']),
  body('content_markdown').optional().trim(),
  body('views').optional().isInt({ min: 0 }).withMessage('Views muss eine nicht-negative Ganzzahl sein'),
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
    return res.json(cached);
  }

  const blog = await Blog.findOne({
    where: { slug, status: 'published' },
    include: [{ model: User, as: 'author', attributes: ['username'] }],
  });
  if (!blog) return err(res, 404, 'Blog not found');

  const plain = blog.toJSON();
  cache.set(cacheKey, plain, BLOG_SINGLE_TTL);
  res.setHeader('X-Cache', 'MISS');
  res.json(plain);
}

// Public: increment view counter when a post is opened
async function incrementView(req, res) {
  const { slug } = req.params;

  const blog = await Blog.findOne({
    where: { slug, status: 'published' },
    attributes: ['id', 'views'],
  });
  if (!blog) return err(res, 404, 'Blog not found');

  await Blog.increment('views', { where: { id: blog.id } });
  const newViews = blog.views + 1;

  const cacheKey = KEYS.BLOG_SLUG(slug);
  const cached = cache.get(cacheKey);
  if (cached) {
    cache.set(cacheKey, { ...cached, views: newViews }, BLOG_SINGLE_TTL);
  }

  res.json({ views: newViews });
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

function resolveContent(format, content, content_markdown) {
  if (format === 'blocks') {
    // content is already pre-built combined HTML from the frontend
    return { html: sanitizeBlogContent(content), raw: content_markdown || null };
  }
  if (format === 'markdown') {
    const md = content_markdown || content;
    return { html: sanitizeBlogContent(marked.parse(md)), raw: md };
  }
  return { html: sanitizeBlogContent(content), raw: null };
}

// Admin: create blog
async function create(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { title, content, excerpt, status, image_alt, content_format, content_markdown, image_url } = req.body;

  const format = ['blocks', 'markdown', 'html'].includes(content_format) ? content_format : 'html';
  const { html: htmlContent, raw } = resolveContent(format, content, content_markdown);

  const finalStatus = status || 'published';
  const blog = await Blog.create({
    title: sanitizeText(title),
    content: htmlContent,
    content_format: format,
    content_markdown: raw,
    excerpt: excerpt ? sanitizeText(excerpt) : null,
    image_url,
    image_alt: image_alt ? sanitizeText(image_alt) : null,
    status: finalStatus,
    published_at: finalStatus === 'published' ? new Date() : null,
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

  const { title, content, excerpt, status, image_alt, content_format, content_markdown, views } = req.body;
  const updates = {};

  if (title !== undefined) updates.title = sanitizeText(title);
  if (content !== undefined) {
    const format = ['blocks', 'markdown', 'html'].includes(content_format)
      ? content_format
      : (blog.content_format || 'html');
    const { html, raw } = resolveContent(format, content, content_markdown);
    updates.content_format = format;
    updates.content = html;
    updates.content_markdown = raw;
  }
  if (excerpt !== undefined) updates.excerpt = sanitizeText(excerpt);
  if (status !== undefined) updates.status = status;
  if (image_alt !== undefined) updates.image_alt = sanitizeText(image_alt);
  if (views !== undefined) updates.views = parseInt(views, 10);

  if (req.body.image_url !== undefined) {
    // New image was uploaded separately via presign token; delete old one if changed
    if (req.body.image_url && req.body.image_url !== blog.image_url && blog.image_url) {
      const oldPath = path.join(UPLOAD_DIR, path.basename(blog.image_url));
      fs.unlink(oldPath, () => {});
    }
    updates.image_url = req.body.image_url || null;
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
    const imgPath = path.join(UPLOAD_DIR, path.basename(blog.image_url));
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

// Render all pages of a PDF as PNG images
async function renderPdfToImages(buffer) {
  if (!pdfjsLib || !createCanvas) throw new Error('PDF rendering not available');
  const uint8 = new Uint8Array(buffer);
  const loadingTask = pdfjsLib.getDocument({ data: uint8, verbosity: 0, disableFontFace: true });
  const pdf = await loadingTask.promise;
  const totalPages = Math.min(pdf.numPages, PDF_MAX_PAGES);
  const results = [];

  for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale: PDF_SCALE });
    const w = Math.round(viewport.width);
    const h = Math.round(viewport.height);

    const canvas = createCanvas(w, h);
    const ctx = canvas.getContext('2d');

    // White background so text is readable
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);

    await page.render({ canvasContext: ctx, viewport }).promise;
    page.cleanup();

    const filename = `pdf-${crypto.randomBytes(8).toString('hex')}-p${pageNum}.png`;
    const filepath = path.join(UPLOAD_DIR, filename);
    fs.writeFileSync(filepath, canvas.toBuffer('image/png'));
    results.push({ page: pageNum, url: `/uploads/${filename}` });
  }

  pdf.destroy();
  return { total: pdf.numPages, rendered: totalPages, pages: results };
}

// Admin: import PDF — renders every page as PNG → embeds in HTML
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
    return err(res, 500, 'Failed to parse PDF');
  }
}

// Admin: import HTML file — inlines CSS from <style> blocks, saves embedded images
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

    // Inline CSS from <style> blocks into element style attributes
    const inlined = juice(raw, { removeStyleTags: true, preserveImportant: true });

    const $ = cheerio.load(inlined, { decodeEntities: false });

    const EMBED_MIME_TO_EXT = {
      'image/jpeg': 'jpg', 'image/jpg': 'jpg',
      'image/png': 'png', 'image/gif': 'gif', 'image/webp': 'webp',
    };
    const MAX_EMBED_BYTES = 5 * 1024 * 1024;

    // Extract base64-embedded images → save to uploads → swap src
    $('img').each((_, el) => {
      const src = $(el).attr('src') || '';
      const m = src.match(/^data:(image\/[\w+-]+);base64,([A-Za-z0-9+/=]+)$/i);
      if (!m) return;
      const mime = m[1].toLowerCase();
      const ext = EMBED_MIME_TO_EXT[mime];
      if (!ext) return;
      const data = Buffer.from(m[2], 'base64');
      if (data.length > MAX_EMBED_BYTES) return;
      if (!validateMagicBytes(data)) return;
      const filename = `html-img-${crypto.randomBytes(8).toString('hex')}.${ext}`;
      fs.writeFileSync(path.join(UPLOAD_DIR, filename), data);
      $(el).attr('src', `/uploads/${filename}`);
    });

    $('[bgcolor]').removeAttr('bgcolor');
    $('[background]').removeAttr('background');

    const title = $('title').text().trim() || '';
    const bodyContent = $('body').length ? $('body').html() : $.html();
    const content = sanitizeBlogContent(bodyContent || '');

    logger.info('HTML imported', { event: 'html_import', userId: req.user.id });
    res.json({ content, title });
  } catch (parseErr) {
    cleanup();
    logger.error('HTML parse error', { err: parseErr.message });
    return err(res, 500, 'Failed to parse HTML');
  }
}

// Admin: patch only views count
async function patchViews(req, res) {
  const v = parseInt(req.body.views, 10);
  if (isNaN(v) || v < 0) return err(res, 400, 'views muss eine nicht-negative Ganzzahl sein');

  const blog = await Blog.findByPk(req.params.id);
  if (!blog) return err(res, 404, 'Blog not found');

  await blog.update({ views: v });
  invalidateBlogCache();
  logger.info('Blog views patched', { event: 'blog_views_patch', blogId: blog.id, views: v, userId: req.user.id });
  res.json({ id: blog.id, views: v });
}

module.exports = { getPublished, getBySlug, incrementView, getAll, create, update, deleteBlog, stats, patchViews, blogValidators, importPdf, importHtml };

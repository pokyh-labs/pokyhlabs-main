const { body, param, query, validationResult } = require('express-validator');
const { Op } = require('sequelize');
const path = require('path');
const fs = require('fs');
const { Blog, User } = require('../models');
const { sanitizeBlogContent, sanitizeText } = require('../middleware/sanitize');
const { cache, KEYS, BLOG_SINGLE_TTL, BLOG_LIST_TTL, STATS_TTL, invalidateBlogCache } = require('../config/cache');
const logger = require('../utils/logger');

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

// Admin: import PDF and return extracted HTML
async function importPdf(req, res) {
  if (!req.file) return err(res, 400, 'No PDF file uploaded');

  const filePath = req.file.path;
  try {
    const pdfParse = require('pdf-parse');
    const buffer = fs.readFileSync(filePath);

    // Validate PDF magic bytes: %PDF
    if (buffer[0] !== 0x25 || buffer[1] !== 0x50 || buffer[2] !== 0x44 || buffer[3] !== 0x46) {
      fs.unlinkSync(filePath);
      return err(res, 400, 'Invalid PDF file');
    }

    const data = await pdfParse(buffer);
    fs.unlinkSync(filePath);

    function escHtml(str) {
      return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    const html = data.text
      .split(/\n{2,}/)
      .map(p => p.trim())
      .filter(p => p.length > 0)
      .map(p => {
        const lines = p.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        if (lines.length === 0) return '';
        if (lines.length === 1 && lines[0].length < 80 && !/[.,;]$/.test(lines[0])) {
          return `<h2>${escHtml(lines[0])}</h2>`;
        }
        return `<p>${lines.map(escHtml).join('<br>')}</p>`;
      })
      .filter(Boolean)
      .join('\n');

    logger.info('PDF imported', { event: 'pdf_import', userId: req.user.id, pages: data.numpages });
    res.json({ content: sanitizeBlogContent(html), pages: data.numpages });
  } catch (parseErr) {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    logger.error('PDF parse error', { err: parseErr.message });
    err(res, 500, 'Failed to parse PDF');
  }
}

module.exports = { getPublished, getBySlug, getAll, create, update, deleteBlog, stats, blogValidators, importPdf };

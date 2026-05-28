const { body, validationResult } = require('express-validator');
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

marked.setOptions({ breaks: true, gfm: true });

const SAFE_UPLOAD_URL = /^\/uploads\/[a-zA-Z0-9_-]+\.(jpg|jpeg|png|gif|webp)$/;

const LANGS = ['de', 'en', 'it'];
const DEFAULT_LANG = 'de';
const pickLang = (q) => LANGS.includes(q) ? q : DEFAULT_LANG;

// Flatten a full Blog row to the public API shape for a given language.
// Fallback chain: requested lang → DE → any available lang slot → legacy flat columns.
function flattenForLang(blog, lang) {
  const t = blog.translations || {};
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
  // Legacy rows created before multi-lang: use flat columns
  if (!slot) {
    slot = {
      title: blog.title || '',
      slug: blog[`slug_${lang}`] || blog[`slug_${DEFAULT_LANG}`] || blog.slug || '',
      excerpt: blog.excerpt || null,
      content: blog.content || '',
      image_alt: blog.image_alt || null,
      content_markdown: blog.content_markdown || null,
    };
  }
  return {
    id: blog.id,
    title: slot.title || '',
    slug: slot.slug || blog[`slug_${lang}`] || blog[`slug_${DEFAULT_LANG}`] || blog.slug || '',
    excerpt: slot.excerpt || null,
    content: slot.content || '',
    image_url: blog.image_url,
    image_alt: slot.image_alt || null,
    status: blog.status,
    published_at: blog.published_at,
    views: blog.views,
    content_format: blog.content_format,
    author_id: blog.author_id,
  };
}

// Auto-fill empty EN/IT slots from DE so admins can write German only.
function fillMissingBlogSlots(translations) {
  const de = translations[DEFAULT_LANG] || {};
  const result = {};
  for (const l of LANGS) {
    const slot = translations[l] || {};
    result[l] = {
      title:            (slot.title?.trim()            || de.title            || ''),
      slug:             (slot.slug?.trim()             || de.slug             || ''),
      excerpt:          (slot.excerpt?.trim()          || de.excerpt          || ''),
      content:          (slot.content?.trim()          || de.content          || ''),
      content_markdown: (slot.content_markdown?.trim() || de.content_markdown || null),
      image_alt:        (slot.image_alt?.trim()        || de.image_alt        || ''),
    };
  }
  return result;
}

const blogValidators = [
  body('translations').custom(t => {
    if (!t || typeof t !== 'object') throw new Error('translations ist erforderlich');
    const de = t[DEFAULT_LANG];
    if (!de || !String(de.title || '').trim() || String(de.title).trim().length < 3) {
      throw new Error('translations.de.title erforderlich (min. 3 Zeichen)');
    }
    if (!de || !String(de.content || '').trim() || String(de.content).trim().length < 10) {
      throw new Error('translations.de.content erforderlich (min. 10 Zeichen)');
    }
    return true;
  }),
  body('image_url').optional({ nullable: true }).custom(v => !v || SAFE_UPLOAD_URL.test(v)).withMessage('Ungültige Bild-URL'),
  body('status').optional().isIn(['draft', 'published']),
  body('content_format').optional().isIn(['html', 'markdown', 'blocks']),
  body('views').optional().isInt({ min: 0 }).withMessage('Views muss eine nicht-negative Ganzzahl sein'),
];

function ok(res) { return (data) => res.json(data); }
function err(res, status, msg) { return res.status(status).json({ error: msg }); }

function resolveContent(format, content, content_markdown) {
  if (format === 'blocks') {
    return { html: sanitizeBlogContent(content), raw: content_markdown || null };
  }
  if (format === 'markdown') {
    const md = content_markdown || content;
    return { html: sanitizeBlogContent(marked.parse(md)), raw: md };
  }
  return { html: sanitizeBlogContent(content), raw: null };
}

// Public: get published blogs (paginated, cached, language-aware)
async function getPublished(req, res) {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(20, Math.max(1, parseInt(req.query.limit) || 10));
  const offset = (page - 1) * limit;
  const lang = pickLang(req.query.lang);
  const includeAlternates = req.query.include === 'alternates';

  const cacheKey = `${KEYS.BLOG_LIST}:p${page}:l${limit}:${lang}${includeAlternates ? ':alt' : ''}`;
  const cached = cache.get(cacheKey);
  if (cached) {
    res.setHeader('X-Cache', 'HIT');
    return res.json(cached);
  }

  const { count, rows } = await Blog.findAndCountAll({
    where: { status: 'published' },
    order: [['published_at', 'DESC']],
    limit,
    offset,
    subQuery: false,
    distinct: true,
    col: 'Blog.id',
  });

  const authorIds = [...new Set(rows.map(b => b.author_id).filter(Boolean))];
  const authorMap = {};
  if (authorIds.length) {
    const authors = await User.findAll({ where: { id: authorIds }, attributes: ['id', 'username'] });
    authors.forEach(u => { authorMap[u.id] = { username: u.username }; });
  }

  const blogs = rows.map(b => {
    const flat = flattenForLang(b, lang);
    const out = { ...flat, author: authorMap[b.author_id] || null };
    if (includeAlternates) {
      out.slug_de = b.slug_de || null;
      out.slug_en = b.slug_en || null;
      out.slug_it = b.slug_it || null;
    }
    return out;
  });

  const result = { blogs, pagination: { page, limit, total: count, pages: Math.ceil(count / limit) } };
  cache.set(cacheKey, result, BLOG_LIST_TTL);
  res.setHeader('X-Cache', 'MISS');
  res.json(result);
}

// Public: get single blog by slug + lang
async function getBySlug(req, res) {
  const { slug } = req.params;
  const lang = pickLang(req.query.lang);
  const cacheKey = `blog:slug:${lang}:${slug}`;

  const cached = cache.get(cacheKey);
  if (cached) {
    res.setHeader('X-Cache', 'HIT');
    return res.json(cached);
  }

  let blog = await Blog.findOne({
    where: { [`slug_${lang}`]: slug, status: 'published' },
  });
  // Fallback: old rows may only have the legacy `slug` column set
  if (!blog) {
    blog = await Blog.findOne({ where: { slug, status: 'published' } });
  }
  if (!blog) return err(res, 404, 'Blog not found');

  const flat = flattenForLang(blog, lang);
  flat.alternates = { de: blog.slug_de || null, en: blog.slug_en || null, it: blog.slug_it || null };

  if (blog.author_id) {
    const author = await User.findByPk(blog.author_id, { attributes: ['username'] });
    flat.author = author ? { username: author.username } : null;
  } else {
    flat.author = null;
  }

  cache.set(cacheKey, flat, BLOG_SINGLE_TTL);
  res.setHeader('X-Cache', 'MISS');
  res.json(flat);
}

// Public: increment view counter
async function incrementView(req, res) {
  const { slug } = req.params;
  const lang = pickLang(req.query.lang);

  const blog = await Blog.findOne({
    where: { [`slug_${lang}`]: slug, status: 'published' },
    attributes: ['id', 'views', 'slug_de', 'slug_en', 'slug_it'],
  });
  if (!blog) return err(res, 404, 'Blog not found');

  await Blog.increment('views', { where: { id: blog.id } });
  const newViews = blog.views + 1;

  // Invalidate single-blog cache for all language variants of this post
  for (const l of LANGS) {
    const s = blog[`slug_${l}`];
    if (s) {
      const key = `blog:slug:${l}:${s}`;
      const cached = cache.get(key);
      if (cached) cache.set(key, { ...cached, views: newViews }, BLOG_SINGLE_TTL);
    }
  }

  res.json({ views: newViews });
}

// Admin: get all blogs (full translations object for the form)
async function getAll(req, res) {
  const cached = cache.get(KEYS.BLOG_ALL);
  if (cached) {
    res.setHeader('X-Cache', 'HIT');
    return res.json(cached);
  }

  const blogs = await Blog.findAll({ order: [['created_at', 'DESC']] });
  const plain = blogs.map(b => b.toJSON());
  cache.set(KEYS.BLOG_ALL, plain, 30);
  res.setHeader('X-Cache', 'MISS');
  res.json(plain);
}

// Admin: create blog
async function create(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { translations, status, image_url, content_format, views } = req.body;
  const format = ['blocks', 'markdown', 'html'].includes(content_format) ? content_format : 'html';

  // Fill missing EN/IT slots from DE, then sanitize
  const filled = fillMissingBlogSlots(translations);
  const sanitizedTranslations = {};
  for (const l of LANGS) {
    const slot = filled[l];
    const { html, raw } = resolveContent(format, slot.content || '', slot.content_markdown || '');
    sanitizedTranslations[l] = {
      title:            sanitizeText(slot.title || ''),
      slug:             slot.slug ? sanitizeText(slot.slug) : '',
      excerpt:          slot.excerpt ? sanitizeText(slot.excerpt) : '',
      content:          html,
      content_markdown: raw,
      image_alt:        slot.image_alt ? sanitizeText(slot.image_alt) : '',
    };
  }

  const finalStatus = status || 'published';
  const blog = await Blog.create({
    translations: sanitizedTranslations,
    image_url: image_url || null,
    content_format: format,
    status: finalStatus,
    published_at: finalStatus === 'published' ? new Date() : null,
    author_id: req.user.id,
    views: views !== undefined ? parseInt(views, 10) : 0,
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

  const { translations, status, content_format, views } = req.body;
  const updates = {};

  if (translations !== undefined) {
    const format = ['blocks', 'markdown', 'html'].includes(content_format)
      ? content_format
      : (blog.content_format || 'html');
    const merged = {};
    for (const l of LANGS) {
      merged[l] = { ...(blog.translations?.[l] || {}), ...(translations[l] || {}) };
    }
    const filled = fillMissingBlogSlots(merged);
    const sanitizedTranslations = {};
    for (const l of LANGS) {
      const slot = filled[l];
      const { html, raw } = resolveContent(format, slot.content || '', slot.content_markdown || '');
      sanitizedTranslations[l] = {
        title:            sanitizeText(slot.title || ''),
        slug:             slot.slug ? sanitizeText(slot.slug) : '',
        excerpt:          slot.excerpt ? sanitizeText(slot.excerpt) : '',
        content:          html,
        content_markdown: raw,
        image_alt:        slot.image_alt ? sanitizeText(slot.image_alt) : '',
      };
    }
    updates.translations = sanitizedTranslations;
    updates.content_format = format;
  }

  if (status !== undefined) updates.status = status;
  if (views !== undefined) updates.views = parseInt(views, 10);

  if (req.body.image_url !== undefined) {
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

    if (buffer[0] !== 0x25 || buffer[1] !== 0x50 || buffer[2] !== 0x44 || buffer[3] !== 0x46) {
      return err(res, 400, 'Invalid PDF file');
    }

    const { total, rendered, pages } = await renderPdfToImages(buffer);

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

    const inlined = juice(raw, { removeStyleTags: true, preserveImportant: true });
    const $ = cheerio.load(inlined, { decodeEntities: false });

    const EMBED_MIME_TO_EXT = {
      'image/jpeg': 'jpg', 'image/jpg': 'jpg',
      'image/png': 'png', 'image/gif': 'gif', 'image/webp': 'webp',
    };
    const MAX_EMBED_BYTES = 5 * 1024 * 1024;

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

module.exports = { getPublished, getBySlug, incrementView, getAll, create, update, deleteBlog, stats, patchViews, blogValidators, importPdf, importHtml };

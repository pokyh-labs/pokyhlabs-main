const { DataTypes, Op } = require('sequelize');
const slugify = require('slugify');

const LANGS = ['de', 'en', 'it'];

module.exports = (sequelize) => {
  const Blog = sequelize.define('Blog', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },

    // Per-language slug lookup columns — indexed, cross-DB portable
    slug_de: { type: DataTypes.STRING(300), allowNull: true },
    slug_en: { type: DataTypes.STRING(300), allowNull: true },
    slug_it: { type: DataTypes.STRING(300), allowNull: true },

    // Translations JSON: { de: {title,slug,excerpt,content,content_markdown,image_alt}, en: {...}, it: {...} }
    translations: {
      type: DataTypes.TEXT('long'),
      allowNull: false,
      defaultValue: '{}',
      get() {
        const raw = this.getDataValue('translations');
        try { return raw ? JSON.parse(raw) : {}; } catch { return {}; }
      },
      set(val) {
        this.setDataValue('translations', JSON.stringify(val && typeof val === 'object' ? val : {}));
      },
    },

    // Non-translatable
    image_url:        { type: DataTypes.STRING(500), allowNull: true },
    status:           { type: DataTypes.STRING(10), defaultValue: 'draft', allowNull: false, validate: { isIn: [['draft', 'published']] } },
    author_id:        { type: DataTypes.INTEGER, allowNull: false },
    published_at:     { type: DataTypes.DATE, allowNull: true },
    views:            { type: DataTypes.INTEGER, defaultValue: 0 },
    content_format:   { type: DataTypes.STRING(10), defaultValue: 'html', allowNull: false },

    // Legacy single-language columns — kept nullable so older DB tables with
    // NOT NULL constraints still accept inserts. Auto-populated from translations.de.*
    // by the beforeValidate hook. No code reads from these.
    title:            { type: DataTypes.STRING(255), allowNull: true },
    slug:             { type: DataTypes.STRING(300), allowNull: true },
    content:          { type: DataTypes.TEXT('long'), allowNull: true },
    excerpt:          { type: DataTypes.STRING(500), allowNull: true },
    image_alt:        { type: DataTypes.STRING(255), allowNull: true },
    content_markdown: { type: DataTypes.TEXT('long'), allowNull: true },
  }, {
    tableName: 'blogs',
    hooks: {
      beforeValidate: async (blog) => {
        const t = blog.translations || {};
        const resolved = {};
        for (const l of LANGS) {
          const slot = { ...(t[l] || {}) };
          // If this row was created via legacy path (no translations object yet),
          // synthesise a DE slot from the legacy columns so the hook can populate slug_de.
          if (l === 'de' && !slot.title && blog.getDataValue('title')) {
            slot.title = blog.getDataValue('title');
            slot.slug = blog.getDataValue('slug') || '';
            slot.content = blog.getDataValue('content') || '';
            slot.excerpt = blog.getDataValue('excerpt') || '';
            slot.image_alt = blog.getDataValue('image_alt') || '';
            slot.content_markdown = blog.getDataValue('content_markdown') || '';
          }
          if (!slot.title) {
            // Missing slot — leave slug_{l} null. Validators in controller enforce required fields on writes.
            resolved[l] = slot;
            continue;
          }
          const base = (slot.slug && String(slot.slug).trim()) || slugify(slot.title, { lower: true, strict: true });
          let candidate = base;
          let counter = 1;
          // Ensure (slug, lang) uniqueness across other rows
          // eslint-disable-next-line no-await-in-loop
          while (await Blog.findOne({
            where: { [`slug_${l}`]: candidate, id: { [Op.ne]: blog.id || 0 } },
            attributes: ['id'],
          })) {
            candidate = `${base}-${counter++}`;
          }
          slot.slug = candidate;
          blog[`slug_${l}`] = candidate;
          resolved[l] = slot;
        }
        blog.translations = resolved;

        // Mirror DE into legacy NOT-NULL columns for older DB schemas
        const de = resolved.de || {};
        if (de.title) blog.title = de.title;
        if (de.slug) blog.slug = de.slug;
        if (de.content) blog.content = de.content;
        if (de.excerpt) blog.excerpt = de.excerpt;
        if (de.image_alt) blog.image_alt = de.image_alt;
        if (de.content_markdown) blog.content_markdown = de.content_markdown;

        if (blog.changed('status') && blog.status === 'published' && !blog.published_at) {
          blog.published_at = new Date();
        }
      },
    },
    indexes: [
      { fields: ['slug_de'] },
      { fields: ['slug_en'] },
      { fields: ['slug_it'] },
      { fields: ['status'] },
      { fields: ['published_at'] },
      { fields: ['author_id'] },
    ],
  });

  return Blog;
};

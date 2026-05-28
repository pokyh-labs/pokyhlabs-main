const { DataTypes } = require('sequelize');

const LANGS = ['de', 'en', 'it'];

module.exports = (sequelize) => {
  const Project = sequelize.define('Project', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },

    // Translations JSON: { de: {title, description, image_alt}, en: {...}, it: {...} }
    translations: {
      type: DataTypes.TEXT,
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
    tags: {
      type: DataTypes.TEXT, allowNull: false, defaultValue: '[]',
      get() { try { return JSON.parse(this.getDataValue('tags')); } catch { return []; } },
      set(val) { this.setDataValue('tags', JSON.stringify(Array.isArray(val) ? val : [])); },
    },
    url:       { type: DataTypes.STRING(500), allowNull: true },
    image_url: { type: DataTypes.STRING(500), allowNull: true },
    gallery: {
      type: DataTypes.TEXT, allowNull: false, defaultValue: '[]',
      get() {
        try { const v = JSON.parse(this.getDataValue('gallery') || '[]'); return Array.isArray(v) ? v : []; }
        catch { return []; }
      },
      set(val) {
        const arr = Array.isArray(val)
          ? val.filter(it => it && typeof it.url === 'string').map(it => ({
              url: it.url,
              alt: typeof it.alt === 'string' ? it.alt : null,
            }))
          : [];
        this.setDataValue('gallery', JSON.stringify(arr));
      },
    },
    year:       { type: DataTypes.INTEGER, allowNull: false },
    status:     { type: DataTypes.STRING(10), defaultValue: 'live', allowNull: false, validate: { isIn: [['live', 'wip', 'concept']] } },
    sort_order: { type: DataTypes.INTEGER, defaultValue: 0 },

    // Legacy single-language columns — kept nullable for backward-compat, mirrored from translations.de.*
    title:       { type: DataTypes.STRING(255), allowNull: true },
    description: { type: DataTypes.TEXT, allowNull: true },
    image_alt:   { type: DataTypes.STRING(255), allowNull: true },
  }, {
    tableName: 'projects',
    hooks: {
      beforeValidate: (project) => {
        const t = project.translations || {};

        // If legacy row has no translations yet, synthesise DE from legacy columns
        if (!t.de?.title && project.getDataValue('title')) {
          t.de = {
            title: project.getDataValue('title') || '',
            description: project.getDataValue('description') || '',
            image_alt: project.getDataValue('image_alt') || '',
          };
        }

        // Validate all 3 langs have title + description (only when translations is being set)
        const hasTranslations = Object.keys(t).length > 0;
        if (hasTranslations) {
          for (const l of LANGS) {
            const slot = t[l];
            if (!slot?.title?.trim()) {
              throw new Error(`translations.${l}.title is required`);
            }
            if (!slot?.description?.trim()) {
              throw new Error(`translations.${l}.description is required`);
            }
          }
        }

        project.translations = t;

        // Mirror DE into legacy columns
        const de = t.de || {};
        if (de.title) project.title = de.title;
        if (de.description) project.description = de.description;
        if (de.image_alt !== undefined) project.image_alt = de.image_alt || null;
      },
    },
    indexes: [
      { fields: ['status'] },
      { fields: ['sort_order'] },
    ],
  });

  return Project;
};

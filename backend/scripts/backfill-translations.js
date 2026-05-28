'use strict';

/**
 * backfill-translations.js
 *
 * Migrates existing single-language blog/project rows to the new
 * multi-language `translations` column.
 *
 * Usage:
 *   node backend/scripts/backfill-translations.js
 *
 * The script uses raw SQL so it bypasses the Sequelize beforeValidate hook
 * (which requires all 3 langs to have title + content before saving).
 */

const path = require('path');
const fs   = require('fs');

// ── .env loading ─────────────────────────────────────────────────────────────
const envCandidates = [
  path.resolve(__dirname, '../../.env'),
  path.resolve(__dirname, '../.env'),
];

for (const candidate of envCandidates) {
  if (fs.existsSync(candidate)) {
    require('dotenv').config({ path: candidate });
    console.log(`Loaded .env from ${candidate}`);
    break;
  }
}

// ── Models / sequelize ────────────────────────────────────────────────────────
const { sequelize } = require('../src/models');

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Returns true when the `translations` value in the DB is already populated
 * (i.e. not NULL, not empty string, not the literal '{}').
 */
function isAlreadyPopulated(raw) {
  if (!raw) return false;
  const trimmed = String(raw).trim();
  if (trimmed === '' || trimmed === '{}') return false;
  try {
    const parsed = JSON.parse(trimmed);
    return parsed && typeof parsed === 'object' && Object.keys(parsed).length > 0;
  } catch {
    return false;
  }
}

// ── Blog backfill ─────────────────────────────────────────────────────────────

async function backfillBlogs() {
  console.log('\n── Blogs ────────────────────────────────────────────────');

  const rows = await sequelize.query(
    'SELECT id, title, slug, content, excerpt, image_alt, content_markdown, translations FROM blogs',
    { type: sequelize.QueryTypes.SELECT }
  );

  console.log(`Found ${rows.length} blog row(s).`);

  let updated = 0;
  let skipped = 0;

  for (const row of rows) {
    if (isAlreadyPopulated(row.translations)) {
      skipped++;
      continue;
    }

    const deSlot = {
      title:            row.title            || '',
      slug:             row.slug             || '',
      excerpt:          row.excerpt          || '',
      content:          row.content          || '',
      content_markdown: row.content_markdown || '',
      image_alt:        row.image_alt        || '',
    };

    const emptyLang = { title: '', slug: '', excerpt: '', content: '', content_markdown: '', image_alt: '' };

    const translations = JSON.stringify({
      de: deSlot,
      en: { ...emptyLang },
      it: { ...emptyLang },
    });

    const slugDe = deSlot.slug || null;

    await sequelize.query(
      'UPDATE blogs SET translations = ?, slug_de = ? WHERE id = ?',
      {
        replacements: [translations, slugDe, row.id],
        type: sequelize.QueryTypes.UPDATE,
      }
    );

    updated++;
    console.log(`  Blog #${row.id} "${deSlot.title || '(no title)'}" — backfilled.`);
  }

  console.log(`Blogs: ${updated} updated, ${skipped} skipped (already populated).`);
  return updated;
}

// ── Project backfill ──────────────────────────────────────────────────────────

async function backfillProjects() {
  console.log('\n── Projects ─────────────────────────────────────────────');

  const rows = await sequelize.query(
    'SELECT id, title, description, image_alt, translations FROM projects',
    { type: sequelize.QueryTypes.SELECT }
  );

  console.log(`Found ${rows.length} project row(s).`);

  let updated = 0;
  let skipped = 0;

  for (const row of rows) {
    if (isAlreadyPopulated(row.translations)) {
      skipped++;
      continue;
    }

    const deSlot = {
      title:       row.title       || '',
      description: row.description || '',
      image_alt:   row.image_alt   || '',
    };

    const emptyLang = { title: '', description: '', image_alt: '' };

    const translations = JSON.stringify({
      de: deSlot,
      en: { ...emptyLang },
      it: { ...emptyLang },
    });

    await sequelize.query(
      'UPDATE projects SET translations = ? WHERE id = ?',
      {
        replacements: [translations, row.id],
        type: sequelize.QueryTypes.UPDATE,
      }
    );

    updated++;
    console.log(`  Project #${row.id} "${deSlot.title || '(no title)'}" — backfilled.`);
  }

  console.log(`Projects: ${updated} updated, ${skipped} skipped (already populated).`);
  return updated;
}

// ── Main ──────────────────────────────────────────────────────────────────────

(async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connection OK.');

    const blogCount    = await backfillBlogs();
    const projectCount = await backfillProjects();

    console.log(`\nDone. Total rows updated: ${blogCount + projectCount}`);
  } catch (err) {
    console.error('Backfill failed:', err);
    process.exitCode = 1;
  } finally {
    await sequelize.close();
    console.log('Database connection closed.');
  }
})();

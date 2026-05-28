const NodeCache = require('node-cache');

// ── TTLs (seconds) ────────────────────────────────────────────
const BLOG_LIST_TTL   = 300;   // 5 min  — public blog list
const BLOG_SINGLE_TTL = 900;   // 15 min — single blog post
const STATS_TTL       = 120;   // 2 min  — admin dashboard stats
const PROJECT_LIST_TTL = 600;  // 10 min — public project list
const LOG_STATS_TTL   = 60;    // 1 min  — logs/geo (fast-changing)
const SEO_TTL         = 3600;  // 1 hr   — SEO config (rarely changes)
const USER_LIST_TTL   = 300;   // 5 min  — user list

const cache = new NodeCache({
  stdTTL: 300,        // default 5 min
  checkperiod: 60,    // sweep expired keys every 60 s
  useClones: false,   // avoid clone overhead on large objects
});

const KEYS = {
  BLOG_LIST:    'blog:list:published',
  BLOG_SLUG:    (slug) => `blog:slug:${slug}`,
  BLOG_ALL:     'blog:list:all',
  STATS:        'admin:stats',
  PROJECT_LIST: 'project:list:public',
  PROJECT_ALL:  'project:list:all',
  LOG_GEO:      (days) => `logs:geo:${days}`,
  LOG_COUNTRIES:(days) => `logs:countries:${days}`,
  LOG_STATS:    'logs:stats',
  SEO_CONFIG:   'seo:config',
  USERS:        'admin:users',
  INQUIRIES:    'admin:inquiries',
};

function invalidateBlogCache() {
  const keys = cache.keys().filter(k =>
    k.startsWith('blog:list') || k.startsWith('blog:slug:')
  );
  if (keys.length) cache.del(keys);
  cache.del([KEYS.BLOG_ALL, KEYS.STATS]);
}

function invalidateProjectCache() {
  const keys = cache.keys().filter(k => k.startsWith('project:'));
  if (keys.length) cache.del(keys);
}

function invalidateLogCache() {
  const keys = cache.keys().filter(k => k.startsWith('logs:'));
  if (keys.length) cache.del(keys);
}

module.exports = {
  cache,
  KEYS,
  BLOG_LIST_TTL,
  BLOG_SINGLE_TTL,
  STATS_TTL,
  PROJECT_LIST_TTL,
  LOG_STATS_TTL,
  SEO_TTL,
  USER_LIST_TTL,
  invalidateBlogCache,
  invalidateProjectCache,
  invalidateLogCache,
};

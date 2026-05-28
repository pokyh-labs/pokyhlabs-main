const NodeCache = require('node-cache');

// TTLs in seconds
const BLOG_LIST_TTL = 60;      // 1 min for blog list
const BLOG_SINGLE_TTL = 300;   // 5 min for single blog
const STATS_TTL = 120;         // 2 min for dashboard stats

const cache = new NodeCache({
  stdTTL: BLOG_LIST_TTL,
  checkperiod: 30,
});

const PROJECT_LIST_TTL = 120; // 2 min

const KEYS = {
  BLOG_LIST: 'blog:list:published',
  BLOG_SLUG: (slug) => `blog:slug:${slug}`,
  BLOG_ALL: 'blog:list:all',
  STATS: 'admin:stats',
  PROJECT_LIST: 'project:list:public',
  PROJECT_ALL:  'project:list:all',
};

function invalidateBlogCache() {
  const keys = cache.keys().filter(k =>
    k.startsWith(KEYS.BLOG_LIST) || k.startsWith('blog:slug:')
  );
  if (keys.length) cache.del(keys);
  cache.del([KEYS.BLOG_ALL, KEYS.STATS]);
}

function invalidateProjectCache() {
  cache.del(KEYS.PROJECT_LIST);
  cache.del(KEYS.PROJECT_ALL);
}

module.exports = { cache, KEYS, BLOG_LIST_TTL, BLOG_SINGLE_TTL, STATS_TTL, PROJECT_LIST_TTL, invalidateBlogCache, invalidateProjectCache };

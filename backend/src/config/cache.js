const NodeCache = require('node-cache');

// TTLs in seconds
const BLOG_LIST_TTL = 60;      // 1 min for blog list
const BLOG_SINGLE_TTL = 300;   // 5 min for single blog
const STATS_TTL = 120;         // 2 min for dashboard stats

const cache = new NodeCache({
  stdTTL: BLOG_LIST_TTL,
  checkperiod: 30,
  useClones: false,
});

const KEYS = {
  BLOG_LIST: 'blog:list:published',
  BLOG_SLUG: (slug) => `blog:slug:${slug}`,
  BLOG_ALL: 'blog:list:all',
  STATS: 'admin:stats',
};

function invalidateBlogCache() {
  cache.del(KEYS.BLOG_LIST);
  cache.del(KEYS.BLOG_ALL);
  cache.del(KEYS.STATS);
  const keys = cache.keys().filter(k => k.startsWith('blog:slug:'));
  if (keys.length) cache.del(keys);
}

module.exports = { cache, KEYS, BLOG_LIST_TTL, BLOG_SINGLE_TTL, STATS_TTL, invalidateBlogCache };

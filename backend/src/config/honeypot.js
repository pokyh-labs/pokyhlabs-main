// ── Honeypot config ────────────────────────────────────────────
// Add sentences freely — one per line, nothing else to change.
// Responses are picked at random on every hit.

const responses = [
  // User-defined
  'Nice try diddy',
  'Sabrina Carpenter said no',
  'Nice try lil bro',

  // Bonus bangers
  'Bro really thought he was a hacker 💀',
  'You shall not pass',
  'Sir, this is a Wendy\'s',
  'The database is in another castle',
  'lmao nice try bestie',
  'Not today satan',
  'This endpoint is sponsored by skill issue',
  'Error 420: go touch some grass',
  'Your hacking skills have been rated: 0/10',
  'Congrats, you found absolutely nothing',
  'mom said it\'s my turn on the Xbox',
  'Have you tried asking nicely instead?',
  'This file does not spark joy. Goodbye.',
  'Bruh.',
  'FBI open up! (jk, but also stop)',
  'Caught you lacking fr fr',
  'W try, L result',
  'Did you really think it would be that easy?',
  'No cap this ain\'t it chief',
  'The audacity 💅',
  'Try harder (you won\'t)',
];

// ── Paths to trap ──────────────────────────────────────────────
// All HTTP methods are caught. Add any path you want to troll.

const paths = [
  // Classic scanner probes
  '/.env',
  '/.env.local',
  '/.env.production',
  '/.git/config',
  '/.git/HEAD',
  '/wp-admin',
  '/wp-login.php',
  '/wordpress/wp-login.php',
  '/phpmyadmin',
  '/pma',
  '/adminer',
  '/config.php',
  '/configuration.php',
  '/backup.zip',
  '/backup.sql',
  '/dump.sql',
  '/db.sql',
  '/shell',
  '/shell.php',
  '/cmd',
  '/console',
  '/actuator',
  '/actuator/env',

  // API honeypots
  '/api/secret',
  '/api/credentials',
  '/api/tokens',
  '/api/debug',
  '/api/config',
  '/api/backup',
  '/api/dump',
  '/api/private',
  '/api/export',
  '/api/env',
  '/api/admin/dump',
  '/api/admin/passwords',
  '/api/admin/secrets',
  '/api/users/export',
  '/api/database',
  '/api/keys',
];

module.exports = { responses, paths };

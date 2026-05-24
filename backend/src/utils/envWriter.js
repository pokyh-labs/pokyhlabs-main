const fs   = require('fs');
const path = require('path');

const ALLOWED_KEYS = new Set([
  'CLOUDFLARE_ACCOUNT_ID',
  'CLOUDFLARE_API_TOKEN',
  'CLOUDFLARE_ZONE_ID',
  'CLOUDFLARE_TUNNEL_TOKEN',
]);

function getEnvPath() {
  const root  = path.resolve(__dirname, '../../../.env');
  const local = path.resolve(__dirname, '../../.env');
  return fs.existsSync(root) ? root : local;
}

async function updateEnv(updates) {
  for (const key of Object.keys(updates)) {
    if (!ALLOWED_KEYS.has(key)) {
      const err = new Error(`Key not in whitelist: ${key}`);
      err.status = 400;
      throw err;
    }
    // Basic value sanity: no newlines
    if (/[\r\n]/.test(updates[key])) {
      const err = new Error(`Invalid value for ${key}: newlines not allowed`);
      err.status = 400;
      throw err;
    }
  }

  const envPath = getEnvPath();
  let lines = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8').split('\n') : [];

  const written = new Set();

  lines = lines.map(line => {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (m && Object.prototype.hasOwnProperty.call(updates, m[1])) {
      written.add(m[1]);
      return `${m[1]}=${updates[m[1]]}`;
    }
    return line;
  });

  for (const [key, val] of Object.entries(updates)) {
    if (!written.has(key)) lines.push(`${key}=${val}`);
  }

  const tmpPath = envPath + '.tmp';
  fs.writeFileSync(tmpPath, lines.join('\n'), 'utf8');
  fs.renameSync(tmpPath, envPath);

  for (const [key, val] of Object.entries(updates)) {
    process.env[key] = val;
  }
}

module.exports = { updateEnv };

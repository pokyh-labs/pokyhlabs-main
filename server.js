'use strict';
const http = require('http');
const { parse } = require('url');
const path = require('path');
const fs = require('fs');

// Load .env from project root, falling back to backend/.env
require('dotenv').config({
  path: (() => {
    const root = path.resolve(__dirname, '.env');
    const local = path.resolve(__dirname, 'backend', '.env');
    return fs.existsSync(root) ? root : local;
  })(),
});

const PORT = parseInt(process.env.PORT || '3000', 10);
const HOST = process.env.HOSTNAME || '0.0.0.0';
const dev = process.env.NODE_ENV !== 'production';

async function main() {
  // 1. Initialise database
  const { app: backendApp, initDatabase } = require('./backend/src/app');
  await initDatabase();

  // 2. Auto-resume tunnel if configured (reads ~/.cloudflared/config.yml — reference-repo approach)
  try {
    const tunnelService = require('./backend/src/services/tunnelService');
    if (tunnelService.isTunnelConfigured()) {
      const name = tunnelService.getTunnelNameFromConfig();
      if (name) {
        await tunnelService.startByName(name);
        console.log(`> Cloudflare tunnel '${name}' auto-resumed`);
      }
    }
  } catch (err) {
    console.warn('> Tunnel auto-resume failed (reconfigure in admin panel):', err.message);
  }

  // 3. Prepare Next.js
  const next = require('next');
  const nextApp = next({ dev, hostname: HOST, port: PORT });
  const handle = nextApp.getRequestHandler();
  await nextApp.prepare();

  // Honeypot paths that need routing to the backend (non-/api/ ones like /.env, /wp-admin, …)
  const { paths: honeypotPaths } = require('./backend/src/config/honeypot');

  // 3. Route requests: backend paths → Express, everything else → Next.js
  const server = http.createServer((req, res) => {
    const parsedUrl = parse(req.url || '/', true);
    const pathname = parsedUrl.pathname || '/';

    if (
      pathname.startsWith('/api/') ||
      pathname === '/admin' ||
      pathname.startsWith('/admin/') ||
      pathname.startsWith('/uploads/') ||
      honeypotPaths.includes(pathname)
    ) {
      backendApp(req, res);
    } else {
      handle(req, res, parsedUrl);
    }
  });

  server.listen(PORT, HOST, () => {
    console.log(`> Ready on http://localhost:${PORT} [${dev ? 'development' : 'production'}]`);
  });
}

main().catch(err => {
  console.error('Startup failed:', err);
  process.exit(1);
});

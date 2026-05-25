const { spawn, execFile } = require('child_process');
const { promisify } = require('util');
const execFileAsync = promisify(execFile);
const fs = require('fs');
const path = require('path');
const os = require('os');
const https = require('https');
const logger = require('../utils/logger');

const IS_WINDOWS = process.platform === 'win32';

function assertSafeToken(token) {
  if (!/^[A-Za-z0-9._\-+=]+$/.test(token)) throw new Error('Invalid token format');
}

function assertSafeName(name) {
  if (!/^[A-Za-z0-9\-_]{1,64}$/.test(name)) throw new Error('Invalid name: letters, numbers, hyphens, underscores only');
}

function cfCredPath() {
  const home = process.env.HOME || process.env.USERPROFILE || '';
  return path.join(home, '.cloudflared', 'cert.pem');
}

class TunnelService {
  constructor() {
    this.process = null;
    this.pid = null;
    this.status = 'stopped';
    this._cfPath = null;
    this._loginProcess = null;
  }

  async getPath() {
    if (this._cfPath) return this._cfPath;
    try {
      const finder = IS_WINDOWS ? 'where' : 'which';
      const { stdout } = await execFileAsync(finder, ['cloudflared']);
      // `where` on Windows may return multiple lines — take first
      this._cfPath = stdout.trim().split(/\r?\n/)[0];
      return this._cfPath;
    } catch {
      return null;
    }
  }

  async isInstalled() {
    return !!(await this.getPath());
  }

  async getVersion() {
    const p = await this.getPath();
    if (!p) throw new Error('cloudflared not installed');
    const { stdout } = await execFileAsync(p, ['--version']);
    return stdout.trim();
  }

  async install() {
    const platform = process.platform;
    if (platform === 'linux') {
      const tmpDeb = path.join(os.tmpdir(), 'cloudflared.deb');
      await execFileAsync('sh', ['-c',
        `curl -fsSL https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb -o ${tmpDeb}`,
      ], { timeout: 60000 });
      await execFileAsync('sudo', ['dpkg', '-i', tmpDeb], { timeout: 30000 });
      try { fs.unlinkSync(tmpDeb); } catch {}
    } else if (platform === 'darwin') {
      await execFileAsync('brew', ['install', 'cloudflared'], { timeout: 120000 });
    } else if (platform === 'win32') {
      throw new Error('Auto-install on Windows not supported. Download manually from https://developers.cloudflare.com/cloudflared/ and add to PATH.');
    } else {
      throw new Error(`Auto-install not supported on "${platform}". Install manually: https://developers.cloudflare.com/cloudflared/`);
    }
    this._cfPath = null;
    logger.info('cloudflared installed');
  }

  isAuthenticated() {
    return fs.existsSync(cfCredPath());
  }

  startLogin() {
    return new Promise(async (resolve, reject) => {
      const cfPath = await this.getPath();
      if (!cfPath) return reject(new Error('cloudflared not installed'));

      if (this._loginProcess) {
        this._loginProcess.kill('SIGTERM');
        this._loginProcess = null;
      }

      const proc = spawn(cfPath, ['tunnel', 'login'], {
        stdio: ['ignore', 'pipe', 'pipe'],
      });
      this._loginProcess = proc;

      let resolved = false;
      let output = '';

      const onData = (chunk) => {
        output += chunk.toString();
        const match = output.match(/https:\/\/dash\.cloudflare\.com\/argotunnel\?[^\s\n]+/);
        if (match && !resolved) {
          resolved = true;
          resolve({ url: match[0].trim() });
        }
      };

      proc.stdout.on('data', onData);
      proc.stderr.on('data', onData);

      proc.on('exit', (code) => {
        this._loginProcess = null;
        logger.info(`cloudflared login exited (code=${code})`);
      });

      proc.on('error', (err) => {
        if (!resolved) reject(err);
      });

      setTimeout(() => {
        if (!resolved) reject(new Error('Timeout: no login URL received from cloudflared'));
      }, 25000);
    });
  }

  // CLI-based setup (uses cert.pem auth — no API token needed)
  async createTunnelCLI(name) {
    assertSafeName(name);
    const p = await this.getPath();
    const { stdout, stderr } = await execFileAsync(p, ['tunnel', 'create', name], { timeout: 30000 });
    const all = stdout + stderr;
    const match = all.match(/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/);
    if (!match) throw new Error('Could not parse tunnel ID from cloudflared output');
    return match[1];
  }

  async routeDNS(name, hostname) {
    assertSafeName(name);
    const p = await this.getPath();
    await execFileAsync(p, ['tunnel', 'route', 'dns', '--overwrite-dns', name, hostname], { timeout: 30000 });
  }

  async getTunnelTokenCLI(name) {
    assertSafeName(name);
    const p = await this.getPath();
    const { stdout } = await execFileAsync(p, ['tunnel', 'token', name], { timeout: 15000 });
    return stdout.trim();
  }

  // Start tunnel with token
  async startWithToken(token) {
    assertSafeToken(token);
    if (this.status === 'running') throw new Error('Tunnel already running');
    const p = await this.getPath();
    if (!p) throw new Error('cloudflared not installed');

    this.process = spawn(p, ['tunnel', 'run', '--token', token], {
      detached: false,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    this.pid = this.process.pid;
    this.status = 'running';

    this.process.stdout.on('data', d => logger.info(`[cloudflared] ${d.toString().trim()}`));
    this.process.stderr.on('data', d => logger.warn(`[cloudflared] ${d.toString().trim()}`));
    this.process.on('exit', (code) => {
      logger.info(`cloudflared exited (${code})`);
      this.status = code === 0 ? 'stopped' : 'error';
      this.process = null;
      this.pid = null;
    });

    return { pid: this.pid };
  }

  async stop() {
    if (this.process) {
      // SIGTERM not available on Windows — use taskkill or process.kill
      if (IS_WINDOWS) {
        try { await execFileAsync('taskkill', ['/PID', String(this.process.pid), '/F']); } catch {}
      } else {
        this.process.kill('SIGTERM');
      }
      this.process = null;
      this.pid = null;
      this.status = 'stopped';
    }
  }

  async installService(token) {
    assertSafeToken(token);
    const p = await this.getPath();
    if (!p) throw new Error('cloudflared not installed');
    if (IS_WINDOWS) {
      // On Windows, cloudflared service install doesn't need sudo
      await execFileAsync(p, ['service', 'install', token], { timeout: 30000 });
    } else {
      await execFileAsync('sudo', [p, 'service', 'install', token], { timeout: 30000 });
    }
    logger.info('cloudflared service installed');
  }

  async uninstallService() {
    const p = await this.getPath();
    if (!p) throw new Error('cloudflared not installed');
    if (IS_WINDOWS) {
      await execFileAsync(p, ['service', 'uninstall'], { timeout: 15000 });
    } else {
      await execFileAsync('sudo', [p, 'service', 'uninstall'], { timeout: 15000 });
    }
  }

  getStatus() {
    return {
      status: this.status,
      pid: this.pid,
      running: this.status === 'running',
    };
  }

  // Legacy: API-based setup (for advanced users who prefer API token)
  async cfApi(method, apiPath, body, token) {
    return new Promise((resolve, reject) => {
      const data = body ? JSON.stringify(body) : null;
      const opts = {
        hostname: 'api.cloudflare.com',
        path: `/client/v4${apiPath}`,
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          ...(data && { 'Content-Length': Buffer.byteLength(data) }),
        },
        timeout: 15000,
      };
      const req = https.request(opts, (res) => {
        let raw = '';
        res.on('data', c => raw += c);
        res.on('end', () => {
          try {
            const parsed = JSON.parse(raw);
            if (parsed.success) resolve(parsed.result);
            else reject(new Error(parsed.errors?.[0]?.message || 'Cloudflare API error'));
          } catch { reject(new Error('Invalid CF API response')); }
        });
      });
      req.on('error', reject);
      req.on('timeout', () => { req.destroy(); reject(new Error('CF API timeout')); });
      if (data) req.write(data);
      req.end();
    });
  }
}

module.exports = new TunnelService();

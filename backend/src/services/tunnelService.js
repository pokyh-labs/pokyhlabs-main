const { spawn, execFile } = require('child_process');
const { promisify } = require('util');
const execFileAsync = promisify(execFile);
const fs   = require('fs');
const path = require('path');
const os   = require('os');
const https = require('https');
const http  = require('http');
const logger = require('../utils/logger');

const IS_WINDOWS = process.platform === 'win32';
const IS_DOCKER  = fs.existsSync('/.dockerenv');

// ── Validation helpers ────────────────────────────────────────────────────────

function assertSafeToken(token) {
  if (!/^[A-Za-z0-9._\-+=]+$/.test(token)) throw new Error('Invalid token format');
}
function assertSafeName(name) {
  if (!/^[A-Za-z0-9\-_]{1,64}$/.test(name))
    throw new Error('Invalid name: letters, numbers, hyphens, underscores only');
}

// ── Path helpers ──────────────────────────────────────────────────────────────

/**
 * Writable directory for the cloudflared binary.
 * Priority:
 *   1. CLOUDFLARED_INSTALL_DIR env var
 *   2. ~/.local/bin/
 *   3. /tmp/cloudflared-bin/ (always writable)
 */
function resolveInstallDir() {
  if (process.env.CLOUDFLARED_INSTALL_DIR) {
    fs.mkdirSync(process.env.CLOUDFLARED_INSTALL_DIR, { recursive: true });
    return process.env.CLOUDFLARED_INSTALL_DIR;
  }
  const home = process.env.HOME || process.env.USERPROFILE;
  if (home) {
    const localBin = path.join(home, '.local', 'bin');
    try { fs.mkdirSync(localBin, { recursive: true }); return localBin; } catch {}
  }
  const tmp = path.join(os.tmpdir(), 'cloudflared-bin');
  fs.mkdirSync(tmp, { recursive: true });
  return tmp;
}

/**
 * Download URL for the cloudflared binary.
 * Override via CLOUDFLARED_DOWNLOAD_URL (e.g. internal mirror or pinned version).
 */
function getDownloadUrl() {
  if (process.env.CLOUDFLARED_DOWNLOAD_URL) return process.env.CLOUDFLARED_DOWNLOAD_URL;
  const archMap = { x64: 'amd64', arm64: 'arm64', arm: 'arm' };
  const cfArch  = archMap[process.arch] || 'amd64';
  return `https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-${cfArch}`;
}

// ── Main service class ────────────────────────────────────────────────────────

class TunnelService {
  constructor() {
    this.process       = null;
    this.pid           = null;
    this.status        = 'stopped';
    this._cfPath       = null;
    this._loginProcess = null;
    this._restartTimer = null;
    this._currentName  = null;
  }

  // ── cloudflared directory / config paths ─────────────────────────────────────

  cfDir() {
    const home = process.env.HOME || process.env.USERPROFILE || os.homedir();
    return path.join(home, '.cloudflared');
  }

  cfCredPath() {
    return path.join(this.cfDir(), 'cert.pem');
  }

  cfConfigPath() {
    return path.join(this.cfDir(), 'config.yml');
  }

  // ── Config-file based helpers (1:1 with reference repo) ──────────────────────

  isTunnelConfigured() {
    return fs.existsSync(this.cfConfigPath());
  }

  getTunnelNameFromConfig() {
    try {
      const content = fs.readFileSync(this.cfConfigPath(), 'utf8');
      const m = content.match(/^tunnel:\s*(.+)$/m);
      return m?.[1]?.trim() || null;
    } catch { return null; }
  }

  getHostnameFromConfig() {
    try {
      const content = fs.readFileSync(this.cfConfigPath(), 'utf8');
      const m = content.match(/^\s*-\s+hostname:\s+(.+)$/m);
      return m?.[1]?.trim() || null;
    } catch { return null; }
  }

  getLocalServiceFromConfig() {
    try {
      const content = fs.readFileSync(this.cfConfigPath(), 'utf8');
      const m = content.match(/^\s*service:\s+(https?:\/\/.+)$/m);
      return m?.[1]?.trim() || null;
    } catch { return null; }
  }

  /**
   * Writes ~/.cloudflared/config.yml with proper ingress rules.
   * Nothing is hardcoded — tunnelId, tunnelName, hostname and localService
   * all come from caller (= user input via admin panel).
   */
  writeConfig(tunnelId, tunnelName, hostname, localService) {
    assertSafeName(tunnelName);
    const dir = this.cfDir();
    fs.mkdirSync(dir, { recursive: true });
    const credFile = path.join(dir, `${tunnelId}.json`);
    const content = [
      `tunnel: ${tunnelId}`,
      `credentials-file: ${credFile}`,
      '',
      'ingress:',
      `  - hostname: ${hostname}`,
      `    service: ${localService}`,
      '  - service: http_status:404',
      '',
    ].join('\n');
    fs.writeFileSync(this.cfConfigPath(), content, 'utf8');
    logger.info('cloudflared config.yml written', { tunnelId, tunnelName, hostname, localService });
  }

  // ── Binary path resolution ────────────────────────────────────────────────────

  async getPath() {
    if (process.env.CLOUDFLARED_PATH) {
      if (fs.existsSync(process.env.CLOUDFLARED_PATH)) {
        this._cfPath = process.env.CLOUDFLARED_PATH;
        return this._cfPath;
      }
      logger.warn('CLOUDFLARED_PATH set but binary not found', { path: process.env.CLOUDFLARED_PATH });
    }

    if (this._cfPath && fs.existsSync(this._cfPath)) return this._cfPath;
    this._cfPath = null;

    // System PATH (covers /usr/local/bin/cloudflared baked into Docker image)
    try {
      const finder = IS_WINDOWS ? 'where' : 'which';
      const { stdout } = await execFileAsync(finder, ['cloudflared']);
      this._cfPath = stdout.trim().split(/\r?\n/)[0];
      return this._cfPath;
    } catch {}

    // User install dir
    try {
      const candidate = path.join(resolveInstallDir(), IS_WINDOWS ? 'cloudflared.exe' : 'cloudflared');
      if (fs.existsSync(candidate)) { this._cfPath = candidate; return candidate; }
    } catch {}

    return null;
  }

  async isInstalled() { return !!(await this.getPath()); }

  async getVersion() {
    const p = await this.getPath();
    if (!p) throw new Error('cloudflared not installed');
    const { stdout } = await execFileAsync(p, ['--version']);
    return stdout.trim();
  }

  // ── Auth ──────────────────────────────────────────────────────────────────────

  isAuthenticated() { return fs.existsSync(this.cfCredPath()); }

  // SSE-friendly login: streams log lines + emits 'url' event when auth URL appears
  loginStream(onEvent) {
    return new Promise(async (resolve, reject) => {
      const cfPath = await this.getPath();
      if (!cfPath) return reject(new Error('cloudflared not installed'));

      if (this._loginProcess) { this._loginProcess.kill('SIGTERM'); this._loginProcess = null; }

      const proc = spawn(cfPath, ['tunnel', 'login'], { stdio: ['ignore', 'pipe', 'pipe'] });
      this._loginProcess = proc;

      let output  = '';
      let urlSent = false;

      const onData = chunk => {
        const text = chunk.toString();
        output += text;
        text.split(/\r?\n/).forEach(line => { if (line.trim()) onEvent({ type: 'log', data: line.trim() }); });

        const m = output.match(/https:\/\/dash\.cloudflare\.com\/argotunnel\?[^\s\n]+/);
        if (m && !urlSent) { urlSent = true; onEvent({ type: 'url', data: m[0].trim() }); }
      };

      proc.stdout.on('data', onData);
      proc.stderr.on('data', onData);

      const timer = setTimeout(() => {
        proc.kill('SIGTERM');
        reject(new Error('Login timed out (5 min). Please try again.'));
      }, 5 * 60_000);

      proc.on('exit', code => {
        clearTimeout(timer);
        this._loginProcess = null;
        if (this.isAuthenticated()) resolve();
        else reject(new Error(code === 0 ? 'Login complete but cert.pem not found' : `cloudflared login exited with code ${code}`));
      });

      proc.on('error', err => { clearTimeout(timer); reject(err); });
    });
  }

  startLogin() {
    return new Promise((resolve, reject) => {
      this.loginStream(ev => { if (ev.type === 'url') resolve({ url: ev.data }); }).catch(reject);
    });
  }

  // ── Tunnel operations ─────────────────────────────────────────────────────────

  /**
   * Lists existing tunnels and returns the ID of `name` if found, else null.
   */
  async findTunnel(name) {
    assertSafeName(name);
    const p = await this.getPath();
    try {
      const { stdout, stderr } = await execFileAsync(p, ['tunnel', 'list'], { timeout: 15_000 });
      const lines = (stdout + stderr).split('\n').filter(l => l.includes(name));
      if (lines.length > 0) {
        const m = lines[0].match(/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i);
        if (m) return m[1];
      }
    } catch {}
    return null;
  }

  /**
   * Finds or creates a named tunnel; returns its UUID.
   */
  async findOrCreateTunnel(name) {
    assertSafeName(name);
    const existing = await this.findTunnel(name);
    if (existing) {
      logger.info('Using existing tunnel', { name, id: existing });
      return existing;
    }
    const p = await this.getPath();
    const { stdout, stderr } = await execFileAsync(p, ['tunnel', 'create', name], { timeout: 30_000 });
    const m = (stdout + stderr).match(/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i);
    if (!m) throw new Error('Could not parse tunnel ID from cloudflared output');
    logger.info('Tunnel created', { name, id: m[1] });
    return m[1];
  }

  async routeDNS(name, hostname) {
    assertSafeName(name);
    const p = await this.getPath();
    await execFileAsync(p, ['tunnel', 'route', 'dns', '--overwrite-dns', name, hostname], { timeout: 30_000 });
  }

  async getTunnelTokenCLI(name) {
    assertSafeName(name);
    const p = await this.getPath();
    const { stdout } = await execFileAsync(p, ['tunnel', 'token', name], { timeout: 15_000 });
    return stdout.trim();
  }

  // ── Runtime control ───────────────────────────────────────────────────────────

  /**
   * Start tunnel by NAME using ~/.cloudflared/config.yml (reference-repo approach).
   * Auto-restarts on exit (5 s normal, 10 s on error) — exactly like the reference.
   */
  async startByName(name) {
    if (this.status === 'running') throw new Error('Tunnel already running');

    if (!name) name = this.getTunnelNameFromConfig();
    if (!name) throw new Error('No tunnel name — run setup first');

    const p = await this.getPath();
    if (!p) throw new Error('cloudflared not installed');

    if (this._restartTimer) { clearTimeout(this._restartTimer); this._restartTimer = null; }

    this._currentName = name;

    this.process = spawn(p, ['tunnel', 'run', name], {
      detached: false, stdio: ['ignore', 'pipe', 'pipe'],
    });
    this.pid    = this.process.pid;
    this.status = 'running';

    this.process.stdout.on('data', d => logger.info(`[cloudflared] ${d.toString().trim()}`));
    this.process.stderr.on('data', d => logger.warn(`[cloudflared] ${d.toString().trim()}`));

    this.process.on('close', code => {
      logger.info(`cloudflared exited (${code}). Restarting in 5s...`);
      this.process = null; this.pid = null; this.status = 'stopped';
      this._restartTimer = setTimeout(() => {
        this.startByName(this._currentName).catch(err => {
          logger.error('Tunnel restart failed', { error: err.message });
          this.status = 'error';
        });
      }, 5000);
    });

    this.process.on('error', err => {
      logger.error('[cloudflared] failed to start', { error: err.message });
      this.process = null; this.pid = null; this.status = 'error';
      this._restartTimer = setTimeout(() => {
        this.startByName(this._currentName).catch(e =>
          logger.error('Tunnel restart failed', { error: e.message })
        );
      }, 10000);
    });

    return { pid: this.pid };
  }

  /**
   * Legacy: start via token (kept for backwards compat).
   */
  async startWithToken(token) {
    assertSafeToken(token);
    if (this.status === 'running') throw new Error('Tunnel already running');
    const p = await this.getPath();
    if (!p) throw new Error('cloudflared not installed');

    if (this._restartTimer) { clearTimeout(this._restartTimer); this._restartTimer = null; }

    this.process = spawn(p, ['tunnel', 'run', '--token', token], {
      detached: false, stdio: ['ignore', 'pipe', 'pipe'],
    });
    this.pid    = this.process.pid;
    this.status = 'running';

    this.process.stdout.on('data', d => logger.info(`[cloudflared] ${d.toString().trim()}`));
    this.process.stderr.on('data', d => logger.warn(`[cloudflared] ${d.toString().trim()}`));
    this.process.on('exit', code => {
      logger.info(`cloudflared exited (${code})`);
      this.status = code === 0 ? 'stopped' : 'error';
      this.process = null; this.pid = null;
    });

    return { pid: this.pid };
  }

  async stop() {
    if (this._restartTimer) { clearTimeout(this._restartTimer); this._restartTimer = null; }
    this._currentName = null;
    if (!this.process) { this.status = 'stopped'; return; }
    if (IS_WINDOWS) {
      try { await execFileAsync('taskkill', ['/PID', String(this.process.pid), '/F']); } catch {}
    } else {
      this.process.kill('SIGTERM');
    }
    this.process = null; this.pid = null; this.status = 'stopped';
  }

  async installService(token) {
    assertSafeToken(token);
    const p = await this.getPath();
    if (!p) throw new Error('cloudflared not installed');
    if (IS_WINDOWS) await execFileAsync(p, ['service', 'install', token], { timeout: 30_000 });
    else            await execFileAsync('sudo', [p, 'service', 'install', token], { timeout: 30_000 });
    logger.info('cloudflared service installed');
  }

  async uninstallService() {
    const p = await this.getPath();
    if (!p) throw new Error('cloudflared not installed');
    if (IS_WINDOWS) await execFileAsync(p, ['service', 'uninstall'], { timeout: 15_000 });
    else            await execFileAsync('sudo', [p, 'service', 'uninstall'], { timeout: 15_000 });
  }

  getStatus() {
    return {
      status:   this.status,
      pid:      this.pid,
      running:  this.status === 'running',
      isDocker: IS_DOCKER,
      configured:    this.isTunnelConfigured(),
      configHostname: this.getHostnameFromConfig(),
    };
  }

  // ── Download helper ───────────────────────────────────────────────────────────

  _downloadFile(url, dest, onProgress) {
    return new Promise((resolve, reject) => {
      const follow = (u, hops) => {
        if (hops > 10) return reject(new Error('Too many redirects while downloading cloudflared'));
        const lib = u.startsWith('https') ? https : http;
        const req = lib.get(u, { timeout: 90_000 }, (res) => {
          if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
            res.resume();
            return follow(res.headers.location, hops + 1);
          }
          if (res.statusCode !== 200) {
            res.resume();
            return reject(new Error(`HTTP ${res.statusCode} while downloading cloudflared`));
          }
          const file = fs.createWriteStream(dest);
          let bytes = 0;
          res.on('data', chunk => { bytes += chunk.length; onProgress?.(bytes); });
          res.pipe(file);
          file.on('finish', () => file.close(resolve));
          file.on('error', err => { try { fs.unlinkSync(dest); } catch {} reject(err); });
        });
        req.on('error', reject);
        req.on('timeout', () => { req.destroy(); reject(new Error('cloudflared download timed out')); });
      };
      follow(url, 0);
    });
  }

  async installStream(onLog) {
    const existing = await this.getPath();
    if (existing) {
      const ver = await this.getVersion().catch(() => null);
      onLog(`✓ cloudflared already installed${ver ? `: ${ver}` : ''}`);
      onLog(`  Path: ${existing}`);
      return;
    }

    const platform = process.platform;

    if (platform === 'darwin') {
      onLog('Platform: macOS — installing via Homebrew…');
      await this._spawnStream('brew', ['install', 'cloudflare/cloudflare/cloudflared'], onLog, { timeout: 120_000 });
      this._cfPath = null;

    } else if (platform === 'linux') {
      const url  = getDownloadUrl();
      const dir  = resolveInstallDir();
      const dest = path.join(dir, 'cloudflared');

      onLog(`Downloading cloudflared (${process.arch})…`);
      onLog(`  Source : ${url}`);
      onLog(`  Target : ${dest}`);

      let prevMb = 0;
      await this._downloadFile(url, dest, (bytes) => {
        const mb = Math.floor(bytes / 1_048_576);
        if (mb > prevMb) { prevMb = mb; onLog(`  ${mb} MB…`); }
      });

      fs.chmodSync(dest, 0o755);
      this._cfPath = dest;
      onLog('  Saved and made executable.');

    } else if (platform === 'win32') {
      throw new Error(
        'Auto-install not supported on Windows. ' +
        'Download cloudflared from https://developers.cloudflare.com/cloudflared/ and add it to PATH.'
      );
    } else {
      throw new Error(`Auto-install not supported on platform "${platform}".`);
    }

    const ver = await this.getVersion().catch(() => null);
    onLog(`✓ ${ver || 'cloudflared ready'}`);
  }

  _spawnStream(cmd, args, onLog, opts = {}) {
    return new Promise((resolve, reject) => {
      const proc = spawn(cmd, args, { stdio: ['ignore', 'pipe', 'pipe'], timeout: opts.timeout });
      const relay = d => d.toString().split(/\r?\n/).forEach(l => l.trim() && onLog(l));
      proc.stdout.on('data', relay);
      proc.stderr.on('data', relay);
      proc.on('error', reject);
      proc.on('exit', code => code === 0 ? resolve() : reject(new Error(`${cmd} exited with code ${code}`)));
    });
  }

  // ── Legacy Cloudflare API helper ──────────────────────────────────────────────

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
        timeout: 15_000,
      };
      const req = https.request(opts, res => {
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

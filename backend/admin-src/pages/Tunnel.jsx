import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useApi } from '../hooks/useApi';
import { toast } from '../hooks/useToast';

// ── Small helpers ──────────────────────────────────────────

function StepHeader({ number, title, subtitle, done, active }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', marginBottom: '1.25rem' }}>
      <div style={{
        width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: done ? 'var(--success-bg)' : active ? 'var(--accent-dim)' : 'rgba(12,12,12,0.05)',
        border: `1px solid ${done ? 'var(--success-border)' : active ? 'rgba(89,61,248,0.30)' : 'var(--border)'}`,
        color: done ? 'var(--success)' : active ? 'var(--accent)' : 'var(--text3)',
        fontSize: done ? '0.9rem' : '0.82rem',
        fontWeight: 600,
        transition: 'all 0.2s',
      }}>
        {done ? <i className="bi bi-check-lg" /> : number}
      </div>
      <div>
        <div style={{ color: active || done ? 'var(--text)' : 'var(--text3)', fontWeight: 600, fontSize: '0.9rem' }}>
          {title}
        </div>
        {subtitle && (
          <div style={{ color: 'var(--text3)', fontSize: '0.78rem', marginTop: 2 }}>{subtitle}</div>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ ok, label }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
      padding: '0.2rem 0.625rem', borderRadius: 99,
      fontSize: '0.78rem', fontWeight: 600,
      background: ok ? 'var(--success-bg)' : 'rgba(107,114,128,0.08)',
      border: `1px solid ${ok ? 'var(--success-border)' : 'rgba(107,114,128,0.2)'}`,
      color: ok ? 'var(--success)' : 'var(--text3)',
    }}>
      <i className={`bi bi-${ok ? 'check-circle-fill' : 'circle'}`} style={{ fontSize: '0.6rem' }} />
      {label}
    </span>
  );
}

function InfoRow({ icon, label, value, mono, link }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.625rem 0', borderBottom: '1px solid var(--border2)' }}>
      <i className={`bi bi-${icon}`} style={{ color: 'var(--text3)', width: 16, textAlign: 'center', flexShrink: 0 }} />
      <span style={{ color: 'var(--text3)', fontSize: '0.8rem', minWidth: 120, flexShrink: 0 }}>{label}</span>
      {link
        ? <a href={value} target="_blank" rel="noreferrer" style={{ color: 'var(--accent)', fontSize: '0.85rem', fontFamily: mono ? 'monospace' : 'inherit' }}>{value}</a>
        : <span style={{ color: 'var(--text2)', fontSize: '0.85rem', fontFamily: mono ? 'monospace' : 'inherit' }}>{value}</span>
      }
    </div>
  );
}

// ── Main component ─────────────────────────────────────────

export default function Tunnel() {
  const { request } = useApi();

  const [status, setStatus] = useState(null);
  const [busyStep, setBusyStep] = useState('');
  const [error, setError] = useState('');

  // Login step state
  const [loginUrl, setLoginUrl] = useState('');
  const [loginPolling, setLoginPolling] = useState(false);
  const loginPollRef = useRef(null);

  // Setup form
  const [form, setForm] = useState({ tunnel_name: '', hostname: '', local_service: '' });
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Reconfigure mode
  const [reconfiguring, setReconfiguring] = useState(false);

  const load = useCallback(async () => {
    try {
      const s = await request('/tunnel/status');
      setStatus(s);
      // Pre-fill local_service from server default
      if (!form.local_service && s.localService) {
        setForm(f => ({ ...f, local_service: f.local_service || s.localService }));
      }
    } catch {}
  }, [request]);

  useEffect(() => { load(); }, [load]);

  // Poll login status
  useEffect(() => {
    if (!loginPolling) { clearInterval(loginPollRef.current); return; }
    loginPollRef.current = setInterval(async () => {
      try {
        const s = await request('/tunnel/login/status');
        if (s.authenticated) {
          setLoginPolling(false);
          setLoginUrl('');
          toast('Mit Cloudflare verbunden!');
          load();
        }
      } catch {}
    }, 2500);
    return () => clearInterval(loginPollRef.current);
  }, [loginPolling, request, load]);

  async function doAction(step, fn, successMsg) {
    setBusyStep(step); setError('');
    try {
      await fn();
      if (successMsg) toast(successMsg);
      await load();
    } catch (err) {
      setError(err.message);
      toast(err.message, 'error');
    } finally {
      setBusyStep('');
    }
  }

  async function handleInstall() {
    doAction('install', () => request('/tunnel/install', { method: 'POST' }), 'cloudflared installiert!');
  }

  async function handleLogin() {
    setBusyStep('login'); setError('');
    try {
      const { url } = await request('/tunnel/login', { method: 'POST' });
      setLoginUrl(url);
      setLoginPolling(true);
      // Try to open in new tab
      window.open(url, '_blank', 'noopener');
    } catch (err) {
      setError(err.message);
      toast(err.message, 'error');
    } finally {
      setBusyStep('');
    }
  }

  async function handleSetup(e) {
    e.preventDefault();
    setBusyStep('setup'); setError('');
    try {
      await request('/tunnel/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      toast('Tunnel erstellt!');
      setReconfiguring(false);
      await load();
    } catch (err) {
      setError(err.message);
      toast(err.message, 'error');
    } finally {
      setBusyStep('');
    }
  }

  async function handleReconfigure() {
    if (!confirm('Aktuelle Tunnel-Konfiguration löschen?')) return;
    doAction('reconfigure',
      () => request('/tunnel/reconfigure', { method: 'POST' }),
      'Konfiguration zurückgesetzt',
    );
    setReconfiguring(true);
  }

  function set(k, v) { setForm(f => ({ ...f, [k]: v })); }

  if (!status) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4rem' }}>
        <span className="spinner" style={{ width: 20, height: 20 }} />
      </div>
    );
  }

  const installed    = status.installed;
  const authed       = status.authenticated;
  const hasTunnel    = !!status.config?.tunnel_id && !reconfiguring;
  const isRunning    = status.status === 'running';
  const hostname     = status.config?.hostname || '';
  const svcInstalled = status.config?.service_installed;

  // Derived URLs — never hardcoded
  const publicBase = hostname ? `https://${hostname}` : null;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 style={{ color: 'var(--text)', fontSize: '1.4rem', fontWeight: 600, letterSpacing: '-0.02em' }}>
            Cloudflare Tunnel
          </h2>
          <p style={{ color: 'var(--text3)', fontSize: '0.82rem', marginTop: 4 }}>
            Server über Cloudflare öffentlich erreichbar machen
          </p>
        </div>
        <button className="btn-outline btn-sm" onClick={load} title="Aktualisieren">
          <i className="bi bi-arrow-clockwise" />Aktualisieren
        </button>
      </div>

      {error && (
        <div className="alert alert-error mb-4">
          <i className="bi bi-exclamation-circle" />{error}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem', maxWidth: 600 }}>

        {/* ── Step 1: Install ──────────────────────────────── */}
        <div className="card">
          <StepHeader
            number="1"
            title="cloudflared installieren"
            subtitle={installed ? `Installiert und bereit${status.version ? ` · ${status.version}` : ''}` : 'Wird für den Tunnel benötigt'}
            done={installed}
            active={!installed}
          />
          {!installed && (
            <button className="btn-primary btn-sm" onClick={handleInstall} disabled={busyStep === 'install'}
              style={{ marginLeft: 48 }}>
              {busyStep === 'install' ? <span className="spinner" /> : <i className="bi bi-download" />}
              {busyStep === 'install' ? 'Installieren…' : 'cloudflared installieren'}
            </button>
          )}
        </div>

        {/* ── Step 2: Authenticate ─────────────────────────── */}
        <div className="card" style={{ opacity: installed ? 1 : 0.45, pointerEvents: installed ? 'auto' : 'none' }}>
          <StepHeader
            number="2"
            title="Mit Cloudflare verbinden"
            subtitle={authed ? 'Bereits mit deinem Cloudflare-Account verbunden.' : 'Öffnet den Browser zur Autorisierung'}
            done={authed}
            active={installed && !authed}
          />
          {!authed && !loginUrl && (
            <button className="btn-primary btn-sm" onClick={handleLogin} disabled={busyStep === 'login' || !installed}
              style={{ marginLeft: 48 }}>
              {busyStep === 'login' ? <span className="spinner" /> : <i className="bi bi-box-arrow-up-right" />}
              {busyStep === 'login' ? 'Starte Autorisierung…' : 'Mit Cloudflare verbinden'}
            </button>
          )}
          {loginUrl && (
            <div style={{ marginLeft: 48 }}>
              <p style={{ color: 'var(--text3)', fontSize: '0.82rem', marginBottom: '0.75rem' }}>
                <span className="spinner" style={{ marginRight: 6 }} />
                Warte auf Autorisierung im Browser…
              </p>
              <div style={{
                background: 'var(--bg3)', border: '1px solid var(--border)',
                borderRadius: 8, padding: '0.625rem 0.875rem',
                fontSize: '0.78rem', color: 'var(--text2)', wordBreak: 'break-all',
                marginBottom: '0.625rem',
              }}>
                {loginUrl}
              </div>
              <a href={loginUrl} target="_blank" rel="noreferrer" className="btn-outline btn-sm"
                style={{ display: 'inline-flex' }}>
                <i className="bi bi-box-arrow-up-right" />Browser öffnen
              </a>
            </div>
          )}
        </div>

        {/* ── Step 3: Configure tunnel ─────────────────────── */}
        <div className="card" style={{ opacity: authed ? 1 : 0.45, pointerEvents: authed ? 'auto' : 'none' }}>
          <StepHeader
            number="3"
            title="Tunnel konfigurieren"
            subtitle={hasTunnel ? `Tunnel aktiv: ${hostname}` : 'Hostname und Namen festlegen'}
            done={hasTunnel}
            active={authed && !hasTunnel}
          />

          {hasTunnel ? (
            <div style={{ marginLeft: 48 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                <StatusBadge ok={isRunning} label={isRunning ? 'Läuft' : 'Gestoppt'} />
                {svcInstalled && <StatusBadge ok label="Auto-Start" />}
                <div style={{ display: 'flex', gap: '0.5rem', marginLeft: 'auto' }}>
                  {!isRunning ? (
                    <button className="btn-primary btn-sm"
                      onClick={() => doAction('start', () => request('/tunnel/start', { method: 'POST' }), 'Tunnel gestartet!')}
                      disabled={!!busyStep}>
                      {busyStep === 'start' ? <span className="spinner" /> : <i className="bi bi-play-fill" />}Starten
                    </button>
                  ) : (
                    <button className="btn-outline btn-sm"
                      onClick={() => doAction('stop', () => request('/tunnel/stop', { method: 'POST' }), 'Tunnel gestoppt')}
                      disabled={!!busyStep}>
                      {busyStep === 'stop' ? <span className="spinner" /> : <i className="bi bi-stop-fill" />}Stoppen
                    </button>
                  )}
                  {!svcInstalled && (
                    <button className="btn-outline btn-sm"
                      onClick={() => {
                        if (confirm('Als Systemdienst installieren? Startet automatisch beim Reboot.'))
                          doAction('svc', () => request('/tunnel/service/install', { method: 'POST' }), 'Auto-Start aktiviert!');
                      }}
                      disabled={!!busyStep} title="Auto-Start beim Reboot">
                      <i className="bi bi-gear" />Auto-Start
                    </button>
                  )}
                </div>
              </div>
              <button className="btn-outline btn-sm" onClick={handleReconfigure} disabled={!!busyStep}
                style={{ color: 'var(--text3)' }}>
                <i className="bi bi-arrow-repeat" />Neu konfigurieren
              </button>
            </div>
          ) : (
            <form onSubmit={handleSetup} style={{ marginLeft: 48, display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Tunnel Name</label>
                <input value={form.tunnel_name} onChange={e => set('tunnel_name', e.target.value)}
                  placeholder="mein-tunnel" pattern="[A-Za-z0-9\-_]+" required />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Hostname (öffentliche Domain)</label>
                <input value={form.hostname} onChange={e => set('hostname', e.target.value)}
                  placeholder="api.meinedomain.de" required />
                <p style={{ color: 'var(--text3)', fontSize: '0.75rem', marginTop: '0.3rem' }}>
                  DNS wird automatisch konfiguriert
                </p>
              </div>
              <div>
                <button type="button" className="btn-outline btn-sm" onClick={() => setShowAdvanced(v => !v)}
                  style={{ color: 'var(--text3)', marginBottom: showAdvanced ? '0.75rem' : 0 }}>
                  <i className={`bi bi-chevron-${showAdvanced ? 'up' : 'down'}`} />
                  Lokalen Service ändern
                </button>
                {showAdvanced && (
                  <div className="form-group" style={{ marginBottom: 0, marginTop: '0.5rem' }}>
                    <label className="form-label">Lokaler Service URL</label>
                    <input type="url" value={form.local_service} onChange={e => set('local_service', e.target.value)}
                      placeholder="http://localhost:3001" required />
                  </div>
                )}
              </div>
              <button type="submit" className="btn-primary btn-sm" disabled={busyStep === 'setup'} style={{ alignSelf: 'flex-start' }}>
                {busyStep === 'setup' ? <span className="spinner" /> : <i className="bi bi-cloud-arrow-up" />}
                {busyStep === 'setup' ? 'Erstellen…' : 'Tunnel erstellen'}
              </button>
            </form>
          )}
        </div>

        {/* ── Step 4: Server Info ───────────────────────────── */}
        {hasTunnel && publicBase && (
          <div className="card">
            <StepHeader number="4" title="Server Info" done active />
            <div style={{ marginLeft: 48 }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <InfoRow icon="link-45deg"    label="API URL"           value={`${publicBase}/api`}    mono link />
                <InfoRow icon="grid-1x2"      label="Admin Dashboard"   value={`${publicBase}/admin`}  mono link />
                <InfoRow icon="shield-check"  label="Rate Limiting"     value="Aktiv" />
                <div style={{ borderBottom: 'none' }}>
                  <InfoRow icon="lock"          label="Security Headers"  value="Aktiv (Helmet)" />
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

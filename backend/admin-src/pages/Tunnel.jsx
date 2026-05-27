import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useApi, getAccessToken } from '../hooks/useApi';
import { toast } from '../hooks/useToast';

// ── Shared helpers ─────────────────────────────────────────────────────────────

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

function StepHeader({ number, title, subtitle, done, active }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', marginBottom: '1.25rem' }}>
      <div style={{
        width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: done ? 'var(--success-bg)' : active ? 'var(--accent-dim)' : 'rgba(12,12,12,0.05)',
        border: `1px solid ${done ? 'var(--success-border)' : active ? 'rgba(89,61,248,0.30)' : 'var(--border)'}`,
        color: done ? 'var(--success)' : active ? 'var(--accent)' : 'var(--text3)',
        fontSize: done ? '0.9rem' : '0.82rem', fontWeight: 600, transition: 'all 0.2s',
      }}>
        {done ? <i className="bi bi-check-lg" /> : number}
      </div>
      <div>
        <div style={{ color: active || done ? 'var(--text)' : 'var(--text3)', fontWeight: 600, fontSize: '0.9rem' }}>{title}</div>
        {subtitle && <div style={{ color: 'var(--text3)', fontSize: '0.78rem', marginTop: 2 }}>{subtitle}</div>}
      </div>
    </div>
  );
}

// ── Terminal output component ──────────────────────────────────────────────────

function Terminal({ lines, loading }) {
  const bottomRef = useRef(null);
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [lines]);

  if (!lines.length && !loading) return null;

  return (
    <div style={{
      background: '#0d1117', borderRadius: 8, padding: '0.75rem 1rem',
      fontFamily: 'ui-monospace, "Cascadia Code", Consolas, monospace',
      fontSize: '0.78rem', lineHeight: 1.6, color: '#c9d1d9',
      maxHeight: 220, overflowY: 'auto',
      border: '1px solid rgba(255,255,255,0.06)',
      marginTop: '0.75rem',
    }}>
      {lines.map((l, i) => (
        <div key={i} style={{
          color: l.startsWith('✓') ? '#3fb950'
               : l.startsWith('error') || l.toLowerCase().includes('error') || l.toLowerCase().includes('failed') ? '#f85149'
               : '#c9d1d9',
        }}>{l}</div>
      ))}
      {loading && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#8b949e', marginTop: 2 }}>
          <span className="spinner" style={{ width: 10, height: 10, borderWidth: 1.5 }} />
          <span>Warte auf Ausgabe…</span>
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  );
}

// ── SSE stream hook ────────────────────────────────────────────────────────────

function useStream(url, { onDone, onError, enabled = true } = {}) {
  const [lines, setLines]   = useState([]);
  const [active, setActive] = useState(false);
  const esRef = useRef(null);

  const start = useCallback(() => {
    if (esRef.current) { esRef.current.close(); esRef.current = null; }
    setLines([]);
    setActive(true);

    const fullUrl = `${url}?token=${encodeURIComponent(getAccessToken() || '')}`;
    const es = new EventSource(fullUrl);
    esRef.current = es;

    es.onmessage = (e) => {
      try {
        const { type, data } = JSON.parse(e.data);
        if (type === 'log')   setLines(prev => [...prev, data]);
        if (type === 'url')   { setLines(prev => [...prev, `URL: ${data}`]); onDone?.({ url: data }); }
        if (type === 'done')  { setActive(false); es.close(); onDone?.({}); }
        if (type === 'error') { setActive(false); es.close(); onError?.(data); }
      } catch {}
    };

    es.onerror = () => {
      setActive(false);
      es.close();
      esRef.current = null;
      onError?.('Verbindung unterbrochen');
    };
  }, [url, onDone, onError]);

  const cancel = useCallback(() => {
    if (esRef.current) { esRef.current.close(); esRef.current = null; }
    setActive(false);
  }, []);

  useEffect(() => () => esRef.current?.close(), []);

  return { lines, active, start, cancel };
}

// ── Tabs ───────────────────────────────────────────────────────────────────────

const TABS = [
  { id: 'tunnel',     label: 'Tunnel Setup', icon: 'bi-diagram-3-fill' },
  { id: 'cloudflare', label: 'Cloudflare',   icon: 'bi-cloud-fill' },
];

function TabBar({ active, onChange }) {
  return (
    <div style={{
      display: 'flex', gap: 2, padding: 4,
      background: 'var(--bg3)', borderRadius: 12, border: '1px solid var(--border)',
      marginBottom: '1.5rem', width: 'fit-content',
    }}>
      {TABS.map(t => (
        <button key={t.id} onClick={() => onChange(t.id)} style={{
          display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px',
          borderRadius: 9, border: 'none', cursor: 'pointer',
          background: active === t.id ? 'var(--bg2)' : 'transparent',
          color: active === t.id ? 'var(--text)' : 'var(--text3)',
          fontWeight: active === t.id ? 600 : 400, fontSize: '0.8rem',
          boxShadow: active === t.id ? 'var(--shadow)' : 'none', transition: 'all 150ms',
        }}>
          <i className={`bi ${t.icon}`} style={{ fontSize: '0.78rem' }} />
          {t.label}
        </button>
      ))}
    </div>
  );
}

// ── Cloudflare tab ─────────────────────────────────────────────────────────────

function fmtBytes(bytes) {
  if (!bytes) return '0 B';
  const u = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${u[i]}`;
}

function AnalyticCard({ label, value, icon, color }) {
  return (
    <div className="card stat-card" style={{ padding: '1rem 1.125rem', display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
      <div style={{
        width: 40, height: 40, borderRadius: 11, flexShrink: 0,
        background: `${color}14`, border: `1px solid ${color}22`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', color,
      }}>
        <i className={`bi bi-${icon}`} style={{ fontSize: '0.95rem' }} />
      </div>
      <div>
        <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.05em', lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: '0.73rem', color: 'var(--text3)', marginTop: 3, fontWeight: 500 }}>{label}</div>
      </div>
    </div>
  );
}

function CloudflarePanel() {
  const { request } = useApi();
  const [cfConfig,  setCfConfig]  = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [tunnelData, setTunnelData] = useState(null);
  const [form,      setForm]      = useState({});
  const [showTokens,  setShowTokens]  = useState(false);
  const [saving,    setSaving]    = useState(false);
  const [purging,   setPurging]   = useState(false);
  const [cfError,   setCfError]   = useState('');
  const [showPurgeConfirm, setShowPurgeConfirm] = useState(false);

  const loadAll = useCallback(async () => {
    setCfError('');
    try {
      const cfg = await request('/cloudflare/config');
      setCfConfig(cfg);
      setForm({
        CLOUDFLARE_ACCOUNT_ID:   cfg.accountId   || '',
        CLOUDFLARE_API_TOKEN:    cfg.apiToken     || '',
        CLOUDFLARE_ZONE_ID:      cfg.zoneId       || '',
        CLOUDFLARE_TUNNEL_TOKEN: cfg.tunnelToken  || '',
      });
    } catch (err) { setCfError(err.message); }
    request('/cloudflare/analytics').then(setAnalytics).catch(() => {});
    request('/cloudflare/tunnel').then(setTunnelData).catch(() => {});
  }, [request]);

  useEffect(() => { loadAll(); }, [loadAll]);
  useEffect(() => {
    const id = setInterval(() => {
      request('/cloudflare/analytics').then(setAnalytics).catch(() => {});
      request('/cloudflare/tunnel').then(setTunnelData).catch(() => {});
    }, 60_000);
    return () => clearInterval(id);
  }, [request]);

  async function handleSave(e) {
    e.preventDefault(); setSaving(true); setCfError('');
    try {
      await request('/cloudflare/config', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      toast('Cloudflare-Konfiguration gespeichert');
      await loadAll();
    } catch (err) { setCfError(err.message); toast(err.message, 'error'); }
    finally { setSaving(false); }
  }

  async function handlePurge() {
    setShowPurgeConfirm(false); setPurging(true); setCfError('');
    try { await request('/cloudflare/purge', { method: 'POST' }); toast('Cache erfolgreich geleert'); }
    catch (err) { setCfError(err.message); toast(err.message, 'error'); }
    finally { setPurging(false); }
  }

  function setF(k, v) { setForm(f => ({ ...f, [k]: v })); }
  const tunnels = tunnelData?.tunnels || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
      {cfError && <div className="alert alert-error"><i className="bi bi-exclamation-circle" />{cfError}</div>}

      <form onSubmit={handleSave} className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <i className="bi bi-gear-fill" style={{ color: 'var(--accent)', fontSize: '0.9rem' }} />
            <h3 style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text)' }}>API-Konfiguration</h3>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button type="button" className="btn-outline btn-sm" onClick={() => setShowTokens(v => !v)}>
              <i className={`bi bi-eye${showTokens ? '-slash' : ''}`} />{showTokens ? 'Verbergen' : 'Anzeigen'}
            </button>
            <button type="submit" className="btn-primary btn-sm" disabled={saving}>
              {saving ? <span className="spinner" /> : <i className="bi bi-floppy2-fill" />}
              {saving ? 'Speichern…' : 'Speichern'}
            </button>
          </div>
        </div>
        <div className="grid-2" style={{ gap: '0.875rem' }}>
          {[
            { key: 'CLOUDFLARE_ACCOUNT_ID', label: 'Account ID', ph: 'Account-ID eingeben', pwd: false },
            { key: 'CLOUDFLARE_ZONE_ID',    label: 'Zone ID',    ph: 'Zone-ID eingeben',    pwd: false },
            { key: 'CLOUDFLARE_API_TOKEN',  label: 'API Token',  ph: 'Leer lassen um nicht zu ändern', pwd: true },
            { key: 'CLOUDFLARE_TUNNEL_TOKEN', label: 'Tunnel Token', ph: 'Leer lassen um nicht zu ändern', pwd: true },
          ].map(({ key, label, ph, pwd }) => (
            <div key={key} className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">{label}</label>
              <input
                type={pwd && !showTokens ? 'password' : 'text'}
                value={form[key] || ''}
                onChange={e => setF(key, e.target.value)}
                placeholder={ph}
                style={{ fontFamily: 'ui-monospace, monospace', fontSize: '0.82rem' }}
              />
            </div>
          ))}
        </div>
        <p style={{ color: 'var(--text3)', fontSize: '0.72rem', marginTop: '0.875rem' }}>
          <i className="bi bi-lock-fill" style={{ marginRight: 4 }} />
          Tokens werden serverseitig gespeichert und nie im Browser angezeigt.
        </p>
      </form>

      <div className="grid-2" style={{ gap: '0.875rem' }}>
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <i className="bi bi-wifi" style={{ color: 'var(--accent)', fontSize: '0.9rem' }} />
            <h3 style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text)' }}>Status</h3>
          </div>
          <StatusBadge ok={cfConfig?.configured} label={cfConfig?.configured ? 'Konfiguriert' : 'Nicht konfiguriert'} />
          {tunnels.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 4 }}>
              {tunnels.map(t => (
                <div key={t.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text2)', fontWeight: 500 }}>{t.name}</span>
                  <StatusBadge ok={t.status === 'healthy'} label={t.status === 'healthy' ? 'Aktiv' : t.status} />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <i className="bi bi-arrow-clockwise" style={{ color: 'var(--accent)', fontSize: '0.9rem' }} />
            <h3 style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text)' }}>Cache</h3>
          </div>
          <p style={{ fontSize: '0.78rem', color: 'var(--text3)', lineHeight: 1.5 }}>
            Löscht den gesamten Cloudflare-Cache für die Zone sofort.
          </p>
          {showPurgeConfirm ? (
            <div style={{ display: 'flex', gap: 6 }}>
              <button className="btn-primary btn-sm" onClick={handlePurge} disabled={purging}
                style={{ background: '#e5383b', border: 'none' }}>
                {purging ? <span className="spinner" /> : <i className="bi bi-trash3-fill" />}Jetzt leeren
              </button>
              <button className="btn-outline btn-sm" onClick={() => setShowPurgeConfirm(false)}>Abbrechen</button>
            </div>
          ) : (
            <button className="btn-outline btn-sm" onClick={() => setShowPurgeConfirm(true)}
              disabled={!cfConfig?.configured || purging}
              style={{ borderColor: 'rgba(229,56,59,0.25)', color: '#e5383b', alignSelf: 'flex-start' }}>
              <i className="bi bi-trash3" />Cache leeren
            </button>
          )}
        </div>
      </div>

      {analytics && (
        <div>
          <p style={{ fontWeight: 600, fontSize: '0.8rem', color: 'var(--text)', marginBottom: '0.75rem' }}>
            <i className="bi bi-graph-up" style={{ color: 'var(--accent)', marginRight: 6 }} />
            Analytics (letzte 24h)
          </p>
          <div className="grid-3" style={{ gap: '0.875rem' }}>
            <AnalyticCard label="Anfragen"   value={analytics.requests?.toLocaleString()}  icon="arrow-left-right"   color="#593df8" />
            <AnalyticCard label="Bandbreite" value={fmtBytes(analytics.bandwidth)}          icon="hdd-network"        color="#28a745" />
            <AnalyticCard label="Bedrohungen" value={analytics.threats?.toLocaleString()}   icon="shield-exclamation" color="#e5383b" />
          </div>
        </div>
      )}
    </div>
  );
}

// ── Tunnel Setup tab ───────────────────────────────────────────────────────────

function TunnelSetup() {
  const { request } = useApi();

  const [status,       setStatus]       = useState(null);
  const [busyStep,     setBusyStep]     = useState('');
  const [error,        setError]        = useState('');
  const [loginUrl,     setLoginUrl]     = useState('');
  const [form,         setForm]         = useState({ tunnel_name: '', hostname: '', local_service: '' });
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [reconfiguring, setReconfiguring] = useState(false);

  const load = useCallback(async () => {
    try {
      const s = await request('/tunnel/status');
      setStatus(s);
      setForm(f => ({ ...f, local_service: f.local_service || s.localService || '' }));
    } catch {}
  }, [request]);

  useEffect(() => { load(); }, [load]);

  // ── Install stream ──
  const installStream = useStream('/api/tunnel/install/stream', {
    onDone:  () => { toast('cloudflared installiert!'); load(); },
    onError: (msg) => { setError(msg); toast(msg, 'error'); },
  });

  // ── Login stream ──
  const [loginPolling, setLoginPolling] = useState(false);
  const loginPollRef = useRef(null);

  const loginStream = useStream('/api/tunnel/login/stream', {
    onDone: (ev) => {
      if (ev.url) {
        // URL received — open browser, start polling
        setLoginUrl(ev.url);
        setLoginPolling(true);
        window.open(ev.url, '_blank', 'noopener');
      } else {
        // Authentication confirmed
        setLoginPolling(false);
        setLoginUrl('');
        toast('Mit Cloudflare verbunden!');
        load();
      }
    },
    onError: (msg) => { setLoginPolling(false); setError(msg); toast(msg, 'error'); },
  });

  // Poll auth status while waiting for user to click the Cloudflare link
  useEffect(() => {
    if (!loginPolling) { clearInterval(loginPollRef.current); return; }
    loginPollRef.current = setInterval(async () => {
      try {
        const s = await request('/tunnel/login/status');
        if (s.authenticated) {
          setLoginPolling(false);
          setLoginUrl('');
          loginStream.cancel();
          toast('Mit Cloudflare verbunden!');
          load();
        }
      } catch {}
    }, 2500);
    return () => clearInterval(loginPollRef.current);
  }, [loginPolling, request, load, loginStream]);

  async function doAction(step, fn, msg) {
    setBusyStep(step); setError('');
    try { await fn(); if (msg) toast(msg); await load(); }
    catch (err) { setError(err.message); toast(err.message, 'error'); }
    finally { setBusyStep(''); }
  }

  async function handleSetup(e) {
    e.preventDefault(); setBusyStep('setup'); setError('');
    try {
      await request('/tunnel/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      toast('Tunnel erstellt!'); setReconfiguring(false); await load();
    } catch (err) { setError(err.message); toast(err.message, 'error'); }
    finally { setBusyStep(''); }
  }

  async function handleReconfigure() {
    if (!confirm('Aktuelle Tunnel-Konfiguration löschen?')) return;
    doAction('reconfigure', () => request('/tunnel/reconfigure', { method: 'POST' }), 'Konfiguration zurückgesetzt');
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
  const isFatal      = !!status.fatalError;
  const hasTunnel    = !!status.config?.tunnel_id && !reconfiguring && !isFatal;
  const isRunning    = status.status === 'running';
  const hostname     = status.config?.hostname || '';
  const svcInstalled = status.config?.service_installed;
  const publicBase   = hostname ? `https://${hostname}` : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem', maxWidth: 620 }}>
      {error && (
        <div className="alert alert-error" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <span><i className="bi bi-exclamation-circle" style={{ marginRight: 6 }} />{error}</span>
          <button onClick={() => setError('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', fontSize: '0.9rem', padding: 0, lineHeight: 1 }}>
            <i className="bi bi-x-lg" />
          </button>
        </div>
      )}

      {isFatal && (
        <div className="alert alert-error" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
            <i className="bi bi-exclamation-triangle-fill" style={{ marginTop: 2, flexShrink: 0 }} />
            <div>
              <strong>Tunnel nicht gefunden — Neu konfigurieren erforderlich</strong>
              <div style={{ fontSize: '0.82rem', marginTop: 2, opacity: 0.85 }}>{status.fatalError}</div>
            </div>
          </div>
          <div style={{ fontSize: '0.82rem', opacity: 0.75 }}>
            Der Tunnel existiert nicht mehr auf Cloudflare. Bitte erstelle ihn unten neu.
          </div>
        </div>
      )}

      {/* ── Step 1: Install ── */}
      <div className="card">
        <StepHeader
          number="1"
          title="cloudflared installieren"
          subtitle={installed
            ? `Installiert${status.version ? ` · ${status.version}` : ''}`
            : 'Wird für den Tunnel benötigt'}
          done={installed}
          active={!installed}
        />
        {!installed && (
          <div style={{ marginLeft: 48 }}>
            {status.isDocker ? (
              <div style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 8, padding: '0.75rem 1rem', fontSize: '0.82rem', color: 'var(--text2)', lineHeight: 1.6 }}>
                <i className="bi bi-box-seam" style={{ color: 'var(--accent)', marginRight: 6 }} />
                <strong>Docker-Umgebung erkannt.</strong> Setze <code style={{ background: 'var(--bg)', padding: '1px 5px', borderRadius: 4 }}>CLOUDFLARED_PATH</code> in deiner <code style={{ background: 'var(--bg)', padding: '1px 5px', borderRadius: 4 }}>.env</code> oder nutze den <code style={{ background: 'var(--bg)', padding: '1px 5px', borderRadius: 4 }}>cloudflared</code> Docker-Service in docker-compose.
              </div>
            ) : (
              <>
                <button
                  className="btn-primary btn-sm"
                  onClick={() => { setError(''); installStream.start(); }}
                  disabled={installStream.active}
                >
                  {installStream.active ? <span className="spinner" /> : <i className="bi bi-download" />}
                  {installStream.active ? 'Installieren…' : 'cloudflared installieren'}
                </button>
                <Terminal lines={installStream.lines} loading={installStream.active} />
              </>
            )}
          </div>
        )}
      </div>

      {/* ── Step 2: Login ── */}
      <div className="card" style={{ opacity: installed ? 1 : 0.45, pointerEvents: installed ? 'auto' : 'none' }}>
        <StepHeader
          number="2"
          title="Mit Cloudflare verbinden"
          subtitle={authed ? 'Verbunden' : 'Öffnet Browser zur Autorisierung'}
          done={authed}
          active={installed && !authed}
        />
        {!authed && (
          <div style={{ marginLeft: 48 }}>
            {!loginStream.active && !loginUrl && (
              <button
                className="btn-primary btn-sm"
                onClick={() => { setError(''); loginStream.start(); }}
                disabled={!installed}
              >
                <i className="bi bi-box-arrow-up-right" />Mit Cloudflare verbinden
              </button>
            )}

            {/* URL card — shown once cloudflared emits the auth URL */}
            {loginUrl && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                <p style={{ color: 'var(--text3)', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span className="spinner" style={{ width: 12, height: 12, borderWidth: 1.5 }} />
                  Warte auf Autorisierung im Browser…
                </p>
                <div style={{
                  background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 8,
                  padding: '0.625rem 0.875rem', fontSize: '0.78rem', color: 'var(--text2)',
                  wordBreak: 'break-all', fontFamily: 'monospace',
                }}>
                  {loginUrl}
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <a href={loginUrl} target="_blank" rel="noreferrer" className="btn-outline btn-sm" style={{ display: 'inline-flex' }}>
                    <i className="bi bi-box-arrow-up-right" />Browser öffnen
                  </a>
                  <button className="btn-outline btn-sm" onClick={() => { loginStream.cancel(); setLoginUrl(''); setLoginPolling(false); }}>
                    Abbrechen
                  </button>
                </div>
              </div>
            )}

            <Terminal lines={loginStream.lines} loading={loginStream.active && !loginUrl} />
          </div>
        )}
      </div>

      {/* ── Step 3: Configure ── */}
      <div className="card" style={{ opacity: authed ? 1 : 0.45, pointerEvents: authed ? 'auto' : 'none' }}>
        <StepHeader
          number="3"
          title="Tunnel konfigurieren"
          subtitle={hasTunnel ? `Aktiv: ${hostname}` : 'Hostname und Name festlegen'}
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
                  <button className="btn-primary btn-sm" disabled={!!busyStep}
                    onClick={() => doAction('start', () => request('/tunnel/start', { method: 'POST' }), 'Tunnel gestartet!')}>
                    {busyStep === 'start' ? <span className="spinner" /> : <i className="bi bi-play-fill" />}Starten
                  </button>
                ) : (
                  <button className="btn-outline btn-sm" disabled={!!busyStep}
                    onClick={() => doAction('stop', () => request('/tunnel/stop', { method: 'POST' }), 'Tunnel gestoppt')}>
                    {busyStep === 'stop' ? <span className="spinner" /> : <i className="bi bi-stop-fill" />}Stoppen
                  </button>
                )}
                {!svcInstalled && (
                  <button className="btn-outline btn-sm" disabled={!!busyStep}
                    onClick={() => { if (confirm('Als Systemdienst installieren?')) doAction('svc', () => request('/tunnel/service/install', { method: 'POST' }), 'Auto-Start aktiviert!'); }}>
                    <i className="bi bi-gear" />Auto-Start
                  </button>
                )}
              </div>
            </div>
            <button className="btn-outline btn-sm" onClick={handleReconfigure} disabled={!!busyStep} style={{ color: 'var(--text3)' }}>
              <i className="bi bi-arrow-repeat" />Neu konfigurieren
            </button>
          </div>
        ) : (
          <form onSubmit={handleSetup} style={{ marginLeft: 48, display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Tunnel Name</label>
              <input
                value={form.tunnel_name}
                onChange={e => set('tunnel_name', e.target.value)}
                placeholder="mein-tunnel"
                pattern="[A-Za-z0-9\-_]+"
                required
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Hostname (öffentliche Domain)</label>
              <input
                value={form.hostname}
                onChange={e => set('hostname', e.target.value)}
                placeholder="api.meinedomain.de"
                required
              />
            </div>
            <div>
              <button
                type="button" className="btn-outline btn-sm"
                onClick={() => setShowAdvanced(v => !v)}
                style={{ color: 'var(--text3)', marginBottom: showAdvanced ? '0.75rem' : 0 }}
              >
                <i className={`bi bi-chevron-${showAdvanced ? 'up' : 'down'}`} />Lokalen Service ändern
              </button>
              {showAdvanced && (
                <div className="form-group" style={{ marginBottom: 0, marginTop: '0.5rem' }}>
                  <label className="form-label">Lokaler Service URL</label>
                  <input
                    type="url"
                    value={form.local_service}
                    onChange={e => set('local_service', e.target.value)}
                    placeholder="http://localhost:3001"
                    required
                  />
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

      {/* ── Step 4: Info ── */}
      {hasTunnel && publicBase && (
        <div className="card">
          <StepHeader number="4" title="Server Info" done active />
          <div style={{ marginLeft: 48 }}>
            <InfoRow icon="link-45deg"   label="API URL"          value={`${publicBase}/api`}   mono link />
            <InfoRow icon="grid-1x2"     label="Admin Dashboard"  value={`${publicBase}/admin`} mono link />
            <InfoRow icon="shield-check" label="Rate Limiting"    value="Aktiv" />
            <div style={{ borderBottom: 'none' }}>
              <InfoRow icon="lock"       label="Security Headers" value="Aktiv (Helmet)" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function Tunnel() {
  const [tab, setTab] = useState('tunnel');
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 style={{ color: 'var(--text)', fontSize: '1.3rem', fontWeight: 600, letterSpacing: '-0.03em' }}>
            Cloudflare Tunnel
          </h2>
          <p style={{ color: 'var(--text3)', fontSize: '0.78rem', marginTop: 2 }}>
            Tunnel-Setup und Cloudflare-API-Verwaltung
          </p>
        </div>
      </div>
      <TabBar active={tab} onChange={setTab} />
      {tab === 'tunnel'     && <TunnelSetup />}
      {tab === 'cloudflare' && <CloudflarePanel />}
    </div>
  );
}

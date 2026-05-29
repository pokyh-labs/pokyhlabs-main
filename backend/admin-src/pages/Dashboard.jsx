import React, { useEffect, useState, useRef } from 'react';
import { useApi } from '../hooks/useApi';
import { toast } from '../hooks/useToast';

/* ─── Count-up hook ────────────────────────────────────────── */

function useCountUp(target, duration = 700) {
  const [count, setCount] = useState(0);
  const rafRef = useRef();

  useEffect(() => {
    if (target == null || isNaN(Number(target))) return;
    const n = Number(target);
    if (n === 0) { setCount(0); return; }

    const startTime = performance.now();
    function tick(now) {
      const t = Math.min((now - startTime) / duration, 1);
      const ease = 1 - (1 - t) * (1 - t) * (1 - t);
      setCount(Math.round(ease * n));
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, duration]);

  return count;
}

function StatCard({ value, label, icon, delay = 0 }) {
  const [hovered, setHovered] = useState(false);
  const displayed = useCountUp(value, 700);

  return (
    <div
      className="card stat-card"
      style={{
        padding: '1.4rem 1.5rem',
        cursor: 'default',
        animationDelay: `${delay}ms`,
        transition: 'border-color 220ms var(--ease)',
        borderColor: hovered ? 'rgba(12,12,12,0.20)' : 'var(--border)',
        position: 'relative',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <span className="label-mono">{label}</span>
        <i className={`bi ${icon}`} style={{
          fontSize: '0.95rem',
          color: 'var(--l4)',
          lineHeight: 1,
        }} />
      </div>
      <div
        className="num-pop"
        style={{
          fontSize: '2.4rem',
          fontWeight: 600,
          color: 'var(--l1)',
          lineHeight: 1,
          letterSpacing: '-0.05em',
          fontVariantNumeric: 'tabular-nums',
          marginTop: '1.1rem',
          animationDelay: `${delay + 120}ms`,
        }}
      >
        {value != null ? displayed : '–'}
      </div>
    </div>
  );
}

function fmtBytes(b) {
  if (!b) return '0 B';
  const u = ['B', 'KB', 'MB', 'GB'];
  const i = Math.min(Math.floor(Math.log(b) / Math.log(1024)), 3);
  return `${(b / Math.pow(1024, i)).toFixed(1)} ${u[i]}`;
}

function fmtUptime(s) {
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function MemBar({ used, total }) {
  const pct = total > 0 ? Math.round((used / total) * 100) : 0;
  const color = pct > 85 ? 'var(--red)' : pct > 65 ? 'var(--orange)' : 'var(--accent)';
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 7 }}>
        <span style={{ fontSize: '0.78rem', color: 'var(--l3)' }}>Heap-Speicher</span>
        <span style={{ fontSize: '0.78rem', color: 'var(--l2)', fontVariantNumeric: 'tabular-nums' }}>
          {fmtBytes(used)} / {fmtBytes(total)}
          <span style={{ color: 'var(--l3)', marginLeft: 6 }}>· {pct}%</span>
        </span>
      </div>
      <div style={{ height: 6, borderRadius: 99, background: 'var(--surface-3)', overflow: 'hidden', border: '1px solid var(--border-2)' }}>
        <div style={{
          height: '100%',
          width: `${pct}%`,
          background: color,
          borderRadius: 99,
          transition: 'width 0.8s var(--ease-site)',
        }} />
      </div>
    </div>
  );
}

function HealthRow({ icon, label, value }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '8px 0', borderBottom: '1px solid var(--border-2)' }}>
      <i className={`bi bi-${icon}`} style={{ color: 'var(--l4)', fontSize: '0.82rem', width: 16, textAlign: 'center', flexShrink: 0 }} />
      <span style={{ fontSize: '0.8rem', color: 'var(--l3)', flex: 1 }}>{label}</span>
      <span style={{ fontSize: '0.8rem', color: 'var(--l2)', fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}>{value}</span>
    </div>
  );
}

function StatusDot({ value, max }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div style={{
      width: '100%',
      height: 5,
      background: 'var(--surface-3)',
      borderRadius: 99,
      overflow: 'hidden',
      marginTop: 9,
      border: '1px solid var(--border-2)',
    }}>
      <div style={{
        height: '100%',
        width: `${pct}%`,
        background: 'var(--accent)',
        borderRadius: 99,
        transition: 'width 0.8s var(--ease-site)',
      }} />
    </div>
  );
}

function SectionLabel({ children }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--accent)', display: 'inline-block', flexShrink: 0 }} />
      <span className="label-mono">{children}</span>
    </div>
  );
}

export default function Dashboard({ onNavigate, user }) {
  const { request } = useApi();
  const [stats, setStats]   = useState(null);
  const [recent, setRecent] = useState([]);
  const [health, setHealth] = useState(null);
  const [backing, setBacking] = useState(false);

  useEffect(() => {
    request('/blogs/admin/stats').then(setStats).catch(() => {});
    request('/blogs/admin/all').then(data => setRecent(data.slice(0, 5))).catch(() => {});
    request('/system/health').then(setHealth).catch(() => {});
  }, []);

  // Auto-refresh health every 30s
  useEffect(() => {
    const id = setInterval(() => {
      request('/system/health').then(setHealth).catch(() => {});
    }, 30000);
    return () => clearInterval(id);
  }, []);

  async function handleBackup() {
    setBacking(true);
    try {
      const res = await request('/system/backup', { method: 'POST' });
      toast(`Backup erstellt: ${res.filename} (${fmtBytes(res.sizeBytes)})`);
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setBacking(false);
    }
  }

  function fmt(d) {
    if (!d) return '–';
    return new Date(d).toLocaleDateString('de-DE', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  const now      = new Date();
  const hour     = now.getHours();
  const greeting = hour < 12 ? 'Guten Morgen' : hour < 18 ? 'Guten Tag' : 'Guten Abend';
  const today    = now.toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div>
      {/* ── Welcome hero ── */}
      <div className="fade-up" style={{ marginBottom: '2.25rem' }}>
        <div style={{ marginBottom: 14 }}>
          <SectionLabel>{today}</SectionLabel>
        </div>
        <h2 style={{
          fontSize: 'clamp(1.7rem, 3.4vw, 2.5rem)',
          fontWeight: 600,
          letterSpacing: '-0.035em',
          lineHeight: 1.05,
          color: 'var(--l1)',
        }}>
          {greeting}{user?.username ? ',' : ''}{' '}
          {user?.username && (
            <span style={{ color: 'var(--accent)' }}>{user.username}</span>
          )}
          <span style={{ color: 'var(--l4)' }}>.</span>
        </h2>
        <p style={{
          fontSize: '0.95rem',
          color: 'var(--l3)',
          marginTop: 10,
          letterSpacing: '-0.01em',
          maxWidth: 540,
          lineHeight: 1.6,
        }}>
          Schön, dass du da bist. Hier ist der aktuelle Stand deines Studios.
        </p>
      </div>

      {/* Stats row */}
      <div className="grid-3 mb-4">
        <StatCard
          value={stats?.total}
          label="Blogs gesamt"
          icon="bi-journal-text"
          delay={0}
        />
        <StatCard
          value={stats?.published}
          label="Veröffentlicht"
          icon="bi-check-circle"
          delay={70}
        />
        <StatCard
          value={stats?.drafts}
          label="Entwürfe"
          icon="bi-file-earmark"
          delay={140}
        />
      </div>

      {/* Published progress */}
      {stats?.total > 0 && (
        <div className="card mb-4 fade-up" style={{
          padding: '1.1rem 1.4rem',
          display: 'flex',
          alignItems: 'center',
          gap: '1.25rem',
        }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              display: 'flex',
              alignItems: 'baseline',
              justifyContent: 'space-between',
              marginBottom: 2,
            }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--l2)' }}>
                Veröffentlichungsrate
              </span>
              <span style={{ fontSize: '0.8rem', color: 'var(--l3)', fontVariantNumeric: 'tabular-nums' }}>
                {stats?.total > 0 ? Math.round((stats.published / stats.total) * 100) : 0}%
              </span>
            </div>
            <StatusDot value={stats?.published ?? 0} max={stats?.total ?? 1} />
          </div>
          <button
            className="btn-primary btn-pill btn-sm"
            onClick={() => onNavigate('blogs')}
            style={{ flexShrink: 0 }}
          >
            <i className="bi bi-plus-lg" />
            Neuer Blog
          </button>
        </div>
      )}

      {/* System Health */}
      {health && (
        <div className="card mb-4">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <SectionLabel>System Health</SectionLabel>
            <button className="btn-outline btn-sm" onClick={handleBackup} disabled={backing}>
              {backing ? <span className="spinner" /> : <i className="bi bi-download" />}
              {backing ? 'Backup…' : 'DB Backup'}
            </button>
          </div>
          <MemBar used={health.memory?.heapUsed} total={health.memory?.heapTotal} />
          <div style={{ marginTop: '1.1rem' }}>
            <HealthRow icon="clock-history"  label="Uptime"          value={fmtUptime(health.uptime)} />
            <HealthRow icon="hdd-network"    label="Node.js"         value={health.nodeVersion} />
            <HealthRow icon="database"       label="Datenbank"       value={fmtBytes(health.database?.sizeBytes)} />
            <div style={{ borderBottom: 'none' }}>
              <HealthRow icon="folder2"      label="Uploads"         value={fmtBytes(health.uploads?.sizeBytes)} />
            </div>
          </div>
        </div>
      )}

      {/* Recent posts table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div
          style={{
            padding: '1.1rem 1.4rem',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <SectionLabel>Letzte Beiträge</SectionLabel>
          <button className="btn-outline btn-sm" onClick={() => onNavigate('blogs')}>
            Alle anzeigen
          </button>
        </div>

        {recent.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3.5rem', color: 'var(--l3)' }}>
            <div style={{
              width: 52, height: 52,
              borderRadius: 14,
              background: 'var(--surface-3)',
              border: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 1rem',
            }}>
              <i className="bi bi-journal-x" style={{ fontSize: '1.4rem', color: 'var(--l4)' }} />
            </div>
            <p style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--l2)', marginBottom: 4 }}>
              Noch keine Blogs vorhanden
            </p>
            <p style={{ fontSize: '0.78rem' }}>Erstelle deinen ersten Beitrag.</p>
          </div>
        ) : (
          <div className="table-scroll">
            <table style={{ width: '100%' }}>
              <thead style={{ background: 'var(--surface-2)' }}>
                <tr>
                  {['Titel', 'Status', 'Datum'].map(h => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recent.map((b, i) => (
                  <tr key={b.id} style={{ animation: `pageFade 0.4s var(--ease-site) ${i * 50}ms both` }}>
                    <td style={{ color: 'var(--l1)', maxWidth: 280, minWidth: 160 }}>
                      <div className="truncate" style={{ fontWeight: 500, fontSize: '0.85rem' }}>
                        {b.title}
                      </div>
                      {b.slug && (
                        <div style={{ color: 'var(--l3)', fontSize: '0.72rem', marginTop: 2 }}>
                          /{b.slug}
                        </div>
                      )}
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <span className={`badge badge-${b.status}`}>
                        {b.status === 'published' ? 'Veröffentlicht' : 'Entwurf'}
                      </span>
                    </td>
                    <td style={{ color: 'var(--l3)', fontSize: '0.78rem', whiteSpace: 'nowrap' }}>
                      {fmt(b.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

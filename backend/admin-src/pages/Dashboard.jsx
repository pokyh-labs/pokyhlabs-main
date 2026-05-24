import React, { useEffect, useState, useCallback } from 'react';
import { useApi } from '../hooks/useApi';
import { toast } from '../hooks/useToast';

function StatCard({ value, label, icon, color, delay = 0 }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  return (
    <div
      className="card stat-card"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        padding: '1.25rem',
        transition: 'transform 160ms ease, box-shadow 160ms ease',
        cursor: 'default',
        animationDelay: `${delay}ms`,
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = 'var(--shadow-md)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'var(--shadow)';
      }}
    >
      <div style={{
        width: 44, height: 44,
        borderRadius: 12,
        background: `${color}12`,
        border: `1px solid ${color}22`,
        color,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '1.1rem',
        flexShrink: 0,
        transition: 'transform var(--spring)',
      }}>
        <i className={`bi ${icon}`} />
      </div>
      <div>
        <div style={{
          fontSize: '1.8rem',
          fontWeight: 700,
          color: 'var(--text)',
          lineHeight: 1,
          letterSpacing: '-0.05em',
          fontVariantNumeric: 'tabular-nums',
        }}>
          {value ?? '–'}
        </div>
        <div style={{
          color: 'var(--text3)',
          fontSize: '0.75rem',
          marginTop: 4,
          fontWeight: 500,
          letterSpacing: '0.01em',
        }}>
          {label}
        </div>
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
  const color = pct > 85 ? '#e5383b' : pct > 65 ? '#f59500' : 'var(--accent)';
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: '0.73rem', color: 'var(--text3)', fontWeight: 500 }}>Heap</span>
        <span style={{ fontSize: '0.73rem', color: 'var(--text2)', fontVariantNumeric: 'tabular-nums' }}>
          {fmtBytes(used)} / {fmtBytes(total)} · {pct}%
        </span>
      </div>
      <div style={{ height: 5, borderRadius: 99, background: 'var(--bg3)', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 99, transition: 'width 0.6s ease' }} />
      </div>
    </div>
  );
}

function HealthRow({ icon, label, value }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0', borderBottom: '1px solid var(--border2)' }}>
      <i className={`bi bi-${icon}`} style={{ color: 'var(--text3)', fontSize: '0.82rem', width: 16, textAlign: 'center', flexShrink: 0 }} />
      <span style={{ fontSize: '0.78rem', color: 'var(--text3)', flex: 1 }}>{label}</span>
      <span style={{ fontSize: '0.78rem', color: 'var(--text2)', fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}>{value}</span>
    </div>
  );
}

function StatusDot({ value, max }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div style={{
      width: '100%',
      height: 4,
      background: 'var(--bg3)',
      borderRadius: 99,
      overflow: 'hidden',
      marginTop: 8,
    }}>
      <div style={{
        height: '100%',
        width: `${pct}%`,
        background: 'var(--accent)',
        borderRadius: 99,
        transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
      }} />
    </div>
  );
}

export default function Dashboard({ onNavigate }) {
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

  return (
    <div>
      {/* Stats row */}
      <div className="grid-3 mb-4">
        <StatCard
          value={stats?.total}
          label="Blogs gesamt"
          icon="bi-journal-text"
          color="#593df8"
          delay={0}
        />
        <StatCard
          value={stats?.published}
          label="Veröffentlicht"
          icon="bi-check-circle-fill"
          color="#28a745"
          delay={60}
        />
        <StatCard
          value={stats?.drafts}
          label="Entwürfe"
          icon="bi-file-earmark"
          color="#8c8c8c"
          delay={120}
        />
      </div>

      {/* Published progress */}
      {stats?.total > 0 && (
        <div className="card mb-4" style={{
          padding: '1rem 1.25rem',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
        }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              display: 'flex',
              alignItems: 'baseline',
              justifyContent: 'space-between',
              marginBottom: 2,
            }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 500, color: 'var(--text2)' }}>
                Veröffentlichungsrate
              </span>
              <span style={{ fontSize: '0.78rem', color: 'var(--text3)', fontVariantNumeric: 'tabular-nums' }}>
                {stats?.total > 0 ? Math.round((stats.published / stats.total) * 100) : 0}%
              </span>
            </div>
            <StatusDot value={stats?.published ?? 0} max={stats?.total ?? 1} />
          </div>
          <button
            className="btn-primary btn-sm"
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
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <i className="bi bi-cpu" style={{ color: 'var(--accent)', fontSize: '0.875rem' }} />
              <span style={{ fontWeight: 600, fontSize: '0.825rem', color: 'var(--text)', letterSpacing: '-0.01em' }}>
                System Health
              </span>
            </div>
            <button className="btn-outline btn-sm" onClick={handleBackup} disabled={backing}>
              {backing ? <span className="spinner" /> : <i className="bi bi-database-down" />}
              {backing ? 'Backup…' : 'DB Backup'}
            </button>
          </div>
          <MemBar used={health.memory?.heapUsed} total={health.memory?.heapTotal} />
          <div style={{ marginTop: '0.875rem' }}>
            <HealthRow icon="clock-history"  label="Uptime"          value={fmtUptime(health.uptime)} />
            <HealthRow icon="node-plus"      label="Node.js"         value={health.nodeVersion} />
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
            padding: '0.875rem 1.125rem',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <i className="bi bi-clock-history" style={{ color: 'var(--text3)', fontSize: '0.825rem' }} />
            <span style={{
              color: 'var(--text)',
              fontWeight: 600,
              fontSize: '0.825rem',
              letterSpacing: '-0.01em',
            }}>
              Letzte Beiträge
            </span>
          </div>
          <button className="btn-outline btn-sm" onClick={() => onNavigate('blogs')}>
            Alle anzeigen
          </button>
        </div>

        {recent.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3.5rem', color: 'var(--text3)' }}>
            <div style={{
              width: 56, height: 56,
              borderRadius: 16,
              background: 'var(--bg3)',
              border: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 1rem',
            }}>
              <i className="bi bi-journal-x" style={{ fontSize: '1.4rem', color: 'var(--text3)' }} />
            </div>
            <p style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text2)', marginBottom: 4 }}>
              Noch keine Blogs vorhanden
            </p>
            <p style={{ fontSize: '0.75rem' }}>Erstelle deinen ersten Beitrag.</p>
          </div>
        ) : (
          <table style={{ width: '100%' }}>
            <thead style={{ background: 'var(--bg3)' }}>
              <tr>
                {['Titel', 'Status', 'Datum'].map(h => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recent.map((b, i) => (
                <tr key={b.id} style={{ animation: `pageFade 0.3s ease ${i * 40}ms both` }}>
                  <td style={{ color: 'var(--text)', maxWidth: 300 }}>
                    <div className="truncate" style={{ fontWeight: 500, fontSize: '0.825rem' }}>
                      {b.title}
                    </div>
                    {b.slug && (
                      <div style={{ color: 'var(--text3)', fontSize: '0.7rem', marginTop: 2 }}>
                        /{b.slug}
                      </div>
                    )}
                  </td>
                  <td>
                    <span className={`badge badge-${b.status}`}>
                      <i className={`bi bi-${b.status === 'published' ? 'check-circle-fill' : 'file-earmark'}`} />
                      {b.status === 'published' ? 'Veröffentlicht' : 'Entwurf'}
                    </span>
                  </td>
                  <td style={{ color: 'var(--text3)', fontSize: '0.78rem' }}>
                    {fmt(b.created_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

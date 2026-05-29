import React, { useEffect, useState, useRef } from 'react';
import { useApi } from '../hooks/useApi';
import { toast } from '../hooks/useToast';

/* ─── Count-up hook ────────────────────────────────────────── */

function useCountUp(target, duration = 800) {
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

function StatBlock({ value, label, tint, delay = 0, onClick }) {
  const [hovered, setHovered] = useState(false);
  const displayed = useCountUp(value, 800);

  return (
    <div
      className="stat-card"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: tint,
        borderRadius: 'var(--r-xl)',
        padding: '1.4rem 1.5rem 1.4rem',
        minHeight: 150,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative',
        animationDelay: `${delay}ms`,
        transition: 'transform 320ms var(--ease-spring)',
        transform: hovered ? 'translateY(-3px)' : 'translateY(0)',
      }}
    >
      <span style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--ink)', letterSpacing: '-0.015em' }}>
        {label}
      </span>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12 }}>
        <span
          className="num-pop"
          style={{
            fontSize: '2.9rem',
            fontWeight: 800,
            color: 'var(--ink)',
            lineHeight: 0.9,
            letterSpacing: '-0.05em',
            fontVariantNumeric: 'tabular-nums',
            animationDelay: `${delay + 120}ms`,
          }}
        >
          {value != null ? displayed : '–'}
        </span>
        <button className="arrow-btn" onClick={onClick} aria-label={label}>
          <i className="bi bi-arrow-up-right" />
        </button>
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
  const color = pct > 85 ? 'var(--red)' : pct > 65 ? 'var(--orange)' : 'var(--ink)';
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontSize: '0.8rem', color: 'var(--l3)', fontWeight: 500 }}>Heap-Speicher</span>
        <span style={{ fontSize: '0.8rem', color: 'var(--l2)', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
          {fmtBytes(used)} / {fmtBytes(total)}
          <span style={{ color: 'var(--l3)', marginLeft: 6, fontWeight: 500 }}>· {pct}%</span>
        </span>
      </div>
      <div style={{ height: 9, borderRadius: 99, background: 'rgba(12,12,12,0.07)', overflow: 'hidden' }}>
        <div style={{
          height: '100%',
          width: `${pct}%`,
          background: color,
          borderRadius: 99,
          transition: 'width 0.9s var(--ease-spring)',
        }} />
      </div>
    </div>
  );
}

function HealthRow({ icon, label, value }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '9px 0', borderBottom: '1px solid var(--border-2)' }}>
      <i className={`bi bi-${icon}`} style={{ color: 'var(--l3)', fontSize: '0.9rem', width: 18, textAlign: 'center', flexShrink: 0 }} />
      <span style={{ fontSize: '0.82rem', color: 'var(--l3)', flex: 1 }}>{label}</span>
      <span style={{ fontSize: '0.82rem', color: 'var(--l1)', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{value}</span>
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
  const pubRate  = stats?.total > 0 ? Math.round((stats.published / stats.total) * 100) : 0;

  return (
    <div>
      {/* ── Welcome hero ── */}
      <div className="fade-up" style={{ margin: '0.5rem 0 2rem' }}>
        <p style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--l3)', letterSpacing: '-0.01em', textTransform: 'capitalize', marginBottom: 8 }}>
          {today}
        </p>
        <h2 style={{
          fontSize: 'clamp(1.9rem, 4vw, 2.9rem)',
          fontWeight: 800,
          letterSpacing: '-0.04em',
          lineHeight: 1.02,
          color: 'var(--l1)',
        }}>
          {greeting}{user?.username ? `, ${user.username}` : ''} <span className="wave" style={{ display: 'inline-block' }}>👋</span>
        </h2>
        <p style={{
          fontSize: '0.98rem',
          color: 'var(--l3)',
          marginTop: 10,
          letterSpacing: '-0.01em',
          maxWidth: 560,
        }}>
          Schön, dass du da bist. Hier ist der aktuelle Stand deines Studios.
        </p>
      </div>

      {/* ── Stat blocks ── */}
      <h3 className="h-section" style={{ marginBottom: '1rem' }}>Deine Inhalte</h3>
      <div className="grid-3 mb-4">
        <StatBlock value={stats?.total}     label="Blogs gesamt"   tint="var(--mint)"   delay={0}   onClick={() => onNavigate('blogs')} />
        <StatBlock value={stats?.published} label="Veröffentlicht" tint="var(--yellow)" delay={80}  onClick={() => onNavigate('blogs')} />
        <StatBlock value={stats?.drafts}    label="Entwürfe"       tint="var(--lav)"    delay={160} onClick={() => onNavigate('blogs')} />
      </div>

      {/* ── Publish rate progress ── */}
      {stats?.total > 0 && (
        <div className="fade-up" style={{
          background: 'var(--pink)',
          borderRadius: 'var(--r-xl)',
          padding: '1.5rem 1.6rem',
          marginBottom: '1.5rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 16 }}>
            <div>
              <p style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--ink)', opacity: 0.6 }}>Veröffentlichungsrate</p>
              <p style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--ink)', letterSpacing: '-0.04em', marginTop: 4 }}>
                {stats.published} von {stats.total} veröffentlicht
              </p>
            </div>
            <button className="btn-primary btn-sm" onClick={() => onNavigate('blogs')} style={{ flexShrink: 0 }}>
              <i className="bi bi-plus-lg" />
              Neuer Blog
            </button>
          </div>
          <div style={{ height: 10, borderRadius: 99, background: 'rgba(12,12,12,0.08)', overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              width: `${pubRate}%`,
              background: 'var(--ink)',
              borderRadius: 99,
              transition: 'width 0.9s var(--ease-spring)',
            }} />
          </div>
        </div>
      )}

      {/* ── System Health ── */}
      {health && (
        <div className="card mb-4">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <span style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--l1)', letterSpacing: '-0.03em' }}>System</span>
            <button className="btn-outline btn-sm" onClick={handleBackup} disabled={backing}>
              {backing ? <span className="spinner" /> : <i className="bi bi-download" />}
              {backing ? 'Backup…' : 'DB Backup'}
            </button>
          </div>
          <MemBar used={health.memory?.heapUsed} total={health.memory?.heapTotal} />
          <div style={{ marginTop: '1.1rem' }}>
            <HealthRow icon="clock-history"  label="Uptime"     value={fmtUptime(health.uptime)} />
            <HealthRow icon="hdd-network"    label="Node.js"    value={health.nodeVersion} />
            <HealthRow icon="database"       label="Datenbank"  value={fmtBytes(health.database?.sizeBytes)} />
            <div style={{ borderBottom: 'none' }}>
              <HealthRow icon="folder2"      label="Uploads"    value={fmtBytes(health.uploads?.sizeBytes)} />
            </div>
          </div>
        </div>
      )}

      {/* ── Recent posts ── */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.1rem' }}>
          <span style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--l1)', letterSpacing: '-0.03em' }}>Letzte Beiträge</span>
          <button className="btn-ghost btn-sm" onClick={() => onNavigate('blogs')}>
            Alle anzeigen
            <i className="bi bi-arrow-right" />
          </button>
        </div>

        {recent.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--l3)' }}>
            <div style={{
              width: 54, height: 54,
              borderRadius: 18,
              background: 'var(--surface-3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 1rem',
            }}>
              <i className="bi bi-journal-x" style={{ fontSize: '1.4rem', color: 'var(--l4)' }} />
            </div>
            <p style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--l2)', marginBottom: 4 }}>
              Noch keine Blogs vorhanden
            </p>
            <p style={{ fontSize: '0.8rem' }}>Erstelle deinen ersten Beitrag.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {recent.map((b, i) => (
              <div
                key={b.id}
                onClick={() => onNavigate('blogs')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  padding: '12px 14px',
                  borderRadius: 'var(--r)',
                  background: 'var(--surface-3)',
                  cursor: 'pointer',
                  animation: `pageFade 0.45s var(--ease-spring) ${i * 60}ms both`,
                  transition: 'background 160ms var(--ease)',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-4)'}
                onMouseLeave={e => e.currentTarget.style.background = 'var(--surface-3)'}
              >
                <div style={{
                  width: 40, height: 40, flexShrink: 0,
                  borderRadius: 12,
                  background: 'var(--surface)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--ink)',
                }}>
                  <i className="bi bi-journal-text" style={{ fontSize: '1rem' }} />
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div className="truncate" style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--l1)' }}>
                    {b.title}
                  </div>
                  <div style={{ color: 'var(--l3)', fontSize: '0.74rem', marginTop: 2 }}>
                    {fmt(b.created_at)}{b.slug ? ` · /${b.slug}` : ''}
                  </div>
                </div>
                <span className={`badge badge-${b.status}`} style={{ flexShrink: 0 }}>
                  {b.status === 'published' ? 'Veröffentlicht' : 'Entwurf'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

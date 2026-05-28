import React from 'react';

const PAGE_META = {
  dashboard:  { title: 'Dashboard',          icon: 'bi-squares-fill' },
  blogs:      { title: 'Blogs',              icon: 'bi-journal-text' },
  projects:   { title: 'Projekte',           icon: 'bi-grid-fill' },
  inquiries:  { title: 'Anfragen',           icon: 'bi-envelope-fill' },
  users:      { title: 'Benutzer',           icon: 'bi-person-2-fill' },
  logs:       { title: 'Logs & Analysen',    icon: 'bi-chart-bar-fill' },
  seo:        { title: 'SEO Editor',         icon: 'bi-search' },
};

export default function Topbar({ page, user, onMenuToggle }) {
  const meta     = PAGE_META[page] || PAGE_META.dashboard;
  const now      = new Date();
  const hour     = now.getHours();
  const greeting = hour < 12 ? 'Guten Morgen' : hour < 18 ? 'Guten Tag' : 'Guten Abend';
  const initial  = (user?.username?.[0] || 'A').toUpperCase();

  return (
    <header className="topbar">

      {/* ── Hamburger (mobile) ── */}
      <button
        className="menu-toggle"
        onClick={onMenuToggle}
        aria-label="Menü"
        style={{
          background: 'rgba(0,0,0,0.038)',
          border: '1px solid var(--border)',
          borderRadius: 8,
          padding: '0.38rem 0.46rem',
          cursor: 'pointer',
          color: 'var(--l2)',
          flexShrink: 0,
          transition: 'background var(--t-sm) var(--ease)',
        }}
        onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,0.07)'}
        onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,0,0,0.038)'}
      >
        <i className="bi bi-list" style={{ fontSize: '1.1rem', lineHeight: 1 }} />
      </button>

      {/* ── Page title ── */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 9, minWidth: 0 }}>
        <div style={{
          width: 28, height: 28,
          borderRadius: 8,
          background: 'var(--accent-dim)',
          border: '1px solid rgba(89,61,248,0.12)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <i className={`bi ${meta.icon}`} style={{
            fontSize: '0.78rem',
            color: 'var(--accent)',
            lineHeight: 1,
          }} />
        </div>
        <h1 style={{
          fontSize: '0.9rem',
          fontWeight: 600,
          color: 'var(--l1)',
          letterSpacing: '-0.026em',
          lineHeight: 1,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {meta.title}
        </h1>
      </div>

      {/* ── Right side ── */}
      <div className="hide-mobile" style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        flexShrink: 0,
      }}>
        <span style={{
          fontSize: '0.775rem',
          color: 'var(--l3)',
          letterSpacing: '-0.012em',
        }}>
          {greeting},{' '}
          <span style={{ color: 'var(--l2)', fontWeight: 500 }}>{user?.username}</span>
        </span>

        {/* Avatar chip */}
        <div style={{
          width: 28, height: 28,
          background: 'linear-gradient(145deg, #7c5af5, var(--accent))',
          borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '0.66rem',
          fontWeight: 700,
          color: '#fff',
          letterSpacing: '-0.01em',
          userSelect: 'none',
          boxShadow: '0 1px 6px rgba(89,61,248,0.38)',
        }}>
          {initial}
        </div>
      </div>
    </header>
  );
}

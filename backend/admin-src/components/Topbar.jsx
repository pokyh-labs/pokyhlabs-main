import React from 'react';

const PAGE_META = {
  dashboard:  { title: 'Dashboard' },
  blogs:      { title: 'Blogs' },
  projects:   { title: 'Projekte' },
  inquiries:  { title: 'Anfragen' },
  users:      { title: 'Benutzer' },
  logs:       { title: 'Logs & Analysen' },
  seo:        { title: 'SEO Editor' },
};

export default function Topbar({ page, user, onMenuToggle }) {
  const meta     = PAGE_META[page] || PAGE_META.dashboard;
  const initial  = (user?.username?.[0] || 'A').toUpperCase();

  return (
    <header className="topbar">

      {/* ── Hamburger (mobile) ── */}
      <button
        className="menu-toggle"
        onClick={onMenuToggle}
        aria-label="Menü"
        style={{
          background: 'transparent',
          border: '1px solid var(--border)',
          borderRadius: 8,
          padding: '0.4rem 0.48rem',
          cursor: 'pointer',
          color: 'var(--l2)',
          flexShrink: 0,
          transition: 'background 160ms var(--ease)',
        }}
        onMouseEnter={e => e.currentTarget.style.background = 'rgba(12,12,12,0.045)'}
        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
      >
        <i className="bi bi-list" style={{ fontSize: '1.15rem', lineHeight: 1 }} />
      </button>

      {/* ── Page title ── */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
        <h1 style={{
          fontSize: '0.95rem',
          fontWeight: 600,
          color: 'var(--l1)',
          letterSpacing: '-0.022em',
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
        gap: 11,
        flexShrink: 0,
      }}>
        <span style={{
          fontSize: '0.8rem',
          color: 'var(--l2)',
          fontWeight: 500,
          letterSpacing: '-0.01em',
        }}>
          {user?.username}
        </span>

        {/* Avatar chip */}
        <div style={{
          width: 30, height: 30,
          background: 'var(--surface-4)',
          border: '1px solid var(--border)',
          borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'var(--font-mono)',
          fontSize: '0.7rem',
          fontWeight: 500,
          color: 'var(--l1)',
          userSelect: 'none',
        }}>
          {initial}
        </div>
      </div>
    </header>
  );
}

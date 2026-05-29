import React from 'react';

const PAGE_META = {
  dashboard:  { title: 'Übersicht' },
  blogs:      { title: 'Blogs' },
  projects:   { title: 'Projekte' },
  inquiries:  { title: 'Anfragen' },
  users:      { title: 'Benutzer' },
  logs:       { title: 'Logs & Analysen' },
  seo:        { title: 'SEO Editor' },
};

export default function Topbar({ page, user, onMenuToggle }) {
  const meta    = PAGE_META[page] || PAGE_META.dashboard;
  const initial = (user?.username?.[0] || 'A').toUpperCase();

  return (
    <header className="topbar">

      {/* ── Hamburger (mobile) ── */}
      <button
        className="menu-toggle"
        onClick={onMenuToggle}
        aria-label="Menü"
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 12,
          padding: '0.5rem 0.58rem',
          cursor: 'pointer',
          color: 'var(--ink)',
          flexShrink: 0,
          transition: 'background 160ms var(--ease)',
        }}
      >
        <i className="bi bi-list" style={{ fontSize: '1.2rem', lineHeight: 1 }} />
      </button>

      {/* ── Page title ── */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <h1 style={{
          fontSize: 'clamp(1.15rem, 2.2vw, 1.55rem)',
          fontWeight: 700,
          color: 'var(--l1)',
          letterSpacing: '-0.035em',
          lineHeight: 1,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {meta.title}
        </h1>
      </div>

      {/* ── Right side ── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        flexShrink: 0,
      }}>
        <span className="hide-mobile" style={{
          fontSize: '0.86rem',
          color: 'var(--l1)',
          fontWeight: 600,
          letterSpacing: '-0.01em',
        }}>
          {user?.username}
        </span>

        {/* Avatar chip */}
        <div style={{
          width: 42, height: 42,
          background: 'var(--lav)',
          borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '0.92rem',
          fontWeight: 700,
          color: 'var(--ink)',
          letterSpacing: '-0.02em',
          userSelect: 'none',
        }}>
          {initial}
        </div>
      </div>
    </header>
  );
}

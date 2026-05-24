import React from 'react';

const PAGE_TITLES = {
  dashboard:  'Dashboard',
  blogs:      'Blogs',
  inquiries:  'Inquiries',
  tunnel:     'Cloudflare Tunnel',
  users:      'Benutzerverwaltung',
  logs:       'Logs & Analysen',
  seo:        'SEO Editor',
};

const PAGE_ICONS = {
  dashboard:  'bi-squares-fill',
  blogs:      'bi-journal-text',
  inquiries:  'bi-envelope-fill',
  tunnel:     'bi-diagram-3-fill',
  users:      'bi-person-fill',
  logs:       'bi-bar-chart-fill',
  seo:        'bi-search',
};

export default function Topbar({ page, user, onMenuToggle }) {
  const title = PAGE_TITLES[page] || 'Dashboard';
  const icon  = PAGE_ICONS[page]  || 'bi-squares-fill';
  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? 'Guten Morgen' : hour < 18 ? 'Guten Tag' : 'Guten Abend';

  return (
    <header className="topbar" style={{
      background: 'rgba(240,237,232,0.85)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
    }}>
      {/* Hamburger for mobile */}
      <button
        className="menu-toggle"
        onClick={onMenuToggle}
        style={{
          background: 'rgba(0,0,0,0.05)',
          border: '1px solid var(--border)',
          borderRadius: 8,
          padding: '0.4rem 0.5rem',
          cursor: 'pointer',
          color: 'var(--text2)',
          flexShrink: 0,
        }}
        aria-label="Menü öffnen"
      >
        <i className="bi bi-list" style={{ fontSize: '1.1rem', lineHeight: 1 }} />
      </button>

      {/* Page title */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
        <i className={`bi ${icon}`} style={{
          fontSize: '0.95rem',
          color: 'var(--accent)',
          lineHeight: 1,
          flexShrink: 0,
        }} />
        <h1 style={{
          fontSize: '0.9375rem',
          fontWeight: 600,
          color: 'var(--text)',
          letterSpacing: '-0.025em',
          lineHeight: 1,
        }}>
          {title}
        </h1>
      </div>

      {/* Greeting on desktop */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        flexShrink: 0,
      }}>
        <span style={{
          fontSize: '0.78rem',
          color: 'var(--text3)',
          fontWeight: 400,
          letterSpacing: '-0.01em',
        }}
          className="hide-mobile"
        >
          {greeting}, <strong style={{ color: 'var(--text2)', fontWeight: 500 }}>{user?.username}</strong>
        </span>
      </div>
    </header>
  );
}

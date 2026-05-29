import React, { useState, useRef, useLayoutEffect, useEffect } from 'react';
import { clearTokens, apiFetch } from '../hooks/useApi';
import { toast } from '../hooks/useToast';

const NAV_ITEMS = [
  { id: 'dashboard', icon: 'bi-grid-1x2-fill',  label: 'Dashboard', roles: ['admin'] },
  { id: 'blogs',     icon: 'bi-journal-text',    label: 'Blogs',     roles: ['admin', 'editor'] },
  { id: 'projects',  icon: 'bi-collection-fill', label: 'Projekte',  roles: ['admin'] },
  { id: 'inquiries', icon: 'bi-envelope-fill',   label: 'Anfragen',  roles: ['admin'] },
  { id: 'users',     icon: 'bi-people-fill',     label: 'Benutzer',  roles: ['admin'] },
  { id: 'seo',       icon: 'bi-search',          label: 'SEO',       roles: ['admin'] },
  { id: 'logs',      icon: 'bi-bar-chart-fill',  label: 'Logs',      roles: ['admin'] },
];

const ITEM = 52; // size of each rail target

function RailButton({ item, active, onClick, btnRef }) {
  const [hover, setHover] = useState(false);
  return (
    <button
      ref={btnRef}
      onClick={onClick}
      title={item.label}
      aria-label={item.label}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        position: 'relative',
        zIndex: 1,
        width: ITEM, height: ITEM,
        minWidth: ITEM,
        borderRadius: 16,
        background: !active && hover ? 'var(--surface-3)' : 'transparent',
        border: 'none',
        padding: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        color: active ? '#fff' : (hover ? 'var(--ink)' : 'var(--l3)'),
        transition: 'color 240ms var(--ease), background 200ms var(--ease)',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      <i className={`bi ${item.icon}`} style={{
        fontSize: '1.15rem',
        lineHeight: 1,
        transition: 'transform 320ms var(--ease-spring)',
        transform: active ? 'scale(1.05)' : 'scale(1)',
      }} />
    </button>
  );
}

export default function Sidebar({ user, page, onPageChange, onLogout, open }) {
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutHover, setLogoutHover] = useState(false);
  const navRef = useRef(null);
  const btnRefs = useRef({});
  const [indicator, setIndicator] = useState({ y: 0, ready: false });

  const items = NAV_ITEMS.filter(item => item.roles.includes(user?.role));

  // Position the sliding indicator behind the active item.
  useLayoutEffect(() => {
    const el = btnRefs.current[page];
    if (el && navRef.current) {
      setIndicator({ y: el.offsetTop, ready: true });
    }
  }, [page, items.length, open]);

  useEffect(() => {
    function onResize() {
      const el = btnRefs.current[page];
      if (el) setIndicator(i => ({ ...i, y: el.offsetTop }));
    }
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [page]);

  async function handleLogout() {
    setLoggingOut(true);
    await apiFetch('/auth/logout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ logoutAll: true }),
    }).catch(() => {});
    clearTokens();
    onLogout();
    toast('Abgemeldet');
    setLoggingOut(false);
  }

  return (
    <aside className={`sidebar${open ? ' open' : ''}`}>

      {/* ── Logo ── */}
      <div style={{
        height: 'var(--topbar-h)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}>
        <div style={{
          width: 44, height: 44,
          borderRadius: 14,
          background: 'var(--surface)',
          border: 'none',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          overflow: 'hidden',
        }}>
          <img
            src="/assets/logo.png"
            alt="pokyh.studio"
            style={{ width: 30, height: 30, objectFit: 'contain', display: 'block' }}
          />
        </div>
      </div>

      {/* ── Navigation rail ── */}
      <nav
        ref={navRef}
        style={{
          flex: 1,
          position: 'relative',
          padding: '8px 0',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 8,
        }}
      >
        {/* Sliding active indicator */}
        <span
          aria-hidden
          style={{
            position: 'absolute',
            top: 0,
            left: '50%',
            width: ITEM, height: ITEM,
            marginLeft: -ITEM / 2,
            borderRadius: 16,
            background: 'var(--ink)',
            transform: `translateY(${indicator.y}px)`,
            transition: indicator.ready
              ? 'transform 0.46s var(--ease-spring)'
              : 'none',
            zIndex: 0,
            boxShadow: '0 6px 16px -6px rgba(12,12,12,0.4)',
          }}
        />
        {items.map(item => (
          <RailButton
            key={item.id}
            item={item}
            active={page === item.id}
            onClick={() => onPageChange(item.id)}
            btnRef={el => { btnRefs.current[item.id] = el; }}
          />
        ))}
      </nav>

      {/* ── User + Logout ── */}
      <div style={{
        padding: '8px 0 16px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 10,
        flexShrink: 0,
      }}>
        <div style={{ width: 28, height: 1, background: 'var(--border)' }} />
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          title="Abmelden"
          aria-label="Abmelden"
          onMouseEnter={() => setLogoutHover(true)}
          onMouseLeave={() => setLogoutHover(false)}
          style={{
            width: ITEM, height: ITEM, minWidth: ITEM,
            borderRadius: 16,
            background: logoutHover ? 'var(--red-bg)' : 'transparent',
            border: 'none',
            padding: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: loggingOut ? 'not-allowed' : 'pointer',
            color: logoutHover ? 'var(--red)' : 'var(--l3)',
            opacity: loggingOut ? 0.5 : 1,
            transition: 'color 200ms var(--ease), background 200ms var(--ease)',
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          {loggingOut
            ? <span className="spinner" style={{ borderTopColor: 'var(--red)', width: 14, height: 14 }} />
            : <i className="bi bi-box-arrow-right" style={{ fontSize: '1.1rem', lineHeight: 1 }} />
          }
        </button>
      </div>
    </aside>
  );
}

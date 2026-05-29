import React, { useState } from 'react';
import { clearTokens, apiFetch } from '../hooks/useApi';
import { toast } from '../hooks/useToast';

const NAV_SECTIONS = [
  {
    label: null,
    items: [
      { id: 'dashboard', icon: 'bi-grid',          label: 'Dashboard', roles: ['admin'] },
    ],
  },
  {
    label: 'Inhalt',
    items: [
      { id: 'blogs',     icon: 'bi-journal-text',  label: 'Blogs',     roles: ['admin', 'editor'] },
      { id: 'projects',  icon: 'bi-collection',    label: 'Projekte',  roles: ['admin'] },
      { id: 'inquiries', icon: 'bi-envelope',      label: 'Anfragen',  roles: ['admin'] },
    ],
  },
  {
    label: 'Verwaltung',
    items: [
      { id: 'users',   icon: 'bi-people',          label: 'Benutzer',  roles: ['admin'] },
      { id: 'seo',     icon: 'bi-search',          label: 'SEO',       roles: ['admin'] },
      { id: 'logs',    icon: 'bi-bar-chart',       label: 'Logs',      roles: ['admin'] },
    ],
  },
];

function NavItem({ item, active, onClick }) {
  const [pressed, setPressed] = useState(false);

  return (
    <button
      onClick={onClick}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      style={{
        position: 'relative',
        width: '100%',
        padding: '9px 12px',
        display: 'flex',
        alignItems: 'center',
        gap: 11,
        background: active ? 'var(--sb-active-bg)' : 'transparent',
        border: `1px solid ${active ? 'var(--sb-active-bdr)' : 'transparent'}`,
        borderRadius: 9,
        cursor: 'pointer',
        color: active ? 'var(--sb-text-active)' : 'var(--sb-text)',
        transition: 'background 140ms ease, color 140ms ease, border-color 140ms ease, transform 160ms var(--ease-site)',
        textAlign: 'left',
        outline: 'none',
        transform: pressed ? 'scale(0.97)' : 'scale(1)',
        WebkitTapHighlightColor: 'transparent',
      }}
      onMouseEnter={e => {
        if (!active) {
          e.currentTarget.style.background = 'var(--sb-hover-bg)';
          e.currentTarget.style.color = 'var(--sb-text-hover)';
        }
      }}
      onMouseLeave={e => {
        if (!active) {
          e.currentTarget.style.background = 'transparent';
          e.currentTarget.style.color = 'var(--sb-text)';
        }
        setPressed(false);
      }}
    >
      {/* Active marker */}
      <span style={{
        position: 'absolute',
        left: -8,
        top: '50%',
        transform: `translateY(-50%) scaleY(${active ? 1 : 0})`,
        width: 3,
        height: 18,
        borderRadius: 3,
        background: 'var(--accent)',
        transition: 'transform 200ms var(--ease-site)',
      }} />
      <i
        className={`bi ${item.icon}`}
        style={{
          fontSize: '0.95rem',
          lineHeight: 1,
          flexShrink: 0,
          color: active ? 'var(--accent)' : 'inherit',
          transition: 'color 140ms ease',
        }}
      />
      <span style={{
        fontSize: '0.825rem',
        fontWeight: active ? 500 : 400,
        letterSpacing: '-0.01em',
        lineHeight: 1,
      }}>
        {item.label}
      </span>
    </button>
  );
}

export default function Sidebar({ user, page, onPageChange, onLogout, open }) {
  const [loggingOut, setLoggingOut] = useState(false);

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

  const initial = (user?.username?.[0] || 'A').toUpperCase();

  const visibleSections = NAV_SECTIONS.map(section => ({
    ...section,
    items: section.items.filter(item => item.roles.includes(user?.role)),
  })).filter(section => section.items.length > 0);

  return (
    <aside className={`sidebar${open ? ' open' : ''}`}>

      {/* ── Logo ── */}
      <div style={{
        padding: '20px 16px 18px',
        display: 'flex',
        alignItems: 'center',
        gap: 11,
        borderBottom: '1px solid var(--sb-border)',
        flexShrink: 0,
      }}>
        <div style={{
          width: 32, height: 32,
          borderRadius: 8,
          overflow: 'hidden',
          flexShrink: 0,
        }}>
          <img
            src="/assets/logo.png"
            alt="pokyh.studio"
            style={{ width: 32, height: 32, objectFit: 'contain', display: 'block' }}
          />
        </div>
        <div>
          <div style={{
            color: 'var(--l1)',
            fontSize: '0.85rem',
            fontWeight: 600,
            letterSpacing: '-0.022em',
            lineHeight: 1.2,
          }}>
            pokyh.studio
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            marginTop: 3,
          }}>
            <span style={{
              width: 5, height: 5,
              borderRadius: '50%',
              background: 'var(--green)',
              display: 'inline-block',
              flexShrink: 0,
            }} />
            <span className="label-mono" style={{ fontSize: '0.56rem', letterSpacing: '0.14em' }}>
              Admin Panel
            </span>
          </div>
        </div>
      </div>

      {/* ── Navigation ── */}
      <nav style={{
        flex: 1,
        padding: '8px 10px',
        display: 'flex',
        flexDirection: 'column',
        gap: 0,
        overflowY: 'auto',
        overflowX: 'hidden',
      }}>
        {visibleSections.map((section, si) => (
          <div key={si}>
            {section.label && (
              <div className="sb-label">{section.label}</div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {section.items.map(item => (
                <NavItem
                  key={item.id}
                  item={item}
                  active={page === item.id}
                  onClick={() => onPageChange(item.id)}
                />
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* ── User ── */}
      <div style={{
        padding: '12px 10px 16px',
        borderTop: '1px solid var(--sb-border)',
        flexShrink: 0,
      }}>
        {/* User row */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '8px 12px',
          marginBottom: 2,
        }}>
          <div style={{
            width: 30, height: 30,
            background: 'var(--surface-4)',
            border: '1px solid var(--border)',
            borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--font-mono)',
            fontWeight: 500,
            fontSize: '0.7rem',
            color: 'var(--l1)',
            letterSpacing: '0',
            userSelect: 'none',
            flexShrink: 0,
          }}>
            {initial}
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{
              color: 'var(--l1)',
              fontSize: '0.8rem',
              fontWeight: 500,
              letterSpacing: '-0.012em',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              lineHeight: 1.2,
            }}>
              {user?.username}
            </div>
            <div className="label-mono" style={{
              fontSize: '0.54rem',
              letterSpacing: '0.14em',
              marginTop: 3,
            }}>
              {user?.role}
            </div>
          </div>
        </div>

        {/* Logout */}
        <LogoutBtn loading={loggingOut} onClick={handleLogout} />
      </div>
    </aside>
  );
}

function LogoutBtn({ loading, onClick }) {
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);

  return (
    <button
      onClick={onClick}
      disabled={loading}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setPressed(false); }}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      style={{
        width: '100%',
        padding: '9px 12px',
        display: 'flex',
        alignItems: 'center',
        gap: 11,
        background: hovered ? 'var(--red-bg)' : 'transparent',
        border: `1px solid ${hovered ? 'var(--red-border)' : 'transparent'}`,
        borderRadius: 9,
        cursor: loading ? 'not-allowed' : 'pointer',
        color: hovered ? 'var(--red)' : 'var(--sb-text)',
        transition: 'background 140ms ease, color 140ms ease, border-color 140ms ease, transform 160ms var(--ease-site)',
        textAlign: 'left',
        opacity: loading ? 0.45 : 1,
        transform: pressed ? 'scale(0.97)' : 'scale(1)',
        outline: 'none',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      {loading
        ? <span className="spinner" style={{ borderTopColor: 'var(--red)', width: 12, height: 12 }} />
        : <i className="bi bi-box-arrow-right" style={{ fontSize: '0.95rem', lineHeight: 1 }} />
      }
      <span style={{ fontSize: '0.825rem', fontWeight: 400, letterSpacing: '-0.01em' }}>
        Abmelden
      </span>
    </button>
  );
}

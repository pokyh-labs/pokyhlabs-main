import React, { useState } from 'react';
import { clearTokens, apiFetch } from '../hooks/useApi';
import { toast } from '../hooks/useToast';

const NAV_SECTIONS = [
  {
    label: null,
    items: [
      { id: 'dashboard', icon: 'bi-squares-fill',  label: 'Dashboard', roles: ['admin'] },
    ],
  },
  {
    label: 'Inhalt',
    items: [
      { id: 'blogs',     icon: 'bi-journal-text',  label: 'Blogs',     roles: ['admin', 'editor'] },
      { id: 'projects',  icon: 'bi-grid-fill',     label: 'Projekte',  roles: ['admin'] },
      { id: 'inquiries', icon: 'bi-envelope-fill', label: 'Anfragen',  roles: ['admin'] },
    ],
  },
  {
    label: 'Verwaltung',
    items: [
      { id: 'users',   icon: 'bi-person-2-fill',   label: 'Benutzer',  roles: ['admin'] },
      { id: 'seo',     icon: 'bi-search',          label: 'SEO',       roles: ['admin'] },
      { id: 'logs',    icon: 'bi-chart-bar-fill',  label: 'Logs',      roles: ['admin'] },
      { id: 'tunnel',  icon: 'bi-diagram-3-fill',  label: 'Tunnel',    roles: ['admin'] },
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
        width: '100%',
        padding: '8px 12px',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        background: active ? 'var(--sb-active-bg)' : 'transparent',
        border: `1px solid ${active ? 'var(--sb-active-bdr)' : 'transparent'}`,
        borderRadius: 9,
        cursor: 'pointer',
        color: active ? 'var(--sb-text-active)' : 'var(--sb-text)',
        transition: 'background 140ms ease, color 140ms ease, border-color 140ms ease, transform 160ms var(--ease-spring)',
        textAlign: 'left',
        outline: 'none',
        transform: pressed ? 'scale(0.96)' : 'scale(1)',
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
      <i
        className={`bi ${item.icon}`}
        style={{
          fontSize: '0.875rem',
          lineHeight: 1,
          flexShrink: 0,
          color: active ? 'var(--accent-light)' : 'inherit',
          transition: 'color 140ms ease',
        }}
      />
      <span style={{
        fontSize: '0.8125rem',
        fontWeight: active ? 500 : 400,
        letterSpacing: '-0.014em',
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
        padding: '18px 14px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        borderBottom: '1px solid var(--sb-border)',
        flexShrink: 0,
      }}>
        <div style={{
          width: 32, height: 32,
          borderRadius: 9,
          overflow: 'hidden',
          flexShrink: 0,
          boxShadow: '0 2px 8px rgba(0,0,0,0.36)',
        }}>
          <img
            src="/assets/logo.png"
            alt="pokyh.studio"
            style={{ width: 32, height: 32, objectFit: 'contain', display: 'block' }}
          />
        </div>
        <div>
          <div style={{
            color: 'rgba(255,255,255,0.90)',
            fontSize: '0.8rem',
            fontWeight: 600,
            letterSpacing: '-0.022em',
            lineHeight: 1.2,
          }}>
            pokyh.studio
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            marginTop: 2,
          }}>
            <span style={{
              width: 5, height: 5,
              borderRadius: '50%',
              background: 'var(--green)',
              display: 'inline-block',
              boxShadow: '0 0 5px var(--green)',
              flexShrink: 0,
            }} />
            <span style={{
              color: 'rgba(255,255,255,0.26)',
              fontSize: '0.66rem',
              fontWeight: 400,
              letterSpacing: '0.01em',
            }}>
              Admin Panel
            </span>
          </div>
        </div>
      </div>

      {/* ── Navigation ── */}
      <nav style={{
        flex: 1,
        padding: '6px 8px',
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
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
        padding: '10px 8px 14px',
        borderTop: '1px solid var(--sb-border)',
        flexShrink: 0,
      }}>
        {/* User row */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 9,
          padding: '8px 12px',
          marginBottom: 1,
        }}>
          <div style={{
            width: 28, height: 28,
            background: 'linear-gradient(145deg, #7c5af5, var(--accent))',
            borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700,
            fontSize: '0.68rem',
            color: '#fff',
            letterSpacing: '-0.01em',
            userSelect: 'none',
            flexShrink: 0,
            boxShadow: '0 2px 8px rgba(89,61,248,0.48)',
          }}>
            {initial}
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{
              color: 'rgba(255,255,255,0.84)',
              fontSize: '0.78rem',
              fontWeight: 500,
              letterSpacing: '-0.014em',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              lineHeight: 1.2,
            }}>
              {user?.username}
            </div>
            <div style={{
              color: 'rgba(255,255,255,0.26)',
              fontSize: '0.66rem',
              textTransform: 'capitalize',
              letterSpacing: '0.01em',
              marginTop: 2,
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
        padding: '8px 12px',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        background: hovered ? 'rgba(255,59,48,0.10)' : 'transparent',
        border: `1px solid ${hovered ? 'rgba(255,59,48,0.18)' : 'transparent'}`,
        borderRadius: 9,
        cursor: loading ? 'not-allowed' : 'pointer',
        color: hovered ? '#fc8181' : 'var(--sb-text)',
        transition: 'background 140ms ease, color 140ms ease, border-color 140ms ease, transform 160ms var(--ease-spring)',
        textAlign: 'left',
        opacity: loading ? 0.45 : 1,
        transform: pressed ? 'scale(0.96)' : 'scale(1)',
        outline: 'none',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      {loading
        ? <span className="spinner" style={{ borderTopColor: '#fc8181', width: 12, height: 12 }} />
        : <i className="bi bi-box-arrow-right" style={{ fontSize: '0.875rem', lineHeight: 1 }} />
      }
      <span style={{ fontSize: '0.8125rem', fontWeight: 400, letterSpacing: '-0.014em' }}>
        Abmelden
      </span>
    </button>
  );
}

import React from 'react';
import { clearTokens, apiFetch } from '../hooks/useApi';
import { toast } from '../hooks/useToast';

const NAV = [
  { id: 'dashboard', icon: 'bi-squares',       label: 'Dashboard',         roles: ['admin'] },
  { id: 'blogs',     icon: 'bi-journal-text',   label: 'Blogs',             roles: ['admin', 'editor'] },
  { id: 'users',     icon: 'bi-people',         label: 'Benutzer',          roles: ['admin'] },
  { id: 'tunnel',    icon: 'bi-diagram-3',      label: 'Cloudflare Tunnel', roles: ['admin'] },
];

export default function Sidebar({ user, page, onPageChange, onLogout }) {
  async function handleLogout() {
    await apiFetch('/auth/logout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ logoutAll: true }),
    }).catch(() => {});
    clearTokens();
    onLogout();
    toast('Erfolgreich ausgeloggt');
  }

  const initial = (user?.username?.[0] || 'A').toUpperCase();
  const visibleNav = NAV.filter(item => item.roles.includes(user?.role));

  return (
    <aside style={{
      position: 'fixed', left: 0, top: 0,
      width: 'var(--sidebar-w)', height: '100vh',
      background: 'var(--bg3)',
      borderRight: '1px solid var(--border)',
      display: 'flex', flexDirection: 'column',
      zIndex: 100,
    }}>
      {/* Brand */}
      <div style={{
        padding: '1.125rem 1.125rem 1rem',
        borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', gap: '0.625rem',
      }}>
        <div style={{
          width: 28, height: 28,
          background: 'var(--accent)',
          borderRadius: 7,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
          boxShadow: '0 2px 6px rgba(89,61,248,0.25)',
        }}>
          <i className="bi bi-shield-lock-fill" style={{ color: '#fff', fontSize: '0.8rem' }} />
        </div>
        <div>
          <div style={{
            color: 'var(--text)',
            fontSize: '0.875rem',
            fontWeight: 600,
            letterSpacing: '-0.02em',
          }}>
            pokyh.studio
          </div>
          <div style={{
            color: 'var(--text3)',
            fontSize: '0.68rem',
            letterSpacing: '0.03em',
            textTransform: 'capitalize',
          }}>
            {user?.role || 'Admin'}
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '0.625rem 0.5rem', overflowY: 'auto' }}>
        {visibleNav.map(item => {
          const active = page === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onPageChange(item.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.55rem',
                padding: '0.55rem 0.75rem',
                color: active ? 'var(--accent)' : 'var(--text2)',
                background: active ? 'var(--accent-dim)' : 'transparent',
                border: '1px solid transparent',
                borderColor: active ? 'rgba(89,61,248,0.18)' : 'transparent',
                width: '100%', textAlign: 'left',
                borderRadius: 8, marginBottom: 1,
                transition: 'all 0.12s',
                cursor: 'pointer',
                fontSize: '0.8125rem',
                fontWeight: active ? 500 : 400,
              }}
              onMouseEnter={e => {
                if (!active) {
                  e.currentTarget.style.background = 'rgba(12,12,12,0.04)';
                  e.currentTarget.style.color = 'var(--text)';
                }
              }}
              onMouseLeave={e => {
                if (!active) {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = 'var(--text2)';
                }
              }}
            >
              <i className={`bi ${item.icon}`} style={{ fontSize: '0.9rem', flexShrink: 0 }} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* User */}
      <div style={{
        padding: '0.75rem 0.875rem',
        borderTop: '1px solid var(--border)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div style={{
            width: 30, height: 30,
            background: 'var(--accent)',
            borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 600, fontSize: '0.75rem',
            flexShrink: 0, color: '#fff',
          }}>
            {initial}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="truncate" style={{ color: 'var(--text)', fontSize: '0.8rem', fontWeight: 500 }}>
              {user?.username || '–'}
            </div>
            <div style={{ color: 'var(--text3)', fontSize: '0.7rem', textTransform: 'capitalize' }}>
              {user?.role || ''}
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="btn-outline btn-icon btn-sm"
            title="Ausloggen"
            style={{ flexShrink: 0, color: 'var(--text3)' }}
          >
            <i className="bi bi-box-arrow-right" />
          </button>
        </div>
      </div>
    </aside>
  );
}

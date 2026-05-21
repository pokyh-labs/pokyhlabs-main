import React from 'react';
import { clearTokens, apiFetch } from '../hooks/useApi';
import { toast } from '../hooks/useToast';

const NAV = [
  { id: 'dashboard', icon: 'bi-squares',         label: 'Dashboard',          roles: ['admin'] },
  { id: 'blogs',     icon: 'bi-journal-text',     label: 'Blogs',              roles: ['admin', 'editor'] },
  { id: 'users',     icon: 'bi-people',           label: 'Benutzer',           roles: ['admin'] },
  { id: 'tunnel',    icon: 'bi-diagram-3',        label: 'Cloudflare Tunnel',  roles: ['admin'] },
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
      background: 'var(--bg2)',
      borderRight: '1px solid var(--border2)',
      display: 'flex', flexDirection: 'column',
      zIndex: 100,
    }}>
      {/* Brand */}
      <div style={{
        padding: '1.25rem 1.25rem 1rem',
        borderBottom: '1px solid var(--border2)',
        display: 'flex', alignItems: 'center', gap: '0.625rem',
      }}>
        <div style={{
          width: 30, height: 30,
          background: 'var(--accent-dim)',
          border: '1px solid rgba(108,71,255,0.3)',
          borderRadius: 8,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <i className="bi bi-shield-lock" style={{ color: 'var(--accent)', fontSize: '0.85rem' }} />
        </div>
        <div>
          <div style={{ color: 'var(--text)', fontSize: '0.9rem', fontWeight: 600, letterSpacing: '-0.01em' }}>
            pokyh.studio
          </div>
          <div style={{ color: 'var(--text3)', fontSize: '0.7rem', letterSpacing: '0.02em', textTransform: 'capitalize' }}>
            {user?.role || 'Admin'}
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '0.75rem 0.625rem', overflowY: 'auto' }}>
        {visibleNav.map(item => {
          const active = page === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onPageChange(item.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.625rem',
                padding: '0.6rem 0.875rem',
                color: active ? '#fff' : 'var(--text2)',
                background: active ? 'rgba(108,71,255,0.15)' : 'transparent',
                border: active ? '1px solid rgba(108,71,255,0.25)' : '1px solid transparent',
                width: '100%', textAlign: 'left',
                borderRadius: 9, marginBottom: 2,
                transition: 'all 0.12s',
                cursor: 'pointer',
                fontSize: '0.875rem',
              }}
              onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
              onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}
            >
              <i className={`bi ${item.icon}`} style={{
                fontSize: '1rem',
                color: active ? 'var(--accent)' : 'inherit',
                flexShrink: 0,
              }} />
              <span style={{ fontWeight: active ? 500 : 400 }}>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* User */}
      <div style={{ padding: '0.875rem 1rem', borderTop: '1px solid var(--border2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          <div style={{
            width: 32, height: 32, background: 'var(--accent)', borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700, fontSize: '0.8rem', flexShrink: 0,
            boxShadow: '0 0 0 2px rgba(108,71,255,0.3)',
          }}>
            {initial}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="truncate" style={{ color: 'var(--text)', fontSize: '0.825rem', fontWeight: 500 }}>
              {user?.username || '–'}
            </div>
            <div style={{ color: 'var(--text3)', fontSize: '0.72rem', textTransform: 'capitalize' }}>
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

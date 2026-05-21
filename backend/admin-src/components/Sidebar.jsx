import React from 'react';
import { clearTokens, apiFetch } from '../hooks/useApi';
import { toast } from '../hooks/useToast';

const NAV = [
  { id: 'dashboard', icon: 'bi-grid-fill',    label: 'Dashboard',         roles: ['admin'] },
  { id: 'blogs',     icon: 'bi-journal-text',  label: 'Blogs',             roles: ['admin', 'editor'] },
  { id: 'users',     icon: 'bi-person',        label: 'Benutzer',          roles: ['admin'] },
  { id: 'tunnel',    icon: 'bi-diagram-3',     label: 'Cloudflare Tunnel', roles: ['admin'] },
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
      background: '#f5f3ee',
      borderRight: '1px solid var(--border)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center',
      paddingTop: 14, paddingBottom: 14,
      zIndex: 100,
    }}>

      {/* Logo */}
      <div style={{
        width: 40, height: 40,
        background: '#1a1918',
        borderRadius: 12,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 18,
        flexShrink: 0,
        boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
      }}>
        <i className="bi bi-shield-lock-fill" style={{ color: '#fff', fontSize: '1rem' }} />
      </div>

      {/* Nav */}
      <nav style={{
        flex: 1,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center',
        gap: 4,
      }}>
        {visibleNav.map(item => {
          const active = page === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onPageChange(item.id)}
              title={item.label}
              style={{
                width: 40, height: 40,
                padding: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: active ? 'var(--accent)' : 'transparent',
                border: 'none',
                borderRadius: 11,
                cursor: 'pointer',
                color: active ? '#fff' : 'var(--text3)',
                fontSize: '1.05rem',
                transition: 'background 0.12s, color 0.12s',
                flexShrink: 0,
              }}
              onMouseEnter={e => {
                if (!active) {
                  e.currentTarget.style.background = 'rgba(12,12,12,0.07)';
                  e.currentTarget.style.color = 'var(--text)';
                }
              }}
              onMouseLeave={e => {
                if (!active) {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = 'var(--text3)';
                }
              }}
            >
              <i className={`bi ${item.icon}`} />
            </button>
          );
        })}
      </nav>

      {/* Avatar + Logout */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
        <div
          title={user?.username}
          style={{
            width: 34, height: 34,
            background: 'var(--accent)',
            borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700, fontSize: '0.75rem',
            color: '#fff',
            letterSpacing: '-0.01em',
            userSelect: 'none',
          }}
        >
          {initial}
        </div>
        <button
          onClick={handleLogout}
          title="Ausloggen"
          style={{
            width: 34, height: 34,
            padding: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'transparent',
            border: 'none',
            borderRadius: 8,
            cursor: 'pointer',
            color: 'var(--text3)',
            fontSize: '1rem',
            transition: 'background 0.12s, color 0.12s',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'rgba(12,12,12,0.07)';
            e.currentTarget.style.color = 'var(--text)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = 'var(--text3)';
          }}
        >
          <i className="bi bi-box-arrow-right" />
        </button>
      </div>
    </aside>
  );
}

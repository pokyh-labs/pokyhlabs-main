import React from 'react';
import { clearTokens, apiFetch } from '../hooks/useApi';
import { toast } from '../hooks/useToast';

const NAV = [
  { id: 'dashboard', icon: 'bi-squares',         label: 'Dashboard',  roles: ['admin'] },
  { id: 'blogs',     icon: 'bi-journal-text',    label: 'Blogs',      roles: ['admin', 'editor'] },
  { id: 'users',     icon: 'bi-person',          label: 'Benutzer',   roles: ['admin'] },
  { id: 'tunnel',    icon: 'bi-diagram-3',       label: 'Tunnel',     roles: ['admin'] },
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
    toast('Abgemeldet');
  }

  const initial = (user?.username?.[0] || 'A').toUpperCase();
  const visibleNav = NAV.filter(item => item.roles.includes(user?.role));

  return (
    <aside style={{
      position: 'fixed',
      left: 0, top: 0,
      width: 'var(--sidebar-w)',
      height: '100vh',
      background: 'var(--bg2)',
      borderRight: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      paddingTop: 16,
      paddingBottom: 16,
      zIndex: 100,
    }}>

      {/* Logo mark */}
      <div style={{
        width: 36, height: 36,
        background: '#0c0c0c',
        borderRadius: 10,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 24,
        flexShrink: 0,
      }}>
        <i className="bi bi-shield-lock-fill" style={{ color: '#fff', fontSize: '0.9rem' }} />
      </div>

      {/* Nav items */}
      <nav style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 2,
        width: '100%',
        paddingLeft: 8,
        paddingRight: 8,
      }}>
        {visibleNav.map(item => {
          const active = page === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onPageChange(item.id)}
              title={item.label}
              style={{
                width: '100%',
                padding: '8px 6px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 3,
                background: active ? 'rgba(89,61,248,0.10)' : 'transparent',
                border: 'none',
                borderRadius: 10,
                cursor: 'pointer',
                color: active ? 'var(--accent)' : 'var(--text3)',
                transition: 'background 120ms, color 120ms',
              }}
              onMouseEnter={e => {
                if (!active) {
                  e.currentTarget.style.background = 'rgba(12,12,12,0.05)';
                  e.currentTarget.style.color = 'var(--text2)';
                }
              }}
              onMouseLeave={e => {
                if (!active) {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = 'var(--text3)';
                }
              }}
            >
              <i className={`bi ${item.icon}`} style={{ fontSize: '1rem', lineHeight: 1 }} />
              <span style={{
                fontSize: '0.58rem',
                fontWeight: active ? 600 : 500,
                letterSpacing: '0.01em',
                lineHeight: 1,
                textAlign: 'center',
              }}>
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>

      {/* Bottom: avatar + logout */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 6,
        width: '100%',
        paddingLeft: 8,
        paddingRight: 8,
      }}>
        {/* User avatar */}
        <div
          title={user?.username}
          style={{
            width: 32, height: 32,
            background: 'var(--accent)',
            borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700,
            fontSize: '0.72rem',
            color: '#fff',
            userSelect: 'none',
            flexShrink: 0,
          }}
        >
          {initial}
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          title="Abmelden"
          style={{
            width: '100%',
            padding: '7px 6px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 3,
            background: 'transparent',
            border: 'none',
            borderRadius: 10,
            cursor: 'pointer',
            color: 'var(--text3)',
            transition: 'background 120ms, color 120ms',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'rgba(220,38,38,0.08)';
            e.currentTarget.style.color = 'var(--danger)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = 'var(--text3)';
          }}
        >
          <i className="bi bi-box-arrow-right" style={{ fontSize: '0.95rem', lineHeight: 1 }} />
          <span style={{ fontSize: '0.58rem', fontWeight: 500, letterSpacing: '0.01em', lineHeight: 1 }}>
            Logout
          </span>
        </button>
      </div>
    </aside>
  );
}

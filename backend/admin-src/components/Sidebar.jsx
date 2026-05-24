import React, { useState } from 'react';
import { clearTokens, apiFetch } from '../hooks/useApi';
import { toast } from '../hooks/useToast';

const NAV = [
  { id: 'dashboard', icon: 'bi-squares-fill',     label: 'Dashboard',  roles: ['admin'] },
  { id: 'blogs',     icon: 'bi-journal-text',     label: 'Blogs',      roles: ['admin', 'editor'] },
  { id: 'users',     icon: 'bi-person-fill',      label: 'Benutzer',   roles: ['admin'] },
  { id: 'logs',      icon: 'bi-bar-chart-fill',   label: 'Logs',       roles: ['admin'] },
  { id: 'seo',       icon: 'bi-search',           label: 'SEO',        roles: ['admin'] },
  { id: 'tunnel',    icon: 'bi-diagram-3-fill',   label: 'Tunnel',     roles: ['admin'] },
];

export default function Sidebar({ user, page, onPageChange, onLogout, open, onClose }) {
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
  const visibleNav = NAV.filter(item => item.roles.includes(user?.role));

  return (
    <aside className={`sidebar${open ? ' open' : ''}`}>
      {/* ── Logo ── */}
      <div style={{
        padding: '20px 16px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        borderBottom: '1px solid var(--sidebar-border)',
        flexShrink: 0,
      }}>
        <div style={{
          width: 32, height: 32,
          background: 'var(--accent)',
          borderRadius: 9,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          boxShadow: '0 2px 8px rgba(89,61,248,0.40)',
        }}>
          <i className="bi bi-shield-lock-fill" style={{ color: '#fff', fontSize: '0.875rem' }} />
        </div>
        <div>
          <div style={{
            color: '#fff',
            fontSize: '0.82rem',
            fontWeight: 600,
            letterSpacing: '-0.02em',
            lineHeight: 1.2,
          }}>
            pokyh.studio
          </div>
          <div style={{
            color: 'var(--sidebar-text)',
            fontSize: '0.68rem',
            fontWeight: 400,
            letterSpacing: '0.01em',
          }}>
            Admin
          </div>
        </div>
      </div>

      {/* ── Nav ── */}
      <nav style={{
        flex: 1,
        padding: '12px 10px',
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        overflowY: 'auto',
      }}>
        {visibleNav.map(item => {
          const active = page === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onPageChange(item.id)}
              style={{
                width: '100%',
                padding: '9px 12px',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                background: active ? 'var(--sidebar-active-bg)' : 'transparent',
                border: 'none',
                borderRadius: 9,
                cursor: 'pointer',
                color: active ? 'var(--sidebar-text-active)' : 'var(--sidebar-text)',
                transition: 'background 150ms, color 150ms',
                textAlign: 'left',
                position: 'relative',
              }}
              onMouseEnter={e => {
                if (!active) {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                  e.currentTarget.style.color = 'var(--sidebar-text-hover)';
                }
              }}
              onMouseLeave={e => {
                if (!active) {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = 'var(--sidebar-text)';
                }
              }}
            >
              {/* Active indicator */}
              {active && (
                <span style={{
                  position: 'absolute',
                  left: 0,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: 3,
                  height: 18,
                  background: 'var(--accent)',
                  borderRadius: '0 3px 3px 0',
                }} />
              )}
              <i className={`bi ${item.icon}`} style={{
                fontSize: '0.9rem',
                lineHeight: 1,
                flexShrink: 0,
                opacity: active ? 1 : 0.8,
              }} />
              <span style={{
                fontSize: '0.8125rem',
                fontWeight: active ? 600 : 400,
                letterSpacing: '-0.01em',
                lineHeight: 1,
              }}>
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>

      {/* ── User section ── */}
      <div style={{
        padding: '12px 10px 16px',
        borderTop: '1px solid var(--sidebar-border)',
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        flexShrink: 0,
      }}>
        {/* User info row */}
        <div style={{
          padding: '9px 12px',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          borderRadius: 9,
        }}>
          <div style={{
            width: 28, height: 28,
            background: 'var(--accent)',
            borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700,
            fontSize: '0.7rem',
            color: '#fff',
            userSelect: 'none',
            flexShrink: 0,
            boxShadow: '0 1px 4px rgba(89,61,248,0.35)',
          }}>
            {initial}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{
              color: 'rgba(255,255,255,0.88)',
              fontSize: '0.78rem',
              fontWeight: 500,
              letterSpacing: '-0.01em',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              {user?.username}
            </div>
            <div style={{
              color: 'var(--sidebar-text)',
              fontSize: '0.68rem',
              textTransform: 'capitalize',
              letterSpacing: '0.01em',
            }}>
              {user?.role}
            </div>
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          style={{
            width: '100%',
            padding: '8px 12px',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            background: 'transparent',
            border: 'none',
            borderRadius: 9,
            cursor: 'pointer',
            color: 'var(--sidebar-text)',
            transition: 'background 150ms, color 150ms',
            textAlign: 'left',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'rgba(229,56,59,0.12)';
            e.currentTarget.style.color = '#f87171';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = 'var(--sidebar-text)';
          }}
        >
          {loggingOut
            ? <span className="spinner" style={{ borderTopColor: '#f87171' }} />
            : <i className="bi bi-box-arrow-right" style={{ fontSize: '0.9rem' }} />
          }
          <span style={{ fontSize: '0.8125rem', fontWeight: 400 }}>Abmelden</span>
        </button>
      </div>
    </aside>
  );
}

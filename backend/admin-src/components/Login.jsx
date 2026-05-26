import React, { useState } from 'react';
import { setTokens, apiFetch } from '../hooks/useApi';
import { toast } from '../hooks/useToast';

export default function Login({ onLogin }) {
  const [form, setForm]       = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [showPw, setShowPw]   = useState(false);
  const [focused, setFocused] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res  = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login fehlgeschlagen');
      setTokens(data.accessToken, data.refreshToken);
      onLogin(data.user);
      toast('Willkommen zurück!');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100dvh',
      padding: '1.5rem',
      background: 'var(--bg)',
      position: 'relative',
      overflow: 'hidden',
    }}>

      {/* ── Animated blobs ── */}
      <div style={{
        position: 'fixed', top: '-8%', left: '2%',
        width: 700, height: 700, borderRadius: '50%',
        background: 'radial-gradient(circle at 40% 40%, rgba(89,61,248,0.13) 0%, transparent 65%)',
        filter: 'blur(52px)',
        animation: 'blobFloat 11s ease-in-out infinite',
        pointerEvents: 'none', zIndex: 0,
      }} />
      <div style={{
        position: 'fixed', bottom: '-10%', right: '-4%',
        width: 580, height: 580, borderRadius: '50%',
        background: 'radial-gradient(circle at 60% 60%, rgba(89,61,248,0.08) 0%, rgba(200,180,100,0.06) 55%, transparent 70%)',
        filter: 'blur(60px)',
        animation: 'blobFloat2 15s ease-in-out infinite',
        pointerEvents: 'none', zIndex: 0,
      }} />
      <div style={{
        position: 'fixed', top: '35%', right: '8%',
        width: 340, height: 340, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(89,61,248,0.06) 0%, transparent 70%)',
        filter: 'blur(40px)',
        animation: 'blobFloat 20s ease-in-out infinite reverse',
        pointerEvents: 'none', zIndex: 0,
      }} />

      {/* ── Card ── */}
      <div style={{
        width: '100%',
        maxWidth: 374,
        position: 'relative',
        zIndex: 1,
        animation: 'pageFade 0.50s var(--ease-spring)',
      }}>

        {/* Brand */}
        <div style={{ textAlign: 'center', marginBottom: '2.25rem' }}>
          <div style={{
            width: 62, height: 62,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 1.25rem',
            borderRadius: 18,
            background: 'rgba(255,255,255,0.72)',
            backdropFilter: 'blur(16px)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.09), 0 1px 0 rgba(255,255,255,0.85) inset',
            border: '1px solid rgba(255,255,255,0.68)',
          }}>
            <img
              src="/assets/logo.png"
              alt="pokyh.studio"
              style={{ width: 38, height: 38, objectFit: 'contain' }}
            />
          </div>
          <h1 style={{
            color: 'var(--l1)',
            fontSize: '1.45rem',
            fontWeight: 700,
            letterSpacing: '-0.04em',
            lineHeight: 1.15,
            marginBottom: 6,
          }}>
            pokyh.studio
          </h1>
          <p style={{
            color: 'var(--l3)',
            fontSize: '0.825rem',
            fontWeight: 400,
            letterSpacing: '-0.01em',
          }}>
            Melde dich im Admin-Panel an
          </p>
        </div>

        {/* Glass card */}
        <div className="card-glass" style={{ padding: '2rem' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

            {/* Username field */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.77rem',
                fontWeight: 500,
                color: 'var(--l2)',
                marginBottom: '0.35rem',
                letterSpacing: '-0.005em',
              }}>
                Benutzername
              </label>
              <div style={{ position: 'relative' }}>
                <i className="bi bi-person" style={{
                  position: 'absolute', left: '0.75rem', top: '50%',
                  transform: 'translateY(-50%)',
                  color: focused === 'user' ? 'var(--accent)' : 'var(--l4)',
                  fontSize: '0.9rem', pointerEvents: 'none',
                  transition: 'color var(--t-sm) var(--ease)',
                }} />
                <input
                  type="text"
                  placeholder="admin"
                  autoComplete="username"
                  required
                  style={{ paddingLeft: '2.25rem' }}
                  value={form.username}
                  onFocus={() => setFocused('user')}
                  onBlur={() => setFocused('')}
                  onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                />
              </div>
            </div>

            {/* Password field */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.77rem',
                fontWeight: 500,
                color: 'var(--l2)',
                marginBottom: '0.35rem',
                letterSpacing: '-0.005em',
              }}>
                Passwort
              </label>
              <div style={{ position: 'relative' }}>
                <i className="bi bi-lock" style={{
                  position: 'absolute', left: '0.75rem', top: '50%',
                  transform: 'translateY(-50%)',
                  color: focused === 'pw' ? 'var(--accent)' : 'var(--l4)',
                  fontSize: '0.9rem', pointerEvents: 'none',
                  transition: 'color var(--t-sm) var(--ease)',
                }} />
                <input
                  type={showPw ? 'text' : 'password'}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                  style={{ paddingLeft: '2.25rem', paddingRight: '2.75rem' }}
                  value={form.password}
                  onFocus={() => setFocused('pw')}
                  onBlur={() => setFocused('')}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(v => !v)}
                  tabIndex={-1}
                  style={{
                    position: 'absolute', right: '0.625rem', top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none', border: 'none', padding: '0.22rem',
                    color: 'var(--l4)', cursor: 'pointer',
                    display: 'flex', alignItems: 'center',
                    transition: 'color var(--t-sm) var(--ease)',
                    borderRadius: 5,
                  }}
                  onMouseEnter={e => e.currentTarget.style.color = 'var(--l2)'}
                  onMouseLeave={e => e.currentTarget.style.color = 'var(--l4)'}
                >
                  <i className={`bi bi-eye${showPw ? '-slash' : ''}`} style={{ fontSize: '0.88rem' }} />
                </button>
              </div>
            </div>

            {error && (
              <div className="alert alert-error" style={{ margin: 0 }}>
                <i className="bi bi-exclamation-circle" />
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              className="btn-primary w-full"
              disabled={loading}
              style={{
                padding: '0.72rem',
                justifyContent: 'center',
                fontSize: '0.875rem',
                marginTop: 4,
                borderRadius: 12,
                letterSpacing: '-0.014em',
              }}
            >
              {loading
                ? <span className="spinner" />
                : <i className="bi bi-arrow-right-circle-fill" style={{ fontSize: '0.95rem' }} />
              }
              {loading ? 'Einloggen…' : 'Einloggen'}
            </button>
          </form>
        </div>

        <p style={{
          textAlign: 'center',
          marginTop: '1.25rem',
          color: 'var(--l4)',
          fontSize: '0.72rem',
          letterSpacing: '-0.005em',
        }}>
          pokyh.studio © {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}

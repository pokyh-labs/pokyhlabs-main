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

      {/* ── Card ── */}
      <div style={{
        width: '100%',
        maxWidth: 380,
        position: 'relative',
        zIndex: 1,
        animation: 'fadeUp 0.6s var(--ease-site) both',
      }}>

        {/* Brand */}
        <div style={{ textAlign: 'center', marginBottom: '2.25rem' }}>
          <div style={{
            width: 58, height: 58,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 1.25rem',
            borderRadius: 16,
            background: 'var(--surface)',
            border: '1px solid var(--border)',
          }}>
            <img
              src="/assets/logo.png"
              alt="pokyh.studio"
              style={{ width: 36, height: 36, objectFit: 'contain' }}
            />
          </div>
          <h1 style={{
            color: 'var(--l1)',
            fontSize: '1.5rem',
            fontWeight: 600,
            letterSpacing: '-0.035em',
            lineHeight: 1.15,
            marginBottom: 8,
          }}>
            pokyh.studio
          </h1>
          <p className="label-mono" style={{ letterSpacing: '0.16em' }}>
            Admin Panel
          </p>
        </div>

        {/* Auth card */}
        <div className="auth-card" style={{ padding: '2rem' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>

            {/* Username field */}
            <div>
              <label className="form-label">Benutzername</label>
              <div style={{ position: 'relative' }}>
                <i className="bi bi-person" style={{
                  position: 'absolute', left: '0.8rem', top: '50%',
                  transform: 'translateY(-50%)',
                  color: focused === 'user' ? 'var(--accent)' : 'var(--l4)',
                  fontSize: '0.9rem', pointerEvents: 'none',
                  transition: 'color 160ms var(--ease)',
                }} />
                <input
                  type="text"
                  placeholder="admin"
                  autoComplete="username"
                  required
                  style={{ paddingLeft: '2.35rem' }}
                  value={form.username}
                  onFocus={() => setFocused('user')}
                  onBlur={() => setFocused('')}
                  onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                />
              </div>
            </div>

            {/* Password field */}
            <div>
              <label className="form-label">Passwort</label>
              <div style={{ position: 'relative' }}>
                <i className="bi bi-lock" style={{
                  position: 'absolute', left: '0.8rem', top: '50%',
                  transform: 'translateY(-50%)',
                  color: focused === 'pw' ? 'var(--accent)' : 'var(--l4)',
                  fontSize: '0.9rem', pointerEvents: 'none',
                  transition: 'color 160ms var(--ease)',
                }} />
                <input
                  type={showPw ? 'text' : 'password'}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                  style={{ paddingLeft: '2.35rem', paddingRight: '2.75rem' }}
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
                    position: 'absolute', right: '0.6rem', top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none', border: 'none', padding: '0.22rem',
                    color: 'var(--l4)', cursor: 'pointer',
                    display: 'flex', alignItems: 'center',
                    transition: 'color 160ms var(--ease)',
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
              className="btn-primary btn-pill w-full"
              disabled={loading}
              style={{
                padding: '0.78rem',
                justifyContent: 'center',
                fontSize: '0.875rem',
                marginTop: 4,
                letterSpacing: '-0.012em',
              }}
            >
              {loading
                ? <span className="spinner" />
                : <i className="bi bi-arrow-right" style={{ fontSize: '0.95rem' }} />
              }
              {loading ? 'Einloggen…' : 'Einloggen'}
            </button>
          </form>
        </div>

        <p style={{
          textAlign: 'center',
          marginTop: '1.5rem',
          color: 'var(--l4)',
          fontSize: '0.72rem',
          letterSpacing: '0',
        }}>
          pokyh.studio © {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}

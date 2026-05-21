import React, { useState } from 'react';
import { setTokens, apiFetch } from '../hooks/useApi';
import { toast } from '../hooks/useToast';

export default function Login({ onLogin }) {
  const [form, setForm] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPw, setShowPw] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
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
      minHeight: '100vh',
      padding: '1rem',
      background: 'var(--bg)',
    }}>
      {/* Subtle accent glow */}
      <div style={{
        position: 'fixed',
        top: 0, left: '50%',
        transform: 'translateX(-50%)',
        width: 600, height: 300,
        background: 'radial-gradient(ellipse at 50% 0%, rgba(89,61,248,0.07) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{ width: '100%', maxWidth: 360, position: 'relative' }}>
        {/* Brand mark */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: 48, height: 48,
            background: 'var(--accent)',
            borderRadius: 13,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 1rem',
            boxShadow: '0 4px 16px rgba(89,61,248,0.25)',
          }}>
            <i className="bi bi-shield-lock-fill" style={{ fontSize: '1.3rem', color: '#fff' }} />
          </div>
          <h1 style={{
            color: 'var(--text)',
            fontSize: '1.25rem',
            fontWeight: 600,
            letterSpacing: '-0.03em',
            marginBottom: 4,
          }}>
            pokyh.studio
          </h1>
          <p style={{ color: 'var(--text3)', fontSize: '0.8125rem' }}>Admin Dashboard</p>
        </div>

        {/* Card */}
        <div className="card" style={{
          padding: '1.75rem',
          background: 'var(--bg2)',
        }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            {/* Username */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Benutzername</label>
              <div style={{ position: 'relative' }}>
                <i className="bi bi-person" style={{
                  position: 'absolute', left: '0.75rem', top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text3)', fontSize: '0.875rem',
                  pointerEvents: 'none',
                }} />
                <input
                  type="text"
                  placeholder="admin"
                  autoComplete="username"
                  required
                  style={{ paddingLeft: '2.25rem' }}
                  value={form.username}
                  onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                />
              </div>
            </div>

            {/* Password */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Passwort</label>
              <div style={{ position: 'relative' }}>
                <i className="bi bi-lock" style={{
                  position: 'absolute', left: '0.75rem', top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text3)', fontSize: '0.875rem',
                  pointerEvents: 'none',
                }} />
                <input
                  type={showPw ? 'text' : 'password'}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                  style={{ paddingLeft: '2.25rem', paddingRight: '2.5rem' }}
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(v => !v)}
                  tabIndex={-1}
                  style={{
                    position: 'absolute', right: '0.625rem', top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none', border: 'none', padding: '0.2rem',
                    color: 'var(--text3)', cursor: 'pointer',
                    display: 'flex', alignItems: 'center',
                  }}
                >
                  <i className={`bi bi-eye${showPw ? '-slash' : ''}`} style={{ fontSize: '0.85rem' }} />
                </button>
              </div>
            </div>

            {error && (
              <div className="alert alert-error" style={{ margin: 0 }}>
                <i className="bi bi-exclamation-circle" />
                {error}
              </div>
            )}

            <button
              type="submit"
              className="btn-primary w-full"
              disabled={loading}
              style={{ padding: '0.6rem', justifyContent: 'center', fontSize: '0.875rem', marginTop: 4 }}
            >
              {loading ? <span className="spinner" /> : <i className="bi bi-arrow-right-circle-fill" />}
              {loading ? 'Einloggen…' : 'Einloggen'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

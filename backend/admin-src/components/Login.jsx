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
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      minHeight: '100vh', padding: '1rem',
      background: 'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(108,71,255,0.12) 0%, transparent 70%)',
    }}>
      <div style={{ width: '100%', maxWidth: 380 }}>
        {/* Logo mark */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: 52, height: 52, background: 'var(--accent-dim)',
            border: '1px solid rgba(108,71,255,0.3)',
            borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 1rem',
          }}>
            <i className="bi bi-shield-lock" style={{ fontSize: '1.4rem', color: 'var(--accent)' }} />
          </div>
          <h1 style={{ color: 'var(--text)', fontSize: '1.35rem', fontWeight: 600, letterSpacing: '-0.02em', marginBottom: 4 }}>
            pokyh.studio
          </h1>
          <p style={{ color: 'var(--text3)', fontSize: '0.85rem' }}>Admin Dashboard</p>
        </div>

        <div className="card" style={{ padding: '1.75rem' }}>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Username</label>
              <div style={{ position: 'relative' }}>
                <i className="bi bi-person" style={{
                  position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)',
                  color: 'var(--text3)', fontSize: '1rem', pointerEvents: 'none',
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

            <div className="form-group" style={{ marginBottom: error ? '1rem' : '1.5rem' }}>
              <label className="form-label">Passwort</label>
              <div style={{ position: 'relative' }}>
                <i className="bi bi-lock" style={{
                  position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)',
                  color: 'var(--text3)', fontSize: '1rem', pointerEvents: 'none',
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
                  style={{
                    position: 'absolute', right: '0.625rem', top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', padding: '0.2rem',
                    color: 'var(--text3)', cursor: 'pointer', borderRadius: 4,
                    display: 'flex', alignItems: 'center',
                  }}
                  tabIndex={-1}
                >
                  <i className={`bi bi-eye${showPw ? '-slash' : ''}`} style={{ fontSize: '0.9rem' }} />
                </button>
              </div>
            </div>

            {error && (
              <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
                <i className="bi bi-exclamation-circle" />
                {error}
              </div>
            )}

            <button type="submit" className="btn-primary w-full" disabled={loading}
              style={{ padding: '0.625rem', justifyContent: 'center', fontSize: '0.9rem' }}>
              {loading ? <span className="spinner" /> : <i className="bi bi-arrow-right-circle" />}
              {loading ? 'Einloggen…' : 'Einloggen'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

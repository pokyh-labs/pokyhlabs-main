import React, { useEffect, useState } from 'react';
import { useApi, getAccessToken } from '../hooks/useApi';
import { toast } from '../hooks/useToast';

const EMPTY_FORM = { username: '', email: '', password: '', role: 'editor' };

function PasswordInput({ value, onChange, placeholder, required }) {
  const [show, setShow] = useState(false);
  return (
    <div style={{ position: 'relative' }}>
      <input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        minLength={8}
        style={{ paddingRight: '2.5rem' }}
      />
      <button
        type="button"
        onClick={() => setShow(s => !s)}
        style={{
          position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'var(--text3)', padding: 0, lineHeight: 1,
        }}
        tabIndex={-1}
        title={show ? 'Verbergen' : 'Anzeigen'}
      >
        <i className={`bi bi-eye${show ? '-slash' : ''}`} />
      </button>
    </div>
  );
}

function CreateUserForm({ onSave, onCancel }) {
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function set(k, v) { setForm(f => ({ ...f, [k]: v })); }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getAccessToken()}`,
        },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        const msg = data.error || data.errors?.[0]?.msg || 'Fehler beim Erstellen';
        throw new Error(msg);
      }
      toast(`Benutzer "${data.username}" wurde erstellt`);
      onSave();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="card" style={{ marginBottom: '1rem', borderColor: 'rgba(108,71,255,0.3)' }}>
      <div className="flex items-center justify-between mb-4">
        <h3 style={{ color: 'var(--text)', fontWeight: 600, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
          <i className="bi bi-person-plus" style={{ color: 'var(--accent)' }} />
          Neuen Benutzer erstellen
        </h3>
        <button className="btn-outline btn-sm btn-icon" onClick={onCancel} title="Schließen">
          <i className="bi bi-x-lg" />
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className="form-group">
            <label className="form-label">Benutzername *</label>
            <input
              value={form.username}
              onChange={e => set('username', e.target.value)}
              placeholder="z.B. lisa_mueller"
              required
              minLength={3}
              maxLength={50}
              pattern="[a-zA-Z0-9_\-]+"
              title="Nur Buchstaben, Zahlen, _ und -"
            />
          </div>

          <div className="form-group">
            <label className="form-label">E-Mail *</label>
            <input
              type="email"
              value={form.email}
              onChange={e => set('email', e.target.value)}
              placeholder="name@example.com"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Passwort *</label>
            <PasswordInput
              value={form.password}
              onChange={e => set('password', e.target.value)}
              placeholder="Min. 8 Zeichen…"
              required
            />
            <p style={{ color: 'var(--text3)', fontSize: '0.72rem', marginTop: 4 }}>
              Mind. 8 Zeichen, Groß- &amp; Kleinbuchstabe, Zahl
            </p>
          </div>

          <div className="form-group">
            <label className="form-label">Rolle</label>
            <select value={form.role} onChange={e => set('role', e.target.value)}>
              <option value="editor">Editor – nur Blogs</option>
              <option value="admin">Admin – voller Zugriff</option>
            </select>
            <p style={{ color: 'var(--text3)', fontSize: '0.72rem', marginTop: 4 }}>
              Editoren können nur Blogs erstellen und bearbeiten.
            </p>
          </div>
        </div>

        {error && (
          <div className="alert alert-error" style={{ marginTop: '0.5rem' }}>
            <i className="bi bi-exclamation-circle" />{error}
          </div>
        )}

        <div className="flex gap-2" style={{ marginTop: '1rem', justifyContent: 'flex-end' }}>
          <button type="button" className="btn-outline" onClick={onCancel}>Abbrechen</button>
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? <span className="spinner" /> : <i className="bi bi-person-check" />}
            {saving ? 'Erstelle…' : 'Benutzer erstellen'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function Users() {
  const { request, loading } = useApi();
  const [users, setUsers] = useState([]);
  const [showForm, setShowForm] = useState(false);

  async function load() {
    try {
      const data = await request('/users');
      setUsers(data);
    } catch {}
  }

  useEffect(() => { load(); }, []);

  async function handleDelete(id, username) {
    if (!confirm(`Benutzer "${username}" wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.`)) return;
    try {
      await request(`/users/${id}`, { method: 'DELETE' });
      toast(`Benutzer "${username}" gelöscht`);
      load();
    } catch (err) {
      toast(err.message, 'error');
    }
  }

  async function handleRoleChange(id, newRole, username) {
    if (!confirm(`Rolle von "${username}" auf "${newRole === 'admin' ? 'Admin' : 'Editor'}" ändern?`)) {
      load(); // Reset select to server value
      return;
    }
    try {
      await request(`/users/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });
      toast('Rolle aktualisiert');
      load();
    } catch (err) {
      toast(err.message, 'error');
      load();
    }
  }

  async function handleUnlock(id, username) {
    try {
      await request(`/users/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ unlock: true }),
      });
      toast(`${username} wurde entsperrt`);
      load();
    } catch (err) {
      toast(err.message, 'error');
    }
  }

  function isLocked(u) {
    return u.locked_until && new Date(u.locked_until) > new Date();
  }

  function fmt(d) {
    return d ? new Date(d).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '–';
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 style={{ color: 'var(--text)', fontSize: '1.4rem', fontWeight: 600, letterSpacing: '-0.02em' }}>
            Benutzerverwaltung
          </h2>
          <p style={{ color: 'var(--text3)', fontSize: '0.82rem', marginTop: 4 }}>
            Benutzer erstellen und Zugriffsrechte verwalten
          </p>
        </div>
        <button
          className={showForm ? 'btn-outline' : 'btn-primary'}
          onClick={() => setShowForm(s => !s)}
        >
          <i className={`bi bi-${showForm ? 'x-lg' : 'person-plus'}`} />
          {showForm ? 'Abbrechen' : 'Neuer Benutzer'}
        </button>
      </div>

      {showForm && (
        <CreateUserForm
          onSave={() => { setShowForm(false); load(); }}
          onCancel={() => setShowForm(false)}
        />
      )}

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text3)' }}>
            <span className="spinner" style={{ width: 20, height: 20, borderTopColor: 'var(--accent)' }} />
          </div>
        ) : users.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text3)' }}>
            <i className="bi bi-people" style={{ fontSize: '2rem', display: 'block', marginBottom: '0.75rem' }} />
            <p style={{ fontSize: '0.875rem' }}>Keine weiteren Benutzer vorhanden.</p>
          </div>
        ) : (
          <table style={{ width: '100%' }}>
            <thead style={{ background: 'var(--bg3)' }}>
              <tr>
                {['Benutzer', 'E-Mail', 'Rolle', 'Letzter Login', 'Status', ''].map((h, i) => (
                  <th key={i}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 32, height: 32, background: u.role === 'admin' ? 'var(--accent)' : 'var(--bg3)',
                        border: '1px solid var(--border)',
                        borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 700, fontSize: '0.8rem', flexShrink: 0,
                        color: u.role === 'admin' ? '#fff' : 'var(--text)',
                      }}>
                        {u.username[0].toUpperCase()}
                      </div>
                      <div>
                        <div style={{ color: 'var(--text)', fontWeight: 500, fontSize: '0.875rem' }}>{u.username}</div>
                        <div style={{ color: 'var(--text3)', fontSize: '0.72rem' }}>#{u.id}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ color: 'var(--text3)', fontSize: '0.83rem' }}>{u.email}</td>
                  <td>
                    <select
                      value={u.role}
                      onChange={e => handleRoleChange(u.id, e.target.value, u.username)}
                      style={{ fontSize: '0.8rem', padding: '3px 8px', width: 'auto', minWidth: 100 }}
                    >
                      <option value="editor">Editor</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td style={{ color: 'var(--text3)', fontSize: '0.8rem' }}>{fmt(u.last_login)}</td>
                  <td>
                    {isLocked(u) ? (
                      <button
                        className="btn-outline btn-sm"
                        onClick={() => handleUnlock(u.id, u.username)}
                        style={{ color: '#f97316', borderColor: 'rgba(249,115,22,0.4)', gap: 5 }}
                        title="Konto ist gesperrt – klicken zum Entsperren"
                      >
                        <i className="bi bi-lock-fill" /> Gesperrt
                      </button>
                    ) : (
                      <span style={{ color: '#22c55e', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 5 }}>
                        <i className="bi bi-check-circle-fill" /> Aktiv
                      </span>
                    )}
                  </td>
                  <td style={{ width: 48 }}>
                    <button
                      className="btn-danger btn-sm btn-icon"
                      onClick={() => handleDelete(u.id, u.username)}
                      title="Benutzer löschen"
                    >
                      <i className="bi bi-trash" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div style={{
        marginTop: '1rem', padding: '0.875rem 1rem',
        background: 'rgba(108,71,255,0.07)', border: '1px solid rgba(108,71,255,0.2)',
        borderRadius: 8, fontSize: '0.8rem', color: 'var(--text3)',
        display: 'flex', alignItems: 'flex-start', gap: 10,
      }}>
        <i className="bi bi-shield-lock" style={{ color: 'var(--accent)', flexShrink: 0, marginTop: 1 }} />
        <span>
          <strong style={{ color: 'var(--text2)' }}>Sicherheitshinweis:</strong> Editoren haben nur Zugriff auf Blogs.
          Dashboard, Tunnel und Benutzerverwaltung sind für Editoren vollständig gesperrt – auch auf API-Ebene.
        </span>
      </div>
    </div>
  );
}

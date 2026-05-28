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
      if (!res.ok) throw new Error(data.error || data.errors?.[0]?.msg || 'Fehler beim Erstellen');
      toast(`Benutzer "${data.username}" wurde erstellt`);
      onSave();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="card" style={{ marginBottom: '1rem', borderColor: 'rgba(89,61,248,0.20)' }}>
      <div className="flex items-center justify-between mb-4">
        <h3 style={{
          color: 'var(--text)', fontWeight: 600, fontSize: '0.9rem',
          display: 'flex', alignItems: 'center', gap: 7,
        }}>
          <i className="bi bi-person-plus" style={{ color: 'var(--accent)' }} />
          Neuen Benutzer erstellen
        </h3>
        <button className="btn-outline btn-sm btn-icon" onClick={onCancel} title="Schließen">
          <i className="bi bi-x-lg" />
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem' }}>
          <div className="form-group">
            <label className="form-label">Benutzername *</label>
            <input
              value={form.username}
              onChange={e => set('username', e.target.value)}
              placeholder="z.B. lisa_mueller"
              required minLength={3} maxLength={50}
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
    try { setUsers(await request('/users')); } catch {}
  }

  useEffect(() => { load(); }, []);

  async function handleDelete(id, username) {
    if (!confirm(`Benutzer "${username}" wirklich löschen?`)) return;
    try {
      await request(`/users/${id}`, { method: 'DELETE' });
      toast(`Benutzer "${username}" gelöscht`);
      load();
    } catch (err) { toast(err.message, 'error'); }
  }

  async function handleRoleChange(id, newRole, username) {
    if (!confirm(`Rolle von "${username}" auf "${newRole === 'admin' ? 'Admin' : 'Editor'}" ändern?`)) {
      load(); return;
    }
    try {
      await request(`/users/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });
      toast('Rolle aktualisiert');
      load();
    } catch (err) { toast(err.message, 'error'); load(); }
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
    } catch (err) { toast(err.message, 'error'); }
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
          <h2 style={{ color: 'var(--text)', fontSize: '1.3rem', fontWeight: 600, letterSpacing: '-0.03em' }}>
            Benutzerverwaltung
          </h2>
          <p style={{ color: 'var(--text3)', fontSize: '0.8rem', marginTop: 3 }}>
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
            <span className="spinner" style={{ width: 18, height: 18, borderTopColor: 'var(--accent)' }} />
          </div>
        ) : users.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text3)' }}>
            <i className="bi bi-people" style={{ fontSize: '1.75rem', display: 'block', marginBottom: '0.625rem' }} />
            <p style={{ fontSize: '0.8125rem' }}>Keine weiteren Benutzer vorhanden.</p>
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                      <div style={{
                        width: 30, height: 30,
                        background: u.role === 'admin' ? 'var(--accent)' : 'rgba(12,12,12,0.07)',
                        border: '1px solid var(--border)',
                        borderRadius: '50%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 600, fontSize: '0.75rem', flexShrink: 0,
                        color: u.role === 'admin' ? '#fff' : 'var(--text2)',
                      }}>
                        {u.username[0].toUpperCase()}
                      </div>
                      <div>
                        <div style={{ color: 'var(--text)', fontWeight: 500, fontSize: '0.8125rem' }}>
                          {u.username}
                        </div>
                        <div style={{ color: 'var(--text3)', fontSize: '0.7rem' }}>#{u.id}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ color: 'var(--text2)', fontSize: '0.8rem' }}>{u.email}</td>
                  <td>
                    <select
                      value={u.role}
                      onChange={e => handleRoleChange(u.id, e.target.value, u.username)}
                      style={{ fontSize: '0.78rem', padding: '3px 8px', width: 'auto', minWidth: 90 }}
                    >
                      <option value="editor">Editor</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td style={{ color: 'var(--text3)', fontSize: '0.78rem' }}>{fmt(u.last_login)}</td>
                  <td>
                    {isLocked(u) ? (
                      <button
                        className="btn-outline btn-sm"
                        onClick={() => handleUnlock(u.id, u.username)}
                        style={{ color: '#d97706', borderColor: 'rgba(217,119,6,0.3)', gap: 5 }}
                        title="Konto ist gesperrt – klicken zum Entsperren"
                      >
                        <i className="bi bi-lock-fill" /> Gesperrt
                      </button>
                    ) : (
                      <span style={{
                        color: 'var(--success)', fontSize: '0.78rem',
                        display: 'flex', alignItems: 'center', gap: 4,
                      }}>
                        <i className="bi bi-check-circle-fill" /> Aktiv
                      </span>
                    )}
                  </td>
                  <td style={{ width: 44 }}>
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
        marginTop: '1rem', padding: '0.75rem 0.875rem',
        background: 'var(--accent-dim)',
        border: '1px solid rgba(89,61,248,0.15)',
        borderRadius: 'var(--radius)',
        fontSize: '0.78rem', color: 'var(--text3)',
        display: 'flex', alignItems: 'flex-start', gap: 8,
      }}>
        <i className="bi bi-shield-lock" style={{ color: 'var(--accent)', flexShrink: 0, marginTop: 1 }} />
        <span>
          <strong style={{ color: 'var(--text2)' }}>Sicherheitshinweis:</strong>{' '}
          Editoren haben nur Zugriff auf Blogs.
          Dashboard und Benutzerverwaltung sind auch auf API-Ebene gesperrt.
        </span>
      </div>
    </div>
  );
}

import React, { useEffect, useState } from 'react';
import { useApi } from '../hooks/useApi';

function StatCard({ value, label, icon, color }) {
  return (
    <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
      <div style={{
        width: 44, height: 44, borderRadius: 11,
        background: `${color}18`,
        border: `1px solid ${color}30`,
        color,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '1.15rem', flexShrink: 0,
      }}>
        <i className={`bi ${icon}`} />
      </div>
      <div>
        <div style={{ fontSize: '1.85rem', fontWeight: 700, color: 'var(--text)', lineHeight: 1, letterSpacing: '-0.03em' }}>
          {value ?? '–'}
        </div>
        <div style={{ color: 'var(--text3)', fontSize: '0.78rem', marginTop: 4, fontWeight: 500 }}>{label}</div>
      </div>
    </div>
  );
}

export default function Dashboard({ onNavigate }) {
  const { request } = useApi();
  const [stats, setStats] = useState(null);
  const [recent, setRecent] = useState([]);

  useEffect(() => {
    request('/blogs/admin/stats').then(setStats).catch(() => {});
    request('/blogs/admin/all').then(data => setRecent(data.slice(0, 5))).catch(() => {});
  }, []);

  function fmt(d) {
    if (!d) return '–';
    return new Date(d).toLocaleDateString('de-DE', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  return (
    <div>
      <div className="mb-4">
        <h2 style={{ color: 'var(--text)', fontSize: '1.4rem', fontWeight: 600, letterSpacing: '-0.02em' }}>Dashboard</h2>
        <p style={{ color: 'var(--text3)', fontSize: '0.82rem', marginTop: 4 }}>Übersicht deiner Blog-Plattform</p>
      </div>

      <div className="grid-3 mb-4">
        <StatCard value={stats?.total}     label="Gesamt"         icon="bi-journal-text"   color="#818cf8" />
        <StatCard value={stats?.published} label="Veröffentlicht" icon="bi-check-circle"   color="#34d399" />
        <StatCard value={stats?.drafts}    label="Entwürfe"       icon="bi-file-earmark"   color="#6b7280" />
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="flex items-center justify-between"
          style={{ padding: '0.875rem 1.25rem', borderBottom: '1px solid var(--border2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <i className="bi bi-clock-history" style={{ color: 'var(--text3)' }} />
            <h6 style={{ color: 'var(--text)', margin: 0, fontWeight: 600, fontSize: '0.875rem' }}>Letzte Beiträge</h6>
          </div>
          <button className="btn-outline btn-sm" onClick={() => onNavigate('blogs')}>
            Alle anzeigen
          </button>
        </div>
        {recent.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text3)' }}>
            <i className="bi bi-journal-x" style={{ fontSize: '1.75rem', display: 'block', marginBottom: '0.75rem' }} />
            <p style={{ fontSize: '0.875rem' }}>Noch keine Blogs vorhanden.</p>
          </div>
        ) : (
          <table style={{ width: '100%' }}>
            <thead style={{ background: 'var(--bg3)' }}>
              <tr>
                {['Titel', 'Status', 'Datum'].map(h => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recent.map(b => (
                <tr key={b.id}>
                  <td style={{ color: 'var(--text)', maxWidth: 280 }} className="truncate">{b.title}</td>
                  <td>
                    <span className={`badge badge-${b.status}`}>
                      <i className={`bi bi-${b.status === 'published' ? 'check-circle-fill' : 'file-earmark'}`} />
                      {b.status === 'published' ? 'Veröffentlicht' : 'Entwurf'}
                    </span>
                  </td>
                  <td style={{ color: 'var(--text3)', fontSize: '0.8rem' }}>{fmt(b.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

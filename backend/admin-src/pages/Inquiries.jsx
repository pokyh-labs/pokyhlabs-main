import React, { useEffect, useState, useCallback } from 'react';
import { apiFetch } from '../hooks/useApi';
import { toast } from '../hooks/useToast';

const STATUS_LABELS = { new: 'New', read: 'Read', archived: 'Archived' };

const STATUS_COLORS = {
  new: {
    bg: 'rgba(89,61,248,0.08)',
    color: '#593df8',
    border: 'rgba(89,61,248,0.2)',
  },
  read: {
    bg: 'rgba(40,167,69,0.08)',
    color: '#28a745',
    border: 'rgba(40,167,69,0.2)',
  },
  archived: {
    bg: 'rgba(0,0,0,0.04)',
    color: '#8c8c8c',
    border: 'rgba(0,0,0,0.1)',
  },
};

function fmt(date) {
  if (!date) return '—';
  return new Date(date).toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function fmtDate(date) {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'long', year: 'numeric',
  });
}

export default function Inquiries() {
  const [inquiries, setInquiries] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selected, setSelected] = useState(null);
  const [updating, setUpdating] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const load = useCallback(async (status) => {
    setLoading(true);
    try {
      const params = status !== 'all' ? `?status=${status}` : '';
      const res = await apiFetch(`/inquiries${params}`);
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      setInquiries(data.inquiries);
      setTotal(data.total);
    } catch {
      toast('Failed to load inquiries', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(filter); }, [filter, load]);

  async function setStatus(id, status) {
    setUpdating(id);
    try {
      const res = await apiFetch(`/inquiries/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error('Failed');
      setInquiries(prev => prev.map(i => i.id === id ? { ...i, status } : i));
      if (selected?.id === id) setSelected(s => ({ ...s, status }));
      toast(`Marked as ${STATUS_LABELS[status]}`);
    } catch {
      toast('Update failed', 'error');
    } finally {
      setUpdating(null);
    }
  }

  async function deleteInquiry(id) {
    setDeleting(id);
    try {
      const res = await apiFetch(`/inquiries/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed');
      setInquiries(prev => prev.filter(i => i.id !== id));
      setTotal(t => t - 1);
      if (selected?.id === id) setSelected(null);
      toast('Deleted');
    } catch {
      toast('Delete failed', 'error');
    } finally {
      setDeleting(null);
      setConfirmDelete(null);
    }
  }

  const newCount = inquiries.filter(i => i.status === 'new').length;

  return (
    <div style={{ display: 'flex', gap: '1.25rem', height: 'calc(100vh - 120px)', minHeight: 500 }}>
      {/* ── List panel ── */}
      <div style={{ width: selected ? '44%' : '100%', transition: 'width 0.25s', display: 'flex', flexDirection: 'column', minWidth: 0 }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h2 style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text)', letterSpacing: '-0.02em', margin: 0 }}>
              Inquiries
            </h2>
            {newCount > 0 && (
              <span style={{ background: 'rgba(89,61,248,0.1)', color: 'var(--accent)', border: '1px solid rgba(89,61,248,0.2)', borderRadius: 999, padding: '2px 9px', fontSize: '0.72rem', fontWeight: 600 }}>
                {newCount} new
              </span>
            )}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text3)' }}>{total} total</span>
        </div>

        {/* Filter tabs */}
        <div style={{ display: 'flex', gap: 5, marginBottom: '0.875rem', flexShrink: 0 }}>
          {['all', 'new', 'read', 'archived'].map(f => (
            <button
              key={f}
              onClick={() => { setFilter(f); setSelected(null); }}
              style={{
                background: filter === f ? '#fff' : 'transparent',
                border: `1px solid ${filter === f ? 'rgba(0,0,0,0.12)' : 'rgba(0,0,0,0.06)'}`,
                borderRadius: 8,
                padding: '5px 12px',
                cursor: 'pointer',
                color: filter === f ? 'var(--text)' : 'var(--text3)',
                fontSize: '0.78rem',
                fontWeight: filter === f ? 600 : 400,
                textTransform: 'capitalize',
                boxShadow: filter === f ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
                transition: 'all 150ms',
              }}
            >
              {f === 'all' ? 'All' : STATUS_LABELS[f]}
            </button>
          ))}
        </div>

        {/* Table */}
        <div style={{ flex: 1, overflowY: 'auto', background: '#fff', border: '1px solid var(--border)', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200 }}>
              <div className="loading-spinner" />
            </div>
          ) : inquiries.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 200, gap: 10 }}>
              <i className="bi bi-inbox" style={{ fontSize: '2rem', color: 'var(--text3)', opacity: 0.4 }} />
              <p style={{ color: 'var(--text3)', fontSize: '0.82rem', margin: 0 }}>No inquiries found</p>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Name', 'Services', 'Company', 'Status', 'Date', ''].map(h => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: '0.68rem', fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--text3)', whiteSpace: 'nowrap', background: '#fafafa' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {inquiries.map(inq => {
                  const sc = STATUS_COLORS[inq.status];
                  const isActive = selected?.id === inq.id;
                  return (
                    <tr
                      key={inq.id}
                      onClick={() => { setSelected(inq); if (inq.status === 'new') setStatus(inq.id, 'read'); }}
                      style={{
                        borderBottom: '1px solid var(--border)',
                        cursor: 'pointer',
                        background: isActive ? 'rgba(89,61,248,0.04)' : 'transparent',
                        transition: 'background 150ms',
                      }}
                      onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'rgba(0,0,0,0.018)'; }}
                      onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
                    >
                      <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                        <div style={{ fontWeight: inq.status === 'new' ? 700 : 500, fontSize: '0.83rem', color: 'var(--text)', letterSpacing: '-0.01em' }}>
                          {inq.name}
                        </div>
                        <div style={{ fontSize: '0.73rem', color: 'var(--text3)', marginTop: 2 }}>{inq.email}</div>
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                          {inq.services.slice(0, 2).map(s => (
                            <span key={s} style={{ background: 'rgba(89,61,248,0.07)', border: '1px solid rgba(89,61,248,0.15)', borderRadius: 6, padding: '2px 8px', fontSize: '0.71rem', color: 'var(--accent)', textTransform: 'capitalize', fontWeight: 500 }}>
                              {s}
                            </span>
                          ))}
                          {inq.services.length > 2 && (
                            <span style={{ fontSize: '0.71rem', color: 'var(--text3)', padding: '2px 4px' }}>
                              +{inq.services.length - 2}
                            </span>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: '12px 14px', fontSize: '0.81rem', color: 'var(--text2)', whiteSpace: 'nowrap' }}>
                        {inq.company || <span style={{ color: 'var(--text3)' }}>—</span>}
                      </td>
                      <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                        <span style={{ background: sc.bg, color: sc.color, border: `1px solid ${sc.border}`, borderRadius: 6, padding: '3px 9px', fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                          {STATUS_LABELS[inq.status]}
                        </span>
                      </td>
                      <td style={{ padding: '12px 14px', fontSize: '0.73rem', color: 'var(--text3)', whiteSpace: 'nowrap' }}>
                        {fmt(inq.createdAt)}
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                        <button
                          onClick={e => { e.stopPropagation(); setConfirmDelete(inq); }}
                          style={{ background: 'transparent', border: '1px solid var(--border)', borderRadius: 7, padding: '4px 8px', cursor: 'pointer', color: 'var(--text3)', transition: 'all 150ms' }}
                          onMouseEnter={e => { e.currentTarget.style.background = 'var(--danger-bg)'; e.currentTarget.style.color = 'var(--danger)'; e.currentTarget.style.borderColor = 'var(--danger-border)'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text3)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
                        >
                          <i className="bi bi-trash3" style={{ fontSize: '0.75rem' }} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ── Detail panel ── */}
      {selected && (
        <div style={{ flex: 1, minWidth: 0, background: '#fff', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>

          {/* Detail header */}
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, background: '#fafafa' }}>
            <div>
              <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text)', letterSpacing: '-0.02em' }}>
                {selected.name}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text3)', marginTop: 2 }}>
                {selected.email}
              </div>
            </div>
            <button
              onClick={() => setSelected(null)}
              style={{ background: 'transparent', border: '1px solid var(--border)', borderRadius: 8, padding: '5px 10px', cursor: 'pointer', color: 'var(--text3)', fontSize: '0.75rem', transition: 'all 150ms' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,0,0,0.04)'; e.currentTarget.style.color = 'var(--text)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text3)'; }}
            >
              <i className="bi bi-x-lg" />
            </button>
          </div>

          {/* Detail body */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
            <DetailSection label="Services">
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {selected.services.map(s => (
                  <span key={s} style={{ background: 'rgba(89,61,248,0.07)', border: '1px solid rgba(89,61,248,0.18)', borderRadius: 8, padding: '4px 12px', fontSize: '0.8rem', color: 'var(--accent)', fontWeight: 500, textTransform: 'capitalize' }}>
                    {s}
                  </span>
                ))}
              </div>
            </DetailSection>

            {selected.company && (
              <DetailSection label="Company">
                <span style={{ fontSize: '0.9rem', color: 'var(--text)', fontWeight: 500 }}>{selected.company}</span>
              </DetailSection>
            )}

            <DetailSection label="Description">
              {selected.description ? (
                <p style={{ fontSize: '0.875rem', color: 'var(--text2)', lineHeight: 1.75, margin: 0, whiteSpace: 'pre-wrap' }}>
                  {selected.description}
                </p>
              ) : (
                <span style={{ fontSize: '0.82rem', color: 'var(--text3)' }}>No description provided</span>
              )}
            </DetailSection>

            {selected.deadline && (
              <DetailSection label="Deadline">
                <span style={{ fontSize: '0.9rem', color: '#d97706', fontWeight: 600 }}>
                  {fmtDate(selected.deadline)}
                </span>
              </DetailSection>
            )}

            <DetailSection label="Received">
              <span style={{ fontSize: '0.85rem', color: 'var(--text2)' }}>{fmt(selected.createdAt)}</span>
            </DetailSection>

            <DetailSection label="Status">
              <div style={{ display: 'flex', gap: 8 }}>
                {['new', 'read', 'archived'].map(s => {
                  const sc = STATUS_COLORS[s];
                  const active = selected.status === s;
                  return (
                    <button
                      key={s}
                      onClick={() => setStatus(selected.id, s)}
                      disabled={updating === selected.id || active}
                      style={{
                        background: active ? sc.bg : 'transparent',
                        border: `1px solid ${active ? sc.border : 'var(--border)'}`,
                        borderRadius: 8,
                        padding: '6px 14px',
                        cursor: active ? 'default' : 'pointer',
                        color: active ? sc.color : 'var(--text3)',
                        fontSize: '0.78rem',
                        fontWeight: active ? 600 : 400,
                        textTransform: 'capitalize',
                        transition: 'all 150ms',
                        opacity: updating === selected.id ? 0.5 : 1,
                      }}
                    >
                      {STATUS_LABELS[s]}
                    </button>
                  );
                })}
              </div>
            </DetailSection>
          </div>

          {/* Detail footer */}
          <div style={{ padding: '14px 20px', borderTop: '1px solid var(--border)', display: 'flex', gap: 10, flexShrink: 0, background: '#fafafa' }}>
            <a
              href={`mailto:${selected.email}?subject=Re: Your enquiry`}
              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, background: 'var(--accent)', borderRadius: 9, padding: '9px 16px', cursor: 'pointer', color: '#fff', fontSize: '0.82rem', fontWeight: 600, textDecoration: 'none', letterSpacing: '-0.01em', transition: 'opacity 150ms' }}
              onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
              onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
            >
              <i className="bi bi-envelope" />
              Reply
            </a>
            <button
              onClick={() => setConfirmDelete(selected)}
              style={{ background: 'transparent', border: '1px solid var(--border)', borderRadius: 9, padding: '9px 16px', cursor: 'pointer', color: 'var(--text3)', fontSize: '0.82rem', fontWeight: 500, transition: 'all 150ms' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--danger-bg)'; e.currentTarget.style.color = 'var(--danger)'; e.currentTarget.style.borderColor = 'var(--danger-border)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text3)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
            >
              <i className="bi bi-trash3" /> Delete
            </button>
          </div>
        </div>
      )}

      {/* ── Delete confirm modal ── */}
      {confirmDelete && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}
          onClick={() => setConfirmDelete(null)}
        >
          <div
            style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 16, padding: '28px 28px 24px', maxWidth: 360, width: '90%', boxShadow: '0 20px 60px rgba(0,0,0,0.14)' }}
            onClick={e => e.stopPropagation()}
          >
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text)', marginBottom: '0.5rem', letterSpacing: '-0.02em' }}>
              Delete inquiry?
            </h3>
            <p style={{ fontSize: '0.83rem', color: 'var(--text3)', lineHeight: 1.6, marginBottom: '1.5rem' }}>
              From <strong style={{ color: 'var(--text)' }}>{confirmDelete.name}</strong> ({confirmDelete.email}). This cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => setConfirmDelete(null)}
                style={{ flex: 1, background: 'rgba(0,0,0,0.04)', border: '1px solid var(--border)', borderRadius: 9, padding: '9px', cursor: 'pointer', color: 'var(--text)', fontSize: '0.83rem', fontWeight: 500 }}
              >
                Cancel
              </button>
              <button
                onClick={() => deleteInquiry(confirmDelete.id)}
                disabled={deleting === confirmDelete.id}
                style={{ flex: 1, background: 'var(--danger-bg)', border: '1px solid var(--danger-border)', borderRadius: 9, padding: '9px', cursor: 'pointer', color: 'var(--danger)', fontSize: '0.83rem', fontWeight: 600, opacity: deleting ? 0.5 : 1 }}
              >
                {deleting === confirmDelete.id ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DetailSection({ label, children }) {
  return (
    <div style={{ marginBottom: '1.5rem' }}>
      <div style={{ fontSize: '0.67rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text3)', marginBottom: '0.5rem' }}>
        {label}
      </div>
      {children}
    </div>
  );
}

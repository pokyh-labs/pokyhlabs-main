import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { apiFetch } from '../hooks/useApi';
import { toast } from '../hooks/useToast';

const MAIL_DOMAIN = 'pokyh.studio';

const STATUS_LABELS = { new: 'New', read: 'Read', archived: 'Archived' };

const STATUS_COLORS = {
  new:      { bg: 'rgba(89,61,248,0.08)', color: '#593df8', border: 'rgba(89,61,248,0.2)' },
  read:     { bg: 'rgba(40,167,69,0.08)', color: '#28a745', border: 'rgba(40,167,69,0.2)' },
  archived: { bg: 'rgba(0,0,0,0.04)',     color: '#8c8c8c', border: 'rgba(0,0,0,0.1)' },
};

function fmt(date) {
  if (!date) return '—';
  return new Date(date).toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}
function fmtTime(date) {
  if (!date) return '';
  return new Date(date).toLocaleString('en-GB', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
  });
}
function fmtDate(date) {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
}

// Group inquiries that share the same email into a single conversation, and
// merge every message (the original inbound request + any replies) into one
// chronological timeline.
function buildConversations(inquiries) {
  const map = new Map();
  for (const inq of inquiries) {
    const key = (inq.email || '').toLowerCase();
    if (!map.has(key)) {
      map.set(key, { email: inq.email, inquiries: [], messages: [], services: new Set(), latest: null, deadline: null, name: inq.name });
    }
    const c = map.get(key);
    c.inquiries.push(inq);
    (inq.services || []).forEach(s => c.services.add(s));
    (inq.messages || []).forEach(m => c.messages.push({ ...m, inquiry_id: inq.id }));
    if (inq.deadline && (!c.deadline || new Date(inq.deadline) < new Date(c.deadline))) c.deadline = inq.deadline;
  }

  const convos = [];
  for (const c of map.values()) {
    c.messages.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    c.inquiries.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    const newest = c.inquiries[c.inquiries.length - 1];
    c.name = newest?.name || c.name;
    c.latestInquiryId = newest?.id;
    const lastMsg = c.messages[c.messages.length - 1];
    c.lastActivity = lastMsg ? lastMsg.createdAt : newest?.createdAt;
    c.status = c.inquiries.some(i => i.status === 'new') ? 'new'
      : c.inquiries.every(i => i.status === 'archived') ? 'archived' : 'read';
    c.services = Array.from(c.services);
    c.company = c.inquiries.map(i => i.company).filter(Boolean).slice(-1)[0] || null;
    convos.push(c);
  }
  convos.sort((a, b) => new Date(b.lastActivity) - new Date(a.lastActivity));
  return convos;
}

export default function Inquiries({ user }) {
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const replyFrom = `${(user?.username || 'hello').toLowerCase()}@${MAIL_DOMAIN}`;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/inquiries?limit=100');
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      setInquiries(data.inquiries || []);
    } catch {
      toast('Failed to load inquiries', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const conversations = useMemo(() => buildConversations(inquiries), [inquiries]);

  const filtered = useMemo(() => {
    if (filter === 'all') return conversations;
    return conversations.filter(c => c.status === filter);
  }, [conversations, filter]);

  const selected = useMemo(
    () => conversations.find(c => (c.email || '').toLowerCase() === selectedEmail) || null,
    [conversations, selectedEmail]
  );

  const total = conversations.length;
  const newCount = conversations.filter(c => c.status === 'new').length;

  // Set the status on every inquiry in a conversation.
  async function setConversationStatus(convo, status) {
    setUpdating(true);
    try {
      const targets = convo.inquiries.filter(i => i.status !== status);
      await Promise.all(targets.map(i =>
        apiFetch(`/inquiries/${i.id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) })
      ));
      setInquiries(prev => prev.map(i =>
        (i.email || '').toLowerCase() === (convo.email || '').toLowerCase() ? { ...i, status } : i
      ));
      toast(`Marked as ${STATUS_LABELS[status]}`);
    } catch {
      toast('Update failed', 'error');
    } finally {
      setUpdating(false);
    }
  }

  // Mark a freshly-opened conversation as read.
  function openConversation(convo) {
    setSelectedEmail((convo.email || '').toLowerCase());
    if (convo.status === 'new') setConversationStatus(convo, 'read');
  }

  async function sendReply(convo, body) {
    const res = await apiFetch(`/inquiries/${convo.latestInquiryId}/reply`, {
      method: 'POST',
      body: JSON.stringify({ body }),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      throw new Error(d.error || 'Send failed');
    }
    const data = await res.json();
    // Attach the new outbound message to the latest inquiry in local state.
    setInquiries(prev => prev.map(i =>
      i.id === convo.latestInquiryId
        ? { ...i, status: data.status || i.status, messages: [...(i.messages || []), data.message] }
        : i
    ));
    if (data.mailError === 'mail_disabled') {
      toast('Saved — but email is not configured (RESEND_API_KEY missing)', 'error');
    } else if (data.emailed) {
      toast('Reply sent');
    } else {
      toast('Saved, but email could not be delivered', 'error');
    }
  }

  async function deleteConversation(convo) {
    setDeleting(true);
    try {
      await Promise.all(convo.inquiries.map(i => apiFetch(`/inquiries/${i.id}`, { method: 'DELETE' })));
      setInquiries(prev => prev.filter(i => (i.email || '').toLowerCase() !== (convo.email || '').toLowerCase()));
      if (selectedEmail === (convo.email || '').toLowerCase()) setSelectedEmail(null);
      toast('Deleted');
    } catch {
      toast('Delete failed', 'error');
    } finally {
      setDeleting(false);
      setConfirmDelete(null);
    }
  }

  return (
    <div style={{ display: 'flex', gap: '1.25rem', height: 'calc(100vh - 120px)', minHeight: 500 }}>
      {/* ── Conversation list ── */}
      <div style={{ width: selected ? '40%' : '100%', transition: 'width 0.25s', display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h2 style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text)', letterSpacing: '-0.02em', margin: 0 }}>
              Conversations
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
              onClick={() => { setFilter(f); setSelectedEmail(null); }}
              style={{
                background: filter === f ? '#fff' : 'transparent',
                border: `1px solid ${filter === f ? 'rgba(0,0,0,0.12)' : 'rgba(0,0,0,0.06)'}`,
                borderRadius: 8, padding: '5px 12px', cursor: 'pointer',
                color: filter === f ? 'var(--text)' : 'var(--text3)',
                fontSize: '0.78rem', fontWeight: filter === f ? 600 : 400, textTransform: 'capitalize',
                boxShadow: filter === f ? '0 1px 3px rgba(0,0,0,0.06)' : 'none', transition: 'all 150ms',
              }}
            >
              {f === 'all' ? 'All' : STATUS_LABELS[f]}
            </button>
          ))}
        </div>

        {/* List */}
        <div style={{ flex: 1, overflowY: 'auto', background: '#fff', border: '1px solid var(--border)', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200 }}>
              <div className="loading-spinner" />
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 200, gap: 10 }}>
              <i className="bi bi-chat-square-dots" style={{ fontSize: '2rem', color: 'var(--text3)', opacity: 0.4 }} />
              <p style={{ color: 'var(--text3)', fontSize: '0.82rem', margin: 0 }}>No conversations found</p>
            </div>
          ) : (
            <div>
              {filtered.map(convo => {
                const sc = STATUS_COLORS[convo.status];
                const isActive = selected && (selected.email || '').toLowerCase() === (convo.email || '').toLowerCase();
                const replyCount = convo.messages.filter(m => m.direction === 'outbound').length;
                return (
                  <button
                    key={convo.email}
                    onClick={() => openConversation(convo)}
                    style={{
                      display: 'block', width: '100%', textAlign: 'left',
                      border: 'none', borderBottom: '1px solid var(--border)', cursor: 'pointer',
                      background: isActive ? 'rgba(89,61,248,0.04)' : 'transparent',
                      padding: '14px 16px', transition: 'background 150ms',
                    }}
                    onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'rgba(0,0,0,0.018)'; }}
                    onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 5 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                        {convo.status === 'new' && <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--accent)', flexShrink: 0 }} />}
                        <span style={{ fontWeight: convo.status === 'new' ? 700 : 600, fontSize: '0.86rem', color: 'var(--text)', letterSpacing: '-0.01em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {convo.name}
                        </span>
                      </div>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text3)', whiteSpace: 'nowrap', flexShrink: 0 }}>
                        {fmtTime(convo.lastActivity)}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text3)', marginBottom: 7, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {convo.email}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      {convo.services.slice(0, 3).map(s => (
                        <span key={s} style={{ background: 'rgba(89,61,248,0.07)', border: '1px solid rgba(89,61,248,0.15)', borderRadius: 6, padding: '1px 7px', fontSize: '0.68rem', color: 'var(--accent)', textTransform: 'capitalize', fontWeight: 500 }}>
                          {s}
                        </span>
                      ))}
                      {convo.inquiries.length > 1 && (
                        <span style={{ fontSize: '0.68rem', color: 'var(--text3)' }}>· {convo.inquiries.length} requests</span>
                      )}
                      {replyCount > 0 && (
                        <span style={{ fontSize: '0.68rem', color: 'var(--text3)', display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                          <i className="bi bi-reply" /> {replyCount}
                        </span>
                      )}
                      <span style={{ marginLeft: 'auto', background: sc.bg, color: sc.color, border: `1px solid ${sc.border}`, borderRadius: 6, padding: '1px 8px', fontSize: '0.64rem', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                        {STATUS_LABELS[convo.status]}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Conversation detail ── */}
      {selected && (
        <ConversationDetail
          convo={selected}
          replyFrom={replyFrom}
          updating={updating}
          onClose={() => setSelectedEmail(null)}
          onSetStatus={setConversationStatus}
          onReply={sendReply}
          onRequestDelete={() => setConfirmDelete(selected)}
        />
      )}

      {/* ── Delete confirm modal ── */}
      {confirmDelete && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(12,12,12,0.42)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
          onClick={() => setConfirmDelete(null)}
        >
          <div
            style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 16, padding: '28px 28px 24px', maxWidth: 380, width: '90%', boxShadow: '0 20px 60px rgba(0,0,0,0.14)' }}
            onClick={e => e.stopPropagation()}
          >
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text)', marginBottom: '0.5rem', letterSpacing: '-0.02em' }}>
              Delete conversation?
            </h3>
            <p style={{ fontSize: '0.83rem', color: 'var(--text3)', lineHeight: 1.6, marginBottom: '1.5rem' }}>
              The whole conversation with <strong style={{ color: 'var(--text)' }}>{confirmDelete.name}</strong> ({confirmDelete.email}),
              including {confirmDelete.inquiries.length} request{confirmDelete.inquiries.length > 1 ? 's' : ''} and all replies, will be removed. This cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => setConfirmDelete(null)}
                style={{ flex: 1, background: 'rgba(0,0,0,0.04)', border: '1px solid var(--border)', borderRadius: 9, padding: '9px', cursor: 'pointer', color: 'var(--text)', fontSize: '0.83rem', fontWeight: 500 }}
              >
                Cancel
              </button>
              <button
                onClick={() => deleteConversation(confirmDelete)}
                disabled={deleting}
                style={{ flex: 1, background: 'var(--danger-bg)', border: '1px solid var(--danger-border)', borderRadius: 9, padding: '9px', cursor: 'pointer', color: 'var(--danger)', fontSize: '0.83rem', fontWeight: 600, opacity: deleting ? 0.5 : 1 }}
              >
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ConversationDetail({ convo, replyFrom, updating, onClose, onSetStatus, onReply, onRequestDelete }) {
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const threadRef = useRef(null);

  // Build a unified timeline: each inquiry contributes a "request" card, and
  // every message is a bubble. We render messages (which already include the
  // inbound original) plus a compact request header per inquiry.
  const timeline = useMemo(() => {
    const items = [];
    for (const inq of convo.inquiries) {
      items.push({ type: 'request', at: inq.createdAt, inquiry: inq, key: `req-${inq.id}` });
    }
    for (const m of convo.messages) {
      items.push({ type: 'message', at: m.createdAt, message: m, key: `msg-${m.id}` });
    }
    items.sort((a, b) => new Date(a.at) - new Date(b.at));
    return items;
  }, [convo]);

  useEffect(() => {
    if (threadRef.current) threadRef.current.scrollTop = threadRef.current.scrollHeight;
  }, [timeline.length, convo.email]);

  async function handleSend() {
    const body = reply.trim();
    if (!body || sending) return;
    setSending(true);
    try {
      await onReply(convo, body);
      setReply('');
    } catch (e) {
      toast(e.message || 'Send failed', 'error');
    } finally {
      setSending(false);
    }
  }

  return (
    <div style={{ flex: 1, minWidth: 0, background: '#fff', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
      {/* Header */}
      <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, background: '#fafafa' }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text)', letterSpacing: '-0.02em' }}>{convo.name}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text3)', marginTop: 2 }}>{convo.email}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {['read', 'archived'].map(s => {
            const sc = STATUS_COLORS[s];
            const active = convo.status === s;
            return (
              <button
                key={s}
                onClick={() => onSetStatus(convo, s)}
                disabled={updating || active}
                title={`Mark as ${STATUS_LABELS[s]}`}
                style={{
                  background: active ? sc.bg : 'transparent', border: `1px solid ${active ? sc.border : 'var(--border)'}`,
                  borderRadius: 8, padding: '5px 11px', cursor: active ? 'default' : 'pointer',
                  color: active ? sc.color : 'var(--text3)', fontSize: '0.74rem', fontWeight: active ? 600 : 400,
                  textTransform: 'capitalize', transition: 'all 150ms', opacity: updating ? 0.5 : 1,
                }}
              >
                {STATUS_LABELS[s]}
              </button>
            );
          })}
          <button
            onClick={onRequestDelete}
            title="Delete conversation"
            style={{ background: 'transparent', border: '1px solid var(--border)', borderRadius: 8, padding: '5px 9px', cursor: 'pointer', color: 'var(--text3)', transition: 'all 150ms' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--danger-bg)'; e.currentTarget.style.color = 'var(--danger)'; e.currentTarget.style.borderColor = 'var(--danger-border)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text3)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
          >
            <i className="bi bi-trash3" style={{ fontSize: '0.78rem' }} />
          </button>
          <button
            onClick={onClose}
            style={{ background: 'transparent', border: '1px solid var(--border)', borderRadius: 8, padding: '5px 9px', cursor: 'pointer', color: 'var(--text3)', fontSize: '0.75rem', transition: 'all 150ms' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,0,0,0.04)'; e.currentTarget.style.color = 'var(--text)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text3)'; }}
          >
            <i className="bi bi-x-lg" />
          </button>
        </div>
      </div>

      {/* Thread */}
      <div ref={threadRef} style={{ flex: 1, overflowY: 'auto', padding: '20px', background: 'linear-gradient(180deg,#fcfcfd,#fafafa)' }}>
        {timeline.map(item =>
          item.type === 'request'
            ? <RequestCard key={item.key} inquiry={item.inquiry} />
            : <MessageBubble key={item.key} message={item.message} />
        )}
      </div>

      {/* Reply composer */}
      <div style={{ borderTop: '1px solid var(--border)', padding: '12px 16px 14px', flexShrink: 0, background: '#fff' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, fontSize: '0.72rem', color: 'var(--text3)' }}>
          <span>From</span>
          <span style={{ background: 'rgba(89,61,248,0.07)', border: '1px solid rgba(89,61,248,0.18)', borderRadius: 6, padding: '2px 8px', color: 'var(--accent)', fontWeight: 600 }}>
            {replyFrom}
          </span>
          <i className="bi bi-arrow-right" style={{ fontSize: '0.66rem' }} />
          <span style={{ color: 'var(--text2)' }}>{convo.email}</span>
        </div>
        <div style={{ border: '1px solid var(--border)', borderRadius: 12, padding: 4, transition: 'border-color 150ms' }}>
          <textarea
            value={reply}
            onChange={e => setReply(e.target.value)}
            onKeyDown={e => { if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') handleSend(); }}
            placeholder="Write a reply…  (⌘/Ctrl + Enter to send)"
            rows={3}
            style={{
              width: '100%', border: 'none', outline: 'none', resize: 'vertical',
              padding: '10px 12px', fontSize: '0.86rem', lineHeight: 1.6, color: 'var(--text)',
              fontFamily: 'inherit', background: 'transparent', boxSizing: 'border-box', minHeight: 64,
            }}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '4px 6px 6px' }}>
            <button
              onClick={handleSend}
              disabled={sending || !reply.trim()}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 7,
                background: 'var(--accent)', border: 'none', borderRadius: 9, padding: '8px 18px',
                cursor: sending || !reply.trim() ? 'not-allowed' : 'pointer',
                color: '#fff', fontSize: '0.82rem', fontWeight: 600, letterSpacing: '-0.01em',
                opacity: sending || !reply.trim() ? 0.5 : 1, transition: 'opacity 150ms',
              }}
            >
              <i className="bi bi-send" style={{ fontSize: '0.8rem' }} />
              {sending ? 'Sending…' : 'Send reply'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Compact card marking a new request inside the thread.
function RequestCard({ inquiry }) {
  return (
    <div style={{ margin: '0 0 18px', textAlign: 'center' }}>
      <div style={{ display: 'inline-block', maxWidth: '92%', textAlign: 'left', background: '#fff', border: '1px solid var(--border)', borderRadius: 12, padding: '12px 16px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <span style={{ fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--accent)' }}>
            <i className="bi bi-stars" style={{ marginRight: 5 }} />New request
          </span>
          <span style={{ fontSize: '0.68rem', color: 'var(--text3)' }}>{fmt(inquiry.createdAt)}</span>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 8 }}>
          {(inquiry.services || []).map(s => (
            <span key={s} style={{ background: 'rgba(89,61,248,0.07)', border: '1px solid rgba(89,61,248,0.15)', borderRadius: 6, padding: '2px 8px', fontSize: '0.7rem', color: 'var(--accent)', textTransform: 'capitalize', fontWeight: 500 }}>
              {s}
            </span>
          ))}
        </div>
        {inquiry.description && (
          <div style={{ fontSize: '0.84rem', color: 'var(--text2)', lineHeight: 1.65, whiteSpace: 'pre-wrap', marginBottom: (inquiry.company || inquiry.deadline) ? 8 : 0 }}>
            {inquiry.description}
          </div>
        )}
        {(inquiry.company || inquiry.deadline) && (
          <div style={{ display: 'flex', gap: 16, fontSize: '0.74rem', color: 'var(--text3)', borderTop: '1px solid var(--border)', paddingTop: 8 }}>
            {inquiry.company && <span><i className="bi bi-building" style={{ marginRight: 4 }} />{inquiry.company}</span>}
            {inquiry.deadline && <span style={{ color: '#d97706', fontWeight: 600 }}><i className="bi bi-calendar-event" style={{ marginRight: 4 }} />{fmtDate(inquiry.deadline)}</span>}
          </div>
        )}
      </div>
    </div>
  );
}

function MessageBubble({ message }) {
  const outbound = message.direction === 'outbound';
  return (
    <div style={{ display: 'flex', justifyContent: outbound ? 'flex-end' : 'flex-start', marginBottom: 14 }}>
      <div style={{ maxWidth: '80%' }}>
        <div style={{
          background: outbound ? 'var(--accent)' : '#fff',
          color: outbound ? '#fff' : 'var(--text)',
          border: outbound ? 'none' : '1px solid var(--border)',
          borderRadius: outbound ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
          padding: '11px 15px', fontSize: '0.86rem', lineHeight: 1.65, whiteSpace: 'pre-wrap',
          boxShadow: outbound ? '0 1px 4px rgba(89,61,248,0.25)' : '0 1px 3px rgba(0,0,0,0.04)',
          wordBreak: 'break-word',
        }}>
          {message.body}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4, justifyContent: outbound ? 'flex-end' : 'flex-start', fontSize: '0.68rem', color: 'var(--text3)' }}>
          {outbound && message.from_email && <span>{message.from_email}</span>}
          <span>{fmtTime(message.createdAt)}</span>
          {outbound && (
            message.emailed
              ? <i className="bi bi-check2-all" title="Email delivered" style={{ color: 'var(--accent)' }} />
              : <i className="bi bi-exclamation-circle" title="Saved, email not sent" style={{ color: '#d97706' }} />
          )}
        </div>
      </div>
    </div>
  );
}

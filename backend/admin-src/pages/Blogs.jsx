import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useApi, getAccessToken, apiFetch } from '../hooks/useApi';
import { toast } from '../hooks/useToast';

const EMPTY_FORM = { title: '', content: '', excerpt: '', status: 'draft', image_alt: '' };

const TOOLBAR_GROUPS = [
  { key: 'headings', items: [
    { tag: 'h2', label: 'H2', title: 'Überschrift 2' },
    { tag: 'h3', label: 'H3', title: 'Überschrift 3' },
    { tag: 'h4', label: 'H4', title: 'Überschrift 4' },
  ]},
  { key: 'inline', items: [
    { tag: 'strong', label: 'B', title: 'Fett',           style: { fontWeight: 700 } },
    { tag: 'em',     label: 'I', title: 'Kursiv',         style: { fontStyle: 'italic' } },
    { tag: 'u',      label: 'U', title: 'Unterstrichen',  style: { textDecoration: 'underline' } },
    { tag: 's',      label: 'S', title: 'Durchgestrichen',style: { textDecoration: 'line-through' } },
  ]},
  { key: 'structure', items: [
    { tag: 'a',  label: 'Link',    title: 'Hyperlink einfügen' },
    { tag: 'ul', label: '• Liste', title: 'Aufzählung' },
    { tag: 'ol', label: '1. Liste',title: 'Nummerierte Liste' },
  ]},
  { key: 'code', items: [
    { tag: 'code',       label: '</>',  title: 'Code (inline)' },
    { tag: 'pre',        label: '{ }',  title: 'Code-Block' },
    { tag: 'blockquote', label: '"…"',  title: 'Zitat' },
    { tag: 'hr',         label: '——',   title: 'Trennlinie' },
  ]},
];

const VIEW_LABELS = { edit: 'Bearbeiten', split: 'Split', preview: 'Vorschau' };

function stripHtml(html) {
  return html.replace(/<[^>]*>/g, ' ').replace(/&[a-z\d#]+;/gi, ' ');
}

function BlogEditor({ blog, onSave, onCancel }) {
  const [form, setForm] = useState(
    blog
      ? { title: blog.title, content: blog.content, excerpt: blog.excerpt || '', status: blog.status, image_alt: blog.image_alt || '' }
      : { ...EMPTY_FORM }
  );
  const [imageFile, setImageFile]     = useState(null);
  const [imagePreview, setImagePreview] = useState(blog?.image_url || null);
  const [saving, setSaving]           = useState(false);
  const [importing, setImporting]     = useState(false);
  const [error, setError]             = useState('');
  const [viewMode, setViewMode]       = useState('split');
  const taRef         = useRef();
  const htmlImportRef = useRef();
  const pdfImportRef  = useRef();

  function set(k, v) { setForm(f => ({ ...f, [k]: v })); }

  const wordCount = useMemo(() => {
    const text = stripHtml(form.content);
    return text.split(/\s+/).filter(w => w.length > 0).length;
  }, [form.content]);
  const readTime = Math.max(1, Math.ceil(wordCount / 200));

  function insertTag(tag) {
    const ta = taRef.current;
    if (!ta) return;
    const start = ta.selectionStart, end = ta.selectionEnd;
    const sel = ta.value.substring(start, end);
    let ins;
    if (tag === 'ul') {
      ins = `<ul>\n  <li>${sel || 'Element'}</li>\n</ul>`;
    } else if (tag === 'ol') {
      ins = `<ol>\n  <li>${sel || 'Element'}</li>\n</ol>`;
    } else if (tag === 'a') {
      const href = window.prompt('URL:', 'https://');
      if (!href) return;
      ins = `<a href="${href}" target="_blank">${sel || 'Link-Text'}</a>`;
    } else if (tag === 'hr') {
      ins = '\n<hr>\n';
    } else if (tag === 'pre') {
      ins = `<pre><code>${sel || 'code hier'}</code></pre>`;
    } else {
      ins = `<${tag}>${sel || 'Text'}</${tag}>`;
    }
    const newVal = ta.value.substring(0, start) + ins + ta.value.substring(end);
    set('content', newVal);
    setTimeout(() => {
      ta.focus();
      ta.selectionStart = start + ins.length;
      ta.selectionEnd   = start + ins.length;
    }, 0);
  }

  function handleHtmlImport(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const html = ev.target.result;
      try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        doc.querySelectorAll('script, style, iframe, link, meta, noscript').forEach(el => el.remove());
        if (!form.title && doc.title) set('title', doc.title);
        set('content', doc.body?.innerHTML || '');
        toast('HTML erfolgreich importiert!');
      } catch {
        toast('HTML konnte nicht verarbeitet werden', 'error');
      }
    };
    reader.onerror = () => toast('Datei konnte nicht gelesen werden', 'error');
    reader.readAsText(file, 'UTF-8');
    e.target.value = '';
  }

  async function handlePdfImport(e) {
    const file = e.target.files[0];
    if (!file) return;
    setImporting(true);
    try {
      const fd = new FormData();
      fd.append('pdf', file);
      const res  = await apiFetch('/blogs/import/pdf', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Import fehlgeschlagen');
      set('content', data.content);
      toast(`PDF importiert – ${data.pages} Seite${data.pages !== 1 ? 'n' : ''}`);
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setImporting(false);
      e.target.value = '';
    }
  }

  function onImageChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = ev => setImagePreview(ev.target.result);
    reader.readAsDataURL(file);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (imageFile) fd.append('image', imageFile);

      const res = await fetch(`/api/blogs${blog ? `/${blog.id}` : ''}`, {
        method: blog ? 'PUT' : 'POST',
        headers: { Authorization: `Bearer ${getAccessToken()}` },
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.errors?.[0]?.msg || JSON.stringify(data));
      toast(blog ? 'Blog aktualisiert!' : 'Blog erstellt!');
      onSave();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  const divider = (
    <div style={{ width: 1, height: 16, background: 'var(--border)', margin: '0 2px', flexShrink: 0 }} />
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 style={{ color: 'var(--text)', fontSize: '1.3rem', fontWeight: 600, letterSpacing: '-0.03em' }}>
            {blog ? 'Blog bearbeiten' : 'Neuer Blog'}
          </h2>
          <p style={{ color: 'var(--text3)', fontSize: '0.8rem', marginTop: 3 }}>
            Inhalt erstellen und veröffentlichen
          </p>
        </div>
        <button className="btn-outline" onClick={onCancel}>
          <i className="bi bi-arrow-left" />Zurück
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 288px', gap: '0.875rem' }}>
          {/* Main editor */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {/* Title */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Titel *</label>
              <input
                value={form.title}
                onChange={e => set('title', e.target.value)}
                placeholder="Blog-Titel…"
                required
                style={{ fontSize: '1rem', fontWeight: 500 }}
              />
            </div>

            {/* Toolbar */}
            <div style={{
              display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center',
              padding: '5px 0',
              borderTop: '1px solid var(--border)',
              borderBottom: '1px solid var(--border)',
            }}>
              {TOOLBAR_GROUPS.map((group, gi) => (
                <React.Fragment key={group.key}>
                  {gi > 0 && divider}
                  {group.items.map(({ tag, label, title, style: btnStyle }) => (
                    <button
                      key={tag} type="button" className="btn-outline btn-sm"
                      onClick={() => insertTag(tag)} title={title}
                      style={{ padding: '2px 6px', fontSize: '0.75rem', minWidth: 26, ...(btnStyle || {}) }}
                    >
                      {label}
                    </button>
                  ))}
                </React.Fragment>
              ))}

              {/* View mode */}
              <div style={{ marginLeft: 'auto', display: 'flex', gap: 1 }}>
                {Object.entries(VIEW_LABELS).map(([mode, label]) => (
                  <button
                    key={mode} type="button"
                    onClick={() => setViewMode(mode)}
                    className="btn-outline btn-sm"
                    style={{
                      padding: '2px 8px', fontSize: '0.73rem',
                      ...(viewMode === mode
                        ? { background: 'var(--accent)', color: '#fff', borderColor: 'var(--accent)' }
                        : {}),
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Import bar */}
            <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
              <input ref={htmlImportRef} type="file" accept=".html,.htm" style={{ display: 'none' }} onChange={handleHtmlImport} />
              <input ref={pdfImportRef}  type="file" accept=".pdf"       style={{ display: 'none' }} onChange={handlePdfImport} />

              <button type="button" className="btn-outline btn-sm" onClick={() => htmlImportRef.current?.click()}>
                <i className="bi bi-file-earmark-code" /> HTML
              </button>
              <button type="button" className="btn-outline btn-sm" disabled={importing} onClick={() => pdfImportRef.current?.click()}>
                {importing
                  ? <><span className="spinner" style={{ width: 10, height: 10 }} />Importiere…</>
                  : <><i className="bi bi-file-earmark-pdf" /> PDF</>}
              </button>

              <span style={{ marginLeft: 'auto', color: 'var(--text3)', fontSize: '0.72rem' }}>
                {wordCount} Wörter · {readTime} Min.
              </span>
            </div>

            {/* Editor / Preview pane */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: viewMode === 'split' ? '1fr 1fr' : '1fr',
              gap: 6,
              minHeight: 380,
            }}>
              {viewMode !== 'preview' && (
                <textarea
                  ref={taRef}
                  value={form.content}
                  onChange={e => set('content', e.target.value)}
                  placeholder="HTML-Inhalt eingeben oder Datei importieren…"
                  required
                  className="font-mono"
                  style={{ minHeight: 380, fontSize: '0.77rem', lineHeight: 1.65, resize: 'vertical' }}
                />
              )}
              {viewMode !== 'edit' && (
                <div
                  style={{
                    minHeight: 380,
                    padding: '1rem 1.125rem',
                    border: '1px solid var(--border)',
                    borderRadius: 6,
                    overflow: 'auto',
                    background: '#fff',
                    lineHeight: 1.75,
                    fontSize: '0.875rem',
                    color: 'var(--text)',
                  }}
                  dangerouslySetInnerHTML={{
                    __html: form.content || '<p style="color:#999;font-style:italic;margin:0">Vorschau erscheint hier…</p>',
                  }}
                />
              )}
            </div>

            {/* Excerpt */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Auszug (optional)</label>
              <textarea
                value={form.excerpt}
                onChange={e => set('excerpt', e.target.value)}
                placeholder="Kurze Zusammenfassung für die Blog-Liste…"
                style={{ minHeight: 64, resize: 'vertical' }}
              />
            </div>
          </div>

          {/* Sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            <div className="card">
              <h6 style={{ color: 'var(--text)', marginBottom: '0.875rem', fontWeight: 600, fontSize: '0.8125rem' }}>
                Einstellungen
              </h6>

              <div className="form-group">
                <label className="form-label">Status</label>
                <select value={form.status} onChange={e => set('status', e.target.value)}>
                  <option value="draft">Entwurf</option>
                  <option value="published">Veröffentlicht</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Titelbild</label>
                <input type="file" accept="image/jpeg,image/png,image/gif,image/webp" onChange={onImageChange} />
                {imagePreview && (
                  <div style={{ marginTop: '0.625rem' }}>
                    <img src={imagePreview} alt="Vorschau" style={{
                      width: '100%', maxHeight: 130, borderRadius: 7, objectFit: 'cover',
                      border: '1px solid var(--border)',
                    }} />
                    <button type="button" className="btn-outline btn-sm w-full"
                      onClick={() => { setImageFile(null); setImagePreview(null); }}
                      style={{ justifyContent: 'center', marginTop: '0.4rem' }}>
                      <i className="bi bi-x-circle" /> Entfernen
                    </button>
                  </div>
                )}
                <p style={{ color: 'var(--text3)', fontSize: '0.72rem', marginTop: '0.3rem' }}>
                  JPEG, PNG, GIF, WebP – max. 5 MB
                </p>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Bild Alt-Text</label>
                <input
                  value={form.image_alt}
                  onChange={e => set('image_alt', e.target.value)}
                  placeholder="Bildbeschreibung…"
                />
              </div>
            </div>

            {error && (
              <div className="alert alert-error">
                <i className="bi bi-exclamation-circle" />{error}
              </div>
            )}

            <button type="submit" className="btn-primary w-full" disabled={saving}
              style={{ padding: '0.6rem', justifyContent: 'center' }}>
              {saving ? <span className="spinner" /> : <i className="bi bi-floppy" />}
              {saving ? 'Speichern…' : 'Speichern'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

export default function Blogs() {
  const { request, loading } = useApi();
  const [blogs, setBlogs]   = useState([]);
  const [view, setView]     = useState('list');
  const [editBlog, setEditBlog] = useState(null);

  async function load() {
    try { setBlogs(await request('/blogs/admin/all')); } catch {}
  }

  useEffect(() => { load(); }, []);

  async function handleDelete(id, title) {
    if (!confirm(`Blog "${title}" wirklich löschen?`)) return;
    try {
      await request(`/blogs/${id}`, { method: 'DELETE' });
      toast('Blog gelöscht');
      load();
    } catch (err) { toast(err.message, 'error'); }
  }

  function openEditor(blog = null) { setEditBlog(blog); setView('editor'); }
  function closeEditor()           { setView('list'); setEditBlog(null); load(); }
  function fmt(d) { return d ? new Date(d).toLocaleDateString('de-DE') : '–'; }

  if (view === 'editor') {
    return (
      <BlogEditor
        blog={editBlog}
        onSave={closeEditor}
        onCancel={() => { setView('list'); setEditBlog(null); }}
      />
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 style={{ color: 'var(--text)', fontSize: '1.3rem', fontWeight: 600, letterSpacing: '-0.03em' }}>
            Blogs
          </h2>
          <p style={{ color: 'var(--text3)', fontSize: '0.8rem', marginTop: 3 }}>
            Alle Beiträge verwalten
          </p>
        </div>
        <button className="btn-primary" onClick={() => openEditor()}>
          <i className="bi bi-plus-lg" />Neuer Blog
        </button>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text3)' }}>
            <span className="spinner" style={{ width: 18, height: 18, borderTopColor: 'var(--accent)', borderColor: 'rgba(0,0,0,0.08)' }} />
          </div>
        ) : blogs.length === 0 ? (
          <div style={{ padding: '3.5rem', textAlign: 'center', color: 'var(--text3)' }}>
            <i className="bi bi-journal-x" style={{ fontSize: '1.75rem', display: 'block', marginBottom: '0.75rem' }} />
            <p style={{ marginBottom: '1.25rem', fontSize: '0.8125rem' }}>Noch keine Blogs. Erstelle deinen ersten!</p>
            <button className="btn-primary" onClick={() => openEditor()} style={{ margin: '0 auto' }}>
              <i className="bi bi-plus-lg" />Jetzt erstellen
            </button>
          </div>
        ) : (
          <table style={{ width: '100%' }}>
            <thead style={{ background: 'var(--bg3)' }}>
              <tr>
                {['Bild', 'Titel', 'Status', 'Datum', 'Views', ''].map((h, i) => (
                  <th key={i}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {blogs.map(b => (
                <tr key={b.id}>
                  <td style={{ width: 56 }}>
                    {b.image_url
                      ? <img src={b.image_url} alt="" style={{
                          width: 42, height: 32, objectFit: 'cover',
                          borderRadius: 6, border: '1px solid var(--border)',
                        }} />
                      : <div style={{
                          width: 42, height: 32, borderRadius: 6,
                          background: 'rgba(12,12,12,0.05)',
                          border: '1px solid var(--border)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          <i className="bi bi-image" style={{ color: 'var(--text3)', fontSize: '0.875rem' }} />
                        </div>}
                  </td>
                  <td style={{ maxWidth: 260 }}>
                    <div className="truncate" style={{ color: 'var(--text)', fontWeight: 500, fontSize: '0.8125rem' }}>
                      {b.title}
                    </div>
                    <div style={{ color: 'var(--text3)', fontSize: '0.7rem', marginTop: 1 }}>/{b.slug}</div>
                  </td>
                  <td>
                    <span className={`badge badge-${b.status}`}>
                      <i className={`bi bi-${b.status === 'published' ? 'check-circle-fill' : 'file-earmark'}`} />
                      {b.status === 'published' ? 'Veröffentlicht' : 'Entwurf'}
                    </span>
                  </td>
                  <td style={{ color: 'var(--text3)', fontSize: '0.78rem' }}>{fmt(b.created_at)}</td>
                  <td style={{ color: 'var(--text3)', fontSize: '0.8rem' }}>{b.views ?? 0}</td>
                  <td>
                    <div className="flex gap-1">
                      <button className="btn-outline btn-sm btn-icon" onClick={() => openEditor(b)} title="Bearbeiten">
                        <i className="bi bi-pencil" />
                      </button>
                      <button className="btn-danger btn-sm btn-icon" onClick={() => handleDelete(b.id, b.title)} title="Löschen">
                        <i className="bi bi-trash" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

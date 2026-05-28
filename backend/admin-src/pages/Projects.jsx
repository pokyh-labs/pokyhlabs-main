import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useApi, apiFetch } from '../hooks/useApi';
import { uploadImage } from '../hooks/useUpload';
import { toast } from '../hooks/useToast';

const STATUSES = ['live', 'wip', 'concept'];
const STATUS_COLOR = { live: '#22c55e', wip: '#f59e0b', concept: '#6b7280' };
const CURRENT_YEAR = new Date().getFullYear();
const MAX_GALLERY = 12;
const PROJ_LANGS = ['de', 'en', 'it'];
const PROJ_LANG_LABELS = { de: '🇩🇪 DE', en: '🇬🇧 EN', it: '🇮🇹 IT' };
const EMPTY_PROJ_SLOT = { title: '', description: '', image_alt: '' };

const emptyForm = () => ({
  translations: {
    de: { ...EMPTY_PROJ_SLOT },
    en: { ...EMPTY_PROJ_SLOT },
    it: { ...EMPTY_PROJ_SLOT },
  },
  tags: '', url: '', year: CURRENT_YEAR, status: 'live', sort_order: 0,
});

export default function Projects() {
  const { request } = useApi();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading]   = useState(false);
  const [modal, setModal]       = useState(false);
  const [form, setForm]         = useState(emptyForm());
  const [activeTab, setActiveTab] = useState('de');
  const [tabErrors, setTabErrors] = useState({});
  const [editId, setEditId]     = useState(null);
  const [saving, setSaving]     = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [formError, setFormError] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [removeImage, setRemoveImage] = useState(false);
  const fileRef = useRef(null);
  // Gallery: mix of already-uploaded {url, alt} items and pending local files
  // {file, previewUrl, alt}. Pending files are uploaded on save.
  const [gallery, setGallery] = useState([]);
  const [galleryUploading, setGalleryUploading] = useState(false);
  const galleryFileRef = useRef(null);

  const loadProjects = useCallback(async () => {
    setLoading(true);
    try {
      const data = await request('/projects/admin/all');
      setProjects(data.projects || []);
    } catch (err) {
      toast(`Laden fehlgeschlagen: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  }, [request]);

  useEffect(() => { loadProjects(); }, [loadProjects]);

  function openCreate() {
    setForm(emptyForm());
    setActiveTab('de');
    setTabErrors({});
    setEditId(null);
    setFormError('');
    setImageFile(null);
    setImagePreview(null);
    setRemoveImage(false);
    setGallery([]);
    setModal(true);
  }

  function openEdit(p) {
    const t = p.translations && typeof p.translations === 'object' && p.translations.de
      ? p.translations
      : { de: { title: p.title || '', description: p.description || '', image_alt: p.image_alt || '' }, en: { ...EMPTY_PROJ_SLOT }, it: { ...EMPTY_PROJ_SLOT } };
    setForm({
      translations: {
        de: { ...EMPTY_PROJ_SLOT, ...t.de },
        en: { ...EMPTY_PROJ_SLOT, ...(t.en || {}) },
        it: { ...EMPTY_PROJ_SLOT, ...(t.it || {}) },
      },
      tags:        Array.isArray(p.tags) ? p.tags.join(', ') : '',
      url:         p.url || '',
      year:        p.year || CURRENT_YEAR,
      status:      p.status || 'live',
      sort_order:  p.sort_order ?? 0,
    });
    setActiveTab('de');
    setTabErrors({});
    setEditId(p.id);
    setFormError('');
    setImageFile(null);
    setImagePreview(p.image_url || null);
    setRemoveImage(false);
    setGallery(Array.isArray(p.gallery) ? p.gallery.map(it => ({ url: it.url, alt: it.alt || '' })) : []);
    setModal(true);
  }

  function closeModal() {
    setModal(false);
    setEditId(null);
    setFormError('');
    setTabErrors({});
    setImageFile(null);
    setImagePreview(null);
    setRemoveImage(false);
    // Revoke any pending local previews so we don't leak object URLs.
    setGallery(prev => {
      for (const it of prev) if (it.previewUrl) URL.revokeObjectURL(it.previewUrl);
      return [];
    });
  }

  function setField(key) {
    return e => setForm(f => ({ ...f, [key]: e.target.value }));
  }

  function setSlotField(lang, key, val) {
    setForm(f => ({ ...f, translations: { ...f.translations, [lang]: { ...f.translations[lang], [key]: val } } }));
  }

  function handleImageChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setRemoveImage(false);
    const reader = new FileReader();
    reader.onload = ev => setImagePreview(ev.target.result);
    reader.readAsDataURL(file);
  }

  function handleRemoveImage() {
    setImageFile(null);
    setImagePreview(null);
    setRemoveImage(true);
    if (fileRef.current) fileRef.current.value = '';
  }

  // Gallery handlers — pending files are uploaded only on save, so the user can
  // pick → reorder → remove without burning storage on canceled edits.
  function handleAddGallery(e) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setGallery(prev => {
      const room = Math.max(0, MAX_GALLERY - prev.length);
      const taken = files.slice(0, room).map(file => ({
        file,
        previewUrl: URL.createObjectURL(file),
        alt: '',
      }));
      return [...prev, ...taken];
    });
    if (galleryFileRef.current) galleryFileRef.current.value = '';
  }

  function removeGalleryItem(idx) {
    setGallery(prev => {
      const next = prev.slice();
      const [removed] = next.splice(idx, 1);
      if (removed?.previewUrl) URL.revokeObjectURL(removed.previewUrl);
      return next;
    });
  }

  function moveGalleryItem(idx, dir) {
    setGallery(prev => {
      const target = idx + dir;
      if (target < 0 || target >= prev.length) return prev;
      const next = prev.slice();
      [next[idx], next[target]] = [next[target], next[idx]];
      return next;
    });
  }

  function setGalleryAlt(idx, alt) {
    setGallery(prev => prev.map((it, i) => (i === idx ? { ...it, alt } : it)));
  }

  async function handleSave(e) {
    e.preventDefault();
    setFormError('');

    // Validate all 3 language slots
    const errs = {};
    for (const l of PROJ_LANGS) {
      const slot = form.translations[l];
      if (!slot.title?.trim()) errs[l] = 'Titel fehlt';
      else if (!slot.description?.trim()) errs[l] = 'Beschreibung fehlt';
    }
    if (Object.keys(errs).length) {
      setTabErrors(errs);
      const firstBad = PROJ_LANGS.find(l => errs[l]);
      setActiveTab(firstBad);
      setFormError(`Bitte ${PROJ_LANG_LABELS[firstBad]}-Felder ausfüllen: ${errs[firstBad]}`);
      return;
    }
    setTabErrors({});
    setSaving(true);

    try {
      // Step 1: upload image via one-time presign token if a new file was selected
      let finalImageUrl = undefined;
      if (imageFile) {
        finalImageUrl = await uploadImage(imageFile);
      } else if (removeImage) {
        finalImageUrl = null;
      }

      // Step 1b: upload any pending gallery files (in current order).
      let resolvedGallery = gallery;
      if (gallery.some(it => it.file)) {
        setGalleryUploading(true);
        try {
          resolvedGallery = await Promise.all(
            gallery.map(async (it) => {
              if (it.file) {
                const url = await uploadImage(it.file);
                return { url, alt: (it.alt || '').trim() };
              }
              return { url: it.url, alt: (it.alt || '').trim() };
            })
          );
        } finally {
          setGalleryUploading(false);
        }
      }

      // Step 2: send the rest as JSON
      const tagArray = form.tags.split(',').map(t => t.trim()).filter(Boolean);
      const builtTranslations = {};
      for (const l of PROJ_LANGS) {
        builtTranslations[l] = {
          title:       form.translations[l].title.trim(),
          description: form.translations[l].description.trim(),
          image_alt:   form.translations[l].image_alt.trim() || '',
        };
      }
      const payload = {
        translations: builtTranslations,
        tags:        tagArray,
        url:         form.url.trim() || undefined,
        gallery:     resolvedGallery.map(it => ({ url: it.url, alt: it.alt || null })),
        year:        parseInt(form.year, 10) || CURRENT_YEAR,
        status:      form.status,
        sort_order:  parseInt(form.sort_order, 10) || 0,
      };
      if (finalImageUrl !== undefined) payload.image_url = finalImageUrl;
      if (removeImage && finalImageUrl === null) payload.remove_image = true;

      const res = await apiFetch(
        editId ? `/projects/${editId}` : '/projects',
        { method: editId ? 'PUT' : 'POST', body: JSON.stringify(payload) }
      );
      const body = await res.json().catch(() => ({}));

      if (!res.ok) {
        const msg = body.errors?.length
          ? body.errors.map(e => e.msg || e.message).join(' · ')
          : (body.error || body.message || `Serverfehler (${res.status})`);
        setFormError(msg);
        return;
      }

      toast(editId ? 'Projekt aktualisiert' : 'Projekt erstellt', 'success');
      closeModal();
      await loadProjects();
    } catch (err) {
      setFormError(`Fehler: ${err.message}`);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Projekt wirklich löschen?')) return;
    setDeleting(id);
    try {
      const res = await apiFetch(`/projects/${id}`, { method: 'DELETE' });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) { toast(body.error || `Löschen fehlgeschlagen (${res.status})`, 'error'); return; }
      toast('Projekt gelöscht', 'success');
      await loadProjects();
    } catch (err) {
      toast(`Netzwerkfehler: ${err.message}`, 'error');
    } finally {
      setDeleting(null);
    }
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600 }}>Projekte</h2>
          <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: 'var(--text3)' }}>
            {projects.length} Projekt{projects.length !== 1 ? 'e' : ''}
          </p>
        </div>
        <button className="btn-primary" onClick={openCreate}>
          <i className="bi bi-plus-lg" style={{ marginRight: 6 }} />
          Neues Projekt
        </button>
      </div>

      {/* List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text3)' }}>
          <div className="loading-spinner" style={{ margin: '0 auto 1rem' }} />
          Lade Projekte…
        </div>
      ) : projects.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 2rem', color: 'var(--text3)' }}>
          <i className="bi bi-grid" style={{ fontSize: '2.5rem', display: 'block', marginBottom: '1rem', opacity: 0.3 }} />
          <p style={{ margin: 0 }}>Noch keine Projekte. Füge das erste hinzu!</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {projects.map(p => (
            <ProjectRow
              key={p.id}
              project={p}
              onEdit={() => openEdit(p)}
              onDelete={() => handleDelete(p.id)}
              deleting={deleting === p.id}
            />
          ))}
        </div>
      )}

      {/* Modal */}
      {modal && (
        <Modal title={editId ? 'Projekt bearbeiten' : 'Neues Projekt'} onClose={closeModal}>
          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            {formError && (
              <div className="alert alert-error">
                <i className="bi bi-exclamation-triangle-fill" />
                {formError}
              </div>
            )}

            {/* Language tab strip */}
            <div style={{ display: 'flex', gap: 4 }}>
              {PROJ_LANGS.map(l => (
                <button
                  key={l}
                  type="button"
                  onClick={() => setActiveTab(l)}
                  style={{
                    padding: '5px 12px',
                    borderRadius: 7,
                    border: activeTab === l ? '1.5px solid var(--accent)' : '1.5px solid var(--border)',
                    background: activeTab === l ? 'rgba(89,61,248,0.08)' : 'var(--bg2)',
                    color: activeTab === l ? 'var(--accent)' : tabErrors[l] ? 'var(--danger)' : 'var(--text2)',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  {PROJ_LANG_LABELS[l]}
                  {tabErrors[l] && <i className="bi bi-exclamation-circle-fill" style={{ fontSize: '0.62rem', color: 'var(--danger)' }} />}
                </button>
              ))}
            </div>

            <Field label={`Titel * (${PROJ_LANG_LABELS[activeTab]})`}>
              <input className="input" value={form.translations[activeTab].title} onChange={e => setSlotField(activeTab, 'title', e.target.value)} maxLength={255} placeholder="z.B. pokyh.studio Website" />
            </Field>

            <Field label={`Beschreibung * (${PROJ_LANG_LABELS[activeTab]})`}>
              <textarea className="input" value={form.translations[activeTab].description} onChange={e => setSlotField(activeTab, 'description', e.target.value)} rows={3} maxLength={2000} placeholder="Kurze Projektbeschreibung…" style={{ resize: 'vertical' }} />
            </Field>

            <Field label="Tags (kommagetrennt)">
              <input className="input" value={form.tags} onChange={setField('tags')} placeholder="Next.js, TypeScript, GSAP" />
            </Field>

            <Field label="URL (optional)">
              <input className="input" value={form.url} onChange={setField('url')} placeholder="https://example.com" />
            </Field>

            {/* Image upload */}
            <Field label="Vorschau-Bild (optional)">
              {imagePreview ? (
                <div style={{ position: 'relative', display: 'inline-block' }}>
                  <img
                    src={imagePreview}
                    alt="Vorschau"
                    style={{ width: '100%', maxHeight: 180, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--border)', display: 'block' }}
                  />
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    style={{
                      position: 'absolute', top: 6, right: 6,
                      background: 'rgba(0,0,0,0.65)', color: '#fff',
                      border: 'none', borderRadius: 6, padding: '3px 7px',
                      cursor: 'pointer', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: 4,
                    }}
                  >
                    <i className="bi bi-trash3" /> Entfernen
                  </button>
                </div>
              ) : (
                <label style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  gap: 8, padding: '1.25rem', border: '2px dashed var(--border)', borderRadius: 8,
                  cursor: 'pointer', color: 'var(--text3)', transition: 'border-color 150ms',
                }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                >
                  <i className="bi bi-image" style={{ fontSize: '1.5rem' }} />
                  <span style={{ fontSize: '0.8rem' }}>Klicken zum Hochladen (JPG, PNG, WebP · max {process.env.MAX_FILE_SIZE_MB || 5} MB)</span>
                  <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={handleImageChange} style={{ display: 'none' }} />
                </label>
              )}
            </Field>

            {imagePreview && (
              <Field label={`Bild-Beschreibung (${PROJ_LANG_LABELS[activeTab]})`}>
                <input className="input" value={form.translations[activeTab].image_alt} onChange={e => setSlotField(activeTab, 'image_alt', e.target.value)} maxLength={255} placeholder="Screenshot der Website" />
              </Field>
            )}

            <Field label={`Galerie (optional, max ${MAX_GALLERY})`}>
              <GallerySection
                items={gallery}
                onAdd={handleAddGallery}
                onRemove={removeGalleryItem}
                onMove={moveGalleryItem}
                onAlt={setGalleryAlt}
                inputRef={galleryFileRef}
                uploading={galleryUploading}
              />
            </Field>

            <div className="grid-3-form" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
              <Field label="Jahr *">
                <input className="input" type="number" value={form.year} onChange={setField('year')} required min={1900} max={CURRENT_YEAR + 5} />
              </Field>
              <Field label="Status">
                <select className="input" value={form.status} onChange={setField('status')}>
                  {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </Field>
              <Field label="Reihenfolge">
                <input className="input" type="number" value={form.sort_order} onChange={setField('sort_order')} min={0} max={9999} />
              </Field>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 4 }}>
              <button type="button" className="btn-outline" onClick={closeModal}>Abbrechen</button>
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? <><span className="spinner" style={{ width: 14, height: 14, marginRight: 6 }} />Speichern…</> : 'Speichern'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

function ProjectRow({ project, onEdit, onDelete, deleting }) {
  const tags = Array.isArray(project.tags) ? project.tags : [];
  const deSlot = project.translations?.de || {};
  const displayTitle = deSlot.title || project.title || '—';
  const displayDesc = deSlot.description || project.description || '';
  const displayAlt = deSlot.image_alt || project.image_alt || '';
  return (
    <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
      {/* Thumbnail */}
      {project.image_url ? (
        <img
          src={project.image_url}
          alt={displayAlt}
          style={{ width: 64, height: 44, objectFit: 'cover', borderRadius: 6, border: '1px solid var(--border)', flexShrink: 0 }}
        />
      ) : (
        <div style={{ width: 64, height: 44, borderRadius: 6, background: 'var(--bg3)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <i className="bi bi-image" style={{ color: 'var(--text3)', fontSize: '1.1rem', opacity: 0.4 }} />
        </div>
      )}

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{displayTitle}</span>
          <span style={{ fontSize: '0.72rem', fontWeight: 600, padding: '2px 8px', borderRadius: 999, background: (STATUS_COLOR[project.status] || '#6b7280') + '22', color: STATUS_COLOR[project.status] || '#6b7280' }}>
            {project.status}
          </span>
          <span style={{ fontSize: '0.72rem', color: 'var(--text3)' }}>{project.year}</span>
        </div>
        <p style={{ margin: '3px 0 5px', fontSize: '0.8rem', color: 'var(--text3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 500 }}>
          {displayDesc}
        </p>
        {tags.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {tags.map(t => (
              <span key={t} style={{ fontSize: '0.68rem', padding: '2px 7px', borderRadius: 999, border: '1px solid var(--border)', color: 'var(--text3)' }}>{t}</span>
            ))}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
        {project.url && (
          <a href={project.url} target="_blank" rel="noopener noreferrer" className="btn-outline btn-icon" title="Website öffnen" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '0.4rem 0.5rem' }}>
            <i className="bi bi-box-arrow-up-right" />
          </a>
        )}
        <button className="btn-outline btn-icon" onClick={onEdit} title="Bearbeiten"><i className="bi bi-pencil" /></button>
        <button className="btn-danger btn-icon" onClick={onDelete} disabled={deleting} title="Löschen">
          {deleting ? <span className="spinner" style={{ width: 14, height: 14 }} /> : <i className="bi bi-trash3" />}
        </button>
      </div>
    </div>
  );
}

function Modal({ title, onClose, children }) {
  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose(); }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 14, padding: '1.5rem', width: '100%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>{title}</h3>
          <button className="btn-outline btn-icon" onClick={onClose}><i className="bi bi-x-lg" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 500, color: 'var(--text3)', marginBottom: 5 }}>{label}</label>
      {children}
    </div>
  );
}

function GallerySection({ items, onAdd, onRemove, onMove, onAlt, inputRef, uploading }) {
  const full = items.length >= MAX_GALLERY;
  return (
    <div>
      {items.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 10, marginBottom: items.length ? 10 : 0 }}>
          {items.map((it, idx) => {
            const src = it.previewUrl || it.url;
            return (
              <div key={(it.url || it.previewUrl) + idx} style={{ position: 'relative', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden', background: 'var(--bg3)' }}>
                <div style={{ position: 'relative', paddingBottom: '66%' }}>
                  <img src={src} alt={it.alt || ''} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                  {it.file && (
                    <span style={{ position: 'absolute', top: 6, left: 6, background: 'rgba(0,0,0,0.7)', color: '#fff', borderRadius: 4, padding: '2px 6px', fontSize: '0.65rem', letterSpacing: '0.5px' }}>
                      NEU
                    </span>
                  )}
                </div>
                <div style={{ padding: 6, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <input
                    className="input"
                    value={it.alt || ''}
                    onChange={(e) => onAlt(idx, e.target.value)}
                    maxLength={255}
                    placeholder="Alt-Text"
                    style={{ fontSize: '0.72rem', padding: '4px 6px' }}
                  />
                  <div style={{ display: 'flex', gap: 4, justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button type="button" onClick={() => onMove(idx, -1)} disabled={idx === 0} className="btn-outline btn-icon" style={{ padding: '3px 7px', opacity: idx === 0 ? 0.4 : 1 }} title="Nach oben">
                        <i className="bi bi-arrow-left" />
                      </button>
                      <button type="button" onClick={() => onMove(idx, 1)} disabled={idx === items.length - 1} className="btn-outline btn-icon" style={{ padding: '3px 7px', opacity: idx === items.length - 1 ? 0.4 : 1 }} title="Nach unten">
                        <i className="bi bi-arrow-right" />
                      </button>
                    </div>
                    <button type="button" onClick={() => onRemove(idx)} className="btn-danger btn-icon" style={{ padding: '3px 7px' }} title="Entfernen">
                      <i className="bi bi-trash3" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!full && (
        <label style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          gap: 6, padding: '1rem', border: '2px dashed var(--border)', borderRadius: 8,
          cursor: uploading ? 'wait' : 'pointer', color: 'var(--text3)', transition: 'border-color 150ms',
        }}
          onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
          onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
        >
          <i className="bi bi-images" style={{ fontSize: '1.25rem' }} />
          <span style={{ fontSize: '0.75rem', textAlign: 'center' }}>
            {uploading ? 'Lade Galerie hoch…' : `Bilder hinzufügen (${items.length}/${MAX_GALLERY})`}
          </span>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            multiple
            onChange={onAdd}
            disabled={uploading}
            style={{ display: 'none' }}
          />
        </label>
      )}
    </div>
  );
}

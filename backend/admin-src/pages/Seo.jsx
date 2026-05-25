import React, { useEffect, useState, useCallback } from 'react';
import { useApi } from '../hooks/useApi';
import { toast } from '../hooks/useToast';

// ── Tag/Keyword input ──────────────────────────────────────────

function TagInput({ tags = [], onChange, placeholder = 'Tag eingeben, Enter drücken…' }) {
  const [input, setInput] = useState('');

  function add() {
    const val = input.trim();
    if (!val || tags.includes(val)) { setInput(''); return; }
    onChange([...tags, val]);
    setInput('');
  }

  function remove(tag) { onChange(tags.filter(t => t !== tag)); }

  function onKey(e) {
    if (e.key === 'Enter') { e.preventDefault(); add(); }
    if (e.key === 'Backspace' && !input && tags.length) {
      onChange(tags.slice(0, -1));
    }
  }

  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden', background: 'var(--bg4)', transition: 'border-color 150ms, box-shadow 150ms' }}
      onFocusCapture={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.boxShadow = '0 0 0 3.5px var(--accent-dim)'; }}
      onBlurCapture={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none'; }}
    >
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, padding: tags.length ? '8px 10px 4px' : '0 10px', minHeight: tags.length ? 'auto' : 0 }}>
        {tags.map(tag => (
          <span key={tag} style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            padding: '3px 10px', borderRadius: 99,
            background: 'var(--accent-dim)', border: '1px solid rgba(89,61,248,0.22)',
            color: 'var(--accent)', fontSize: '0.75rem', fontWeight: 500,
          }}>
            {tag}
            <button type="button" onClick={() => remove(tag)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent)', padding: 0, lineHeight: 1, opacity: 0.7, display: 'flex' }}>
              <i className="bi bi-x" style={{ fontSize: '0.8rem' }} />
            </button>
          </span>
        ))}
      </div>
      <input
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={onKey}
        placeholder={tags.length === 0 ? placeholder : 'Weiterer Tag…'}
        style={{ border: 'none', background: 'transparent', padding: '10px 12px', outline: 'none', width: '100%', fontSize: '0.875rem', color: 'var(--text)' }}
      />
      {tags.length > 0 && (
        <div style={{ padding: '0 12px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--text3)' }}>{tags.length} Tags · Enter zum Hinzufügen</span>
          <button type="button" onClick={() => onChange([])} style={{ background: 'none', border: 'none', fontSize: '0.7rem', color: 'var(--text3)', cursor: 'pointer', padding: 0 }}>
            Alle löschen
          </button>
        </div>
      )}
    </div>
  );
}

function Field({ label, hint, children }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 500, color: 'var(--text3)', marginBottom: 5 }}>{label}</label>
      {children}
      {hint && <p style={{ fontSize: '0.71rem', color: 'var(--text3)', marginTop: 4 }}>{hint}</p>}
    </div>
  );
}

function Section({ title, icon, children }) {
  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingBottom: 12, borderBottom: '1px solid var(--border)' }}>
        <div style={{ width: 32, height: 32, borderRadius: 9, background: 'var(--accent-dim)', border: '1px solid rgba(89,61,248,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)', flexShrink: 0 }}>
          <i className={`bi bi-${icon}`} style={{ fontSize: '0.85rem' }} />
        </div>
        <h3 style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text)', letterSpacing: '-0.02em', margin: 0 }}>{title}</h3>
      </div>
      {children}
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────

export default function Seo() {
  const { request } = useApi();
  const [config,  setConfig]  = useState(null);
  const [saving,  setSaving]  = useState(false);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const cfg = await request('/seo/config');
      setConfig(cfg);
    } catch (err) {
      setError('Konfiguration konnte nicht geladen werden: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [request]);

  useEffect(() => { load(); }, [load]);

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await request('/seo/config', {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(config),
      });
      toast('SEO gespeichert ✓', 'success');
    } catch (err) {
      toast(err.message || 'Fehler beim Speichern', 'error');
    } finally {
      setSaving(false);
    }
  }

  function set(key, val)            { setConfig(c => ({ ...c, [key]: val })); }
  function setNested(key, sub, val) { setConfig(c => ({ ...c, [key]: { ...c[key], [sub]: val } })); }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '5rem' }}>
      <span className="spinner" style={{ width: 22, height: 22 }} />
    </div>
  );

  if (error) return (
    <div className="alert alert-error">
      <i className="bi bi-exclamation-triangle-fill" />
      {error}
      <button type="button" className="btn-outline btn-sm" onClick={load} style={{ marginLeft: 'auto' }}>Erneut versuchen</button>
    </div>
  );

  if (!config) return null;

  const descLen = (config.description?.de || '').length;

  return (
    <form onSubmit={handleSave}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600 }}>SEO</h2>
          <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: 'var(--text3)' }}>Metadaten und Keywords für Suchmaschinen</p>
        </div>
        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? <><span className="spinner" style={{ width: 14, height: 14, marginRight: 6 }} />Speichern…</> : <><i className="bi bi-floppy2-fill" style={{ marginRight: 6 }} />Speichern</>}
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>

        {/* Basis */}
        <Section title="Website" icon="globe2">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Site-Name">
              <input className="input" value={config.name || ''} onChange={e => set('name', e.target.value)} placeholder="pokyh.studio" />
            </Field>
            <Field label="Canonical URL">
              <input className="input" value={config.url || ''} onChange={e => set('url', e.target.value)} placeholder="https://pokyh.studio" />
            </Field>
          </div>
          <Field label="Seitentitel">
            <input className="input" value={config.title?.default || ''} onChange={e => setNested('title', 'default', e.target.value)} placeholder="pokyh.studio – Design & Development" />
          </Field>
          <Field label="Titel-Template" hint="%s wird durch den Seitennamen ersetzt, z.B. «Über uns | pokyh.studio»">
            <input className="input" value={config.title?.template || ''} onChange={e => setNested('title', 'template', e.target.value)} placeholder="%s | pokyh.studio" />
          </Field>
        </Section>

        {/* Beschreibung */}
        <Section title="Beschreibung" icon="card-text">
          <Field
            label="Meta-Beschreibung"
            hint={`${descLen} Zeichen${descLen > 160 ? ' — über 160, wird möglicherweise abgeschnitten' : ' · ideal: 120–160'}`}
          >
            <textarea
              className="input"
              value={config.description?.de || ''}
              onChange={e => setNested('description', 'de', e.target.value)}
              rows={3}
              style={{ resize: 'vertical' }}
              placeholder="Kurze Beschreibung der Website für Google & Co. (120–160 Zeichen ideal)"
            />
          </Field>
        </Section>

        {/* Keywords */}
        <Section title="Keywords / Tags" icon="tags-fill">
          <Field label="Keywords" hint="Enter oder Komma drücken um einen Tag hinzuzufügen. Werden als Meta-Keywords und strukturierte Daten verwendet.">
            <TagInput
              tags={config.keywords || []}
              onChange={kws => set('keywords', kws)}
              placeholder="Keyword eingeben, Enter drücken…"
            />
          </Field>
        </Section>

        {/* Verifikation */}
        <Section title="Suchmaschinen-Verifikation" icon="patch-check-fill">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Google Search Console">
              <input className="input" value={config.verification?.google || ''} onChange={e => setNested('verification', 'google', e.target.value)} placeholder="google-site-verification=…" style={{ fontFamily: 'ui-monospace, monospace', fontSize: '0.8rem' }} />
            </Field>
            <Field label="Bing Webmaster">
              <input className="input" value={config.verification?.bing || ''} onChange={e => setNested('verification', 'bing', e.target.value)} placeholder="msvalidate.01=…" style={{ fontFamily: 'ui-monospace, monospace', fontSize: '0.8rem' }} />
            </Field>
          </div>
        </Section>

      </div>
    </form>
  );
}

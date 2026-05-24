import React, { useEffect, useState, useCallback } from 'react';
import { useApi } from '../hooks/useApi';
import { toast } from '../hooks/useToast';

const CHANGE_FREQS = ['always', 'hourly', 'daily', 'weekly', 'monthly', 'yearly', 'never'];
const LANG_TABS = [
  { id: 'de', label: 'DE' },
  { id: 'en', label: 'EN' },
  { id: 'it', label: 'IT' },
];

// ── Chip input for keywords ────────────────────────────────────

function ChipInput({ chips = [], onChange }) {
  const [input, setInput] = useState('');

  function add() {
    const val = input.trim();
    if (!val || chips.includes(val)) { setInput(''); return; }
    onChange([...chips, val]);
    setInput('');
  }

  function remove(kw) {
    onChange(chips.filter(c => c !== kw));
  }

  return (
    <div>
      <div style={{
        display: 'flex', flexWrap: 'wrap', gap: 6,
        padding: '8px 10px', minHeight: 44,
        background: 'var(--bg)', border: '1px solid var(--border)',
        borderRadius: 10, cursor: 'text',
        marginBottom: 8,
      }}>
        {chips.map(kw => (
          <span key={kw} style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            padding: '3px 10px', borderRadius: 99,
            background: 'var(--accent-dim)', border: '1px solid rgba(89,61,248,0.22)',
            color: 'var(--accent)', fontSize: '0.75rem', fontWeight: 500,
          }}>
            {kw}
            <button
              type="button"
              onClick={() => remove(kw)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent)', padding: 0, lineHeight: 1, opacity: 0.7 }}
            >
              <i className="bi bi-x" style={{ fontSize: '0.75rem' }} />
            </button>
          </span>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add(); } }}
          placeholder="Keyword eingeben, Enter drücken..."
          style={{ flex: 1 }}
        />
        <button type="button" className="btn-outline btn-sm" onClick={add}>
          <i className="bi bi-plus-lg" />Hinzufügen
        </button>
      </div>
      <p style={{ color: 'var(--text3)', fontSize: '0.72rem', marginTop: 4 }}>
        {chips.length} Keywords
      </p>
    </div>
  );
}

// ── Sitemap page row ───────────────────────────────────────────

function PageRow({ page, index, onChange, onRemove }) {
  function set(k, v) { onChange({ ...page, [k]: v }); }
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: '1fr 90px 130px auto',
      gap: 8, alignItems: 'center',
      padding: '10px 12px', borderRadius: 10,
      background: 'var(--bg3)', border: '1px solid var(--border)',
    }}>
      <input
        value={page.path || ''}
        onChange={e => set('path', e.target.value)}
        placeholder="/pfad"
        style={{ margin: 0 }}
      />
      <input
        type="number" min="0" max="1" step="0.1"
        value={page.priority ?? 0.8}
        onChange={e => set('priority', parseFloat(e.target.value))}
        style={{ margin: 0 }}
      />
      <select value={page.changeFreq || 'weekly'} onChange={e => set('changeFreq', e.target.value)}
        style={{
          padding: '7px 10px', borderRadius: 8, border: '1px solid var(--border)',
          background: 'var(--bg)', color: 'var(--text)', fontSize: '0.82rem',
        }}>
        {CHANGE_FREQS.map(f => <option key={f} value={f}>{f}</option>)}
      </select>
      <button type="button" className="btn-outline btn-sm btn-icon" onClick={onRemove}
        style={{ color: '#e5383b', borderColor: 'rgba(229,56,59,0.2)' }}>
        <i className="bi bi-trash3" />
      </button>
    </div>
  );
}

// ── Collapsible preview panel ──────────────────────────────────

function PreviewPanel({ title, icon, content, mono = true }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        style={{
          width: '100%', padding: '0.875rem 1.125rem',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'none', border: 'none', cursor: 'pointer',
          borderBottom: open ? '1px solid var(--border)' : 'none',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <i className={`bi bi-${icon}`} style={{ color: 'var(--accent)', fontSize: '0.875rem' }} />
          <span style={{ fontWeight: 600, fontSize: '0.825rem', color: 'var(--text)' }}>{title}</span>
        </div>
        <i className={`bi bi-chevron-${open ? 'up' : 'down'}`} style={{ color: 'var(--text3)', fontSize: '0.75rem' }} />
      </button>
      {open && (
        <pre style={{
          margin: 0, padding: '1rem 1.125rem',
          fontFamily: mono ? 'ui-monospace, monospace' : 'inherit',
          fontSize: '0.72rem', lineHeight: 1.6,
          color: 'var(--text2)', overflowX: 'auto',
          maxHeight: 320, overflowY: 'auto',
          background: 'var(--bg3)',
          whiteSpace: 'pre-wrap', wordBreak: 'break-all',
        }}>
          {content || 'Keine Daten'}
        </pre>
      )}
    </div>
  );
}

// ── Section card ───────────────────────────────────────────────

function Section({ title, icon, children }) {
  return (
    <div className="card">
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '1.25rem' }}>
        <div style={{
          width: 34, height: 34, borderRadius: 10, flexShrink: 0,
          background: 'var(--accent-dim)', border: '1px solid rgba(89,61,248,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)',
        }}>
          <i className={`bi bi-${icon}`} style={{ fontSize: '0.9rem' }} />
        </div>
        <h3 style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text)', letterSpacing: '-0.02em' }}>
          {title}
        </h3>
      </div>
      {children}
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────

export default function Seo() {
  const { request } = useApi();

  const [config,  setConfig]  = useState(null);
  const [saving,  setSaving]  = useState(false);
  const [loading, setLoading] = useState(true);
  const [descTab, setDescTab] = useState('de');
  const [sitemapXml,   setSitemapXml]   = useState('');
  const [robotsContent, setRobotsContent] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [cfg, sitemap, robots] = await Promise.all([
        request('/seo/config'),
        request('/seo/sitemap-preview'),
        request('/seo/robots-preview'),
      ]);
      setConfig(cfg);
      setSitemapXml(sitemap?.xml || '');
      setRobotsContent(robots?.content || '');
    } catch {
      toast('Fehler beim Laden der SEO-Konfiguration', 'error');
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
      toast('SEO-Konfiguration gespeichert');
      // Refresh previews
      const [sitemap, robots] = await Promise.all([
        request('/seo/sitemap-preview'),
        request('/seo/robots-preview'),
      ]);
      setSitemapXml(sitemap?.xml || '');
      setRobotsContent(robots?.content || '');
    } catch (err) {
      toast(err.message || 'Fehler beim Speichern', 'error');
    } finally {
      setSaving(false);
    }
  }

  function set(key, val) { setConfig(c => ({ ...c, [key]: val })); }
  function setNested(key, sub, val) { setConfig(c => ({ ...c, [key]: { ...c[key], [sub]: val } })); }

  function addPage() {
    setConfig(c => ({
      ...c,
      pages: [...(c.pages || []), { path: '/', priority: 0.8, changeFreq: 'weekly' }],
    }));
  }

  function updatePage(i, val) {
    setConfig(c => {
      const pages = [...(c.pages || [])];
      pages[i] = val;
      return { ...c, pages };
    });
  }

  function removePage(i) {
    setConfig(c => ({ ...c, pages: (c.pages || []).filter((_, idx) => idx !== i) }));
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4rem' }}>
        <span className="spinner" style={{ width: 20, height: 20 }} />
      </div>
    );
  }

  if (!config) return null;

  return (
    <form onSubmit={handleSave}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 style={{ color: 'var(--text)', fontSize: '1.3rem', fontWeight: 600, letterSpacing: '-0.03em' }}>
            SEO Editor
          </h2>
          <p style={{ color: 'var(--text3)', fontSize: '0.78rem', marginTop: 2 }}>
            Metadaten, Keywords und Sitemap konfigurieren
          </p>
        </div>
        <button type="submit" className="btn-primary btn-sm" disabled={saving}>
          {saving ? <span className="spinner" /> : <i className="bi bi-floppy2-fill" />}
          {saving ? 'Speichern…' : 'Speichern'}
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>

        {/* Site Identity */}
        <Section title="Site Identity" icon="globe2">
          <div className="grid-2" style={{ gap: '0.875rem' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Site Name</label>
              <input value={config.name || ''} onChange={e => set('name', e.target.value)} placeholder="pokyh.studio" />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Canonical URL</label>
              <input value={config.url || ''} onChange={e => set('url', e.target.value)} placeholder="https://pokyh.studio" />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Locale</label>
              <input value={config.locale || ''} onChange={e => set('locale', e.target.value)} placeholder="de_DE" />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Sprache (lang)</label>
              <input value={config.lang || ''} onChange={e => set('lang', e.target.value)} placeholder="de" />
            </div>
          </div>
        </Section>

        {/* Page Titles */}
        <Section title="Seitentitel" icon="type-h1">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Standard-Titel (DE)</label>
              <input value={config.title?.default || ''} onChange={e => setNested('title', 'default', e.target.value)} placeholder="pokyh.studio – Design & Development" />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Titel (EN)</label>
              <input value={config.title?.en || ''} onChange={e => setNested('title', 'en', e.target.value)} placeholder="pokyh.studio – Design & Development" />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Titel-Template</label>
              <input value={config.title?.template || ''} onChange={e => setNested('title', 'template', e.target.value)} placeholder="%s | pokyh.studio" />
              <p style={{ color: 'var(--text3)', fontSize: '0.72rem', marginTop: 4 }}>
                %s wird durch den Seitentitel ersetzt
              </p>
            </div>
          </div>
        </Section>

        {/* Descriptions */}
        <Section title="Beschreibungen" icon="card-text">
          <div style={{ display: 'flex', gap: 4, marginBottom: '1rem', padding: 4, background: 'var(--bg3)', borderRadius: 10, border: '1px solid var(--border)' }}>
            {LANG_TABS.map(t => (
              <button
                key={t.id}
                type="button"
                onClick={() => setDescTab(t.id)}
                style={{
                  padding: '6px 14px', borderRadius: 8, border: 'none', cursor: 'pointer',
                  background: descTab === t.id ? 'var(--bg2)' : 'transparent',
                  color: descTab === t.id ? 'var(--text)' : 'var(--text3)',
                  fontWeight: descTab === t.id ? 600 : 400,
                  fontSize: '0.8rem',
                  boxShadow: descTab === t.id ? 'var(--shadow)' : 'none',
                  transition: 'all 150ms',
                }}
              >
                {t.label}
              </button>
            ))}
          </div>
          <textarea
            value={config.description?.[descTab] || ''}
            onChange={e => setNested('description', descTab, e.target.value)}
            rows={3}
            placeholder={`Beschreibung auf ${descTab.toUpperCase()}…`}
            style={{ width: '100%', resize: 'vertical' }}
          />
          <p style={{ color: 'var(--text3)', fontSize: '0.72rem', marginTop: 4 }}>
            {(config.description?.[descTab] || '').length} Zeichen
            {(config.description?.[descTab] || '').length > 160 && (
              <span style={{ color: '#e5383b', marginLeft: 6 }}>
                <i className="bi bi-exclamation-triangle" style={{ marginRight: 3 }} />
                Über 160 Zeichen — möglicherweise abgeschnitten
              </span>
            )}
          </p>
        </Section>

        {/* Keywords */}
        <Section title="Keywords" icon="tags-fill">
          <ChipInput
            chips={config.keywords || []}
            onChange={kws => set('keywords', kws)}
          />
        </Section>

        {/* Verification Tokens */}
        <Section title="Verification Tokens" icon="patch-check-fill">
          <div className="grid-2" style={{ gap: '0.875rem' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">
                <i className="bi bi-google" style={{ marginRight: 5, fontSize: '0.8rem' }} />
                Google Search Console
              </label>
              <input
                value={config.verification?.google || ''}
                onChange={e => setNested('verification', 'google', e.target.value)}
                placeholder="google-site-verification=…"
                style={{ fontFamily: 'ui-monospace, monospace', fontSize: '0.8rem' }}
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">
                <i className="bi bi-microsoft" style={{ marginRight: 5, fontSize: '0.8rem' }} />
                Bing Webmaster
              </label>
              <input
                value={config.verification?.bing || ''}
                onChange={e => setNested('verification', 'bing', e.target.value)}
                placeholder="msvalidate.01=…"
                style={{ fontFamily: 'ui-monospace, monospace', fontSize: '0.8rem' }}
              />
            </div>
          </div>
        </Section>

        {/* Sitemap entries */}
        <Section title="Sitemap-Einträge" icon="diagram-3">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: '1rem' }}>
            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 90px 130px auto',
              gap: 8, padding: '6px 12px',
              color: 'var(--text3)', fontSize: '0.72rem', fontWeight: 600,
            }}>
              <span>Pfad</span>
              <span>Priorität</span>
              <span>Frequenz</span>
              <span />
            </div>
            {(config.pages || []).map((p, i) => (
              <PageRow
                key={i}
                index={i}
                page={p}
                onChange={val => updatePage(i, val)}
                onRemove={() => removePage(i)}
              />
            ))}
            {(config.pages || []).length === 0 && (
              <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text3)', fontSize: '0.8rem' }}>
                Keine Seiten konfiguriert
              </div>
            )}
          </div>
          <button type="button" className="btn-outline btn-sm" onClick={addPage}>
            <i className="bi bi-plus-lg" />Seite hinzufügen
          </button>
        </Section>

        {/* Previews */}
        <PreviewPanel title="Sitemap-Vorschau (XML)" icon="filetype-xml" content={sitemapXml} />
        <PreviewPanel title="robots.txt / robots.ts Quellcode" icon="file-code" content={robotsContent} />

      </div>
    </form>
  );
}

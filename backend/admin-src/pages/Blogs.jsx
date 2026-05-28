import React, { useEffect, useState, useRef, useCallback } from 'react';
import { marked } from 'marked';
import { useApi, getAccessToken, apiFetch } from '../hooks/useApi';
import { uploadImage } from '../hooks/useUpload';
import { toast } from '../hooks/useToast';

marked.setOptions({ breaks: true, gfm: true });

// ─── helpers ─────────────────────────────────────────────────────────────────

let _id = 0;
function genId() { return `b${++_id}`; }

function blockToHtml(block) {
  if (block.type === 'markdown') {
    try { return marked.parse(block.content || ''); } catch { return block.content || ''; }
  }
  return block.content || '';
}

function buildHtml(blocks) {
  return blocks.map(blockToHtml).join('\n');
}

function stripHtml(html) {
  return html.replace(/<[^>]*>/g, ' ').replace(/&[a-z\d#]+;/gi, ' ');
}

function wordCount(blocks) {
  return blocks.reduce((sum, b) => {
    const text = b.type === 'markdown' ? b.content : stripHtml(b.content);
    return sum + text.split(/\s+/).filter(w => w.length > 0).length;
  }, 0);
}

function defaultBlock(type = 'markdown') {
  return { id: genId(), type, content: '' };
}

// ─── Block-type config ───────────────────────────────────────────────────────

const BLOCK_TYPES = {
  markdown: {
    label: 'Markdown',
    short: 'MD',
    color: '#593DF8',
    bg: 'rgba(89,61,248,0.06)',
    borderColor: 'rgba(89,61,248,0.20)',
    placeholder: '# Überschrift\n\nMarkdown-Text hier…\n\n**Fett**, *Kursiv*, `Code`, [Link](url)',
    toolbar: [
      { label: 'H1',  icon: null, wrap: ['# ', ''],          title: 'Überschrift 1' },
      { label: 'H2',  icon: null, wrap: ['## ', ''],          title: 'Überschrift 2' },
      { label: 'H3',  icon: null, wrap: ['### ', ''],         title: 'Überschrift 3' },
      { label: 'B',   icon: null, wrap: ['**', '**'],         title: 'Fett',     style: { fontWeight: 700 } },
      { label: 'I',   icon: null, wrap: ['*', '*'],           title: 'Kursiv',   style: { fontStyle: 'italic' } },
      { label: '`',   icon: null, wrap: ['`', '`'],           title: 'Inline Code' },
      { label: '```', icon: null, wrap: ['```\n', '\n```'],   title: 'Code-Block' },
      { label: null,  icon: 'bi-quote',      wrap: ['> ', ''],           title: 'Zitat' },
      { label: null,  icon: 'bi-dash-lg',    wrap: ['\n---\n', ''],      title: 'Trennlinie' },
      { label: null,  icon: 'bi-list-ul',    wrap: ['- ', ''],           title: 'Liste' },
      { label: null,  icon: 'bi-list-ol',    wrap: ['1. ', ''],          title: 'Nummerierte Liste' },
      { label: null,  icon: 'bi-link-45deg', link: true,                 title: 'Hyperlink' },
    ],
  },
  html: {
    label: 'HTML',
    short: 'HTML',
    color: '#d97706',
    bg: 'rgba(217,119,6,0.06)',
    borderColor: 'rgba(217,119,6,0.20)',
    placeholder: '<p>HTML-Inhalt hier…</p>\n<h2>Überschrift</h2>',
    toolbar: [
      { label: 'H2',  icon: null, tag: 'h2' },
      { label: 'H3',  icon: null, tag: 'h3' },
      { label: 'H4',  icon: null, tag: 'h4' },
      { label: 'B',   icon: null, tag: 'strong', style: { fontWeight: 700 } },
      { label: 'I',   icon: null, tag: 'em',     style: { fontStyle: 'italic' } },
      { label: 'U',   icon: null, tag: 'u',      style: { textDecoration: 'underline' } },
      { label: null,  icon: 'bi-link-45deg',   tag: 'a' },
      { label: null,  icon: 'bi-list-ul',      tag: 'ul' },
      { label: null,  icon: 'bi-list-ol',      tag: 'ol' },
      { label: null,  icon: 'bi-code-slash',   tag: 'code' },
      { label: null,  icon: 'bi-braces',       tag: 'pre' },
      { label: null,  icon: 'bi-chat-left',    tag: 'blockquote' },
      { label: null,  icon: 'bi-dash-lg',      tag: 'hr' },
    ],
  },
};

// ─── Toolbar insert logic ────────────────────────────────────────────────────

function insertMd(ta, item, getContent, setContent) {
  if (!ta) return;
  const start = ta.selectionStart, end = ta.selectionEnd;
  const sel = ta.value.substring(start, end);
  let ins;
  if (item.link) {
    const href = window.prompt('URL:', 'https://');
    if (!href) return;
    ins = `[${sel || 'Link-Text'}](${href})`;
  } else {
    const [before, after] = item.wrap;
    ins = `${before}${sel || 'Text'}${after}`;
  }
  const newVal = ta.value.substring(0, start) + ins + ta.value.substring(end);
  setContent(newVal);
  setTimeout(() => { ta.focus(); ta.selectionStart = ta.selectionEnd = start + ins.length; }, 0);
}

function insertHtml(ta, item, setContent) {
  if (!ta) return;
  const start = ta.selectionStart, end = ta.selectionEnd;
  const sel = ta.value.substring(start, end);
  let ins;
  const tag = item.tag;
  if (tag === 'ul') ins = `<ul>\n  <li>${sel || 'Element'}</li>\n</ul>`;
  else if (tag === 'ol') ins = `<ol>\n  <li>${sel || 'Element'}</li>\n</ol>`;
  else if (tag === 'a') {
    const href = window.prompt('URL:', 'https://');
    if (!href) return;
    ins = `<a href="${href}" target="_blank">${sel || 'Link-Text'}</a>`;
  } else if (tag === 'hr') ins = '\n<hr>\n';
  else if (tag === 'pre') ins = `<pre><code>${sel || 'code'}</code></pre>`;
  else ins = `<${tag}>${sel || 'Text'}</${tag}>`;
  const newVal = ta.value.substring(0, start) + ins + ta.value.substring(end);
  setContent(newVal);
  setTimeout(() => { ta.focus(); ta.selectionStart = ta.selectionEnd = start + ins.length; }, 0);
}

// ─── Toolbar Button ──────────────────────────────────────────────────────────

function ToolbarBtn({ item, onClick }) {
  return (
    <button
      type="button"
      title={item.title || item.label}
      onClick={onClick}
      style={{
        background: 'none',
        border: 'none',
        borderRadius: 5,
        cursor: 'pointer',
        color: 'var(--text2)',
        fontSize: item.label ? '0.72rem' : '0.85rem',
        fontWeight: item.style?.fontWeight || 500,
        fontStyle: item.style?.fontStyle || 'normal',
        textDecoration: item.style?.textDecoration || 'none',
        padding: '3px 6px',
        lineHeight: 1,
        display: 'inline-flex',
        alignItems: 'center',
        transition: 'background 100ms, color 100ms',
        minWidth: item.icon ? 26 : 'auto',
        justifyContent: 'center',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.background = 'rgba(12,12,12,0.07)';
        e.currentTarget.style.color = 'var(--text)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = 'none';
        e.currentTarget.style.color = 'var(--text2)';
      }}
    >
      {item.icon
        ? <i className={`bi ${item.icon}`} />
        : item.label}
    </button>
  );
}

// ─── Single Block ────────────────────────────────────────────────────────────

function Block({ block, index, total, onChange, onDelete, onMove, showPreview }) {
  const taRef = useRef();
  const cfg = BLOCK_TYPES[block.type];
  const preview = block.type === 'markdown'
    ? (marked.parse(block.content || '') || '')
    : (block.content || '');

  function handleToolbar(item) {
    if (block.type === 'markdown') insertMd(taRef.current, item, () => block.content, c => onChange(block.id, c));
    else insertHtml(taRef.current, item, c => onChange(block.id, c));
  }

  return (
    <div style={{
      border: `1px solid ${cfg.borderColor}`,
      borderRadius: 10,
      overflow: 'hidden',
      background: 'var(--bg)',
      boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
    }}>
      {/* Block header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '7px 10px',
        background: cfg.bg,
        borderBottom: `1px solid ${cfg.borderColor}`,
      }}>
        {/* Format pill */}
        <span style={{
          fontSize: '0.65rem',
          fontWeight: 700,
          letterSpacing: '0.05em',
          padding: '2px 7px',
          borderRadius: 99,
          background: cfg.color,
          color: '#fff',
          userSelect: 'none',
          flexShrink: 0,
        }}>
          {cfg.short}
        </span>

        <span style={{
          fontSize: '0.73rem',
          color: 'var(--text3)',
          flex: 1,
          letterSpacing: '-0.01em',
        }}>
          Block {index + 1}
          {block.label && (
            <span style={{ marginLeft: 5, opacity: 0.7, fontStyle: 'italic' }}>
              · {block.label}
            </span>
          )}
        </span>

        {/* Move controls */}
        <div style={{ display: 'flex', gap: 1 }}>
          <button
            type="button"
            title="Nach oben"
            disabled={index === 0}
            onClick={() => onMove(block.id, -1)}
            style={{
              ...blockIconBtn,
              opacity: index === 0 ? 0.25 : 1,
              cursor: index === 0 ? 'default' : 'pointer',
            }}
          >
            <i className="bi bi-chevron-up" style={{ fontSize: '0.7rem' }} />
          </button>
          <button
            type="button"
            title="Nach unten"
            disabled={index === total - 1}
            onClick={() => onMove(block.id, 1)}
            style={{
              ...blockIconBtn,
              opacity: index === total - 1 ? 0.25 : 1,
              cursor: index === total - 1 ? 'default' : 'pointer',
            }}
          >
            <i className="bi bi-chevron-down" style={{ fontSize: '0.7rem' }} />
          </button>
          <div style={{ width: 1, height: 16, background: 'rgba(12,12,12,0.10)', margin: '0 3px', alignSelf: 'center' }} />
          <button
            type="button"
            title="Block löschen"
            onClick={() => onDelete(block.id)}
            disabled={total === 1}
            style={{
              ...blockIconBtn,
              color: 'var(--danger)',
              opacity: total === 1 ? 0.25 : 1,
              cursor: total === 1 ? 'default' : 'pointer',
            }}
          >
            <i className="bi bi-trash3" style={{ fontSize: '0.7rem' }} />
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 1,
        padding: '3px 6px',
        borderBottom: '1px solid var(--border2)',
        background: 'var(--bg2)',
        alignItems: 'center',
      }}>
        {cfg.toolbar.map((item, i) => (
          <ToolbarBtn key={i} item={item} onClick={() => handleToolbar(item)} />
        ))}
      </div>

      {/* Editor + optional inline preview */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: showPreview ? '1fr 1fr' : '1fr',
        minHeight: 180,
      }}>
        <textarea
          ref={taRef}
          value={block.content}
          onChange={e => onChange(block.id, e.target.value)}
          placeholder={cfg.placeholder}
          className="font-mono"
          style={{
            minHeight: 180,
            fontSize: '0.78rem',
            lineHeight: 1.65,
            resize: 'vertical',
            border: 'none',
            outline: 'none',
            padding: '10px 14px',
            background: 'var(--bg)',
            borderRight: showPreview ? '1px solid var(--border2)' : 'none',
          }}
        />
        {showPreview && (
          <div
            style={{
              padding: '12px 14px',
              overflow: 'auto',
              fontSize: '0.83rem',
              lineHeight: 1.75,
              background: '#fff',
              color: 'var(--text)',
            }}
            dangerouslySetInnerHTML={{
              __html: preview || `<span style="color:#ccc;font-style:italic;font-size:0.8rem">Vorschau…</span>`,
            }}
          />
        )}
      </div>
    </div>
  );
}

const blockIconBtn = {
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  padding: '4px 5px',
  borderRadius: 5,
  color: 'var(--text3)',
  lineHeight: 1,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'background 100ms, color 100ms',
};

// ─── Combined preview ─────────────────────────────────────────────────────────

function CombinedPreview({ blocks }) {
  const html = buildHtml(blocks);
  return (
    <div
      style={{
        padding: '1.75rem',
        border: '1px solid var(--border)',
        borderRadius: 10,
        background: '#fff',
        minHeight: 200,
        lineHeight: 1.8,
        fontSize: '0.88rem',
        color: 'var(--text)',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      }}
      dangerouslySetInnerHTML={{
        __html: html || '<p style="color:#ccc;font-style:italic;font-size:0.8rem">Kein Inhalt vorhanden.</p>',
      }}
    />
  );
}

// ─── Add-block bar ────────────────────────────────────────────────────────────

function AddBlockBar({ onAdd, onImportPdf, onImportHtml, importing }) {
  return (
    <div style={{
      display: 'flex',
      gap: 0,
      alignItems: 'center',
      padding: '8px 12px',
      background: 'var(--bg2)',
      border: '1px solid var(--border)',
      borderRadius: 10,
    }}>
      {/* Add new block section */}
      <span style={{
        fontSize: '0.68rem',
        color: 'var(--text3)',
        fontWeight: 600,
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
        marginRight: 8,
        whiteSpace: 'nowrap',
      }}>
        Block
      </span>

      <button
        type="button"
        onClick={() => onAdd('markdown')}
        title="Markdown-Block hinzufügen"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 5,
          padding: '5px 11px',
          borderRadius: 7,
          border: '1px solid rgba(89,61,248,0.30)',
          background: 'rgba(89,61,248,0.07)',
          color: '#593DF8',
          fontSize: '0.75rem',
          fontWeight: 600,
          cursor: 'pointer',
          transition: 'background 120ms',
          marginRight: 4,
        }}
        onMouseEnter={e => e.currentTarget.style.background = 'rgba(89,61,248,0.13)'}
        onMouseLeave={e => e.currentTarget.style.background = 'rgba(89,61,248,0.07)'}
      >
        <i className="bi bi-plus-lg" style={{ fontSize: '0.7rem' }} />
        Markdown
      </button>

      <button
        type="button"
        onClick={() => onAdd('html')}
        title="HTML-Block hinzufügen"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 5,
          padding: '5px 11px',
          borderRadius: 7,
          border: '1px solid rgba(217,119,6,0.30)',
          background: 'rgba(217,119,6,0.07)',
          color: '#d97706',
          fontSize: '0.75rem',
          fontWeight: 600,
          cursor: 'pointer',
          transition: 'background 120ms',
        }}
        onMouseEnter={e => e.currentTarget.style.background = 'rgba(217,119,6,0.13)'}
        onMouseLeave={e => e.currentTarget.style.background = 'rgba(217,119,6,0.07)'}
      >
        <i className="bi bi-plus-lg" style={{ fontSize: '0.7rem' }} />
        HTML
      </button>

      {/* Divider */}
      <div style={{ width: 1, height: 20, background: 'var(--border)', margin: '0 12px', flexShrink: 0 }} />

      {/* Import section */}
      <span style={{
        fontSize: '0.68rem',
        color: 'var(--text3)',
        fontWeight: 600,
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
        marginRight: 8,
        whiteSpace: 'nowrap',
      }}>
        Importieren
      </span>

      <button
        type="button"
        onClick={onImportPdf}
        disabled={importing}
        title="PDF importieren – jede Seite wird als Bild eingefügt"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 5,
          padding: '5px 11px',
          borderRadius: 7,
          border: '1px solid rgba(220,38,38,0.25)',
          background: importing ? 'rgba(220,38,38,0.04)' : 'rgba(220,38,38,0.06)',
          color: '#dc2626',
          fontSize: '0.75rem',
          fontWeight: 600,
          cursor: importing ? 'not-allowed' : 'pointer',
          opacity: importing ? 0.55 : 1,
          transition: 'background 120ms',
          marginRight: 4,
        }}
        onMouseEnter={e => { if (!importing) e.currentTarget.style.background = 'rgba(220,38,38,0.11)'; }}
        onMouseLeave={e => { if (!importing) e.currentTarget.style.background = 'rgba(220,38,38,0.06)'; }}
      >
        {importing
          ? <span className="spinner" style={{ width: 10, height: 10 }} />
          : <i className="bi bi-file-earmark-pdf" style={{ fontSize: '0.8rem' }} />}
        PDF
      </button>

      <button
        type="button"
        onClick={onImportHtml}
        disabled={importing}
        title="HTML-Datei importieren – CSS wird inline eingefügt"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 5,
          padding: '5px 11px',
          borderRadius: 7,
          border: '1px solid rgba(37,99,235,0.25)',
          background: importing ? 'rgba(37,99,235,0.04)' : 'rgba(37,99,235,0.06)',
          color: '#2563eb',
          fontSize: '0.75rem',
          fontWeight: 600,
          cursor: importing ? 'not-allowed' : 'pointer',
          opacity: importing ? 0.55 : 1,
          transition: 'background 120ms',
        }}
        onMouseEnter={e => { if (!importing) e.currentTarget.style.background = 'rgba(37,99,235,0.11)'; }}
        onMouseLeave={e => { if (!importing) e.currentTarget.style.background = 'rgba(37,99,235,0.06)'; }}
      >
        {importing
          ? <span className="spinner" style={{ width: 10, height: 10 }} />
          : <i className="bi bi-filetype-html" style={{ fontSize: '0.8rem' }} />}
        HTML-Datei
      </button>
    </div>
  );
}

const LANGS = ['de', 'en', 'it'];
const LANG_LABELS = { de: '🇩🇪 DE', en: '🇬🇧 EN', it: '🇮🇹 IT' };
const EMPTY_SLOT = { title: '', slug: '', excerpt: '', image_alt: '' };

function autoSlug(title) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

// ─── Load initial blocks from blog data ──────────────────────────────────────

function initBlocksFromSlot(slot) {
  if (!slot?.content_markdown && !slot?.content) return [defaultBlock('markdown')];
  if (slot.content_markdown) {
    try {
      const parsed = JSON.parse(slot.content_markdown);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map(b => ({ ...b, id: genId() }));
      }
    } catch { /* fall through */ }
    return [{ id: genId(), type: 'markdown', content: slot.content_markdown }];
  }
  return [{ id: genId(), type: 'html', content: slot.content || '' }];
}

function initAllBlocks(blog) {
  if (!blog) return { de: [defaultBlock('markdown')], en: [defaultBlock('markdown')], it: [defaultBlock('markdown')] };

  // New multi-lang format
  if (blog.translations && typeof blog.translations === 'object' && blog.translations.de) {
    return {
      de: initBlocksFromSlot(blog.translations.de),
      en: initBlocksFromSlot(blog.translations.en),
      it: initBlocksFromSlot(blog.translations.it),
    };
  }

  // Legacy single-lang: put existing content in DE, blank for EN/IT
  const deBlocks = (() => {
    if (blog.content_format === 'blocks' && blog.content_markdown) {
      try {
        const parsed = JSON.parse(blog.content_markdown);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map(b => ({ ...b, id: genId() }));
        }
      } catch {}
    }
    if (blog.content_format === 'markdown') {
      return [{ id: genId(), type: 'markdown', content: blog.content_markdown || blog.content || '' }];
    }
    return [{ id: genId(), type: 'html', content: blog.content || '' }];
  })();

  return { de: deBlocks, en: [defaultBlock('markdown')], it: [defaultBlock('markdown')] };
}

function initTranslations(blog) {
  if (!blog) return { de: { ...EMPTY_SLOT }, en: { ...EMPTY_SLOT }, it: { ...EMPTY_SLOT } };

  if (blog.translations && typeof blog.translations === 'object' && blog.translations.de) {
    return {
      de: { ...EMPTY_SLOT, ...blog.translations.de },
      en: { ...EMPTY_SLOT, ...(blog.translations.en || {}) },
      it: { ...EMPTY_SLOT, ...(blog.translations.it || {}) },
    };
  }

  // Legacy
  return {
    de: { title: blog.title || '', slug: blog.slug || '', excerpt: blog.excerpt || '', image_alt: blog.image_alt || '' },
    en: { ...EMPTY_SLOT },
    it: { ...EMPTY_SLOT },
  };
}

// ─── View mode segment ────────────────────────────────────────────────────────

function ViewToggle({ viewMode, setViewMode }) {
  const modes = [
    { k: 'edit',    icon: 'bi-pencil',        label: 'Bearbeiten' },
    { k: 'split',   icon: 'bi-layout-split',  label: 'Split' },
    { k: 'preview', icon: 'bi-eye',           label: 'Vorschau' },
  ];

  return (
    <div style={{
      display: 'inline-flex',
      background: 'var(--bg3)',
      border: '1px solid var(--border)',
      borderRadius: 8,
      padding: 2,
      gap: 1,
    }}>
      {modes.map(({ k, icon, label }) => {
        const active = viewMode === k;
        return (
          <button
            key={k}
            type="button"
            onClick={() => setViewMode(k)}
            title={label}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              padding: '4px 10px',
              borderRadius: 6,
              border: 'none',
              cursor: 'pointer',
              fontSize: '0.75rem',
              fontWeight: 500,
              letterSpacing: '-0.01em',
              background: active ? '#fff' : 'transparent',
              color: active ? 'var(--text)' : 'var(--text3)',
              boxShadow: active ? '0 1px 3px rgba(0,0,0,0.10)' : 'none',
              transition: 'all 120ms',
            }}
          >
            <i className={`bi ${icon}`} style={{ fontSize: '0.8rem' }} />
            {label}
          </button>
        );
      })}
    </div>
  );
}

// ─── BlogEditor ───────────────────────────────────────────────────────────────

function BlogEditor({ blog, onSave, onCancel }) {
  const [translations, setTranslations] = useState(() => initTranslations(blog));
  const [blocksByLang, setBlocksByLang] = useState(() => initAllBlocks(blog));
  const [activeTab, setActiveTab]       = useState('de');
  const [tabErrors, setTabErrors]       = useState({});
  const [status, setStatus]             = useState(blog?.status || 'published');
  const [imageFile, setImageFile]       = useState(null);
  const [imagePreview, setImagePreview] = useState(blog?.image_url || null);
  const [saving, setSaving]             = useState(false);
  const [importing, setImporting]       = useState(false);
  const [viewMode, setViewMode]         = useState('split');
  const [error, setError]               = useState('');

  const htmlImportRef = useRef();
  const pdfImportRef  = useRef();

  // Per-tab block helpers
  const updateBlock = useCallback((id, content) =>
    setBlocksByLang(prev => ({ ...prev, [activeTab]: prev[activeTab].map(b => b.id === id ? { ...b, content } : b) })),
  [activeTab]);

  const deleteBlock = useCallback((id) =>
    setBlocksByLang(prev => ({ ...prev, [activeTab]: prev[activeTab].filter(b => b.id !== id) })),
  [activeTab]);

  const addBlock = useCallback((type) =>
    setBlocksByLang(prev => ({ ...prev, [activeTab]: [...prev[activeTab], defaultBlock(type)] })),
  [activeTab]);

  const moveBlock = useCallback((id, dir) =>
    setBlocksByLang(prev => {
      const bs = prev[activeTab];
      const i = bs.findIndex(b => b.id === id);
      const j = i + dir;
      if (j < 0 || j >= bs.length) return prev;
      const next = [...bs];
      [next[i], next[j]] = [next[j], next[i]];
      return { ...prev, [activeTab]: next };
    }),
  [activeTab]);

  function setSlotField(lang, key, val) {
    setTranslations(t => ({ ...t, [lang]: { ...t[lang], [key]: val } }));
  }

  function handleTitleChange(val) {
    const slot = translations[activeTab];
    const slugWasAuto = !slot.slug || slot.slug === autoSlug(slot.title || '');
    setSlotField(activeTab, 'title', val);
    if (slugWasAuto) setSlotField(activeTab, 'slug', autoSlug(val));
  }

  const blocks = blocksByLang[activeTab] || [];
  const wc = wordCount(blocks);
  const readTime = Math.max(1, Math.ceil(wc / 200));

  async function handlePdfImport(e) {
    const file = e?.target?.files?.[0];
    if (!file) return;
    setImporting(true);
    try {
      const fd = new FormData();
      fd.append('pdf', file);
      const res  = await apiFetch('/blogs/import/pdf', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Import fehlgeschlagen');
      const newBlock = { id: genId(), type: 'html', content: data.content, label: `PDF (${data.pages} S.)` };
      setBlocksByLang(prev => ({ ...prev, [activeTab]: [...prev[activeTab], newBlock] }));
      toast(`PDF importiert — ${data.pages} Seite${data.pages !== 1 ? 'n' : ''} als neuer Block`);
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setImporting(false);
      if (e?.target) e.target.value = '';
    }
  }

  async function handleHtmlImport(e) {
    const file = e?.target?.files?.[0];
    if (!file) return;
    setImporting(true);
    try {
      const fd = new FormData();
      fd.append('html', file);
      const res  = await apiFetch('/blogs/import/html', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Import fehlgeschlagen');
      const newBlock = { id: genId(), type: 'html', content: data.content, label: 'HTML-Datei' };
      setBlocksByLang(prev => ({ ...prev, [activeTab]: [...prev[activeTab], newBlock] }));
      if (!translations[activeTab].title && data.title) setSlotField(activeTab, 'title', data.title);
      toast('HTML importiert als neuer Block');
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setImporting(false);
      if (e?.target) e.target.value = '';
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
    // Validate all 3 languages
    const errs = {};
    for (const l of LANGS) {
      const slot = translations[l];
      const html = buildHtml(blocksByLang[l]);
      if (!slot.title?.trim() || slot.title.trim().length < 3) errs[l] = 'Titel fehlt';
      else if (!html.trim() || html.trim().length < 10) errs[l] = 'Inhalt fehlt';
    }
    if (Object.keys(errs).length) {
      setTabErrors(errs);
      const firstBad = LANGS.find(l => errs[l]);
      setActiveTab(firstBad);
      setError(`Bitte ${LANG_LABELS[firstBad]}-Felder ausfüllen: ${errs[firstBad]}`);
      return;
    }
    setTabErrors({});
    setSaving(true); setError('');
    try {
      let imageUrl = blog?.image_url || undefined;
      if (imageFile) imageUrl = await uploadImage(imageFile);

      const builtTranslations = {};
      for (const l of LANGS) {
        const slot = translations[l];
        const langBlocks = blocksByLang[l];
        builtTranslations[l] = {
          title:            slot.title,
          slug:             slot.slug || autoSlug(slot.title),
          excerpt:          slot.excerpt || '',
          image_alt:        slot.image_alt || '',
          content:          buildHtml(langBlocks),
          content_markdown: JSON.stringify(langBlocks),
        };
      }

      const payload = {
        translations:   builtTranslations,
        status,
        content_format: 'blocks',
        image_url:      imageUrl || null,
      };
      if (!blog) payload.views = 0;

      const res = await apiFetch(`/blogs${blog ? `/${blog.id}` : ''}`, {
        method: blog ? 'PUT' : 'POST',
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || data.errors?.[0]?.msg || JSON.stringify(data));
      toast(blog ? 'Blog aktualisiert' : 'Blog erstellt');
      onSave();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  const showBlockPreview = viewMode === 'split';
  const showOnlyPreview  = viewMode === 'preview';
  const slot = translations[activeTab] || EMPTY_SLOT;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 style={{ color: 'var(--text)', fontSize: '1.3rem', fontWeight: 600, letterSpacing: '-0.03em' }}>
            {blog ? 'Blog bearbeiten' : 'Neuer Blog'}
          </h2>
          <p style={{ color: 'var(--text3)', fontSize: '0.78rem', marginTop: 2 }}>
            {blocks.length} Block{blocks.length !== 1 ? 'e' : ''} &middot; {wc} Wörter &middot; {readTime} Min. Lesezeit
          </p>
        </div>
        <button className="btn-outline" onClick={onCancel}>
          <i className="bi bi-arrow-left" /> Zurück
        </button>
      </div>

      {/* Language tab strip */}
      <div style={{ display: 'flex', gap: 4, marginBottom: '1rem' }}>
        {LANGS.map(l => (
          <button
            key={l}
            type="button"
            onClick={() => setActiveTab(l)}
            style={{
              padding: '6px 14px',
              borderRadius: 8,
              border: activeTab === l ? '1.5px solid var(--accent)' : '1.5px solid var(--border)',
              background: activeTab === l ? 'var(--accent-dim, rgba(89,61,248,0.08))' : 'var(--bg2)',
              color: activeTab === l ? 'var(--accent)' : tabErrors[l] ? 'var(--danger)' : 'var(--text2)',
              fontSize: '0.78rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              transition: 'all 120ms',
            }}
          >
            {LANG_LABELS[l]}
            {tabErrors[l] && <i className="bi bi-exclamation-circle-fill" style={{ fontSize: '0.65rem', color: 'var(--danger)' }} />}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '1rem', alignItems: 'start' }}>

          {/* ── Main editor area ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>

            {/* Title + Slug for active language */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <input
                value={slot.title}
                onChange={e => handleTitleChange(e.target.value)}
                placeholder={`Titel (${LANG_LABELS[activeTab]})…`}
                style={{
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  letterSpacing: '-0.02em',
                  border: 'none',
                  padding: 0,
                  background: 'transparent',
                  boxShadow: 'none',
                  color: 'var(--text)',
                }}
              />
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text3)', flexShrink: 0 }}>Slug:</span>
                <input
                  value={slot.slug}
                  onChange={e => setSlotField(activeTab, 'slug', e.target.value)}
                  placeholder="url-slug"
                  style={{
                    fontSize: '0.72rem',
                    fontFamily: 'monospace',
                    color: 'var(--text2)',
                    border: 'none',
                    padding: '2px 0',
                    background: 'transparent',
                    boxShadow: 'none',
                    flex: 1,
                  }}
                />
              </div>
            </div>

            {/* View mode toggle */}
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <ViewToggle viewMode={viewMode} setViewMode={setViewMode} />
            </div>

            {/* Full preview mode */}
            {showOnlyPreview ? (
              <div className="card">
                <p style={{ fontSize: '0.68rem', color: 'var(--text3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '1rem' }}>
                  Vorschau ({LANG_LABELS[activeTab]})
                </p>
                <CombinedPreview blocks={blocks} />
              </div>
            ) : (
              <>
                {blocks.map((block, i) => (
                  <Block
                    key={block.id}
                    block={block}
                    index={i}
                    total={blocks.length}
                    onChange={updateBlock}
                    onDelete={deleteBlock}
                    onMove={moveBlock}
                    showPreview={showBlockPreview}
                  />
                ))}

                <input ref={pdfImportRef}  type="file" accept=".pdf"       style={{ display: 'none' }} onChange={handlePdfImport} />
                <input ref={htmlImportRef} type="file" accept=".html,.htm" style={{ display: 'none' }} onChange={handleHtmlImport} />

                <AddBlockBar
                  onAdd={addBlock}
                  onImportPdf={() => pdfImportRef.current?.click()}
                  onImportHtml={() => htmlImportRef.current?.click()}
                  importing={importing}
                />
              </>
            )}

            {/* Excerpt for active language */}
            <div className="card">
              <label className="form-label">Kurztext ({LANG_LABELS[activeTab]}) <span style={{ color: 'var(--text3)', fontWeight: 400 }}>(optional)</span></label>
              <textarea
                value={slot.excerpt}
                onChange={e => setSlotField(activeTab, 'excerpt', e.target.value)}
                placeholder="Kurze Zusammenfassung…"
                style={{ minHeight: 64, resize: 'vertical', marginTop: 2 }}
              />
            </div>
          </div>

          {/* ── Sidebar ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', position: 'sticky', top: '1rem' }}>

            {/* Save button */}
            <button type="submit" className="btn-primary w-full" disabled={saving}
              style={{ padding: '0.65rem', justifyContent: 'center', fontSize: '0.875rem' }}>
              {saving ? <span className="spinner" /> : <i className="bi bi-floppy2" />}
              {saving ? 'Speichern…' : 'Alle 3 Sprachen speichern'}
            </button>

            {error && (
              <div className="alert alert-error" style={{ margin: 0 }}>
                <i className="bi bi-exclamation-circle" /> {error}
              </div>
            )}

            {/* Settings — non-translatable */}
            <div className="card">
              <p style={{ fontSize: '0.68rem', color: 'var(--text3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.875rem' }}>
                Einstellungen (Global)
              </p>

              <div className="form-group">
                <label className="form-label">Status</label>
                <select value={status} onChange={e => setStatus(e.target.value)}>
                  <option value="draft">Entwurf</option>
                  <option value="published">Veröffentlicht</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Titelbild</label>
                {imagePreview ? (
                  <div>
                    <div style={{ position: 'relative', borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border)' }}>
                      <img src={imagePreview} alt="Vorschau" style={{ width: '100%', maxHeight: 120, objectFit: 'cover', display: 'block' }} />
                      <button
                        type="button"
                        onClick={() => { setImageFile(null); setImagePreview(null); }}
                        style={{
                          position: 'absolute', top: 6, right: 6,
                          background: 'rgba(0,0,0,0.55)',
                          border: 'none',
                          borderRadius: '50%',
                          width: 24, height: 24,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: '#fff', cursor: 'pointer',
                          backdropFilter: 'blur(4px)',
                        }}
                        title="Bild entfernen"
                      >
                        <i className="bi bi-x" style={{ fontSize: '0.85rem' }} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <label style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 6,
                    padding: '1rem',
                    border: '1.5px dashed var(--border)',
                    borderRadius: 8,
                    cursor: 'pointer',
                    background: 'var(--bg3)',
                    transition: 'border-color 120ms, background 120ms',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.background = 'var(--accent-dim)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--bg3)'; }}>
                    <i className="bi bi-image" style={{ fontSize: '1.25rem', color: 'var(--text3)' }} />
                    <span style={{ fontSize: '0.75rem', color: 'var(--text3)' }}>Bild auswählen</span>
                    <span style={{ fontSize: '0.68rem', color: 'var(--text3)', opacity: 0.7 }}>JPEG, PNG, GIF, WebP · max. 5 MB</span>
                    <input type="file" accept="image/jpeg,image/png,image/gif,image/webp" onChange={onImageChange} style={{ display: 'none' }} />
                  </label>
                )}
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Bild Alt-Text ({LANG_LABELS[activeTab]})</label>
                <input
                  value={slot.image_alt}
                  onChange={e => setSlotField(activeTab, 'image_alt', e.target.value)}
                  placeholder="Bildbeschreibung…"
                />
              </div>
            </div>

            {/* Block summary */}
            <div className="card">
              <p style={{ fontSize: '0.68rem', color: 'var(--text3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.75rem' }}>
                Inhalt {LANG_LABELS[activeTab]} ({blocks.length} Block{blocks.length !== 1 ? 'e' : ''})
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {blocks.map((b, i) => {
                  const cfg = BLOCK_TYPES[b.type];
                  const chars = b.content.length;
                  return (
                    <div key={b.id} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 7,
                      padding: '5px 8px',
                      borderRadius: 7,
                      background: cfg.bg,
                      border: `1px solid ${cfg.borderColor}`,
                    }}>
                      <span style={{
                        fontWeight: 700,
                        padding: '1px 5px',
                        borderRadius: 4,
                        background: cfg.color,
                        color: '#fff',
                        fontSize: '0.6rem',
                        letterSpacing: '0.04em',
                        flexShrink: 0,
                      }}>
                        {cfg.short}
                      </span>
                      <span style={{ color: 'var(--text2)', fontSize: '0.73rem', flex: 1 }}>
                        Block {i + 1}
                        {b.label && <span style={{ color: 'var(--text3)', marginLeft: 4 }}>· {b.label}</span>}
                      </span>
                      <span style={{ color: 'var(--text3)', fontSize: '0.68rem', flexShrink: 0 }}>
                        {chars > 0 ? `${chars} Z.` : <span style={{ opacity: 0.5 }}>leer</span>}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

// ─── Blog list ────────────────────────────────────────────────────────────────

function formatBadge(blog) {
  if (blog.content_format === 'blocks') {
    let md = 0, html = 0;
    try {
      const bs = JSON.parse(blog.content_markdown || '[]');
      bs.forEach(b => b.type === 'markdown' ? md++ : html++);
    } catch { html = 1; }
    const parts = [];
    if (md > 0)   parts.push(`${md} MD`);
    if (html > 0) parts.push(`${html} HTML`);
    return parts.join(' + ');
  }
  if (blog.content_format === 'markdown') return 'Markdown';
  return 'HTML';
}

export default function Blogs() {
  const { request, loading } = useApi();
  const [blogs, setBlogs]       = useState([]);
  const [view, setView]         = useState('list');
  const [editBlog, setEditBlog] = useState(null);
  const [viewsEdit, setViewsEdit]   = useState(null); // { id, value }
  const [viewsSaving, setViewsSaving] = useState(false);

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

  function startViewsEdit(blog) {
    setViewsEdit({ id: blog.id, value: String(blog.views ?? 0) });
  }

  async function saveViews(id) {
    const v = parseInt(viewsEdit.value, 10);
    if (isNaN(v) || v < 0) { toast('Ungültige Zahl', 'error'); return; }
    setViewsSaving(true);
    try {
      const res = await apiFetch(`/blogs/${id}/views`, { method: 'PATCH', body: JSON.stringify({ views: v }) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || data.message || `HTTP ${res.status}`);
      toast('Views gespeichert');
      setBlogs(bs => bs.map(b => b.id === id ? { ...b, views: v } : b));
      setViewsEdit(null);
    } catch (e) {
      toast(e.message, 'error');
    } finally {
      setViewsSaving(false);
    }
  }

  function cancelViewsEdit() { setViewsEdit(null); }

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
          <p style={{ color: 'var(--text3)', fontSize: '0.78rem', marginTop: 2 }}>
            {blogs.length > 0 ? `${blogs.length} Beitrag${blogs.length !== 1 ? 'e' : ''}` : 'Alle Beiträge verwalten'}
          </p>
        </div>
        <button className="btn-primary" onClick={() => openEditor()}>
          <i className="bi bi-plus-lg" /> Neuer Blog
        </button>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '3.5rem', textAlign: 'center', color: 'var(--text3)' }}>
            <span className="spinner" style={{ width: 20, height: 20, borderTopColor: 'var(--accent)', borderColor: 'rgba(0,0,0,0.08)' }} />
          </div>
        ) : blogs.length === 0 ? (
          <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text3)' }}>
            <i className="bi bi-journal-text" style={{ fontSize: '2rem', display: 'block', marginBottom: '1rem', opacity: 0.4 }} />
            <p style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text2)', marginBottom: '0.5rem' }}>Noch keine Blogs vorhanden</p>
            <p style={{ fontSize: '0.78rem', marginBottom: '1.5rem' }}>Erstelle deinen ersten Beitrag.</p>
            <button className="btn-primary" onClick={() => openEditor()} style={{ margin: '0 auto' }}>
              <i className="bi bi-plus-lg" /> Jetzt erstellen
            </button>
          </div>
        ) : (
          <table style={{ width: '100%' }}>
            <thead style={{ background: 'var(--bg3)' }}>
              <tr>
                {['Bild', 'Titel', 'Format', 'Status', 'Datum', 'Views', ''].map((h, i) => (
                  <th key={i}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {blogs.map(b => (
                <tr key={b.id}>
                  <td style={{ width: 56, paddingRight: 0 }}>
                    {b.image_url
                      ? <img src={b.image_url} alt="" style={{ width: 40, height: 30, objectFit: 'cover', borderRadius: 6, border: '1px solid var(--border)', display: 'block' }} />
                      : <div style={{ width: 40, height: 30, borderRadius: 6, background: 'var(--bg3)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <i className="bi bi-image" style={{ color: 'var(--text3)', fontSize: '0.8rem' }} />
                        </div>}
                  </td>
                  <td style={{ maxWidth: 240 }}>
                    <div className="truncate" style={{ color: 'var(--text)', fontWeight: 500, fontSize: '0.8125rem' }}>
                      {b.translations?.de?.title || b.title || '—'}
                    </div>
                    <div style={{ color: 'var(--text3)', fontSize: '0.7rem', marginTop: 1 }}>
                      /de/{b.slug_de || b.translations?.de?.slug || b.slug || '—'}
                    </div>
                  </td>
                  <td>
                    <span style={{
                      fontSize: '0.68rem',
                      padding: '2px 7px',
                      borderRadius: 5,
                      fontFamily: 'monospace',
                      fontWeight: 600,
                      background: b.content_format === 'blocks'
                        ? 'rgba(89,61,248,0.10)'
                        : b.content_format === 'markdown'
                          ? 'rgba(89,61,248,0.08)'
                          : 'rgba(0,0,0,0.05)',
                      color: b.content_format === 'blocks' || b.content_format === 'markdown'
                        ? 'var(--accent)'
                        : 'var(--text3)',
                    }}>
                      {formatBadge(b)}
                    </span>
                  </td>
                  <td>
                    <span className={`badge badge-${b.status}`}>
                      <i className={`bi bi-${b.status === 'published' ? 'check-circle-fill' : 'file-earmark'}`} />
                      {b.status === 'published' ? 'Veröffentlicht' : 'Entwurf'}
                    </span>
                  </td>
                  <td style={{ color: 'var(--text3)', fontSize: '0.78rem' }}>{fmt(b.created_at)}</td>
                  <td style={{ minWidth: 110 }}>
                    {viewsEdit?.id === b.id ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <input
                          type="number"
                          min="0"
                          value={viewsEdit.value}
                          onChange={e => setViewsEdit(ve => ({ ...ve, value: e.target.value }))}
                          onKeyDown={e => { if (e.key === 'Enter') saveViews(b.id); if (e.key === 'Escape') cancelViewsEdit(); }}
                          autoFocus
                          style={{
                            width: 72,
                            padding: '3px 6px',
                            fontSize: '0.78rem',
                            borderRadius: 5,
                            border: '1px solid var(--accent)',
                            outline: 'none',
                            background: 'var(--bg)',
                            color: 'var(--text)',
                          }}
                        />
                        <button
                          className="btn-outline btn-sm btn-icon"
                          title="Speichern"
                          disabled={viewsSaving}
                          onClick={() => saveViews(b.id)}
                          style={{ color: 'var(--success, #16a34a)' }}
                        >
                          {viewsSaving ? <span className="spinner" style={{ width: 10, height: 10 }} /> : <i className="bi bi-check-lg" />}
                        </button>
                        <button
                          className="btn-outline btn-sm btn-icon"
                          title="Abbrechen"
                          onClick={cancelViewsEdit}
                        >
                          <i className="bi bi-x" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => startViewsEdit(b)}
                        title="Views bearbeiten"
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 5,
                          padding: '3px 6px',
                          borderRadius: 5,
                          color: 'var(--text3)',
                          fontSize: '0.78rem',
                          fontVariantNumeric: 'tabular-nums',
                          transition: 'background 100ms, color 100ms',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg3)'; e.currentTarget.style.color = 'var(--text)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--text3)'; }}
                      >
                        <i className="bi bi-eye" style={{ fontSize: '0.7rem' }} />
                        {(b.views ?? 0).toLocaleString('de-DE')}
                        <i className="bi bi-pencil" style={{ fontSize: '0.6rem', opacity: 0.4 }} />
                      </button>
                    )}
                  </td>
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

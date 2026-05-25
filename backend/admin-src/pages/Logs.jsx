import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useApi } from '../hooks/useApi';
import WorldMap from '../components/WorldMap';

// ── Helpers ────────────────────────────────────────────────────

function fmtDate(d) {
  if (!d) return '–';
  return new Date(d).toLocaleString('de-DE', {
    day: '2-digit', month: '2-digit', year: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
}

function fmtMs(ms) {
  if (ms == null) return '–';
  if (ms < 1000) return `${ms} ms`;
  return `${(ms / 1000).toFixed(2)} s`;
}

function StatusBadge({ status }) {
  if (!status) return null;
  const color =
    status < 300 ? { bg: 'rgba(40,167,69,0.10)', text: '#28a745', border: 'rgba(40,167,69,0.22)' } :
    status < 400 ? { bg: 'rgba(245,149,0,0.10)',  text: '#f59500', border: 'rgba(245,149,0,0.22)' } :
    status < 500 ? { bg: 'rgba(229,56,59,0.10)',  text: '#e5383b', border: 'rgba(229,56,59,0.22)' } :
                   { bg: 'rgba(120,0,0,0.12)',    text: '#dc2626', border: 'rgba(220,38,38,0.30)' };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 3,
      padding: '2px 7px', borderRadius: 99,
      fontSize: '0.7rem', fontWeight: 700, fontVariantNumeric: 'tabular-nums',
      background: color.bg, color: color.text, border: `1px solid ${color.border}`,
    }}>
      {status}
    </span>
  );
}

function EventBadge({ type }) {
  const map = {
    login_success:   { label: 'Login OK',       bg: 'rgba(40,167,69,0.10)',  text: '#28a745', border: 'rgba(40,167,69,0.22)' },
    login_failed:    { label: 'Login Fehler',    bg: 'rgba(229,56,59,0.10)', text: '#e5383b', border: 'rgba(229,56,59,0.22)' },
    logout:          { label: 'Logout',          bg: 'rgba(140,140,140,0.10)',text: '#8c8c8c', border: 'rgba(140,140,140,0.22)' },
    token_refresh:   { label: 'Token Refresh',   bg: 'rgba(89,61,248,0.10)', text: '#593df8', border: 'rgba(89,61,248,0.22)' },
    account_locked:  { label: 'Account Gesperrt',bg: 'rgba(245,149,0,0.10)', text: '#f59500', border: 'rgba(245,149,0,0.22)' },
    failed_login:    { label: 'Login Fehler',    bg: 'rgba(229,56,59,0.10)', text: '#e5383b', border: 'rgba(229,56,59,0.22)' },
    brute_force:     { label: 'Brute Force',     bg: 'rgba(150,0,0,0.14)',   text: '#dc2626', border: 'rgba(220,38,38,0.30)' },
    invalid_token:   { label: 'Ungültiger Token',bg: 'rgba(245,149,0,0.10)', text: '#f59500', border: 'rgba(245,149,0,0.22)' },
    rate_limit_hit:  { label: 'Rate Limit',      bg: 'rgba(89,61,248,0.10)', text: '#593df8', border: 'rgba(89,61,248,0.22)' },
    sql_injection_attempt: { label: 'SQL Injection', bg: 'rgba(150,0,0,0.14)', text: '#dc2626', border: 'rgba(220,38,38,0.30)' },
    xss_attempt:     { label: 'XSS-Versuch',     bg: 'rgba(150,0,0,0.14)',   text: '#dc2626', border: 'rgba(220,38,38,0.30)' },
    path_traversal:  { label: 'Path Traversal',  bg: 'rgba(150,0,0,0.14)',   text: '#dc2626', border: 'rgba(220,38,38,0.30)' },
    suspicious_ua:   { label: 'Susp. User-Agent',bg: 'rgba(245,149,0,0.10)', text: '#f59500', border: 'rgba(245,149,0,0.22)' },
  };
  const c = map[type] || { label: type, bg: 'rgba(0,0,0,0.06)', text: '#8c8c8c', border: 'var(--border)' };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '2px 7px', borderRadius: 99,
      fontSize: '0.7rem', fontWeight: 600,
      background: c.bg, color: c.text, border: `1px solid ${c.border}`,
    }}>
      {c.label}
    </span>
  );
}

function MethodBadge({ method }) {
  const colors = {
    GET:    '#28a745',
    POST:   '#593df8',
    PUT:    '#f59500',
    PATCH:  '#f59500',
    DELETE: '#e5383b',
  };
  return (
    <span style={{
      fontSize: '0.68rem', fontWeight: 700, fontFamily: 'ui-monospace, monospace',
      color: colors[method] || '#8c8c8c',
      minWidth: 44, display: 'inline-block',
    }}>
      {method}
    </span>
  );
}

// ── Mini bar chart (hourly requests) ────────────────────────────

function HourlyChart({ data }) {
  if (!data?.length) return null;
  const max = Math.max(...data.map(d => d.count), 1);
  const now = new Date().getHours();

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 48 }}>
        {data.map(({ hour, count }) => {
          const pct = count / max;
          const isNow = hour === now;
          return (
            <div
              key={hour}
              title={`${String(hour).padStart(2,'0')}:00 — ${count} Anfragen`}
              style={{
                flex: 1,
                height: `${Math.max(pct * 100, count > 0 ? 6 : 2)}%`,
                minHeight: count > 0 ? 3 : 1,
                background: isNow ? '#593df8' : count > 0 ? 'rgba(89,61,248,0.45)' : 'rgba(0,0,0,0.06)',
                borderRadius: 2,
                transition: 'height 0.5s ease',
              }}
            />
          );
        })}
      </div>
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        marginTop: 5, color: 'var(--text3)', fontSize: '0.65rem', fontVariantNumeric: 'tabular-nums',
      }}>
        <span>0h</span>
        <span>6h</span>
        <span>12h</span>
        <span>18h</span>
        <span>23h</span>
      </div>
    </div>
  );
}

// ── Stat Card ───────────────────────────────────────────────────

function StatCard({ value, label, icon, color, sub }) {
  return (
    <div className="card stat-card" style={{
      display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.125rem',
      transition: 'transform 160ms ease, box-shadow 160ms ease',
    }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}
    >
      <div style={{
        width: 42, height: 42, borderRadius: 12, flexShrink: 0,
        background: `${color}14`, border: `1px solid ${color}22`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '1rem', color,
      }}>
        <i className={`bi ${icon}`} />
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: '1.7rem', fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.05em', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
          {value ?? '–'}
        </div>
        <div style={{ fontSize: '0.75rem', color: 'var(--text3)', fontWeight: 500, marginTop: 3 }}>{label}</div>
        {sub && <div style={{ fontSize: '0.68rem', color: 'var(--text3)', marginTop: 2, opacity: 0.75 }}>{sub}</div>}
      </div>
    </div>
  );
}

// ── Pagination ─────────────────────────────────────────────────

function Pagination({ page, total, limit, onChange }) {
  const totalPages = Math.ceil(total / limit);
  if (totalPages <= 1) return null;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center', marginTop: '1rem' }}>
      <button className="btn-outline btn-sm btn-icon" disabled={page <= 1} onClick={() => onChange(page - 1)}>
        <i className="bi bi-chevron-left" />
      </button>
      <span style={{ fontSize: '0.78rem', color: 'var(--text3)', fontVariantNumeric: 'tabular-nums' }}>
        {page} / {totalPages}
      </span>
      <button className="btn-outline btn-sm btn-icon" disabled={page >= totalPages} onClick={() => onChange(page + 1)}>
        <i className="bi bi-chevron-right" />
      </button>
    </div>
  );
}

// ── Tab bar ─────────────────────────────────────────────────────

const TABS = [
  { id: 'overview',  label: 'Übersicht',    icon: 'bi-bar-chart-fill' },
  { id: 'access',    label: 'Zugriffslogs', icon: 'bi-arrow-left-right' },
  { id: 'auth',      label: 'Authentifizierung', icon: 'bi-shield-lock' },
  { id: 'security',  label: 'Sicherheit',   icon: 'bi-exclamation-triangle-fill' },
  { id: 'errors',    label: 'Fehler',       icon: 'bi-bug-fill' },
  { id: 'map',       label: 'Weltkarte',    icon: 'bi-globe2' },
];

function TabBar({ active, onChange }) {
  return (
    <div style={{
      display: 'flex', gap: 2, padding: 4,
      background: 'var(--bg3)', borderRadius: 12,
      border: '1px solid var(--border)',
      marginBottom: '1.5rem',
      overflowX: 'auto',
    }}>
      {TABS.map(t => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '7px 14px',
            borderRadius: 9, border: 'none',
            background: active === t.id ? 'var(--bg2)' : 'transparent',
            color: active === t.id ? 'var(--text)' : 'var(--text3)',
            fontWeight: active === t.id ? 600 : 400,
            fontSize: '0.8rem', letterSpacing: '-0.01em',
            boxShadow: active === t.id ? 'var(--shadow)' : 'none',
            transition: 'all 150ms',
            whiteSpace: 'nowrap',
            cursor: 'pointer',
          }}
        >
          <i className={`bi ${t.icon}`} style={{ fontSize: '0.78rem' }} />
          {t.label}
        </button>
      ))}
    </div>
  );
}

// ── Overview tab ────────────────────────────────────────────────

function Overview({ stats, countries, loading, error, onRetry }) {
  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text3)' }}>
        <span className="spinner" style={{ width: 20, height: 20 }} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-error" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <i className="bi bi-exclamation-triangle-fill" />
        <span style={{ flex: 1 }}>Übersicht konnte nicht geladen werden: {error}</span>
        <button type="button" className="btn-outline btn-sm" onClick={onRetry}>
          Erneut versuchen
        </button>
      </div>
    );
  }

  if (!stats) return null;
  const errorRate = stats.total24h > 0 ? Math.round((stats.errors24h / stats.total24h) * 100) : 0;
  const topCountryMax = countries?.[0]?.count || 1;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Stat cards */}
      <div className="grid-3" style={{ gap: '0.875rem' }}>
        <StatCard value={stats.total24h?.toLocaleString()} label="Anfragen (24h)" icon="bi-lightning-fill" color="#593df8" />
        <StatCard value={stats.uniqueIPs24h?.toLocaleString()} label="Unique IPs (24h)" icon="bi-person-badge" color="#28a745" />
        <StatCard value={`${fmtMs(stats.avgResponseTime)}`} label="Ø Antwortzeit" icon="bi-speedometer" color="#f59500" />
        <StatCard value={stats.errors24h?.toLocaleString()} label="Fehler (4xx/5xx)" icon="bi-x-circle-fill" color="#e5383b" sub={`${errorRate}% Fehlerrate`} />
        <StatCard value={stats.authFails24h?.toLocaleString()} label="Login-Fehler (24h)" icon="bi-shield-x" color="#e5383b" />
        <StatCard value={stats.secEvents24h?.toLocaleString()} label="Security-Events" icon="bi-bug-fill" color="#f59500" />
      </div>

      {/* Hourly chart */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <div>
            <p style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text)' }}>Anfragen pro Stunde</p>
            <p style={{ fontSize: '0.73rem', color: 'var(--text3)', marginTop: 2 }}>Letzte 24 Stunden</p>
          </div>
          <span style={{ fontSize: '0.73rem', color: 'var(--text3)', fontVariantNumeric: 'tabular-nums' }}>
            Gesamt: {stats.hourlyData?.reduce((s, d) => s + d.count, 0).toLocaleString()}
          </span>
        </div>
        <HourlyChart data={stats.hourlyData} />
      </div>

      {/* Top countries + top IPs */}
      <div className="grid-2">
        {/* Top countries */}
        <div className="card">
          <p style={{ fontWeight: 600, fontSize: '0.825rem', color: 'var(--text)', marginBottom: '1rem' }}>
            <i className="bi bi-globe2" style={{ color: 'var(--accent)', marginRight: 6 }} />
            Top Länder (30d)
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {countries?.slice(0, 8).map((c, i) => {
              const pct = Math.round((c.count / topCountryMax) * 100);
              return (
                <div key={c.country_code}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text2)', fontWeight: 500 }}>
                      {i + 1}. {c.country || c.country_code || 'Unbekannt'}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text3)', fontVariantNumeric: 'tabular-nums' }}>
                      {parseInt(c.count).toLocaleString()}
                    </span>
                  </div>
                  <div style={{ height: 4, borderRadius: 99, background: 'var(--bg3)' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: 'var(--accent)', borderRadius: 99, transition: 'width 0.6s ease' }} />
                  </div>
                </div>
              );
            })}
            {!countries?.length && (
              <p style={{ color: 'var(--text3)', fontSize: '0.78rem', textAlign: 'center', padding: '1rem' }}>
                Noch keine Geo-Daten
              </p>
            )}
          </div>
        </div>

        {/* Top IPs */}
        <div className="card">
          <p style={{ fontWeight: 600, fontSize: '0.825rem', color: 'var(--text)', marginBottom: '1rem' }}>
            <i className="bi bi-hdd-network" style={{ color: 'var(--accent)', marginRight: 6 }} />
            Top IPs (24h)
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {stats.topIPs?.slice(0, 8).map((ip, i) => (
              <div key={ip.ip} style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '5px 8px', borderRadius: 7,
                background: i === 0 ? 'var(--accent-dim)' : 'transparent',
                transition: 'background 120ms',
              }}>
                <span style={{ color: 'var(--text3)', fontSize: '0.68rem', width: 16, textAlign: 'right', flexShrink: 0 }}>
                  {i + 1}
                </span>
                <span style={{ fontSize: '0.78rem', fontFamily: 'ui-monospace, monospace', color: 'var(--text2)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {ip.ip}
                </span>
                <span style={{ fontSize: '0.7rem', color: 'var(--text3)' }}>{ip.country || '–'}</span>
                <span style={{ fontSize: '0.73rem', fontWeight: 600, color: 'var(--text)', fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>
                  {parseInt(ip.count).toLocaleString()}
                </span>
              </div>
            ))}
            {!stats.topIPs?.length && (
              <p style={{ color: 'var(--text3)', fontSize: '0.78rem', textAlign: 'center', padding: '1rem' }}>
                Noch keine Daten
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Top endpoints */}
      {stats.topEndpoints?.length > 0 && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '0.875rem 1.125rem', borderBottom: '1px solid var(--border)' }}>
            <p style={{ fontWeight: 600, fontSize: '0.825rem', color: 'var(--text)' }}>
              <i className="bi bi-arrow-left-right" style={{ color: 'var(--accent)', marginRight: 6 }} />
              Top Endpunkte (7d)
            </p>
          </div>
          <table style={{ width: '100%' }}>
            <thead style={{ background: 'var(--bg3)' }}>
              <tr>
                {['Methode', 'URL', 'Anfragen', 'Ø ms'].map(h => <th key={h}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {stats.topEndpoints.slice(0, 8).map((e, i) => (
                <tr key={i}>
                  <td><MethodBadge method={e.method} /></td>
                  <td style={{ maxWidth: 300 }}>
                    <span className="truncate font-mono" style={{ fontSize: '0.76rem', color: 'var(--text2)', display: 'block' }}>
                      {e.url}
                    </span>
                  </td>
                  <td style={{ fontVariantNumeric: 'tabular-nums', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text)' }}>
                    {parseInt(e.count).toLocaleString()}
                  </td>
                  <td style={{ fontVariantNumeric: 'tabular-nums', fontSize: '0.78rem', color: 'var(--text3)' }}>
                    {Math.round(e.avg_ms)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Access Log tab ──────────────────────────────────────────────

function AccessTab({ data, page, setPage, loading }) {
  return (
    <div>
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center' }}>
            <span className="spinner" style={{ width: 18, height: 18 }} />
          </div>
        ) : data.logs.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text3)' }}>
            <i className="bi bi-journal-x" style={{ fontSize: '1.5rem', display: 'block', marginBottom: 8 }} />
            <p>Keine Logs vorhanden</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', minWidth: 700 }}>
              <thead style={{ background: 'var(--bg3)' }}>
                <tr>
                  {['Zeit', 'Methode', 'URL', 'Status', 'ms', 'IP', 'Land', 'Benutzer'].map(h => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.logs.map(log => (
                  <tr key={log.id}>
                    <td style={{ fontSize: '0.72rem', color: 'var(--text3)', whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>
                      {fmtDate(log.created_at)}
                    </td>
                    <td><MethodBadge method={log.method} /></td>
                    <td style={{ maxWidth: 220 }}>
                      <span className="truncate font-mono" style={{ fontSize: '0.72rem', color: 'var(--text2)', display: 'block' }}>
                        {log.url}
                      </span>
                    </td>
                    <td><StatusBadge status={log.status} /></td>
                    <td style={{ fontSize: '0.73rem', color: 'var(--text3)', fontVariantNumeric: 'tabular-nums' }}>
                      {log.response_time ?? '–'}
                    </td>
                    <td style={{ fontSize: '0.72rem', fontFamily: 'ui-monospace, monospace', color: 'var(--text2)' }}>
                      {log.ip || '–'}
                    </td>
                    <td style={{ fontSize: '0.72rem', color: 'var(--text3)' }}>
                      {log.country_code ? `${log.country_code}` : '–'}
                    </td>
                    <td style={{ fontSize: '0.73rem', color: 'var(--text2)' }}>
                      {log.username || <span style={{ color: 'var(--text3)', fontStyle: 'italic' }}>anon</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <Pagination page={page} total={data.total} limit={50} onChange={setPage} />
    </div>
  );
}

// ── Auth Log tab ────────────────────────────────────────────────

function AuthTab({ data, page, setPage, loading }) {
  return (
    <div>
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center' }}>
            <span className="spinner" style={{ width: 18, height: 18 }} />
          </div>
        ) : data.logs.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text3)' }}>
            <i className="bi bi-shield-lock" style={{ fontSize: '1.5rem', display: 'block', marginBottom: 8 }} />
            <p>Keine Auth-Logs vorhanden</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', minWidth: 600 }}>
              <thead style={{ background: 'var(--bg3)' }}>
                <tr>
                  {['Zeit', 'Ereignis', 'Benutzer', 'IP', 'Land', 'Details'].map(h => <th key={h}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {data.logs.map(log => (
                  <tr key={log.id}>
                    <td style={{ fontSize: '0.72rem', color: 'var(--text3)', whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>
                      {fmtDate(log.created_at)}
                    </td>
                    <td><EventBadge type={log.event_type} /></td>
                    <td style={{ fontSize: '0.78rem', fontWeight: 500, color: 'var(--text)' }}>{log.username || '–'}</td>
                    <td style={{ fontSize: '0.72rem', fontFamily: 'ui-monospace, monospace', color: 'var(--text2)' }}>
                      {log.ip || '–'}
                    </td>
                    <td style={{ fontSize: '0.72rem', color: 'var(--text3)' }}>{log.country || log.country_code || '–'}</td>
                    <td style={{ fontSize: '0.72rem', color: 'var(--text3)', maxWidth: 200 }}>
                      <span className="truncate" style={{ display: 'block' }}>{log.details || '–'}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <Pagination page={page} total={data.total} limit={50} onChange={setPage} />
    </div>
  );
}

// ── Security tab ────────────────────────────────────────────────

function SecurityTab({ data, page, setPage, loading }) {
  return (
    <div>
      <div className="alert alert-error mb-4" style={{ margin: 0, marginBottom: '1rem' }}>
        <i className="bi bi-exclamation-triangle-fill" />
        Diese Liste zeigt alle erkannten Sicherheitsereignisse. Häufige Einträge sollten blockiert werden.
      </div>
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center' }}>
            <span className="spinner" style={{ width: 18, height: 18 }} />
          </div>
        ) : data.logs.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text3)' }}>
            <i className="bi bi-shield-check" style={{ fontSize: '1.5rem', display: 'block', marginBottom: 8, color: 'var(--success)' }} />
            <p style={{ color: 'var(--success)', fontWeight: 500 }}>Keine Sicherheitsereignisse erkannt</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', minWidth: 640 }}>
              <thead style={{ background: 'var(--bg3)' }}>
                <tr>
                  {['Zeit', 'Ereignis', 'IP', 'URL', 'Details'].map(h => <th key={h}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {data.logs.map(log => (
                  <tr key={log.id}>
                    <td style={{ fontSize: '0.72rem', color: 'var(--text3)', whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>
                      {fmtDate(log.created_at)}
                    </td>
                    <td><EventBadge type={log.event_type} /></td>
                    <td style={{ fontSize: '0.72rem', fontFamily: 'ui-monospace, monospace', color: 'var(--text2)' }}>
                      {log.ip_address || '–'}
                    </td>
                    <td style={{ fontSize: '0.72rem', color: 'var(--text3)', maxWidth: 160 }}>
                      <span className="truncate font-mono" style={{ display: 'block' }}>{log.url || '–'}</span>
                    </td>
                    <td style={{ fontSize: '0.72rem', color: 'var(--text3)', maxWidth: 200 }}>
                      <span className="truncate" style={{ display: 'block' }}>{log.details || '–'}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <Pagination page={page} total={data.total} limit={50} onChange={setPage} />
    </div>
  );
}

// ── Error log tab ────────────────────────────────────────────────

function ErrorTab({ data, page, setPage, loading }) {
  const [expanded, setExpanded] = useState(null);

  return (
    <div>
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center' }}>
            <span className="spinner" style={{ width: 18, height: 18 }} />
          </div>
        ) : data.logs.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text3)' }}>
            <i className="bi bi-check-circle-fill" style={{ fontSize: '1.5rem', display: 'block', marginBottom: 8, color: 'var(--success)' }} />
            <p style={{ color: 'var(--success)', fontWeight: 500 }}>Keine Server-Fehler aufgezeichnet</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', minWidth: 640 }}>
              <thead style={{ background: 'var(--bg3)' }}>
                <tr>
                  {['Zeit', 'Status', 'Methode', 'Endpunkt', 'Nachricht', ''].map(h => <th key={h}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {data.logs.map(log => (
                  <React.Fragment key={log.id}>
                    <tr>
                      <td style={{ fontSize: '0.72rem', color: 'var(--text3)', whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>
                        {fmtDate(log.created_at)}
                      </td>
                      <td><StatusBadge status={log.status_code || 500} /></td>
                      <td><MethodBadge method={log.method || '–'} /></td>
                      <td style={{ maxWidth: 180 }}>
                        <span className="truncate font-mono" style={{ fontSize: '0.72rem', color: 'var(--text2)', display: 'block' }}>
                          {log.endpoint || '–'}
                        </span>
                      </td>
                      <td style={{ maxWidth: 240 }}>
                        <span className="truncate" style={{ fontSize: '0.73rem', color: 'var(--text2)', display: 'block' }}>
                          {log.message || '–'}
                        </span>
                      </td>
                      <td>
                        {log.stack && (
                          <button
                            className="btn-outline btn-sm btn-icon"
                            onClick={() => setExpanded(expanded === log.id ? null : log.id)}
                            title="Stack Trace"
                          >
                            <i className={`bi bi-chevron-${expanded === log.id ? 'up' : 'down'}`} />
                          </button>
                        )}
                      </td>
                    </tr>
                    {expanded === log.id && log.stack && (
                      <tr>
                        <td colSpan={6} style={{ padding: 0 }}>
                          <pre style={{
                            margin: 0, padding: '0.875rem 1.125rem',
                            background: 'var(--bg3)', fontSize: '0.7rem', lineHeight: 1.6,
                            color: '#e5383b', overflowX: 'auto', maxHeight: 240,
                            fontFamily: 'ui-monospace, monospace', whiteSpace: 'pre-wrap', wordBreak: 'break-all',
                          }}>
                            {log.stack}
                          </pre>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <Pagination page={page} total={data.total} limit={50} onChange={setPage} />
    </div>
  );
}

// ── Map tab ─────────────────────────────────────────────────────

function MapTab({ geoData, countries }) {
  const topMax = countries?.[0]?.count || 1;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* World map */}
      <div className="card" style={{ padding: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.875rem' }}>
          <div>
            <p style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text)' }}>Zugriffsherkunft</p>
            <p style={{ fontSize: '0.73rem', color: 'var(--text3)', marginTop: 2 }}>Letzte 30 Tage · {geoData?.length || 0} Standorte</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#593df8', boxShadow: '0 0 6px rgba(89,61,248,0.7)' }} />
            <span style={{ fontSize: '0.72rem', color: 'var(--text3)' }}>Zugriffspunkte</span>
          </div>
        </div>
        {!countries?.length ? (
          <div style={{
            height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(0,0,0,0.03)', borderRadius: 10, border: '1px solid var(--border)',
          }}>
            <div style={{ textAlign: 'center', color: 'var(--text3)' }}>
              <i className="bi bi-globe2" style={{ fontSize: '1.5rem', display: 'block', marginBottom: 8, opacity: 0.4 }} />
              <p style={{ fontSize: '0.78rem' }}>Noch keine Geodaten vorhanden</p>
              <p style={{ fontSize: '0.7rem', marginTop: 4, opacity: 0.7 }}>Geodaten werden für öffentliche IPs automatisch erfasst</p>
            </div>
          </div>
        ) : (
          <WorldMap countries={countries} />
        )}
      </div>

      {/* Country grid */}
      {countries?.length > 0 && (
        <div className="card">
          <p style={{ fontWeight: 600, fontSize: '0.825rem', color: 'var(--text)', marginBottom: '1rem' }}>
            Anfragen nach Land (30d)
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 8 }}>
            {countries.slice(0, 20).map((c, i) => {
              const pct = Math.round((c.count / topMax) * 100);
              return (
                <div key={c.country_code} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: 500, color: 'var(--text2)' }}>
                      {i + 1}. {c.country || c.country_code || 'Unbekannt'}
                    </span>
                    <span style={{ fontSize: '0.73rem', color: 'var(--text3)', fontVariantNumeric: 'tabular-nums' }}>
                      {parseInt(c.count).toLocaleString()}
                    </span>
                  </div>
                  <div style={{ height: 3, borderRadius: 99, background: 'var(--bg3)' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: 'var(--accent)', borderRadius: 99, transition: 'width 0.6s ease' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Logs page ──────────────────────────────────────────────

const EMPTY_LIST = { logs: [], total: 0 };

export default function Logs() {
  const { request } = useApi();

  const [tab, setTab]         = useState('overview');
  const [stats, setStats]     = useState(null);
  const [countries, setCountries] = useState([]);
  const [geoData, setGeoData] = useState([]);
  const [access, setAccess]   = useState(EMPTY_LIST);
  const [auth, setAuth]       = useState(EMPTY_LIST);
  const [security, setSecurity] = useState(EMPTY_LIST);
  const [errors, setErrors]   = useState(EMPTY_LIST);

  const [overviewError, setOverviewError]   = useState('');
  const [loadingStats, setLoadingStats]     = useState(false);
  const [loadingAccess, setLoadingAccess]   = useState(false);
  const [loadingAuth, setLoadingAuth]       = useState(false);
  const [loadingSec, setLoadingSec]         = useState(false);
  const [loadingErrors, setLoadingErrors]   = useState(false);

  const [accessPage, setAccessPage]   = useState(1);
  const [authPage, setAuthPage]       = useState(1);
  const [secPage, setSecPage]         = useState(1);
  const [errorPage, setErrorPage]     = useState(1);

  // Load overview stats + countries once
  useEffect(() => {
    setLoadingStats(true);
    setOverviewError('');
    Promise.all([
      request('/logs/stats'),
      request('/logs/countries?days=30'),
      request('/logs/geo?days=30'),
    ]).then(([s, c, g]) => {
      setStats(s);
      setCountries(c || []);
      setGeoData(g || []);
    }).catch(err => setOverviewError(err.message || 'Verbindungsfehler')).finally(() => setLoadingStats(false));
  }, []);

  // Load access logs on page change
  useEffect(() => {
    if (tab !== 'access') return;
    setLoadingAccess(true);
    request(`/logs/access?page=${accessPage}&limit=50`)
      .then(d => setAccess(d || EMPTY_LIST))
      .catch(() => setAccess(EMPTY_LIST))
      .finally(() => setLoadingAccess(false));
  }, [tab, accessPage]);

  // Load auth logs on page change
  useEffect(() => {
    if (tab !== 'auth') return;
    setLoadingAuth(true);
    request(`/logs/auth?page=${authPage}&limit=50`)
      .then(d => setAuth(d || EMPTY_LIST))
      .catch(() => setAuth(EMPTY_LIST))
      .finally(() => setLoadingAuth(false));
  }, [tab, authPage]);

  // Load security logs on page change
  useEffect(() => {
    if (tab !== 'security') return;
    setLoadingSec(true);
    request(`/logs/security?page=${secPage}&limit=50`)
      .then(d => setSecurity(d || EMPTY_LIST))
      .catch(() => setSecurity(EMPTY_LIST))
      .finally(() => setLoadingSec(false));
  }, [tab, secPage]);

  // Load error logs on page change
  useEffect(() => {
    if (tab !== 'errors') return;
    setLoadingErrors(true);
    request(`/system/errors?page=${errorPage}&limit=50`)
      .then(d => setErrors(d || EMPTY_LIST))
      .catch(() => setErrors(EMPTY_LIST))
      .finally(() => setLoadingErrors(false));
  }, [tab, errorPage]);

  function loadOverview() {
    setLoadingStats(true);
    setOverviewError('');
    Promise.all([
      request('/logs/stats'),
      request('/logs/countries?days=30'),
      request('/logs/geo?days=30'),
    ]).then(([s, c, g]) => {
      setStats(s);
      setCountries(c || []);
      setGeoData(g || []);
    }).catch(err => setOverviewError(err.message || 'Verbindungsfehler')).finally(() => setLoadingStats(false));
  }

  function handleRefresh() {
    loadOverview();

    if (tab === 'access')   { setAccessPage(1); }
    if (tab === 'auth')     { setAuthPage(1); }
    if (tab === 'security') { setSecPage(1); }
    if (tab === 'errors')   { setErrorPage(1); }
  }

  return (
    <div>
      {/* Page header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 style={{ color: 'var(--text)', fontSize: '1.3rem', fontWeight: 600, letterSpacing: '-0.03em' }}>
            Logs & Analysen
          </h2>
          <p style={{ color: 'var(--text3)', fontSize: '0.78rem', marginTop: 2 }}>
            Zugriffe, Authentifizierung und Sicherheitsereignisse
          </p>
        </div>
        <button className="btn-outline btn-sm" onClick={handleRefresh} disabled={loadingStats}>
          {loadingStats
            ? <span className="spinner" />
            : <i className="bi bi-arrow-clockwise" />
          }
          Aktualisieren
        </button>
      </div>

      <TabBar active={tab} onChange={setTab} />

      {tab === 'overview' && (
        <Overview stats={stats} countries={countries} loading={loadingStats} error={overviewError} onRetry={loadOverview} />
      )}
      {tab === 'access' && (
        <AccessTab data={access} page={accessPage} setPage={setAccessPage} loading={loadingAccess} />
      )}
      {tab === 'auth' && (
        <AuthTab data={auth} page={authPage} setPage={setAuthPage} loading={loadingAuth} />
      )}
      {tab === 'security' && (
        <SecurityTab data={security} page={secPage} setPage={setSecPage} loading={loadingSec} />
      )}
      {tab === 'errors' && (
        <ErrorTab data={errors} page={errorPage} setPage={setErrorPage} loading={loadingErrors} />
      )}
      {tab === 'map' && (
        <MapTab geoData={geoData} countries={countries} />
      )}
    </div>
  );
}

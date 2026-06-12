/**
 * Cloudflare Email Worker — pokyh.studio
 * ────────────────────────────────────────────────────────────────────────────
 * Makes a direct email to contact@pokyh.studio go through the SAME flow as the
 * website contact form. For every incoming message it:
 *
 *   1. Forwards the raw email to the studio inbox (FORWARD_TO) — full fidelity
 *      archive incl. attachments.
 *   2. Parses it and POSTs it to the backend (BACKEND_INBOUND_URL). The backend
 *      creates an Inquiry (visible in the admin dashboard) and sends the sender
 *      the same confirmation the form sends — one pipeline, one source of truth.
 *
 * Auto-confirmations are guarded against backscatter / mail loops:
 *   - skipped for automated senders (mailer-daemon, no-reply, bounces, …)
 *   - skipped for bulk / list / auto-submitted mail (newsletters, autoresponders)
 *   - confirmation sent at most once per sender per CONFIRM_TTL_MINUTES (KV) —
 *     a short per-sender rate limit. Note: the inquiry is still recorded every
 *     time; only the *confirmation* email is rate-limited.
 *
 * Bindings (see wrangler.toml / .dev.vars):
 *   FORWARD_TO            studio inbox (verified Cloudflare destination address)
 *   BACKEND_INBOUND_URL   e.g. https://pokyh.studio/api/inquiries/inbound
 *   INBOUND_EMAIL_SECRET  shared secret (matches backend INBOUND_EMAIL_SECRET)
 *   CONFIRM_TTL_MINUTES   confirmation rate-limit window in minutes (default 10)
 *   AUTOREPLY_KV          KV namespace for dedup
 */

import PostalMime from 'postal-mime';

export default {
  async email(message, env, ctx) {
    // 1) Always forward first — never lose a mail, even if ingest fails.
    try {
      await message.forward(env.FORWARD_TO);
    } catch (err) {
      console.error('Forward failed:', err?.message || err);
    }

    // 2) Ingest into the backend in the background — never delays delivery.
    ctx.waitUntil(ingest(message, env));
  },
};

// ── Ingest decision + backend hand-off ───────────────────────────────────────
async function ingest(message, env) {
  const sender = (message.from || '').trim().toLowerCase();

  if (!isPlausibleAddress(sender)) return;          // garbage / empty envelope
  if (isAutomatedSender(sender))  return;           // mailer-daemon, no-reply, …
  if (isAutomatedMail(message.headers)) return;     // newsletters, autoresponders

  // Rate-limit the confirmation only — we still record every email. At most one
  // confirmation per sender per CONFIRM_TTL_MINUTES (short window, like a
  // per-sender rate limit). KV enforces a 60s minimum TTL.
  const ttlMinutes = Math.max(1, parseInt(env.CONFIRM_TTL_MINUTES || '10', 10));
  const kvKey = `seen:${sender}`;
  let confirm = true;
  if (env.AUTOREPLY_KV && (await env.AUTOREPLY_KV.get(kvKey))) {
    confirm = false;
  }

  // Parse the MIME message to extract a readable name / subject / body.
  let parsed = {};
  try {
    parsed = await PostalMime.parse(message.raw);
  } catch (err) {
    console.error('MIME parse failed:', err?.message || err);
  }

  const payload = {
    from: parsed.from?.address || sender,
    name: parsed.from?.name || '',
    subject: parsed.subject || message.headers.get('subject') || '',
    text: parsed.text || stripHtml(parsed.html) || '',
    confirm,
  };

  const ok = await postToBackend(payload, env);

  // Only start the rate-limit window once a confirmation actually went out.
  if (ok && confirm && env.AUTOREPLY_KV) {
    await env.AUTOREPLY_KV.put(kvKey, '1', { expirationTtl: ttlMinutes * 60 });
  }
}

async function postToBackend(payload, env) {
  if (!env.BACKEND_INBOUND_URL || !env.INBOUND_EMAIL_SECRET) {
    console.warn('BACKEND_INBOUND_URL / INBOUND_EMAIL_SECRET missing — ingest skipped');
    return false;
  }
  try {
    const res = await fetch(env.BACKEND_INBOUND_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Inbound-Secret': env.INBOUND_EMAIL_SECRET,
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      console.error('Backend ingest error:', res.status, await res.text());
      return false;
    }
    return true;
  } catch (err) {
    console.error('Backend ingest failed:', err?.message || err);
    return false;
  }
}

// ── Loop / backscatter guards ────────────────────────────────────────────────
function isPlausibleAddress(addr) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(addr);
}

function isAutomatedSender(addr) {
  const local = addr.split('@')[0];
  return [
    'noreply', 'no-reply', 'donotreply', 'do-not-reply',
    'mailer-daemon', 'mailerdaemon', 'postmaster',
    'bounce', 'bounces', 'notifications', 'notification',
  ].some((p) => local.includes(p));
}

function isAutomatedMail(headers) {
  // RFC 3834 — anything other than "no" means it was machine-generated.
  const autoSubmitted = (headers.get('auto-submitted') || '').toLowerCase();
  if (autoSubmitted && autoSubmitted !== 'no') return true;

  const precedence = (headers.get('precedence') || '').toLowerCase();
  if (['bulk', 'list', 'junk', 'auto_reply'].includes(precedence)) return true;

  // Newsletters / mailing lists.
  if (headers.get('list-id') || headers.get('list-unsubscribe')) return true;

  // Common vendor autoresponder markers.
  if (headers.get('x-autoreply') || headers.get('x-autorespond')) return true;

  return false;
}

function stripHtml(html) {
  if (!html) return '';
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

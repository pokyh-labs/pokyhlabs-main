const nodemailer = require('nodemailer');
const logger = require('./logger');

// ── Configuration ────────────────────────────────────────────────────────────
// All driven by env vars so nothing is hardcoded. Resend is used as the SMTP
// relay (host smtp.resend.com, user literally "resend", pass = API key).
const MAIL_DOMAIN    = process.env.MAIL_DOMAIN    || 'pokyh.studio';
const MAIL_FROM      = process.env.MAIL_FROM      || `noreply@${MAIL_DOMAIN}`;
const MAIL_FROM_NAME = process.env.MAIL_FROM_NAME || 'Pokyh Studio';
const MAIL_ADMIN     = process.env.MAIL_ADMIN     || `hello@${MAIL_DOMAIN}`;
const SMTP_HOST      = process.env.SMTP_HOST       || 'smtp.resend.com';
const SMTP_PORT      = parseInt(process.env.SMTP_PORT || '587', 10);

let _transporter = null;

function isMailEnabled() {
  return !!process.env.RESEND_API_KEY;
}

function getTransporter() {
  if (!isMailEnabled()) return null;
  if (_transporter) return _transporter;
  _transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465,
    auth: {
      user: process.env.SMTP_USER || 'resend',
      pass: process.env.RESEND_API_KEY,
    },
  });
  return _transporter;
}

// ── Low-level send ─────────────────────────────────────────────────────────────
async function sendMail({ from, fromName, to, subject, html, text, replyTo }) {
  const transporter = getTransporter();
  if (!transporter) {
    logger.warn('Mail skipped — RESEND_API_KEY not configured', { to, subject });
    return { skipped: true };
  }
  const fromAddress = from || MAIL_FROM;
  const fromLine = fromName ? `${fromName} <${fromAddress}>` : fromAddress;
  const info = await transporter.sendMail({
    from: fromLine,
    to,
    subject,
    html,
    text: text || htmlToText(html),
    ...(replyTo ? { replyTo } : {}),
  });
  logger.info('Mail sent', { to, subject, messageId: info.messageId });
  return { messageId: info.messageId };
}

function htmlToText(html) {
  if (!html) return '';
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/&nbsp;/g, ' ')
    .trim();
}

function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ── Shared email shell ───────────────────────────────────────────────────────
// Clean, minimal, light layout — works across mail clients (inline styles only).
const ACCENT = '#593df8';
const INK    = '#101014';
const MUTED  = '#8a8a94';
const LINE   = '#ececf1';
const BG     = '#f4f4f7';

function shell({ preheader = '', body, footerNote }) {
  return `<!doctype html>
<html lang="de" style="height:100%;">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;height:100%;width:100%;background:#ffffff;">
  <span style="display:none!important;opacity:0;color:transparent;height:0;width:0;overflow:hidden;">${esc(preheader)}</span>
  <table role="presentation" width="100%" height="100%" cellpadding="0" cellspacing="0" style="width:100%;height:100%;min-height:100%;background:#ffffff;border:0;border-collapse:collapse;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <tr><td valign="top" style="padding:0;border:0;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="width:100%;border:0;border-collapse:collapse;">
        <tr><td style="padding:30px 40px 24px;border:0;background:${BG};">
          <div style="font-size:16px;font-weight:700;letter-spacing:-0.01em;color:${INK};">pokyh<span style="color:${ACCENT};">.</span>studio</div>
        </td></tr>
        <tr><td style="padding:40px;border:0;">
          ${body}
        </td></tr>
        <tr><td style="padding:24px 40px 30px;border:0;background:${BG};">
          <div style="font-size:12px;line-height:1.6;color:${MUTED};">
            ${footerNote || `Diese E-Mail wurde automatisch von pokyh.studio gesendet.`}
          </div>
          <div style="font-size:11px;color:${MUTED};margin-top:6px;">pokyh.studio · ${esc(MAIL_DOMAIN)}</div>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

function label(text) {
  return `<div style="font-size:10px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;color:${MUTED};margin:0 0 6px;">${esc(text)}</div>`;
}

function chip(text) {
  return `<span style="display:inline-block;background:rgba(89,61,248,0.07);border:1px solid rgba(89,61,248,0.18);border-radius:7px;padding:3px 10px;font-size:12px;color:${ACCENT};font-weight:600;margin:0 5px 5px 0;">${esc(text)}</span>`;
}

// ── Templates ────────────────────────────────────────────────────────────────

// Notification to the studio when a new inquiry arrives.
function inquiryNotificationEmail(inquiry) {
  const services = (inquiry.services || []).map(chip).join('') || '<span style="color:' + MUTED + ';">—</span>';
  const rows = [];
  rows.push(`<div style="margin-bottom:20px;">${label('Service')}${services}</div>`);
  if (inquiry.company) rows.push(`<div style="margin-bottom:20px;">${label('Unternehmen')}<div style="font-size:15px;color:${INK};">${esc(inquiry.company)}</div></div>`);
  if (inquiry.description) rows.push(`<div style="margin-bottom:20px;">${label('Nachricht')}<div style="font-size:14px;line-height:1.7;color:#3a3a42;white-space:pre-wrap;">${esc(inquiry.description)}</div></div>`);
  if (inquiry.deadline) rows.push(`<div style="margin-bottom:20px;">${label('Deadline')}<div style="font-size:15px;color:#d97706;font-weight:600;">${esc(inquiry.deadline)}</div></div>`);

  const body = `
    ${label('Neue Anfrage')}
    <h1 style="margin:0 0 4px;font-size:22px;font-weight:700;letter-spacing:-0.02em;color:${INK};">${esc(inquiry.name)}</h1>
    <a href="mailto:${esc(inquiry.email)}" style="font-size:14px;color:${ACCENT};text-decoration:none;">${esc(inquiry.email)}</a>
    <div style="height:1px;background:${LINE};margin:24px 0;"></div>
    ${rows.join('')}
    <a href="mailto:${esc(inquiry.email)}" style="display:inline-block;background:${ACCENT};color:#fff;font-size:14px;font-weight:600;text-decoration:none;padding:12px 24px;border-radius:10px;margin-top:4px;">Antworten</a>
  `;
  return shell({
    preheader: `Neue Anfrage von ${inquiry.name}`,
    body,
    footerNote: 'Du bekommst diese E-Mail, weil eine neue Kontaktanfrage über pokyh.studio eingegangen ist.',
  });
}

// Confirmation to the customer that we received their request.
function inquiryConfirmationEmail(inquiry) {
  const services = (inquiry.services || []).map(chip).join('');
  const body = `
    ${label('Anfrage erhalten')}
    <h1 style="margin:0 0 14px;font-size:23px;font-weight:700;letter-spacing:-0.02em;color:${INK};">Danke, ${esc(inquiry.name)}.</h1>
    <p style="margin:0 0 22px;font-size:15px;line-height:1.7;color:#3a3a42;">
      Wir haben deine Anfrage erhalten und melden uns in der Regel innerhalb von 24&nbsp;Stunden bei dir.
      Hier eine kurze Zusammenfassung:
    </p>
    ${services ? `<div style="margin-bottom:8px;">${services}</div>` : ''}
    ${inquiry.description ? `<div style="background:${BG};border:1px solid ${LINE};border-radius:12px;padding:16px 18px;margin-top:14px;font-size:14px;line-height:1.7;color:#3a3a42;white-space:pre-wrap;">${esc(inquiry.description)}</div>` : ''}
    <div style="height:1px;background:${LINE};margin:24px 0;"></div>
    <p style="margin:0;font-size:13px;line-height:1.7;color:${MUTED};">
      Antworte einfach direkt auf diese E-Mail, wenn du etwas ergänzen möchtest.
    </p>
  `;
  return shell({
    preheader: 'Wir haben deine Anfrage erhalten — wir melden uns in Kürze.',
    body,
    footerNote: 'Du erhältst diese Bestätigung, weil du pokyh.studio über das Kontaktformular angeschrieben hast.',
  });
}

// ── High-level helpers used by the controller ────────────────────────────────
async function sendInquiryNotification(inquiry) {
  return sendMail({
    from: MAIL_FROM,
    fromName: MAIL_FROM_NAME,
    to: MAIL_ADMIN,
    replyTo: inquiry.email,
    subject: `Neue Anfrage · ${inquiry.name}`,
    html: inquiryNotificationEmail(inquiry),
  });
}

async function sendInquiryConfirmation(inquiry) {
  return sendMail({
    from: MAIL_FROM,
    fromName: MAIL_FROM_NAME,
    to: inquiry.email,
    subject: 'Wir haben deine Anfrage erhalten',
    html: inquiryConfirmationEmail(inquiry),
  });
}

module.exports = {
  isMailEnabled,
  sendMail,
  sendInquiryNotification,
  sendInquiryConfirmation,
  MAIL_DOMAIN,
  MAIL_FROM,
  MAIL_ADMIN,
};

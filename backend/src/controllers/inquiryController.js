const { Inquiry } = require('../models');
const logger = require('../utils/logger');
const mailer = require('../utils/mailer');

const VALID_SERVICES = [
  'website', 'app', 'hosting', 'software-automation',
  'frontend', 'backend', 'threejs', 'seo', 'wordpress', 'ecommerce', 'react-native', 'flutter',
];

// Workflow statuses an inquiry can move through. 'read' stays valid only for
// older rows created before the workflow existed.
const VALID_STATUSES = ['new', 'in_progress', 'developing', 'waiting', 'done', 'archived', 'read'];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

async function createInquiry(req, res) {
  const { services, description, company, name, email, deadline, company_website } = req.body;

  // Honeypot: real users never fill this hidden field. If it's set, a bot did —
  // pretend success (201) so the bot learns nothing, but drop the submission.
  if (company_website) {
    logger.warn('Honeypot tripped on contact form', { ip: req.ip });
    return res.status(201).json({ message: 'Inquiry received.' });
  }

  if (!Array.isArray(services) || services.length === 0) {
    return res.status(400).json({ error: 'At least one service is required.' });
  }
  const invalid = services.filter(s => !VALID_SERVICES.includes(s));
  if (invalid.length > 0) {
    return res.status(400).json({ error: `Invalid services: ${invalid.join(', ')}` });
  }
  if (!name?.trim()) return res.status(400).json({ error: 'Name is required.' });
  if (!email?.trim() || !EMAIL_RE.test(email)) return res.status(400).json({ error: 'Valid email is required.' });

  let deadlineValue = null;
  if (deadline) {
    if (!DATE_RE.test(deadline)) return res.status(400).json({ error: 'Invalid deadline format.' });
    const minDate = new Date();
    minDate.setDate(minDate.getDate() + 6);
    if (new Date(deadline) < minDate) return res.status(400).json({ error: 'Deadline must be at least 1 week from today.' });
    deadlineValue = deadline;
  }

  const inquiry = await Inquiry.create({
    services: JSON.stringify(services),
    description: description?.trim() || null,
    company: company?.trim() || null,
    name: name.trim(),
    email: email.trim().toLowerCase(),
    deadline: deadlineValue,
    status: 'new',
  });

  // Fire-and-forget emails — never block or fail the form submission on mail errors.
  const payload = { ...inquiry.get({ plain: true }), services };
  Promise.allSettled([
    mailer.sendInquiryNotification(payload),
    mailer.sendInquiryConfirmation(payload),
  ]).then(results => {
    results.forEach(r => {
      if (r.status === 'rejected') logger.error('Inquiry email failed', { message: r.reason?.message });
    });
  });

  res.status(201).json({ id: inquiry.id, message: 'Inquiry received.' });
}

// Inbound email → inquiry. Called by the Cloudflare Email Worker when someone
// writes directly to contact@. Goes through the SAME pipeline as the form: it
// lands in the DB / admin dashboard and the sender gets the same confirmation.
// The raw email is forwarded to the studio inbox by the Worker itself, so we do
// not send a separate admin notification here (it would just duplicate it).
async function createInboundInquiry(req, res) {
  const { from, name, subject, text, confirm } = req.body;

  const email = (from || '').trim().toLowerCase();
  if (!email || !EMAIL_RE.test(email)) {
    return res.status(400).json({ error: 'Valid sender email is required.' });
  }

  const displayName = (name && name.trim()) || email.split('@')[0];
  const parts = [];
  if (subject && subject.trim()) parts.push(`Betreff: ${subject.trim()}`);
  if (text && text.trim()) parts.push(text.trim());
  const description = parts.join('\n\n') || null;

  const inquiry = await Inquiry.create({
    services: '[]',
    description,
    company: null,
    name: displayName,
    email,
    deadline: null,
    status: 'new',
    source: 'email',
  });

  // Same confirmation the form sends — fire-and-forget. The Worker decides via
  // `confirm:false` when a sender already got one recently (dedup), so we never
  // spam someone who emails several times in a row.
  if (confirm !== false) {
    const payload = { ...inquiry.get({ plain: true }), services: [] };
    mailer.sendInquiryConfirmation(payload).catch(err =>
      logger.error('Inbound confirmation failed', { message: err.message }));
  }

  res.status(201).json({ id: inquiry.id, message: 'Inbound inquiry received.' });
}

function safeParseServices(value) {
  try { return JSON.parse(value); } catch { return []; }
}

function serializeInquiry(r) {
  return {
    id: r.id,
    services: safeParseServices(r.services),
    description: r.description,
    company: r.company,
    name: r.name,
    email: r.email,
    status: r.status,
    deadline: r.deadline,
    source: r.source || 'form',
    createdAt: r.createdAt,
  };
}

async function getInquiries(req, res) {
  const { status } = req.query;
  const page  = Math.max(1, parseInt(req.query.page)  || 1);
  const limit = Math.min(Math.max(1, parseInt(req.query.limit) || 50), 100);
  const where = {};
  if (status && VALID_STATUSES.includes(status)) where.status = status;

  const offset = (page - 1) * limit;
  const { count, rows } = await Inquiry.findAndCountAll({
    where,
    order: [['createdAt', 'DESC']],
    limit,
    offset,
  });

  res.json({
    total: count,
    page,
    pages: Math.ceil(count / limit),
    inquiries: rows.map(serializeInquiry),
  });
}

async function updateInquiryStatus(req, res) {
  const { id } = req.params;
  const { status } = req.body;

  if (!VALID_STATUSES.includes(status)) {
    return res.status(400).json({ error: 'Invalid status.' });
  }

  const inquiry = await Inquiry.findByPk(id);
  if (!inquiry) return res.status(404).json({ error: 'Not found.' });

  await inquiry.update({ status });
  res.json({ id: inquiry.id, status: inquiry.status });
}

async function deleteInquiry(req, res) {
  const { id } = req.params;
  const inquiry = await Inquiry.findByPk(id);
  if (!inquiry) return res.status(404).json({ error: 'Not found.' });
  await inquiry.destroy();
  res.json({ message: 'Deleted.' });
}

module.exports = { createInquiry, createInboundInquiry, getInquiries, updateInquiryStatus, deleteInquiry };

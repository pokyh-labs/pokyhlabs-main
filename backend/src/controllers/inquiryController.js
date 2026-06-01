const { Inquiry, Message } = require('../models');
const logger = require('../utils/logger');
const mailer = require('../utils/mailer');

const VALID_SERVICES = [
  'website', 'app', 'hosting', 'software-automation',
  'frontend', 'backend', 'threejs', 'seo', 'wordpress', 'ecommerce', 'react-native', 'flutter',
];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

async function createInquiry(req, res) {
  const { services, description, company, name, email, deadline } = req.body;

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

  // The inquiry itself is the first (inbound) entry of the conversation — its
  // services/description are rendered as the opening "request" in the dashboard,
  // so no separate inbound Message row is needed here. Replies are stored as
  // outbound messages via the reply endpoint.

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
    createdAt: r.createdAt,
    messages: (r.messages || [])
      .slice()
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
      .map(m => ({
        id: m.id,
        direction: m.direction,
        author: m.author,
        from_email: m.from_email,
        to_email: m.to_email,
        subject: m.subject,
        body: m.body,
        emailed: m.emailed,
        createdAt: m.createdAt,
      })),
  };
}

function safeParseServices(value) {
  try { return JSON.parse(value); } catch { return []; }
}

async function getInquiries(req, res) {
  const { status } = req.query;
  const page  = Math.max(1, parseInt(req.query.page)  || 1);
  const limit = Math.min(Math.max(1, parseInt(req.query.limit) || 50), 100);
  const where = {};
  if (status && ['new', 'read', 'archived'].includes(status)) where.status = status;

  const offset = (page - 1) * limit;
  const { count, rows } = await Inquiry.findAndCountAll({
    where,
    order: [['createdAt', 'DESC']],
    limit,
    offset,
    include: [{ model: Message, as: 'messages' }],
    distinct: true,
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

  if (!['new', 'read', 'archived'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status.' });
  }

  const inquiry = await Inquiry.findByPk(id);
  if (!inquiry) return res.status(404).json({ error: 'Not found.' });

  await inquiry.update({ status });
  res.json({ id: inquiry.id, status: inquiry.status });
}

// Reply to an inquiry from the dashboard. The email is sent from
// <username>@pokyh.studio (the logged-in admin), and the reply is stored as an
// outbound message so the full conversation stays visible in the dashboard.
async function replyToInquiry(req, res) {
  const { id } = req.params;
  const { body, subject } = req.body;

  if (!body || !body.trim()) return res.status(400).json({ error: 'Message body is required.' });
  if (body.length > 10000) return res.status(400).json({ error: 'Message is too long.' });

  const inquiry = await Inquiry.findByPk(id);
  if (!inquiry) return res.status(404).json({ error: 'Not found.' });

  const username = req.user?.username || 'hello';
  const fromEmail = `${String(username).toLowerCase().replace(/[^a-z0-9._-]/g, '') || 'hello'}@${mailer.MAIL_DOMAIN}`;
  const finalSubject = (subject && subject.trim()) || `Re: Deine Anfrage bei pokyh.studio`;

  let emailed = false;
  let mailError = null;
  try {
    const result = await mailer.sendReply({
      username,
      displayName: username,
      to: inquiry.email,
      subject: finalSubject,
      bodyText: body.trim(),
    });
    emailed = !result?.skipped;
    if (result?.skipped) mailError = 'mail_disabled';
  } catch (err) {
    logger.error('Reply email failed', { message: err.message, inquiryId: id });
    mailError = err.message;
  }

  const message = await Message.create({
    inquiry_id: inquiry.id,
    direction: 'outbound',
    author: username,
    from_email: fromEmail,
    to_email: inquiry.email,
    subject: finalSubject,
    body: body.trim(),
    emailed,
  });

  // A reply implies we've handled it — move 'new' to 'read'.
  if (inquiry.status === 'new') await inquiry.update({ status: 'read' });

  res.status(201).json({
    message: {
      id: message.id,
      direction: message.direction,
      author: message.author,
      from_email: message.from_email,
      to_email: message.to_email,
      subject: message.subject,
      body: message.body,
      emailed: message.emailed,
      createdAt: message.createdAt,
    },
    emailed,
    mailError,
    status: inquiry.status,
  });
}

async function deleteInquiry(req, res) {
  const { id } = req.params;
  const inquiry = await Inquiry.findByPk(id);
  if (!inquiry) return res.status(404).json({ error: 'Not found.' });
  await inquiry.destroy();
  res.json({ message: 'Deleted.' });
}

module.exports = { createInquiry, getInquiries, updateInquiryStatus, replyToInquiry, deleteInquiry };

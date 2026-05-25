const { Inquiry } = require('../models');

const VALID_SERVICES = [
  'website', 'app', 'hosting',
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

  res.status(201).json({ id: inquiry.id, message: 'Inquiry received.' });
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
  });

  res.json({
    total: count,
    page,
    pages: Math.ceil(count / limit),
    inquiries: rows.map(r => ({
      id: r.id,
      services: JSON.parse(r.services),
      description: r.description,
      company: r.company,
      name: r.name,
      email: r.email,
      status: r.status,
      deadline: r.deadline,
      createdAt: r.createdAt,
    })),
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

async function deleteInquiry(req, res) {
  const { id } = req.params;
  const inquiry = await Inquiry.findByPk(id);
  if (!inquiry) return res.status(404).json({ error: 'Not found.' });
  await inquiry.destroy();
  res.json({ message: 'Deleted.' });
}

module.exports = { createInquiry, getInquiries, updateInquiryStatus, deleteInquiry };

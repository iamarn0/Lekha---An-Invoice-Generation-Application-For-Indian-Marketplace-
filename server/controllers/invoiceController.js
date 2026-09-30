const mongoose = require('mongoose');
const Invoice = require('../models/Invoice');
const Client = require('../models/Client');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { containsRegex } = require('../utils/regex');
const { getPagination, getSort } = require('../utils/pagination');
const { calculateInvoice } = require('../services/invoiceCalc');
const { DOCUMENT_TYPES, isStateCode, supplyTypeFor } = require('../utils/india');
const { logActivity } = require('../services/activityService');
const { markOverdueInvoices, refreshInvoiceStatus } = require('../services/invoiceStatus');
const { generateInvoicePdf } = require('../services/pdfService');

const STATUSES = ['draft', 'sent', 'paid', 'overdue', 'cancelled'];

function assertId(id) {
  if (!mongoose.isValidObjectId(id)) throw new AppError('Invalid identifier', 400);
}

function parseDate(value, label) {
  if (!value) throw new AppError(`${label} is required`, 400);
  const raw = String(value);
  const date = /^\d{4}-\d{2}-\d{2}$/.test(raw) ? new Date(`${raw}T12:00:00.000Z`) : new Date(raw);
  if (Number.isNaN(date.getTime())) throw new AppError(`${label} is invalid`, 400);
  return date;
}

function assertItems(items) {
  if (!Array.isArray(items) || items.length === 0) throw new AppError('Add at least one line item', 400);
  if (items.length > 40) throw new AppError('Invoices are limited to 40 line items', 400);
  items.forEach((item, index) => {
    const row = index + 1;
    if (!item?.description || !String(item.description).trim()) {
      throw new AppError(`Item ${row} needs a description`, 400);
    }
    if (!(Number(item.quantity) > 0)) throw new AppError(`Item ${row} quantity must be greater than zero`, 400);
    if (!(Number(item.unitPrice) >= 0) || Number.isNaN(Number(item.unitPrice))) {
      throw new AppError(`Item ${row} price cannot be negative`, 400);
    }
    const hsn = String(item.hsn || '').trim();
    if (hsn && !/^\d{4,8}$/.test(hsn)) throw new AppError(`Item ${row} HSN/SAC must be 4 to 8 digits`, 400);
  });
}

async function nextInvoiceNumber(userId) {
  const user = await User.findByIdAndUpdate(userId, { $inc: { invoiceNextNumber: 1 } }, { new: true });
  const sequence = user.invoiceNextNumber - 1;
  return `${(user.invoicePrefix || 'INV').toUpperCase()}-${sequence}`;
}

async function loadClient(userId, clientId) {
  if (!mongoose.isValidObjectId(clientId)) throw new AppError('Choose a client', 400);
  const client = await Client.findOne({ _id: clientId, user: userId });
  if (!client) throw new AppError('Client not found', 404);
  return client;
}

function snapshotFrom(client) {
  return {
    name: client.name,
    company: client.company,
    email: client.email,
    phone: client.phone,
    address: client.address,
    gstin: client.gstin || '',
    pan: client.pan || '',
    state: client.state || '',
  };
}

function readCommercial(body, user, client) {
  const documentType = DOCUMENT_TYPES.includes(body.documentType) ? body.documentType : 'tax_invoice';
  const placeOfSupply = String(body.placeOfSupply || client.state || user.state || '').trim();
  if (placeOfSupply && !isStateCode(placeOfSupply)) throw new AppError('Choose a valid place of supply', 400);
  return {
    documentType,
    placeOfSupply,
    supplyType: supplyTypeFor(user.state, placeOfSupply),
    upiId: user.upiId || '',
  };
}

function totalsFor(source, status) {
  return calculateInvoice({
    items: source.items,
    taxRate: source.taxRate,
    discount: source.discount,
    discountType: source.discountType,
    status,
    supplyType: source.supplyType,
    documentType: source.documentType,
  });
}

function readMoneyInput(body) {
  const discountType = body.discountType === 'fixed' ? 'fixed' : 'percent';
  const discount = Number(body.discount) || 0;
  const taxRate = Number(body.taxRate) || 0;
  if (discount < 0) throw new AppError('Discount cannot be negative', 400);
  if (discountType === 'percent' && discount > 100) throw new AppError('Percent discount cannot exceed 100', 400);
  if (taxRate < 0 || taxRate > 100) throw new AppError('Tax rate must be between 0 and 100', 400);
  return { discountType, discount, taxRate };
}

function statusDates(status, existing = {}) {
  const keepsSent = ['sent', 'paid', 'overdue'].includes(status);
  return {
    sentAt: keepsSent ? existing.sentAt || new Date() : null,
    paidAt: status === 'paid' ? existing.paidAt || new Date() : null,
  };
}

async function findInvoice(userId, id) {
  assertId(id);
  const invoice = await Invoice.findOne({ _id: id, user: userId }).populate('client', 'name company email status');
  if (!invoice) throw new AppError('Invoice not found', 404);
  return invoice;
}

exports.list = asyncHandler(async (req, res) => {
  await markOverdueInvoices(req.user._id);
  const { page, limit, skip } = getPagination(req.query);
  const sort = getSort(
    req.query,
    ['invoiceNumber', 'issueDate', 'dueDate', 'grandTotal', 'outstanding', 'status', 'createdAt'],
    'issueDate',
    'desc'
  );

  const filter = { user: req.user._id };
  if (STATUSES.includes(req.query.status)) filter.status = req.query.status;
  if (DOCUMENT_TYPES.includes(req.query.documentType)) filter.documentType = req.query.documentType;
  if (req.query.client && mongoose.isValidObjectId(req.query.client)) filter.client = req.query.client;

  if (req.query.from || req.query.to) {
    filter.issueDate = {};
    if (req.query.from) filter.issueDate.$gte = parseDate(req.query.from, 'Start date');
    if (req.query.to) filter.issueDate.$lte = parseDate(req.query.to, 'End date');
  }

  const minAmount = req.query.minAmount === undefined || req.query.minAmount === '' ? null : Number(req.query.minAmount);
  const maxAmount = req.query.maxAmount === undefined || req.query.maxAmount === '' ? null : Number(req.query.maxAmount);
  if (minAmount !== null || maxAmount !== null) {
    filter.grandTotal = {};
    if (minAmount !== null && !Number.isNaN(minAmount)) filter.grandTotal.$gte = minAmount;
    if (maxAmount !== null && !Number.isNaN(maxAmount)) filter.grandTotal.$lte = maxAmount;
  }

  const search = String(req.query.search || '').trim();
  if (search) {
    const regex = containsRegex(search);
    const clients = await Client.find({
      user: req.user._id,
      $or: [{ name: regex }, { company: regex }, { email: regex }],
    }).select('_id');
    filter.$or = [
      { invoiceNumber: regex },
      { notes: regex },
      { 'clientSnapshot.name': regex },
      { 'clientSnapshot.company': regex },
      { client: { $in: clients.map((client) => client._id) } },
    ];
  }

  const [total, items] = await Promise.all([
    Invoice.countDocuments(filter),
    Invoice.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate('client', 'name company email status'),
  ]);

  res.json({
    success: true,
    data: {
      items,
      pagination: { page, limit, total, pages: Math.max(Math.ceil(total / limit), 1) },
    },
  });
});

exports.getOne = asyncHandler(async (req, res) => {
  const invoice = await refreshInvoiceStatus(await findInvoice(req.user._id, req.params.id), req.user._id);
  res.json({ success: true, data: invoice });
});

exports.create = asyncHandler(async (req, res) => {
  assertItems(req.body.items);
  const status = STATUSES.includes(req.body.status) ? req.body.status : 'draft';
  const client = await loadClient(req.user._id, req.body.client);
  const issueDate = parseDate(req.body.issueDate, 'Issue date');
  const dueDate = parseDate(req.body.dueDate, 'Due date');
  if (dueDate < issueDate) throw new AppError('Due date cannot be earlier than the issue date', 400);

  const money = readMoneyInput(req.body);
  const commercial = readCommercial(req.body, req.user, client);
  const totals = calculateInvoice({ items: req.body.items, ...money, status, ...commercial });
  const dates = statusDates(status);

  const invoice = await Invoice.create({
    user: req.user._id,
    client: client._id,
    clientSnapshot: snapshotFrom(client),
    invoiceNumber: await nextInvoiceNumber(req.user._id),
    issueDate,
    dueDate,
    notes: (req.body.notes || '').trim(),
    status,
    discount: money.discount,
    discountType: money.discountType,
    placeOfSupply: commercial.placeOfSupply,
    upiId: commercial.upiId,
    ...totals,
    ...dates,
  });

  await logActivity(req.user._id, {
    type: 'invoice_created',
    message: `Invoice ${invoice.invoiceNumber} created`,
    invoice: invoice._id,
    client: client._id,
    invoiceNumber: invoice.invoiceNumber,
  });

  const fresh = await findInvoice(req.user._id, invoice._id);
  res.status(201).json({ success: true, data: fresh });
});

exports.update = asyncHandler(async (req, res) => {
  const invoice = await findInvoice(req.user._id, req.params.id);
  assertItems(req.body.items);
  const status = STATUSES.includes(req.body.status) ? req.body.status : invoice.status;
  const client = await loadClient(req.user._id, req.body.client);
  const issueDate = parseDate(req.body.issueDate, 'Issue date');
  const dueDate = parseDate(req.body.dueDate, 'Due date');
  if (dueDate < issueDate) throw new AppError('Due date cannot be earlier than the issue date', 400);

  const money = readMoneyInput(req.body);
  const commercial = readCommercial(req.body, req.user, client);
  const totals = calculateInvoice({ items: req.body.items, ...money, status, ...commercial });
  const previousStatus = invoice.status;

  invoice.client = client._id;
  invoice.clientSnapshot = snapshotFrom(client);
  invoice.issueDate = issueDate;
  invoice.dueDate = dueDate;
  invoice.notes = (req.body.notes || '').trim();
  invoice.status = status;
  invoice.discount = money.discount;
  invoice.discountType = money.discountType;
  invoice.placeOfSupply = commercial.placeOfSupply;
  invoice.upiId = commercial.upiId;
  Object.assign(invoice, totals, statusDates(status, invoice));
  await invoice.save();

  const message = previousStatus !== status
    ? `Invoice ${invoice.invoiceNumber} marked ${status}`
    : `Invoice ${invoice.invoiceNumber} updated`;

  await logActivity(req.user._id, {
    type: previousStatus !== status ? `invoice_${status}` : 'invoice_updated',
    message,
    invoice: invoice._id,
    client: client._id,
    invoiceNumber: invoice.invoiceNumber,
  });

  res.json({ success: true, data: await findInvoice(req.user._id, invoice._id) });
});

exports.remove = asyncHandler(async (req, res) => {
  const invoice = await findInvoice(req.user._id, req.params.id);
  const number = invoice.invoiceNumber;
  await invoice.deleteOne();
  await logActivity(req.user._id, {
    type: 'invoice_deleted',
    message: `Invoice ${number} deleted`,
    invoiceNumber: number,
  });
  res.json({ success: true, message: 'Invoice deleted' });
});

exports.duplicate = asyncHandler(async (req, res) => {
  const invoice = await findInvoice(req.user._id, req.params.id);
  const issueDate = parseDate(new Date().toISOString().slice(0, 10), 'Issue date');
  const dueDate = new Date(issueDate);
  dueDate.setUTCDate(dueDate.getUTCDate() + 14);
  const totals = totalsFor({ ...invoice.toObject(), status: 'draft' }, 'draft');

  const copy = await Invoice.create({
    user: req.user._id,
    client: invoice.client._id || invoice.client,
    clientSnapshot: invoice.clientSnapshot,
    invoiceNumber: await nextInvoiceNumber(req.user._id),
    issueDate,
    dueDate,
    notes: invoice.notes,
    status: 'draft',
    discount: invoice.discount,
    discountType: invoice.discountType,
    placeOfSupply: invoice.placeOfSupply,
    upiId: req.user.upiId || invoice.upiId || '',
    sentAt: null,
    paidAt: null,
    ...totals,
  });

  await logActivity(req.user._id, {
    type: 'invoice_duplicated',
    message: `Invoice ${invoice.invoiceNumber} duplicated as ${copy.invoiceNumber}`,
    invoice: copy._id,
    client: copy.client,
    invoiceNumber: copy.invoiceNumber,
  });

  res.status(201).json({ success: true, data: await findInvoice(req.user._id, copy._id) });
});

exports.updateStatus = asyncHandler(async (req, res) => {
  const invoice = await findInvoice(req.user._id, req.params.id);
  const status = req.body.status;
  if (!STATUSES.includes(status)) throw new AppError('Choose a valid status', 400);

  const totals = totalsFor(invoice, status);

  invoice.status = status;
  Object.assign(invoice, totals, statusDates(status, invoice));
  await invoice.save();

  const labels = {
    paid: `Invoice ${invoice.invoiceNumber} paid`,
    overdue: `Invoice ${invoice.invoiceNumber} overdue`,
    draft: `Invoice ${invoice.invoiceNumber} moved to draft`,
    sent: `Invoice ${invoice.invoiceNumber} sent`,
    cancelled: `Invoice ${invoice.invoiceNumber} cancelled`,
  };

  await logActivity(req.user._id, {
    type: `invoice_${status}`,
    message: labels[status],
    invoice: invoice._id,
    client: invoice.client?._id || invoice.client,
    invoiceNumber: invoice.invoiceNumber,
  });

  res.json({ success: true, data: await findInvoice(req.user._id, invoice._id) });
});

exports.send = asyncHandler(async (req, res) => {
  const invoice = await findInvoice(req.user._id, req.params.id);
  if (invoice.status === 'cancelled') throw new AppError('Cancelled invoices cannot be sent', 400);
  if (invoice.status === 'paid') throw new AppError('This invoice is already paid', 400);

  if (invoice.status === 'draft') invoice.status = 'sent';
  invoice.sentAt = invoice.sentAt || new Date();
  const totals = totalsFor(invoice, invoice.status);
  Object.assign(invoice, totals);
  await invoice.save();

  await logActivity(req.user._id, {
    type: 'invoice_sent',
    message: `Invoice ${invoice.invoiceNumber} sent`,
    invoice: invoice._id,
    client: invoice.client?._id || invoice.client,
    invoiceNumber: invoice.invoiceNumber,
  });

  res.json({
    success: true,
    message: 'Invoice marked as sent',
    data: await findInvoice(req.user._id, invoice._id),
  });
});

exports.convert = asyncHandler(async (req, res) => {
  const invoice = await findInvoice(req.user._id, req.params.id);
  if (invoice.documentType === 'tax_invoice') throw new AppError('This is already a tax invoice', 400);

  invoice.documentType = 'tax_invoice';
  invoice.status = 'draft';
  invoice.sentAt = null;
  invoice.paidAt = null;
  Object.assign(invoice, totalsFor(invoice, 'draft'));
  await invoice.save();

  await logActivity(req.user._id, {
    type: 'invoice_created',
    message: `${invoice.invoiceNumber} converted to a tax invoice`,
    invoice: invoice._id,
    client: invoice.client?._id || invoice.client,
    invoiceNumber: invoice.invoiceNumber,
  });

  res.json({ success: true, data: await findInvoice(req.user._id, invoice._id) });
});

exports.pdf = asyncHandler(async (req, res) => {
  const invoice = await findInvoice(req.user._id, req.params.id);
  const buffer = await generateInvoicePdf(invoice, req.user);
  const filename = `${invoice.invoiceNumber}.pdf`.replace(/[^a-zA-Z0-9._-]/g, '');
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(buffer);
});

const mongoose = require('mongoose');
const Client = require('../models/Client');
const Invoice = require('../models/Invoice');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { containsRegex } = require('../utils/regex');
const { GSTIN_RE, PAN_RE, isStateCode } = require('../utils/india');
const { getPagination, getSort } = require('../utils/pagination');
const { logActivity } = require('../services/activityService');

function assertId(id) {
  if (!mongoose.isValidObjectId(id)) throw new AppError('Invalid identifier', 400);
}

exports.list = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const sort = getSort(req.query, ['name', 'email', 'company', 'status', 'outstanding', 'createdAt'], 'name', 'asc');
  const match = { user: req.user._id };

  if (req.query.status === 'active' || req.query.status === 'inactive') {
    match.status = req.query.status;
  }

  const search = String(req.query.search || '').trim();
  if (search) {
    const regex = containsRegex(search);
    match.$or = [{ name: regex }, { company: regex }, { email: regex }];
  }

  const pipeline = [
    { $match: match },
    {
      $lookup: {
        from: 'invoices',
        let: { clientId: '$_id' },
        pipeline: [
          {
            $match: {
              $expr: { $eq: ['$client', '$$clientId'] },
              user: req.user._id,
              status: { $in: ['sent', 'overdue'] },
              documentType: 'tax_invoice',
            },
          },
          { $group: { _id: null, outstanding: { $sum: '$outstanding' } } },
        ],
        as: 'balance',
      },
    },
    {
      $addFields: {
        outstanding: { $ifNull: [{ $arrayElemAt: ['$balance.outstanding', 0] }, 0] },
      },
    },
    { $project: { balance: 0 } },
  ];

  if (req.query.status === 'outstanding') {
    pipeline.push({ $match: { outstanding: { $gt: 0 } } });
  }

  const [countRows, items] = await Promise.all([
    Client.aggregate([...pipeline, { $count: 'total' }]),
    Client.aggregate([...pipeline, { $sort: sort }, { $skip: skip }, { $limit: limit }]),
  ]);

  const total = countRows[0]?.total || 0;
  res.json({
    success: true,
    data: {
      items,
      pagination: { page, limit, total, pages: Math.max(Math.ceil(total / limit), 1) },
    },
  });
});

exports.getOne = asyncHandler(async (req, res) => {
  assertId(req.params.id);
  const client = await Client.findOne({ _id: req.params.id, user: req.user._id });
  if (!client) throw new AppError('Client not found', 404);

  const [balance] = await Invoice.aggregate([
    {
      $match: {
        user: req.user._id,
        client: client._id,
        status: { $in: ['sent', 'overdue'] },
        documentType: 'tax_invoice',
      },
    },
    { $group: { _id: null, outstanding: { $sum: '$outstanding' } } },
  ]);

  res.json({
    success: true,
    data: { ...client.toJSON(), outstanding: balance?.outstanding || 0 },
  });
});

function readIdentity(body) {
  const gstin = String(body.gstin || '').trim().toUpperCase();
  const pan = String(body.pan || '').trim().toUpperCase();
  const state = String(body.state || '').trim();
  if (gstin && !GSTIN_RE.test(gstin)) throw new AppError('Enter a valid GSTIN', 400);
  if (pan && !PAN_RE.test(pan)) throw new AppError('Enter a valid PAN', 400);
  if (state && !isStateCode(state)) throw new AppError('Choose a state', 400);
  return { gstin, pan, state };
}

exports.create = asyncHandler(async (req, res) => {
  const identity = readIdentity(req.body);
  const client = await Client.create({
    user: req.user._id,
    name: req.body.name.trim(),
    company: (req.body.company || '').trim(),
    email: req.body.email.toLowerCase().trim(),
    phone: (req.body.phone || '').trim(),
    address: (req.body.address || '').trim(),
    ...identity,
    status: req.body.status === 'inactive' ? 'inactive' : 'active',
  });

  await logActivity(req.user._id, {
    type: 'client_created',
    message: `Client added: ${client.name}`,
    client: client._id,
  });

  res.status(201).json({ success: true, data: { ...client.toJSON(), outstanding: 0 } });
});

exports.update = asyncHandler(async (req, res) => {
  assertId(req.params.id);
  const client = await Client.findOne({ _id: req.params.id, user: req.user._id });
  if (!client) throw new AppError('Client not found', 404);

  client.name = req.body.name.trim();
  client.company = (req.body.company || '').trim();
  client.email = req.body.email.toLowerCase().trim();
  client.phone = (req.body.phone || '').trim();
  client.address = (req.body.address || '').trim();
  Object.assign(client, readIdentity(req.body));
  if (req.body.status === 'active' || req.body.status === 'inactive') client.status = req.body.status;
  await client.save();

  await logActivity(req.user._id, {
    type: 'client_updated',
    message: `Client updated: ${client.name}`,
    client: client._id,
  });

  const fresh = await Client.findById(client._id);
  res.json({ success: true, data: fresh });
});

exports.remove = asyncHandler(async (req, res) => {
  assertId(req.params.id);
  const client = await Client.findOne({ _id: req.params.id, user: req.user._id });
  if (!client) throw new AppError('Client not found', 404);

  const invoiceCount = await Invoice.countDocuments({ user: req.user._id, client: client._id });
  if (invoiceCount > 0) {
    throw new AppError('This client has invoices. Mark them inactive instead of deleting.', 409);
  }

  await client.deleteOne();
  await logActivity(req.user._id, {
    type: 'client_deleted',
    message: `Client removed: ${client.name}`,
  });

  res.json({ success: true, message: 'Client deleted' });
});

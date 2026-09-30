const mongoose = require('mongoose');
const Activity = require('../models/Activity');
const asyncHandler = require('../utils/asyncHandler');
const { getPagination } = require('../utils/pagination');

exports.list = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query, 12);
  const filter = { user: req.user._id };
  if (req.query.invoice && mongoose.isValidObjectId(req.query.invoice)) filter.invoice = req.query.invoice;
  if (req.query.client && mongoose.isValidObjectId(req.query.client)) filter.client = req.query.client;

  const [total, items] = await Promise.all([
    Activity.countDocuments(filter),
    Activity.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
  ]);

  res.json({
    success: true,
    data: {
      items,
      pagination: { page, limit, total, pages: Math.max(Math.ceil(total / limit), 1) },
    },
  });
});

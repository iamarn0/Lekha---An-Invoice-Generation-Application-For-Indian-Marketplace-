const bcrypt = require('bcryptjs');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { removeUpload } = require('../utils/files');
const {
  BUSINESS_TYPES,
  GSTIN_RE,
  PAN_RE,
  RAZORPAY_KEY_RE,
  UPI_RE,
  isStateCode,
} = require('../utils/india');

const CURRENCIES = ['INR', 'USD', 'EUR', 'GBP', 'AED', 'SGD'];

exports.update = asyncHandler(async (req, res) => {
  const user = req.user;
  const email = req.body.email.toLowerCase().trim();
  if (email !== user.email) {
    const taken = await User.findOne({ email, _id: { $ne: user._id } });
    if (taken) throw new AppError('That email is already in use', 409);
    user.email = email;
  }

  const currency = String(req.body.currency || user.currency || 'INR').toUpperCase();
  if (!CURRENCIES.includes(currency)) throw new AppError('Choose a supported currency', 400);

  const gstin = String(req.body.gstin ?? user.gstin ?? '').trim().toUpperCase();
  const pan = String(req.body.pan ?? user.pan ?? '').trim().toUpperCase();
  const state = String(req.body.state ?? user.state ?? '').trim();
  const upiId = String(req.body.upiId ?? user.upiId ?? '').trim();
  const razorpayKeyId = String(req.body.razorpayKeyId ?? user.razorpayKeyId ?? '').trim();
  const businessType = String(req.body.businessType ?? user.businessType ?? '').trim();
  if (gstin && !GSTIN_RE.test(gstin)) throw new AppError('Enter a valid GSTIN', 400);
  if (pan && !PAN_RE.test(pan)) throw new AppError('Enter a valid PAN', 400);
  if (state && !isStateCode(state)) throw new AppError('Choose a state', 400);
  if (upiId && !UPI_RE.test(upiId)) throw new AppError('Enter a valid UPI ID', 400);
  if (razorpayKeyId && !RAZORPAY_KEY_RE.test(razorpayKeyId)) {
    throw new AppError('Razorpay key ID should look like rzp_test_… or rzp_live_…', 400);
  }
  if (businessType && !BUSINESS_TYPES.includes(businessType)) throw new AppError('Choose a business type', 400);

  const taxRate = Number(req.body.taxRate);
  if (Number.isNaN(taxRate) || taxRate < 0 || taxRate > 100) {
    throw new AppError('Tax rate must be between 0 and 100', 400);
  }

  const prefix = String(req.body.invoicePrefix || 'INV').toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (!prefix || prefix.length > 8) throw new AppError('Invoice prefix must be 1 to 8 letters or numbers', 400);

  user.name = req.body.name.trim();
  user.businessName = (req.body.businessName || '').trim();
  user.address = (req.body.address || '').trim();
  user.phone = (req.body.phone || '').trim();
  user.taxNumber = gstin || (req.body.taxNumber || '').trim();
  user.gstin = gstin;
  user.pan = pan;
  user.state = state;
  user.upiId = upiId;
  user.razorpayKeyId = razorpayKeyId;
  user.businessType = businessType;
  user.currency = currency;
  user.taxRate = taxRate;
  user.invoicePrefix = prefix;
  await user.save();

  res.json({ success: true, data: { user } });
});

exports.updatePassword = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('+password');
  const match = await bcrypt.compare(req.body.currentPassword, user.password);
  if (!match) throw new AppError('Current password is incorrect', 400);
  user.password = await bcrypt.hash(req.body.newPassword, 12);
  await user.save();
  res.json({ success: true, message: 'Password updated' });
});

exports.uploadLogo = asyncHandler(async (req, res) => {
  if (!req.file) throw new AppError('Choose an image to upload', 400);
  removeUpload(req.user.logo);
  req.user.logo = `/uploads/${req.file.filename}`;
  await req.user.save();
  res.json({ success: true, data: { user: req.user } });
});

exports.removeLogo = asyncHandler(async (req, res) => {
  removeUpload(req.user.logo);
  req.user.logo = '';
  await req.user.save();
  res.json({ success: true, data: { user: req.user } });
});

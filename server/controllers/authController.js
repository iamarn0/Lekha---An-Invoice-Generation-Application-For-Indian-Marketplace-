const bcrypt = require('bcryptjs');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { signToken, createResetToken, hashToken, cookieOptions } = require('../services/tokenService');
const { logActivity } = require('../services/activityService');
const { env } = require('../config/env');

let dummyHashPromise;
function dummyHash() {
  if (!dummyHashPromise) dummyHashPromise = bcrypt.hash('not-a-user-password', 12);
  return dummyHashPromise;
}

function sendAuth(res, user, status = 200) {
  const token = signToken(user._id);
  res.cookie('token', token, cookieOptions());
  res.status(status).json({ success: true, data: { user, token } });
}

exports.register = asyncHandler(async (req, res) => {
  const email = req.body.email.toLowerCase().trim();
  const existing = await User.findOne({ email });
  if (existing) throw new AppError('An account with that email already exists', 409);

  const user = await User.create({
    name: req.body.name.trim(),
    email,
    password: await bcrypt.hash(req.body.password, 12),
    businessName: '',
    currency: 'INR',
    taxRate: 18,
    invoicePrefix: 'INV',
  });

  await logActivity(user._id, { type: 'account_created', message: 'Workspace created' });
  sendAuth(res, user, 201);
});

exports.login = asyncHandler(async (req, res) => {
  const email = req.body.email.toLowerCase().trim();
  const user = await User.findOne({ email }).select('+password');
  const hash = user?.password || (await dummyHash());
  const match = await bcrypt.compare(req.body.password, hash);
  if (!user || !match) throw new AppError('Invalid email or password', 401);
  user.password = undefined;
  sendAuth(res, user);
});

exports.logout = asyncHandler(async (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: env.nodeEnv === 'production',
    sameSite: 'lax',
    path: '/',
  });
  res.json({ success: true, message: 'Signed out' });
});

exports.me = asyncHandler(async (req, res) => {
  res.json({ success: true, data: { user: req.user } });
});

exports.forgotPassword = asyncHandler(async (req, res) => {
  const email = req.body.email.toLowerCase().trim();
  const user = await User.findOne({ email });
  let resetUrl;

  if (user) {
    const { raw, hashed } = createResetToken();
    user.resetPasswordToken = hashed;
    user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000);
    await user.save({ validateBeforeSave: false });
    resetUrl = `${env.clientUrl}/reset-password/${raw}`;
    if (env.nodeEnv !== 'production') {
      console.log(`Password reset link for ${email}: ${resetUrl}`);
    }
  }

  res.json({
    success: true,
    message: 'If an account exists for that email, a reset link is ready.',
    ...(env.nodeEnv !== 'production' && resetUrl ? { data: { resetUrl } } : {}),
  });
});

exports.resetPassword = asyncHandler(async (req, res) => {
  const user = await User.findOne({
    resetPasswordToken: hashToken(req.body.token),
    resetPasswordExpires: { $gt: new Date() },
  }).select('+password +resetPasswordToken +resetPasswordExpires');

  if (!user) throw new AppError('This reset link is invalid or has expired', 400);

  user.password = await bcrypt.hash(req.body.password, 12);
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();
  await User.updateOne(
    { _id: user._id },
    { $unset: { resetPasswordToken: 1, resetPasswordExpires: 1 } }
  );

  sendAuth(res, user);
});

const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { env } = require('../config/env');

const protect = asyncHandler(async (req, res, next) => {
  let token;
  const header = req.headers.authorization || '';
  if (header.startsWith('Bearer ')) token = header.slice(7);
  else if (req.cookies?.token) token = req.cookies.token;

  if (!token) throw new AppError('Please sign in to continue', 401);

  const decoded = jwt.verify(token, env.jwtSecret);
  const user = await User.findById(decoded.id);
  if (!user) throw new AppError('Please sign in to continue', 401);

  req.user = user;
  next();
});

module.exports = { protect };

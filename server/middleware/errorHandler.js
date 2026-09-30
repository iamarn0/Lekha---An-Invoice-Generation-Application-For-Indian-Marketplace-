const mongoose = require('mongoose');

function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);

  let status = err.statusCode || 500;
  let message = err.message || 'Something went wrong';

  if (err.name === 'ValidationError') {
    status = 400;
    message = Object.values(err.errors)
      .map((item) => item.message)
      .join(' ');
  }

  if (err.code === 11000) {
    status = 409;
    const field = Object.keys(err.keyPattern || {})[0];
    message = field === 'email' ? 'That email is already in use' : 'A record with that value already exists';
  }

  if (err.name === 'CastError' || err instanceof mongoose.Error.CastError) {
    status = 400;
    message = 'Invalid identifier';
  }

  if (err.type === 'entity.parse.failed') {
    status = 400;
    message = 'Request body must be valid JSON';
  }

  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    status = 401;
    message = 'Your session is invalid or has expired';
  }

  if (status >= 500) {
    console.error(err);
    message = 'Something went wrong. Please try again.';
  }

  res.status(status).json({
    success: false,
    message,
    ...(err.errorsList ? { errors: err.errorsList } : {}),
  });
}

module.exports = errorHandler;

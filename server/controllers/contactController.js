const asyncHandler = require('../utils/asyncHandler');

exports.submit = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    message: 'Thanks. This demo confirms the form. Connect an inbox when you deploy.',
  });
});

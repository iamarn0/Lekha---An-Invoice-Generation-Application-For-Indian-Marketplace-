const Client = require('../models/Client');
const Invoice = require('../models/Invoice');
const asyncHandler = require('../utils/asyncHandler');
const { containsRegex } = require('../utils/regex');

exports.search = asyncHandler(async (req, res) => {
  const term = String(req.query.q || '').trim();
  if (term.length < 2) {
    res.json({ success: true, data: { invoices: [], clients: [] } });
    return;
  }

  const regex = containsRegex(term);
  const [clients, invoices] = await Promise.all([
    Client.find({
      user: req.user._id,
      $or: [{ name: regex }, { company: regex }, { email: regex }],
    })
      .select('name company email status')
      .limit(5),
    Invoice.find({
      user: req.user._id,
      $or: [{ invoiceNumber: regex }, { 'clientSnapshot.name': regex }, { 'clientSnapshot.company': regex }],
    })
      .select('invoiceNumber status grandTotal clientSnapshot issueDate')
      .sort({ issueDate: -1 })
      .limit(5),
  ]);

  res.json({ success: true, data: { invoices, clients } });
});

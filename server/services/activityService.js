const Activity = require('../models/Activity');

function logActivity(userId, { type, message, invoice, client, invoiceNumber }) {
  return Activity.create({
    user: userId,
    type,
    message,
    invoice: invoice || undefined,
    client: client || undefined,
    invoiceNumber: invoiceNumber || '',
  });
}

module.exports = { logActivity };

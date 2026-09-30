const Invoice = require('../models/Invoice');
const { logActivity } = require('./activityService');

function startOfTodayUtc() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

async function markOverdueInvoices(userId) {
  const due = await Invoice.find({
    user: userId,
    status: 'sent',
    documentType: 'tax_invoice',
    dueDate: { $lt: startOfTodayUtc() },
  });

  if (!due.length) return;

  await Invoice.updateMany(
    { _id: { $in: due.map((invoice) => invoice._id) } },
    { $set: { status: 'overdue' } }
  );

  await ActivityInsert(due, userId);
}

async function ActivityInsert(due, userId) {
  const Activity = require('../models/Activity');
  await Activity.insertMany(
    due.map((invoice) => ({
      user: userId,
      type: 'invoice_overdue',
      message: `Invoice ${invoice.invoiceNumber} overdue`,
      invoice: invoice._id,
      client: invoice.client,
      invoiceNumber: invoice.invoiceNumber,
    }))
  );
}

async function refreshInvoiceStatus(invoice, userId) {
  if (invoice.status === 'sent' && invoice.dueDate < startOfTodayUtc()) {
    invoice.status = 'overdue';
    await invoice.save();
    await logActivity(userId, {
      type: 'invoice_overdue',
      message: `Invoice ${invoice.invoiceNumber} overdue`,
      invoice: invoice._id,
      client: invoice.client,
      invoiceNumber: invoice.invoiceNumber,
    });
  }
  return invoice;
}

module.exports = { startOfTodayUtc, markOverdueInvoices, refreshInvoiceStatus };

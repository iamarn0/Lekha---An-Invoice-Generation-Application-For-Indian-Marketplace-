const Invoice = require('../models/Invoice');
const Client = require('../models/Client');

function monthSeries(count) {
  const now = new Date();
  const series = [];
  for (let i = count - 1; i >= 0; i -= 1) {
    const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    const key = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
    series.push({
      key,
      label: date.toLocaleString('en-US', { month: 'short', timeZone: 'UTC' }),
      revenue: 0,
      issued: 0,
      paid: 0,
      clients: 0,
    });
  }
  return series;
}

function seriesStart(count) {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (count - 1), 1));
}

const TAX_INVOICE = {
  $or: [{ documentType: 'tax_invoice' }, { documentType: { $exists: false } }],
};

function taxMatch(match) {
  return { $and: [match, TAX_INVOICE] };
}

function keyFromParts(year, month) {
  return `${year}-${String(month).padStart(2, '0')}`;
}

function applyGroups(series, rows, field) {
  const map = new Map(series.map((item) => [item.key, item]));
  rows.forEach((row) => {
    const key = keyFromParts(row._id.y, row._id.m);
    const bucket = map.get(key);
    if (!bucket) return;
    bucket[field] = field === 'revenue' ? Math.round(row.value * 100) / 100 : row.value;
  });
  return series;
}

async function revenueGroups(userId, start) {
  return Invoice.aggregate([
    { $match: taxMatch({ user: userId, status: 'paid', paidAt: { $gte: start, $ne: null } }) },
    {
      $group: {
        _id: { y: { $year: '$paidAt' }, m: { $month: '$paidAt' } },
        value: { $sum: '$grandTotal' },
      },
    },
  ]);
}

async function paidCountGroups(userId, start) {
  return Invoice.aggregate([
    { $match: taxMatch({ user: userId, status: 'paid', paidAt: { $gte: start, $ne: null } }) },
    {
      $group: {
        _id: { y: { $year: '$paidAt' }, m: { $month: '$paidAt' } },
        value: { $sum: 1 },
      },
    },
  ]);
}

async function issuedGroups(userId, start) {
  return Invoice.aggregate([
    { $match: taxMatch({ user: userId, status: { $ne: 'cancelled' }, issueDate: { $gte: start } }) },
    {
      $group: {
        _id: { y: { $year: '$issueDate' }, m: { $month: '$issueDate' } },
        value: { $sum: 1 },
      },
    },
  ]);
}

async function clientGroups(userId, start) {
  return Client.aggregate([
    { $match: { user: userId, createdAt: { $gte: start } } },
    {
      $group: {
        _id: { y: { $year: '$createdAt' }, m: { $month: '$createdAt' } },
        value: { $sum: 1 },
      },
    },
  ]);
}

async function buildSeries(userId, months) {
  const count = months === 12 ? 12 : 6;
  const start = seriesStart(count);
  const series = monthSeries(count);
  const [revenue, paid, issued, clients] = await Promise.all([
    revenueGroups(userId, start),
    paidCountGroups(userId, start),
    issuedGroups(userId, start),
    clientGroups(userId, start),
  ]);
  applyGroups(series, revenue, 'revenue');
  applyGroups(series, paid, 'paid');
  applyGroups(series, issued, 'issued');
  applyGroups(series, clients, 'clients');
  return series;
}

async function getStats(userId) {
  const now = new Date();
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const prevStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));

  const [totals, currentMonth, previousMonth, outstanding, paidCount, activeClients] = await Promise.all([
    Invoice.aggregate([
      { $match: taxMatch({ user: userId, status: 'paid' }) },
      { $group: { _id: null, total: { $sum: '$grandTotal' } } },
    ]),
    Invoice.aggregate([
      { $match: taxMatch({ user: userId, status: 'paid', paidAt: { $gte: monthStart } }) },
      { $group: { _id: null, total: { $sum: '$grandTotal' } } },
    ]),
    Invoice.aggregate([
      { $match: taxMatch({ user: userId, status: 'paid', paidAt: { $gte: prevStart, $lt: monthStart } }) },
      { $group: { _id: null, total: { $sum: '$grandTotal' } } },
    ]),
    Invoice.aggregate([
      { $match: taxMatch({ user: userId, status: { $in: ['sent', 'overdue'] } }) },
      { $group: { _id: null, total: { $sum: '$outstanding' }, count: { $sum: 1 } } },
    ]),
    Invoice.countDocuments(taxMatch({ user: userId, status: 'paid' })),
    Client.countDocuments({ user: userId, status: 'active' }),
  ]);

  const current = currentMonth[0]?.total || 0;
  const previous = previousMonth[0]?.total || 0;
  let revenueChange = null;
  if (previous > 0) revenueChange = Math.round((((current - previous) / previous) * 100) * 10) / 10;

  return {
    totalRevenue: Math.round((totals[0]?.total || 0) * 100) / 100,
    monthlyRevenue: Math.round(current * 100) / 100,
    outstandingAmount: Math.round((outstanding[0]?.total || 0) * 100) / 100,
    outstandingCount: outstanding[0]?.count || 0,
    paidInvoices: paidCount,
    activeClients,
    revenueChange,
  };
}

async function statusDistribution(userId) {
  const rows = await Invoice.aggregate([
    { $match: { user: userId } },
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);
  const order = ['draft', 'sent', 'paid', 'overdue', 'cancelled'];
  return order.map((status) => ({
    status,
    count: rows.find((row) => row._id === status)?.count || 0,
  }));
}

module.exports = { buildSeries, getStats, statusDistribution };

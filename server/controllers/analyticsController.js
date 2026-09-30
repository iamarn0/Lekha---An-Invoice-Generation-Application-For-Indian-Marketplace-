const Invoice = require('../models/Invoice');
const Activity = require('../models/Activity');
const asyncHandler = require('../utils/asyncHandler');
const { markOverdueInvoices } = require('../services/invoiceStatus');
const { buildSeries, getStats, statusDistribution } = require('../services/analyticsService');

exports.dashboard = asyncHandler(async (req, res) => {
  await markOverdueInvoices(req.user._id);
  const userId = req.user._id;
  const [stats, series, distribution, recentPayments, outstandingInvoices, activities] = await Promise.all([
    getStats(userId),
    buildSeries(userId, 6),
    statusDistribution(userId),
    Invoice.find({ user: userId, status: 'paid' })
      .sort({ paidAt: -1 })
      .limit(5)
      .populate('client', 'name company'),
    Invoice.find({ user: userId, status: { $in: ['sent', 'overdue'] } })
      .sort({ dueDate: 1 })
      .limit(5)
      .populate('client', 'name company'),
    Activity.find({ user: userId }).sort({ createdAt: -1 }).limit(8),
  ]);

  res.json({
    success: true,
    data: {
      stats,
      revenueByMonth: series.map((item) => ({ label: item.label, revenue: item.revenue })),
      statusDistribution: distribution,
      recentPayments,
      outstandingInvoices,
      activities,
    },
  });
});

exports.overview = asyncHandler(async (req, res) => {
  await markOverdueInvoices(req.user._id);
  const months = Number(req.query.months) === 12 ? 12 : 6;
  const [stats, series] = await Promise.all([
    getStats(req.user._id),
    buildSeries(req.user._id, months),
  ]);

  const rangePaid = series.reduce((sum, item) => sum + item.paid, 0);
  const rangeClients = series.reduce((sum, item) => sum + item.clients, 0);

  res.json({
    success: true,
    data: {
      months,
      monthlyRevenue: stats.monthlyRevenue,
      paidInvoices: rangePaid,
      outstandingAmount: stats.outstandingAmount,
      outstandingCount: stats.outstandingCount,
      clientGrowthCount: rangeClients,
      revenueChange: stats.revenueChange,
      clientGrowth: series.map((item) => ({ label: item.label, clients: item.clients })),
      revenueTrends: series.map((item) => ({ label: item.label, revenue: item.revenue })),
      invoiceTrends: series.map((item) => ({ label: item.label, issued: item.issued, paid: item.paid })),
    },
  });
});

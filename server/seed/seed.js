const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Client = require('../models/Client');
const Invoice = require('../models/Invoice');
const Activity = require('../models/Activity');
const { calculateInvoice } = require('../services/invoiceCalc');

const DEMO_EMAIL = 'demo@lekha.app';
const DEMO_PASSWORD = 'Demo1234!';

function utcMonthsAgo(months, day) {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - months, day, 12, 0, 0));
}

function daysFromNow(days) {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + days, 12, 0, 0));
}

function addDays(date, days) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

async function stamp(Model, id, date) {
  await Model.collection.updateOne(
    { _id: id },
    { $set: { createdAt: date, updatedAt: date } }
  );
}

const clientSeeds = [
  { key: 'kalpa', name: 'Ananya Rao', company: 'Kalpa Retail', email: 'ananya@kalparetail.in', phone: '+91 80 4120 1101', address: '18 Commercial Street\nBengaluru, Karnataka 560001', gstin: '29AABCK1234A1Z5', pan: 'AABCK1234A', state: '29', status: 'active', monthsAgo: 8, day: 4 },
  { key: 'filter', name: 'Arjun Menon', company: 'Filter Coffee Co.', email: 'arjun@filtercoffee.in', phone: '+91 80 4120 2244', address: '6 Church Street\nBengaluru, Karnataka 560001', gstin: '29AABCF5678B1Z2', pan: 'AABCF5678B', state: '29', status: 'active', monthsAgo: 8, day: 16 },
  { key: 'deccan', name: 'Farah Qureshi', company: 'Deccan Looms', email: 'farah@deccanlooms.in', phone: '+91 40 4012 8800', address: '22 Banjara Hills\nHyderabad, Telangana 500034', gstin: '36AABCD9012C1Z3', pan: 'AABCD9012C', state: '36', status: 'active', monthsAgo: 6, day: 9 },
  { key: 'westline', name: 'Kabir Shah', company: 'Westline Logistics', email: 'kabir@westline.co.in', phone: '+91 22 4890 3300', address: '401 Nariman Point\nMumbai, Maharashtra 400021', gstin: '27AABCL3456D1Z7', pan: 'AABCL3456D', state: '27', status: 'active', monthsAgo: 6, day: 21 },
  { key: 'joshi', name: 'Neel Joshi', company: 'Joshi & Associates', email: 'neel@joshiassociates.in', phone: '+91 79 4001 2210', address: '9 CG Road\nAhmedabad, Gujarat 380009', gstin: '24AABCJ7890E1Z1', pan: 'AABCJ7890E', state: '24', status: 'active', monthsAgo: 4, day: 3 },
  { key: 'malabar', name: 'Meenakshi Nair', company: 'Malabar Prints', email: 'meena@malabarprints.in', phone: '+91 484 401 2288', address: '14 MG Road\nKochi, Kerala 682016', gstin: '32AABCM2468F1Z9', pan: 'AABCM2468F', state: '32', status: 'active', monthsAgo: 3, day: 12 },
  { key: 'indore', name: 'Vikram Jain', company: 'Indore Spice Works', email: 'vikram@indorespice.in', phone: '+91 731 400 1190', address: '8 Rajwada\nIndore, Madhya Pradesh 452002', gstin: '23AABCI1357G1Z4', pan: 'AABCI1357G', state: '23', status: 'inactive', monthsAgo: 2, day: 8 },
  { key: 'charminar', name: 'Sana Ali', company: 'Charminar Digital', email: 'sana@charminar.digital', phone: '+91 40 4455 0190', address: '3 Charminar Road\nHyderabad, Telangana 500002', gstin: '36AABCC8642H1Z6', pan: 'AABCC8642H', state: '36', status: 'active', monthsAgo: 1, day: 14 },
  { key: 'aditi', name: 'Aditi Bose', company: '', email: 'aditi.bose@email.com', phone: '+91 33 4001 0144', address: '21 Park Street\nKolkata, West Bengal 700016', gstin: '', pan: 'AABCB9753J', state: '19', status: 'active', daysAgo: 3 },
];

const invoiceSeeds = [
  { number: 'INV-1028', client: 'kalpa', status: 'paid', monthsAgo: 8, day: 8, items: [['Brand system and store identity', 1, 85000, '998391'], ['Art direction', 8, 4500, '998391']] },
  { number: 'INV-1029', client: 'filter', status: 'paid', monthsAgo: 7, day: 3, items: [['Seasonal menu design', 1, 42000, '998391'], ['Photography direction', 6, 3500, '998391']] },
  { number: 'INV-1030', client: 'deccan', status: 'paid', monthsAgo: 7, day: 18, items: [['Lookbook and catalogue', 1, 72000, '998391']] },
  { number: 'INV-1031', client: 'westline', status: 'paid', monthsAgo: 6, day: 9, items: [['Freight coordination, Bengaluru to Mumbai', 1, 64000, '996511'], ['Proof of delivery pack', 4, 2500, '996511']] },
  { number: 'INV-1032', client: 'joshi', status: 'paid', monthsAgo: 5, day: 2, discount: 10, items: [['Advisory retainer', 1, 90000, '998311']] },
  { number: 'INV-1033', client: 'malabar', status: 'paid', monthsAgo: 5, day: 21, items: [['Print collection design', 1, 56000, '998391'], ['Sampling rounds', 4, 4000, '998391']] },
  { number: 'INV-1034', client: 'kalpa', status: 'paid', monthsAgo: 4, day: 7, items: [['Monthly design retainer', 1, 75000, '998314']] },
  { number: 'INV-1035', client: 'charminar', status: 'paid', monthsAgo: 4, day: 24, items: [['Campaign site', 1, 68000, '998314']] },
  { number: 'INV-1036', client: 'deccan', status: 'paid', monthsAgo: 3, day: 11, items: [['Wholesale catalogue, cotton shirting', 120, 480, '520811']] },
  { number: 'INV-1037', client: 'filter', status: 'paid', monthsAgo: 3, day: 26, items: [['Cafe photography direction', 1, 38000, '998391']] },
  { number: 'INV-1038', client: 'westline', status: 'paid', monthsAgo: 2, day: 8, items: [['Line-haul, Bengaluru to Hyderabad', 1, 54000, '996511']] },
  { number: 'INV-1039', client: 'joshi', status: 'paid', monthsAgo: 2, day: 22, items: [['Compliance pack for GST filings', 1, 32000, '998311']] },
  { number: 'INV-1040', client: 'malabar', status: 'paid', monthsAgo: 1, day: 6, items: [['Export lookbook', 1, 61000, '998391']] },
  { number: 'INV-1041', client: 'kalpa', status: 'paid', monthsAgo: 1, day: 19, items: [['Quarterly retainer', 1, 95000, '998314']] },
  { number: 'INV-1042', client: 'deccan', status: 'paid', issueDaysAgo: 20, paidDaysAgo: 12, dueDaysAgo: 6, items: [['Launch asset kit', 1, 48000, '998391']] },
  { number: 'INV-1043', client: 'charminar', status: 'sent', issueDaysAgo: 2, dueInDays: 14, items: [['Performance creative retainer', 1, 36000, '998314']] },
  { number: 'INV-1044', client: 'filter', status: 'overdue', issueDaysAgo: 30, dueDaysAgo: 8, items: [['Monsoon menu redesign', 1, 28000, '998391']] },
  { number: 'INV-1045', client: 'indore', status: 'overdue', issueDaysAgo: 40, dueDaysAgo: 18, items: [['Spice blend labels, 500 g', 200, 42, '091091']] },
  { number: 'INV-1046', client: 'westline', status: 'overdue', issueDaysAgo: 21, dueDaysAgo: 3, items: [['Detention and revision', 1, 18500, '996511']] },
  { number: 'INV-1047', client: 'joshi', status: 'draft', issueDaysAgo: 1, dueInDays: 20, items: [['Year-end advisory', 1, 45000, '998311'], ['Working papers', 6, 1500, '998311']] },
  { number: 'INV-1048', client: 'malabar', status: 'draft', documentType: 'quotation', issueDaysAgo: 0, dueInDays: 28, items: [['Trade fair kit', 1, 52000, '998391']] },
  { number: 'INV-1049', client: 'indore', status: 'cancelled', monthsAgo: 5, day: 14, items: [['Cancelled pouch order', 1, 12000, '091091']] },
  { number: 'INV-1050', client: 'charminar', status: 'sent', documentType: 'proforma', issueDaysAgo: 1, dueInDays: 21, items: [['Proforma for festival campaign', 1, 40000, '998314']] },
];

function itemRows(rows) {
  return rows.map(([description, quantity, unitPrice, hsn]) => ({ description, quantity, unitPrice, hsn: hsn || '' }));
}

function resolveDates(input) {
  let issueDate;
  let dueDate;
  if (input.issueDaysAgo != null) {
    issueDate = daysFromNow(-input.issueDaysAgo);
    if (input.dueInDays != null) dueDate = daysFromNow(input.dueInDays);
    else dueDate = daysFromNow(-input.dueDaysAgo);
  } else {
    issueDate = utcMonthsAgo(input.monthsAgo, input.day);
    dueDate = addDays(issueDate, 14);
  }

  const paidAt = input.status === 'paid'
    ? (input.paidDaysAgo != null ? daysFromNow(-input.paidDaysAgo) : addDays(issueDate, 5))
    : null;
  const sentAt = input.status === 'draft' ? null : issueDate;
  return { issueDate, dueDate, paidAt, sentAt };
}

async function seedDemo() {
  const password = await bcrypt.hash(DEMO_PASSWORD, 12);
  const user = await User.create({
    name: 'Meera Iyer',
    email: DEMO_EMAIL,
    password,
    businessName: 'Kaavya Studio',
    businessType: 'agency',
    currency: 'INR',
    taxRate: 18,
    address: '42 Residency Road\nBengaluru, Karnataka 560025',
    phone: '+91 80 4123 8800',
    gstin: '29AAPFM1234Q1Z8',
    pan: 'AAPFM1234Q',
    state: '29',
    upiId: 'kaavyastudio@okicici',
    razorpayKeyId: 'rzp_test_lekha_demo',
    taxNumber: '29AAPFM1234Q1Z8',
    invoicePrefix: 'INV',
    invoiceNextNumber: 1051,
  });
  await stamp(User, user._id, utcMonthsAgo(10, 2));

  const clients = {};
  for (const seed of clientSeeds) {
    const client = await Client.create({
      user: user._id,
      name: seed.name,
      company: seed.company,
      email: seed.email,
      phone: seed.phone,
      address: seed.address,
      gstin: seed.gstin || '',
      pan: seed.pan || '',
      state: seed.state || '',
      status: seed.status,
    });
    const createdAt = seed.daysAgo != null ? daysFromNow(-seed.daysAgo) : utcMonthsAgo(seed.monthsAgo, seed.day);
    await stamp(Client, client._id, createdAt);
    clients[seed.key] = client;
  }

  const invoices = {};
  for (const seed of invoiceSeeds) {
    const client = clients[seed.client];
    const dates = resolveDates(seed);
    const placeOfSupply = client.state || user.state;
    const documentType = seed.documentType || 'tax_invoice';
    const totals = calculateInvoice({
      items: itemRows(seed.items),
      taxRate: user.taxRate,
      discount: seed.discount || 0,
      discountType: 'percent',
      status: seed.status,
      supplyType: placeOfSupply && placeOfSupply !== user.state ? 'inter' : 'intra',
      documentType,
    });
    const invoice = await Invoice.create({
      user: user._id,
      client: client._id,
      clientSnapshot: {
        name: client.name,
        company: client.company,
        email: client.email,
        phone: client.phone,
        address: client.address,
        gstin: client.gstin,
        pan: client.pan,
        state: client.state,
      },
      placeOfSupply,
      upiId: user.upiId,
      invoiceNumber: seed.number,
      issueDate: dates.issueDate,
      dueDate: dates.dueDate,
      notes: 'Thank you. Pay by UPI to kaavyastudio@okicici, or by NEFT before the due date.',
      status: seed.status,
      discount: seed.discount || 0,
      discountType: 'percent',
      sentAt: dates.sentAt,
      paidAt: dates.paidAt,
      ...totals,
    });
    await stamp(Invoice, invoice._id, dates.issueDate);
    invoices[seed.number] = invoice;
  }

  const activitySeeds = [
    { type: 'invoice_paid', message: 'Invoice INV-1042 paid', invoice: 'INV-1042', when: daysFromNow(-12) },
    { type: 'invoice_overdue', message: 'Invoice INV-1046 overdue', invoice: 'INV-1046', when: daysFromNow(-2) },
    { type: 'client_created', message: 'Client added: Aditi Bose', clientKey: 'aditi', when: daysFromNow(-3) },
    { type: 'invoice_sent', message: 'Invoice INV-1043 sent', invoice: 'INV-1043', when: daysFromNow(-2) },
    { type: 'invoice_created', message: 'Invoice INV-1047 created', invoice: 'INV-1047', when: daysFromNow(-1) },
    { type: 'invoice_sent', message: 'Invoice INV-1050 sent', invoice: 'INV-1050', when: daysFromNow(-1) },
    { type: 'invoice_paid', message: 'Invoice INV-1041 paid', invoice: 'INV-1041', when: utcMonthsAgo(1, 24) },
    { type: 'invoice_overdue', message: 'Invoice INV-1044 overdue', invoice: 'INV-1044', when: daysFromNow(-7) },
  ];

  for (const seed of activitySeeds) {
    const invoice = seed.invoice ? invoices[seed.invoice] : null;
    const clientId = seed.clientKey ? clients[seed.clientKey]._id : invoice?.client;
    const activity = await Activity.create({
      user: user._id,
      type: seed.type,
      message: seed.message,
      invoice: invoice?._id,
      client: clientId,
      invoiceNumber: seed.invoice || '',
    });
    await stamp(Activity, activity._id, seed.when);
  }

  console.log(`Seeded demo workspace ${DEMO_EMAIL} / ${DEMO_PASSWORD}`);
}

async function seedIfEmpty() {
  const count = await User.countDocuments();
  if (count > 0) return false;
  await seedDemo();
  return true;
}

if (require.main === module) {
  require('dotenv').config();
  const { connectDB } = require('../config/db');
  connectDB()
    .then(() => seedIfEmpty())
    .then((created) => {
      if (!created) console.log('Database already has users. Seed skipped.');
      process.exit(0);
    })
    .catch((error) => {
      console.error(error.message);
      process.exit(1);
    });
}

module.exports = { seedIfEmpty, seedDemo, DEMO_EMAIL, DEMO_PASSWORD };

const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema(
  {
    description: { type: String, required: true, trim: true, maxlength: 240 },
    hsn: { type: String, default: '', maxlength: 8 },
    quantity: { type: Number, required: true, min: 0 },
    unitPrice: { type: Number, required: true, min: 0 },
    amount: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const snapshotSchema = new mongoose.Schema(
  {
    name: String,
    company: String,
    email: String,
    phone: String,
    address: String,
    gstin: String,
    pan: String,
    state: String,
  },
  { _id: false }
);

const invoiceSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
    clientSnapshot: { type: snapshotSchema, required: true },
    invoiceNumber: { type: String, required: true, trim: true },
    issueDate: { type: Date, required: true },
    dueDate: { type: Date, required: true },
    items: { type: [itemSchema], validate: [(items) => items.length > 0, 'Add at least one line item'] },
    documentType: {
      type: String,
      enum: ['tax_invoice', 'quotation', 'proforma'],
      default: 'tax_invoice',
    },
    placeOfSupply: { type: String, default: '', maxlength: 2 },
    supplyType: { type: String, enum: ['intra', 'inter'], default: 'intra' },
    taxRate: { type: Number, default: 18, min: 0, max: 100 },
    taxAmount: { type: Number, default: 0, min: 0 },
    cgstRate: { type: Number, default: 0, min: 0 },
    sgstRate: { type: Number, default: 0, min: 0 },
    igstRate: { type: Number, default: 0, min: 0 },
    cgstAmount: { type: Number, default: 0, min: 0 },
    sgstAmount: { type: Number, default: 0, min: 0 },
    igstAmount: { type: Number, default: 0, min: 0 },
    upiId: { type: String, default: '', maxlength: 80 },
    discount: { type: Number, default: 0, min: 0 },
    discountType: { type: String, enum: ['percent', 'fixed'], default: 'percent' },
    discountAmount: { type: Number, default: 0, min: 0 },
    subtotal: { type: Number, required: true, min: 0 },
    grandTotal: { type: Number, required: true, min: 0 },
    amountPaid: { type: Number, default: 0, min: 0 },
    outstanding: { type: Number, default: 0, min: 0 },
    notes: { type: String, default: '', maxlength: 1000 },
    status: {
      type: String,
      enum: ['draft', 'sent', 'paid', 'overdue', 'cancelled'],
      default: 'draft',
    },
    sentAt: { type: Date, default: null },
    paidAt: { type: Date, default: null },
  },
  { timestamps: true }
);

invoiceSchema.index({ user: 1, invoiceNumber: 1 }, { unique: true });
invoiceSchema.index({ user: 1, status: 1 });
invoiceSchema.index({ user: 1, client: 1 });
invoiceSchema.index({ user: 1, issueDate: -1 });

module.exports = mongoose.model('Invoice', invoiceSchema);

const mongoose = require('mongoose');

const clientSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 80 },
    company: { type: String, trim: true, default: '', maxlength: 120 },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, trim: true, default: '', maxlength: 40 },
    address: { type: String, trim: true, default: '', maxlength: 400 },
    gstin: { type: String, trim: true, default: '', uppercase: true, maxlength: 15 },
    pan: { type: String, trim: true, default: '', uppercase: true, maxlength: 10 },
    state: { type: String, trim: true, default: '', maxlength: 2 },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  },
  { timestamps: true }
);

clientSchema.index({ user: 1, email: 1 }, { unique: true });

module.exports = mongoose.model('Client', clientSchema);

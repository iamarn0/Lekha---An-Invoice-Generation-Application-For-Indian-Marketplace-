const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, required: true, maxlength: 40 },
    message: { type: String, required: true, maxlength: 180 },
    invoice: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice' },
    client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client' },
    invoiceNumber: { type: String, default: '' },
  },
  { timestamps: true }
);

activitySchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('Activity', activitySchema);

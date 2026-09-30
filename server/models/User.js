const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: false },
    businessName: { type: String, trim: true, default: '', maxlength: 120 },
    logo: { type: String, default: '' },
    currency: { type: String, default: 'INR', uppercase: true, maxlength: 3 },
    taxRate: { type: Number, default: 18, min: 0, max: 100 },
    address: { type: String, default: '', maxlength: 400 },
    phone: { type: String, default: '', maxlength: 40 },
    taxNumber: { type: String, default: '', maxlength: 40 },
    gstin: { type: String, default: '', uppercase: true, maxlength: 15 },
    pan: { type: String, default: '', uppercase: true, maxlength: 10 },
    state: { type: String, default: '', maxlength: 2 },
    businessType: {
      type: String,
      enum: ['freelancer', 'agency', 'consultant', 'manufacturer', 'logistics', 'trader', 'other', ''],
      default: '',
    },
    upiId: { type: String, default: '', maxlength: 80 },
    razorpayKeyId: { type: String, default: '', maxlength: 80 },
    invoicePrefix: { type: String, default: 'INV', uppercase: true, maxlength: 8 },
    invoiceNextNumber: { type: Number, default: 1001 },
    resetPasswordToken: { type: String, select: false },
    resetPasswordExpires: { type: Date, select: false },
  },
  { timestamps: true }
);

userSchema.set('toJSON', {
  transform(_doc, ret) {
    delete ret.password;
    delete ret.resetPasswordToken;
    delete ret.resetPasswordExpires;
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('User', userSchema);

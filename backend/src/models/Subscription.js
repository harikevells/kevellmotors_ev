const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    vehicle: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', required: true },
    plan: { type: String, enum: ['monthly', 'quarterly', 'amc_1yr', 'amc_2yr'], required: true },
    status: { type: String, enum: ['active', 'expired', 'cancelled', 'pending'], default: 'pending' },
    startDate: { type: Date },
    endDate: { type: Date },
    amount: { type: Number, required: true },
    features: [{ type: String }],
    servicesIncluded: { type: Number, default: 0 },
    servicesUsed: { type: Number, default: 0 },
    autoRenew: { type: Boolean, default: false },
    paymentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Subscription', subscriptionSchema);

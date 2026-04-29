const mongoose = require('mongoose');

const subscriptionPlanSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    key: { type: String, required: true, unique: true, lowercase: true, trim: true },
    amount: { type: Number, required: true },
    duration: { type: Number, required: true }, // days
    services: { type: Number, required: true }, // included service count
    highlights: [{ type: String }],             // feature bullet points
    badge: { type: String, default: '' },       // e.g. "Most Popular"
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('SubscriptionPlan', subscriptionPlanSchema);

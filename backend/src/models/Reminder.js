const mongoose = require('mongoose');

const reminderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    vehicle: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', required: true },
    type: {
      type: String,
      enum: ['service_due', 'insurance_expiry', 'warranty_expiry', 'subscription_renewal', 'battery_check'],
      required: true,
    },
    dueDate: { type: Date, required: true },
    message: { type: String },
    isSent: { type: Boolean, default: false },
    sentAt: { type: Date },
    isAcknowledged: { type: Boolean, default: false },
    acknowledgedAt: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Reminder', reminderSchema);

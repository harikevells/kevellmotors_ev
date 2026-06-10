const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: { type: String, enum: ['booking', 'payment', 'system', 'message', 'order'], default: 'system' },
  read: { type: Boolean, default: false },
  link: { type: String }, // Optional URL to redirect to on click
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);

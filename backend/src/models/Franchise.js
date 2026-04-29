const mongoose = require('mongoose');

const franchiseSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    address: {
      street: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      pincode: { type: String, required: true },
    },
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], default: [0, 0] },
    },
    licenseNumber: { type: String },
    gstNumber: { type: String },
    status: { type: String, enum: ['pending', 'active', 'suspended'], default: 'pending' },
    capacity: { type: Number, default: 10 },
    technicianCount: { type: Number, default: 0 },
    servicesOffered: [{ type: String }],
    workingHours: {
      open: { type: String, default: '09:00' },
      close: { type: String, default: '18:00' },
    },
    availableDays: {
      type: [{ type: String, enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] }],
      default: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
    },
    rating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },
    documents: [{ name: String, url: String }],
    upiId: { type: String },
    wallet: {
      balance: { type: Number, default: 0 },
      pendingBalance: { type: Number, default: 0 },
      transactions: [
        {
          type: { type: String, enum: ['credit', 'redeem_request', 'redeemed'], required: true },
          amount: { type: Number, required: true },
          serviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Service' },
          note: { type: String },
          status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
          requestedAt: { type: Date },
          processedAt: { type: Date },
          createdAt: { type: Date, default: Date.now },
        },
      ],
    },
    pickupDropService: { type: Boolean, default: false },
  },
  { timestamps: true }
);

franchiseSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Franchise', franchiseSchema);

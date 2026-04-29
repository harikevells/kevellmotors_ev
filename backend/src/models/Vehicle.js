const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    registrationNumber: { type: String, required: true, trim: true, uppercase: true },
    make: { type: String, required: true },
    model: { type: String, required: true },
    year: { type: Number },
    vehicleType: { type: String, enum: ['2-wheeler', '3-wheeler', '4-wheeler'], required: true },
    batteryCapacity: { type: String },
    color: { type: String },
    vinNumber: { type: String },
    insuranceExpiry: { type: Date },
    warrantyExpiry: { type: Date },
    documents: [{ name: String, url: String, uploadedAt: Date }],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Vehicle', vehicleSchema);

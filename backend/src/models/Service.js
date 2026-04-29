const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema(
  {
    vehicle: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle' },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    franchise: { type: mongoose.Schema.Types.ObjectId, ref: 'Franchise' },
    serviceType: {
      type: String,
      enum: ['general', 'battery', 'motor', 'software', 'accident', 'amc', 'custom'],
      required: true,
    },
    status: {
      type: String,
      enum: ['onboarded', 'diagnosis', 'in_progress', 'waiting_parts', 'quality_check', 'delivered', 'cancelled'],
      default: 'onboarded',
    },
    description: { type: String },
    scheduledDate: { type: Date },
    completedDate: { type: Date },
    estimatedAmount: { type: Number },
    finalAmount: { type: Number },
    technicianNotes: { type: String },
    progressUpdates: [
      {
        status: String,
        note: String,
        updatedAt: { type: Date, default: Date.now },
        updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      },
    ],
    spareParts: [
      {
        part: { type: mongoose.Schema.Types.ObjectId, ref: 'SparePart' },
        quantity: Number,
        price: Number,
      },
    ],
    deliverables: [{ item: String, delivered: { type: Boolean, default: false } }],
    invoice: { type: String },
    invoiceItems: [
      {
        description: { type: String, required: true },
        type: { type: String, enum: ['service', 'part', 'other'], default: 'service' },
        quantity: { type: Number, default: 1 },
        rate: { type: Number },
        amount: { type: Number, required: true },
      },
    ],
    invoiceNumber: { type: String },
    invoiceDate: { type: Date },
    voiceNote: { type: String },
    paymentStatus: { type: String, enum: ['pending', 'confirmed', 'waived'], default: 'pending' },
    paymentConfirmedAt: { type: Date },
    jobCard: {
      jobNo: { type: String },
      date: { type: Date },
      make: { type: String },
      year: { type: String },
      model: { type: String },
      colour: { type: String },
      regNo: { type: String },
      speedo: { type: String },
      totalAmount: { type: Number },
      address: { type: String },
      postCode: { type: String },
      phone: { type: String },
      fax: { type: String },
      repairOrderNo: { type: String },
      inDate: { type: Date },
      outDate: { type: Date },
      charge: { type: Number },
      cash: { type: Number },
      vehicleInfo: { type: String },
      sundries: { type: String },
      customerName: { type: String },
      customerContact: { type: String },
    },
    pickupRequested: { type: Boolean, default: false },
    dropRequested: { type: Boolean, default: false },
    pickupStatus: { type: String, enum: ['pending', 'completed', 'none'], default: 'none' },
    dropStatus: { type: String, enum: ['pending', 'completed', 'none'], default: 'none' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Service', serviceSchema);

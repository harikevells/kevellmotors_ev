const mongoose = require('mongoose');

const sparePartSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    partNumber: { type: String, unique: true },
    category: { type: String, enum: ['battery', 'motor', 'controller', 'charger', 'body', 'electrical', 'other'] },
    description: { type: String },
    price: { type: Number, required: true },
    stock: { type: Number, default: 0 },
    compatibleModels: [{ type: String }],
    image: { type: String },
    images: [{ type: String }],
    brand: { type: String },
    warranty: { type: String },
    isAvailable: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    items: [
      {
        part: { type: mongoose.Schema.Types.ObjectId, ref: 'SparePart', required: true },
        quantity: { type: Number, required: true },
        price: { type: Number, required: true },
      },
    ],
    totalAmount: { type: Number, required: true },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'],
      default: 'pending',
    },
    shippingAddress: {
      street: String,
      city: String,
      state: String,
      pincode: String,
    },
    paymentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment' },
    appliedSubscription: { type: mongoose.Schema.Types.ObjectId, ref: 'Subscription' },
    deliveredAt: { type: Date },
  },
  { timestamps: true }
);

const SparePart = mongoose.model('SparePart', sparePartSchema);
const Order = mongoose.model('Order', orderSchema);

module.exports = { SparePart, Order };

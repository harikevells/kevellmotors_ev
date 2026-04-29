const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    service: { type: mongoose.Schema.Types.ObjectId, ref: 'Service' },
    rating: { type: Number, min: 1, max: 5, required: true },
    comment: { type: String },
    category: { type: String, enum: ['service', 'app', 'staff', 'general'], default: 'service' },
    images: [{ type: String }],
    isPublic: { type: Boolean, default: true },
    adminResponse: { type: String },
    respondedAt: { type: Date },
  },
  { timestamps: true }
);

const reviewSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    franchise: { type: mongoose.Schema.Types.ObjectId, ref: 'Franchise' },
    rating: { type: Number, min: 1, max: 5, required: true },
    title: { type: String },
    comment: { type: String, required: true },
    helpful: { type: Number, default: 0 },
    isVerified: { type: Boolean, default: false },
    adminResponse: { type: String },
  },
  { timestamps: true }
);

const Feedback = mongoose.model('Feedback', feedbackSchema);
const Review = mongoose.model('Review', reviewSchema);

module.exports = { Feedback, Review };

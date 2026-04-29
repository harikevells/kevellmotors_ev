const mongoose = require('mongoose');

const feedPostSchema = new mongoose.Schema(
  {
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String },
    content: { type: String, required: true },
    type: { type: String, enum: ['post', 'offer', 'news', 'tip', 'announcement'], default: 'post' },
    images: [{ type: String }],
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    likeCount: { type: Number, default: 0 },
    tags: [{ type: String }],
    isPublished: { type: Boolean, default: true },
    isPinned: { type: Boolean, default: false },
    targetAudience: { type: String, enum: ['all', 'subscribers', 'franchise'], default: 'all' },
    expiresAt: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model('FeedPost', feedPostSchema);

const express = require('express');
const router = express.Router();
const FeedPost = require('../models/FeedPost');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

// GET /api/feed — public feed
router.get('/', async (req, res, next) => {
  try {
    const { type, page = 1, limit = 20 } = req.query;
    const filter = { isPublished: true };
    if (type) filter.type = type;

    const now = new Date();
    filter.$or = [{ expiresAt: { $gt: now } }, { expiresAt: null }];

    const total = await FeedPost.countDocuments(filter);
    const posts = await FeedPost.find(filter)
      .populate('author', 'name profileImage role')
      .sort({ isPinned: -1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({ success: true, posts, total });
  } catch (err) {
    next(err);
  }
});

// POST /api/feed — admin/franchise create post
router.post('/', protect, authorize('admin', 'franchise'), upload.array('images', 5), async (req, res, next) => {
  try {
    const images = req.files ? req.files.map((f) => `/uploads/${f.filename}`) : [];
    const post = await FeedPost.create({ ...req.body, author: req.user._id, images });
    res.status(201).json({ success: true, post });
  } catch (err) {
    next(err);
  }
});

// GET /api/feed/:id
router.get('/:id', async (req, res, next) => {
  try {
    const post = await FeedPost.findById(req.params.id).populate('author', 'name profileImage');
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });
    res.json({ success: true, post });
  } catch (err) {
    next(err);
  }
});

// PUT /api/feed/:id/like — toggle like
router.put('/:id/like', protect, async (req, res, next) => {
  try {
    const post = await FeedPost.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });

    const idx = post.likes.indexOf(req.user._id);
    if (idx === -1) {
      post.likes.push(req.user._id);
      post.likeCount += 1;
    } else {
      post.likes.splice(idx, 1);
      post.likeCount -= 1;
    }
    await post.save();
    res.json({ success: true, likeCount: post.likeCount });
  } catch (err) {
    next(err);
  }
});

// PUT /api/feed/:id — admin update
router.put('/:id', protect, authorize('admin'), async (req, res, next) => {
  try {
    const post = await FeedPost.findByIdAndUpdate(req.params.id, req.body, { returnDocument: 'after' });
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });
    res.json({ success: true, post });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/feed/:id — admin delete
router.delete('/:id', protect, authorize('admin'), async (req, res, next) => {
  try {
    await FeedPost.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Post deleted' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

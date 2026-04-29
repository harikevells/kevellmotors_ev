const express = require('express');
const router = express.Router();
const { Feedback, Review } = require('../models/Feedback');
const Franchise = require('../models/Franchise');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

// POST /api/feedback — submit feedback
router.post('/', protect, upload.array('images', 3), async (req, res, next) => {
  try {
    const images = req.files ? req.files.map((f) => `/uploads/${f.filename}`) : [];
    const feedback = await Feedback.create({
      ...req.body,
      user: req.user._id,
      images,
    });
    res.status(201).json({ success: true, feedback });
  } catch (err) {
    next(err);
  }
});

// GET /api/feedback/mine — user's feedback
router.get('/mine', protect, async (req, res, next) => {
  try {
    const feedback = await Feedback.find({ user: req.user._id }).populate('service', 'serviceType scheduledDate description status').sort({ createdAt: -1 });
    res.json({ success: true, feedback });
  } catch (err) {
    next(err);
  }
});

// GET /api/feedback/all — admin: all feedback
router.get('/all', protect, authorize('admin'), async (req, res, next) => {
  try {
    const { category, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (category) filter.category = category;

    const total = await Feedback.countDocuments(filter);
    const feedback = await Feedback.find(filter)
      .populate('user', 'name email')
      .populate('service', 'serviceType status')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({ success: true, feedback, total });
  } catch (err) {
    next(err);
  }
});

// PUT /api/feedback/:id/respond — admin respond
router.put('/:id/respond', protect, authorize('admin'), async (req, res, next) => {
  try {
    const feedback = await Feedback.findByIdAndUpdate(
      req.params.id,
      { adminResponse: req.body.response, respondedAt: new Date() },
      { new: true }
    );
    if (!feedback) return res.status(404).json({ success: false, message: 'Feedback not found' });
    res.json({ success: true, feedback });
  } catch (err) {
    next(err);
  }
});

// POST /api/feedback/reviews — submit review
router.post('/reviews', protect, async (req, res, next) => {
  try {
    const review = await Review.create({ ...req.body, user: req.user._id });

    // Recalculate franchise rating & reviewCount from all reviews
    if (review.franchise) {
      const agg = await Review.aggregate([
        { $match: { franchise: review.franchise } },
        { $group: { _id: '$franchise', avg: { $avg: '$rating' }, count: { $sum: 1 } } },
      ]);
      if (agg.length > 0) {
        await Franchise.findByIdAndUpdate(review.franchise, {
          rating: Math.round(agg[0].avg * 10) / 10,
          reviewCount: agg[0].count,
        });
      }
    }

    res.status(201).json({ success: true, review });
  } catch (err) {
    next(err);
  }
});

// GET /api/feedback/reviews — public reviews
router.get('/reviews', async (req, res, next) => {
  try {
    const { franchiseId, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (franchiseId) filter.franchise = franchiseId;

    const total = await Review.countDocuments(filter);
    const reviews = await Review.find(filter)
      .populate('user', 'name profileImage')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({ success: true, reviews, total });
  } catch (err) {
    next(err);
  }
});

// PUT /api/feedback/reviews/:id — user updates own review
router.put('/reviews/:id', protect, async (req, res, next) => {
  try {
    const review = await Review.findOne({ _id: req.params.id, user: req.user._id });
    if (!review) return res.status(404).json({ success: false, message: 'Review not found' });
    if (req.body.rating) review.rating = Number(req.body.rating);
    if (req.body.title !== undefined) review.title = req.body.title;
    if (req.body.comment) review.comment = req.body.comment;
    await review.save();
    await review.populate('user', 'name profileImage');
    res.json({ success: true, review });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/feedback/reviews/:id — user deletes own review
router.delete('/reviews/:id', protect, async (req, res, next) => {
  try {
    const review = await Review.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!review) return res.status(404).json({ success: false, message: 'Review not found' });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// PUT /api/feedback/:id — user updates own feedback
router.put('/:id', protect, upload.array('images', 3), async (req, res, next) => {
  try {
    const feedback = await Feedback.findOne({ _id: req.params.id, user: req.user._id });
    if (!feedback) return res.status(404).json({ success: false, message: 'Feedback not found' });
    if (req.body.rating) feedback.rating = Number(req.body.rating);
    if (req.body.comment !== undefined) feedback.comment = req.body.comment;
    if (req.body.category) feedback.category = req.body.category;
    await feedback.save();
    res.json({ success: true, feedback });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/feedback/:id — user deletes own feedback
router.delete('/:id', protect, async (req, res, next) => {
  try {
    const feedback = await Feedback.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!feedback) return res.status(404).json({ success: false, message: 'Feedback not found' });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

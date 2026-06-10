const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const { protect } = require('../middleware/auth');

// Get user notifications
router.get('/', protect, async (req, res, next) => {
  try {
    const notifications = await Notification.find({ recipient: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json({ success: true, notifications });
  } catch (err) {
    next(err);
  }
});

// Get unread count
router.get('/unread-count', protect, async (req, res, next) => {
  try {
    const count = await Notification.countDocuments({ recipient: req.user._id, read: false });
    res.json({ success: true, count });
  } catch (err) {
    next(err);
  }
});

// Mark as read
router.put('/:id/read', protect, async (req, res, next) => {
  try {
    await Notification.findByIdAndUpdate(req.params.id, { read: true });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// Mark all as read
router.put('/read-all', protect, async (req, res, next) => {
  try {
    await Notification.updateMany({ recipient: req.user._id, read: false }, { read: true });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// Admin/Franchise sending a custom notification
router.post('/send', protect, async (req, res, next) => {
  try {
    // Only admin or franchise can send arbitrary notifications (optional security check)
    if (req.user.role !== 'admin' && req.user.role !== 'franchise') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    
    const { recipient, title, message, type, link } = req.body;
    const notification = await Notification.create({
      recipient, title, message, type: type || 'system', link
    });
    
    res.status(201).json({ success: true, notification });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

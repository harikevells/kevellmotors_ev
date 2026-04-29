const express = require('express');
const router = express.Router();
const Reminder = require('../models/Reminder');
const { protect, authorize } = require('../middleware/auth');

// GET /api/reminders — user's reminders
router.get('/', protect, async (req, res, next) => {
  try {
    const reminders = await Reminder.find({ user: req.user._id })
      .populate('vehicle', 'registrationNumber make model')
      .sort({ dueDate: 1 });
    res.json({ success: true, reminders });
  } catch (err) {
    next(err);
  }
});

// POST /api/reminders — create reminder
router.post('/', protect, async (req, res, next) => {
  try {
    const reminder = await Reminder.create({ ...req.body, user: req.user._id });
    res.status(201).json({ success: true, reminder });
  } catch (err) {
    next(err);
  }
});

// PUT /api/reminders/:id/acknowledge — user acknowledges
router.put('/:id/acknowledge', protect, async (req, res, next) => {
  try {
    const reminder = await Reminder.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { isAcknowledged: true, acknowledgedAt: new Date() },
      { new: true }
    );
    if (!reminder) return res.status(404).json({ success: false, message: 'Reminder not found' });
    res.json({ success: true, reminder });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/reminders/:id
router.delete('/:id', protect, async (req, res, next) => {
  try {
    const reminder = await Reminder.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!reminder) return res.status(404).json({ success: false, message: 'Reminder not found' });
    res.json({ success: true, message: 'Reminder deleted' });
  } catch (err) {
    next(err);
  }
});

// GET /api/reminders/due — admin: due reminders (for sending notifications)
router.get('/due', protect, authorize('admin'), async (req, res, next) => {
  try {
    const now = new Date();
    const soon = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const reminders = await Reminder.find({ dueDate: { $lte: soon }, isSent: false })
      .populate('user', 'name email phone pushToken')
      .populate('vehicle', 'registrationNumber make');
    res.json({ success: true, reminders });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

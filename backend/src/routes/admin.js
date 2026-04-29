const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Service = require('../models/Service');
const Payment = require('../models/Payment');
const { Feedback } = require('../models/Feedback');
const Subscription = require('../models/Subscription');
const FeedPost = require('../models/FeedPost');
const { protect, authorize } = require('../middleware/auth');

// GET /api/admin/dashboard
router.get('/dashboard', protect, authorize('admin'), async (req, res, next) => {
  try {
    const [
      totalUsers,
      totalServices,
      onboardedServices,
      inProgressServices,
      deliveredServices,
      totalPayments,
      successPayments,
      failedPayments,
      refundedPayments,
      recentFeedback,
      activeSubscriptions,
    ] = await Promise.all([
      User.countDocuments({ role: 'user' }),
      Service.countDocuments(),
      Service.countDocuments({ status: 'onboarded' }),
      Service.countDocuments({ status: 'in_progress' }),
      Service.countDocuments({ status: 'delivered' }),
      Payment.countDocuments(),
      Payment.countDocuments({ status: 'success' }),
      Payment.countDocuments({ status: 'failed' }),
      Payment.countDocuments({ status: 'refunded' }),
      Feedback.find().sort({ createdAt: -1 }).limit(6).populate('user', 'name'),
      Subscription.countDocuments({ status: 'active' }),
    ]);

    const totalRevenue = await Payment.aggregate([
      { $match: { status: 'success' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);

    const recentServices = await Service.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('owner', 'name phone')
      .populate('vehicle', 'registrationNumber make model');

    res.json({
      success: true,
      dashboard: {
        users: { total: totalUsers },
        services: {
          total: totalServices,
          onboarded: onboardedServices,
          inProgress: inProgressServices,
          delivered: deliveredServices,
        },
        payments: {
          total: totalPayments,
          success: successPayments,
          failed: failedPayments,
          refunded: refundedPayments,
          revenue: totalRevenue[0]?.total || 0,
        },
        subscriptions: { active: activeSubscriptions },
        recentFeedback,
        recentServices,
      },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/users — list all users
router.get('/users', protect, authorize('admin'), async (req, res, next) => {
  try {
    const { role, page = 1, limit = 20, search } = req.query;
    const filter = {};
    if (role) filter.role = role;
    if (search) filter.$or = [{ name: new RegExp(search, 'i') }, { email: new RegExp(search, 'i') }];

    const total = await User.countDocuments(filter);
    const users = await User.find(filter)
      .select('-password')
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .sort({ createdAt: -1 });

    res.json({ success: true, users, total });
  } catch (err) {
    next(err);
  }
});

// PUT /api/admin/users/:id/access — update user role/status
router.put('/users/:id/access', protect, authorize('admin'), async (req, res, next) => {
  try {
    const { role, isActive } = req.body;
    const updates = {};
    if (role) updates.role = role;
    if (isActive !== undefined) updates.isActive = isActive;

    const user = await User.findByIdAndUpdate(req.params.id, updates, { returnDocument: 'after' }).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, user });
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/services — all services
router.get('/services', protect, authorize('admin', 'franchise'), async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status) filter.status = status;

    const total = await Service.countDocuments(filter);
    const services = await Service.find(filter)
      .populate('owner', 'name phone')
      .populate('vehicle', 'registrationNumber make model')
      .populate('franchise', 'name')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({ success: true, services, total });
  } catch (err) {
    next(err);
  }
});

// POST /api/admin/push-offer — push offer to feed
router.post('/push-offer', protect, authorize('admin'), async (req, res, next) => {
  try {
    const offer = await FeedPost.create({
      ...req.body,
      author: req.user._id,
      type: 'offer',
    });
    res.status(201).json({ success: true, offer });
  } catch (err) {
    next(err);
  }
});

// POST /api/admin/push-feed — push announcement to feed
router.post('/push-feed', protect, authorize('admin'), async (req, res, next) => {
  try {
    const post = await FeedPost.create({
      ...req.body,
      author: req.user._id,
      type: 'announcement',
    });
    res.status(201).json({ success: true, post });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

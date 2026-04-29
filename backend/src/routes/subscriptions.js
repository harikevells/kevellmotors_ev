const express = require('express');
const router = express.Router();
const Subscription = require('../models/Subscription');
const SubscriptionPlan = require('../models/SubscriptionPlan');
const { protect, authorize } = require('../middleware/auth');

// ─── Default plans seeded on first run ───────────────────────────────────────
const DEFAULT_PLANS = [
  {
    key: 'monthly', name: 'Monthly', amount: 999, duration: 30, services: 1, sortOrder: 1,
    highlights: ['Free pickup & drop', 'Service history', 'Priority support'],
  },
  {
    key: 'quarterly', name: 'Quarterly', amount: 2499, duration: 90, services: 3, sortOrder: 2,
    highlights: ['Free pickup & drop', 'Service history', 'Priority support', 'Battery health check', 'Discount on spare parts'],
  },
  {
    key: 'amc_1yr', name: 'AMC 1 Year', amount: 7999, duration: 365, services: 12, sortOrder: 3, badge: 'Most Popular',
    highlights: ['Free pickup & drop', 'Service history', 'Priority support', 'Free labour', 'Battery health check', '24/7 roadside assistance', 'Annual safety inspection'],
  },
  {
    key: 'amc_2yr', name: 'AMC 2 Years', amount: 13999, duration: 730, services: 24, sortOrder: 4, badge: 'Best Value',
    highlights: ['Free pickup & drop', 'Service history', 'Priority support', 'Free labour', 'Battery health check', '24/7 roadside assistance', 'Annual safety inspection', 'Extended warranty support', 'Free diagnostics'],
  },
];

async function ensurePlansSeeded() {
  const count = await SubscriptionPlan.countDocuments();
  if (count === 0) await SubscriptionPlan.insertMany(DEFAULT_PLANS);
}
ensurePlansSeeded().catch(console.error);

// GET /api/subscriptions/plans — public
router.get('/plans', async (req, res, next) => {
  try {
    const plans = await SubscriptionPlan.find({ isActive: true }).sort({ sortOrder: 1, createdAt: 1 });
    res.json({ success: true, plans });
  } catch (err) {
    next(err);
  }
});

// ─── Admin plan CRUD ──────────────────────────────────────────────────────────

// GET /api/subscriptions/admin/plans — admin: all plans (incl inactive)
router.get('/admin/plans', protect, authorize('admin'), async (req, res, next) => {
  try {
    const plans = await SubscriptionPlan.find().sort({ sortOrder: 1, createdAt: 1 });
    res.json({ success: true, plans });
  } catch (err) {
    next(err);
  }
});

// POST /api/subscriptions/admin/plans — admin: create plan
router.post('/admin/plans', protect, authorize('admin'), async (req, res, next) => {
  try {
    const plan = await SubscriptionPlan.create(req.body);
    res.status(201).json({ success: true, plan });
  } catch (err) {
    next(err);
  }
});

// PUT /api/subscriptions/admin/plans/:id — admin: update plan
router.put('/admin/plans/:id', protect, authorize('admin'), async (req, res, next) => {
  try {
    const plan = await SubscriptionPlan.findByIdAndUpdate(req.params.id, req.body, { returnDocument: 'after', runValidators: true });
    if (!plan) return res.status(404).json({ success: false, message: 'Plan not found' });
    res.json({ success: true, plan });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/subscriptions/admin/plans/:id — admin: delete plan
router.delete('/admin/plans/:id', protect, authorize('admin'), async (req, res, next) => {
  try {
    const plan = await SubscriptionPlan.findByIdAndDelete(req.params.id);
    if (!plan) return res.status(404).json({ success: false, message: 'Plan not found' });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// GET /api/subscriptions — user's subscriptions
router.get('/', protect, async (req, res, next) => {
  try {
    const subscriptions = await Subscription.find({ user: req.user._id })
      .populate('vehicle', 'registrationNumber make model')
      .sort({ createdAt: -1 });
    res.json({ success: true, subscriptions });
  } catch (err) {
    next(err);
  }
});

// POST /api/subscriptions — create subscription
router.post('/', protect, async (req, res, next) => {
  try {
    const { planId, vehicleId } = req.body;
    const planDoc = await SubscriptionPlan.findOne({ _id: planId, isActive: true });
    if (!planDoc) return res.status(400).json({ success: false, message: 'Invalid or inactive plan' });

    const startDate = new Date();
    const endDate = new Date(Date.now() + planDoc.duration * 24 * 60 * 60 * 1000);

    const subscription = await Subscription.create({
      user: req.user._id,
      vehicle: vehicleId,
      plan: planDoc.key,
      amount: planDoc.amount,
      startDate,
      endDate,
      servicesIncluded: planDoc.services,
      features: planDoc.highlights,
    });

    res.status(201).json({ success: true, subscription });
  } catch (err) {
    next(err);
  }
});

// GET /api/subscriptions/:id
router.get('/:id', protect, async (req, res, next) => {
  try {
    const subscription = await Subscription.findOne({ _id: req.params.id, user: req.user._id })
      .populate('vehicle');
    if (!subscription) return res.status(404).json({ success: false, message: 'Subscription not found' });
    res.json({ success: true, subscription });
  } catch (err) {
    next(err);
  }
});

// PUT /api/subscriptions/:id/activate — admin activates after payment
router.put('/:id/activate', protect, authorize('admin'), async (req, res, next) => {
  try {
    const subscription = await Subscription.findByIdAndUpdate(
      req.params.id,
      { status: 'active', paymentId: req.body.paymentId },
      { new: true }
    );
    if (!subscription) return res.status(404).json({ success: false, message: 'Subscription not found' });
    res.json({ success: true, subscription });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

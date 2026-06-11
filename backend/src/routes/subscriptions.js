const express = require('express');
const router = express.Router();
const Subscription = require('../models/Subscription');
const SubscriptionPlan = require('../models/SubscriptionPlan');
const Service = require('../models/Service');
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

// GET /api/subscriptions/admin/plans — admin/franchise: all plans (incl inactive)
router.get('/admin/plans', protect, authorize('admin', 'franchise'), async (req, res, next) => {
  try {
    const plans = await SubscriptionPlan.find().sort({ sortOrder: 1, createdAt: 1 });
    res.json({ success: true, plans });
  } catch (err) {
    next(err);
  }
});

// POST /api/subscriptions/admin/plans — admin/franchise: create plan
router.post('/admin/plans', protect, authorize('admin', 'franchise'), async (req, res, next) => {
  try {
    const plan = await SubscriptionPlan.create(req.body);
    res.status(201).json({ success: true, plan });
  } catch (err) {
    next(err);
  }
});

// PUT /api/subscriptions/admin/plans/:id — admin/franchise: update plan
router.put('/admin/plans/:id', protect, authorize('admin', 'franchise'), async (req, res, next) => {
  try {
    const plan = await SubscriptionPlan.findByIdAndUpdate(req.params.id, req.body, { returnDocument: 'after', runValidators: true });
    if (!plan) return res.status(404).json({ success: false, message: 'Plan not found' });
    res.json({ success: true, plan });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/subscriptions/admin/plans/:id — admin/franchise: delete plan
router.delete('/admin/plans/:id', protect, authorize('admin', 'franchise'), async (req, res, next) => {
  try {
    const plan = await SubscriptionPlan.findByIdAndDelete(req.params.id);
    if (!plan) return res.status(404).json({ success: false, message: 'Plan not found' });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// GET /api/subscriptions — user's subscriptions (or all for admin/franchise)
router.get('/', protect, async (req, res, next) => {
  try {
    let filter = {};
    if (req.user.role === 'user') {
      filter = { user: req.user._id };
    }
    const subscriptions = await Subscription.find(filter)
      .populate('user', 'name email phone')
      .populate('vehicle', 'registrationNumber make model')
      .sort({ createdAt: -1 });

    const plans = await SubscriptionPlan.find();
    const planMap = {};
    plans.forEach(p => {
      planMap[p.key] = p;
    });

    const populatedSubscriptions = subscriptions.map(sub => {
      const subObj = sub.toObject();
      const planDetail = planMap[sub.plan];
      if (planDetail) {
        subObj.plan = planDetail;
      } else {
        subObj.plan = { name: sub.plan, highlights: sub.features || [], services: sub.servicesIncluded, duration: 30, amount: sub.amount };
      }
      return subObj;
    });

    res.json({ success: true, subscriptions: populatedSubscriptions });
  } catch (err) {
    next(err);
  }
});

// POST /api/subscriptions — create subscription
router.post('/', protect, async (req, res, next) => {
  try {
    const { planId, vehicleId, userId } = req.body;
    const planDoc = await SubscriptionPlan.findOne({ _id: planId, isActive: true });
    if (!planDoc) return res.status(400).json({ success: false, message: 'Invalid or inactive plan' });

    let targetUserId = req.user._id;
    if ((req.user.role === 'admin' || req.user.role === 'franchise') && userId) {
      targetUserId = userId;
    }

    const subscription = await Subscription.create({
      user: targetUserId,
      vehicle: vehicleId,
      plan: planDoc.key,
      amount: planDoc.amount,
      status: 'pending', // Explicitly pending until admin approves
      servicesIncluded: planDoc.services,
      features: planDoc.highlights,
    });

    const subObj = subscription.toObject();
    subObj.plan = planDoc;

    res.status(201).json({ success: true, subscription: subObj });
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
    
    const planDetail = await SubscriptionPlan.findOne({ key: subscription.plan });
    const subObj = subscription.toObject();
    if (planDetail) {
      subObj.plan = planDetail;
    } else {
      subObj.plan = { name: subscription.plan, highlights: subscription.features || [], services: subscription.servicesIncluded, duration: 30, amount: subscription.amount };
    }
    
    res.json({ success: true, subscription: subObj });
  } catch (err) {
    next(err);
  }
});

// GET /api/subscriptions/:id/usage — admin/franchise gets usage of a subscription
router.get('/:id/usage', protect, authorize('admin', 'franchise'), async (req, res, next) => {
  try {
    const subscription = await Subscription.findById(req.params.id);
    if (!subscription) return res.status(404).json({ success: false, message: 'Subscription not found' });
    
    // Find services for this vehicle and user
    const services = await Service.find({
      vehicle: subscription.vehicle,
      owner: subscription.user,
    }).populate('spareParts.part', 'name partNumber price category').sort({ createdAt: -1 });

    res.json({ success: true, services });
  } catch (err) {
    next(err);
  }
});

// PUT /api/subscriptions/:id/activate — admin activates
router.put('/:id/activate', protect, authorize('admin'), async (req, res, next) => {
  try {
    const subscriptionToAct = await Subscription.findById(req.params.id);
    if (!subscriptionToAct) return res.status(404).json({ success: false, message: 'Subscription not found' });

    const planDetailToAct = await SubscriptionPlan.findOne({ key: subscriptionToAct.plan });
    const duration = planDetailToAct ? planDetailToAct.duration : 30;

    const updates = { status: 'active' };
    if (req.body.paymentId) updates.paymentId = req.body.paymentId;
    
    if (!subscriptionToAct.startDate) {
      updates.startDate = new Date();
      updates.endDate = new Date(Date.now() + duration * 24 * 60 * 60 * 1000);
    }

    const subscription = await Subscription.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true }
    );
    if (!subscription) return res.status(404).json({ success: false, message: 'Subscription not found' });
    
    const planDetail = await SubscriptionPlan.findOne({ key: subscription.plan });
    const subObj = subscription.toObject();
    if (planDetail) {
      subObj.plan = planDetail;
    } else {
      subObj.plan = { name: subscription.plan, highlights: subscription.features || [], services: subscription.servicesIncluded, duration: 30, amount: subscription.amount };
    }
    
    res.json({ success: true, subscription: subObj });
  } catch (err) {
    next(err);
  }
});

// PUT /api/subscriptions/:id/reject — admin rejects pending subscription
router.put('/:id/reject', protect, authorize('admin'), async (req, res, next) => {
  try {
    const subscription = await Subscription.findByIdAndUpdate(
      req.params.id,
      { status: 'cancelled' },
      { new: true }
    );
    if (!subscription) return res.status(404).json({ success: false, message: 'Subscription not found' });
    
    const planDetail = await SubscriptionPlan.findOne({ key: subscription.plan });
    const subObj = subscription.toObject();
    if (planDetail) {
      subObj.plan = planDetail;
    } else {
      subObj.plan = { name: subscription.plan, highlights: subscription.features || [], services: subscription.servicesIncluded, duration: 30, amount: subscription.amount };
    }
    
    res.json({ success: true, subscription: subObj });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

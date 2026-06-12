const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Franchise = require('../models/Franchise');
const Service = require('../models/Service');
const { Feedback, Review } = require('../models/Feedback');
const Payment = require('../models/Payment');
const { protect, authorize } = require('../middleware/auth');

// All routes require authentication + franchise role
router.use(protect, authorize('franchise', 'admin'));

// Helper: get franchise record for the logged-in user
async function getMyFranchise(userId) {
  const f = await Franchise.findOne({ owner: userId });
  if (!f) throw { status: 404, message: 'No franchise found for this account' };
  return f;
}

// ── GET /api/franchise/me ──────────────────────────────────────────
router.get('/me', async (req, res, next) => {
  try {
    const franchise = await Franchise.findOne({ owner: req.user._id }).populate('owner', 'name email phone');
    if (!franchise) return res.status(404).json({ success: false, message: 'Franchise not found' });
    res.json({ success: true, franchise });
  } catch (err) { next(err); }
});

// ── GET /api/franchise/profile ─────────────────────────────────────
router.get('/profile', async (req, res, next) => {
  try {
    const franchise = await Franchise.findOne({ owner: req.user._id });
    if (!franchise) return res.status(404).json({ success: false, message: 'Franchise not found' });
    res.json({ success: true, franchise });
  } catch (err) { next(err); }
});

// ── PUT /api/franchise/profile ─────────────────────────────────────
router.put('/profile', async (req, res, next) => {
  try {
    const allowed = ['name', 'phone', 'email', 'licenseNumber', 'gstNumber', 'capacity', 'address', 'schedules', 'pickupDropService'];
    const updates = {};
    allowed.forEach((f) => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });

    // Handle lat/lng → GeoJSON location
    const lat = parseFloat(req.body.lat);
    const lng = parseFloat(req.body.lng);
    if (!isNaN(lat) && !isNaN(lng)) {
      updates.location = { type: 'Point', coordinates: [lng, lat] };
    }

    const franchise = await Franchise.findOneAndUpdate(
      { owner: req.user._id },
      updates,
      { new: true, runValidators: true }
    );
    if (!franchise) return res.status(404).json({ success: false, message: 'Franchise not found' });
    res.json({ success: true, franchise });
  } catch (err) { next(err); }
});

// ── GET /api/franchise/dashboard ──────────────────────────────────
router.get('/dashboard', async (req, res, next) => {
  try {
    const franchise = await getMyFranchise(req.user._id);
    const fid = franchise._id;

    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
    const todayEnd   = new Date(); todayEnd.setHours(23, 59, 59, 999);
    const weekStart  = new Date(todayStart); weekStart.setDate(weekStart.getDate() - 6);
    const monthStart = new Date(todayStart); monthStart.setDate(1);

    const [
      totalBookings,
      todayBookings,
      pendingBookings,
      completedToday,
      weekServices,
      monthServices,
      recentServices,
    ] = await Promise.all([
      Service.countDocuments({ franchise: fid }),
      Service.countDocuments({ franchise: fid, createdAt: { $gte: todayStart, $lte: todayEnd } }),
      Service.countDocuments({ franchise: fid, status: { $in: ['onboarded', 'diagnosis'] } }),
      Service.countDocuments({ franchise: fid, status: 'delivered', completedDate: { $gte: todayStart } }),
      Service.find({ franchise: fid, createdAt: { $gte: weekStart } }).select('createdAt finalAmount status'),
      Service.find({ franchise: fid, createdAt: { $gte: monthStart } }).select('createdAt finalAmount status'),
      Service.find({ franchise: fid })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('vehicle', 'registrationNumber make model')
        .populate('owner', 'name phone'),
    ]);

    // Daily booking counts for last 7 days
    const dailyBookings = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(todayStart); d.setDate(d.getDate() - i);
      const dEnd = new Date(d); dEnd.setHours(23, 59, 59, 999);
      const label = d.toLocaleDateString('en-IN', { weekday: 'short' });
      const count = weekServices.filter(s => new Date(s.createdAt) >= d && new Date(s.createdAt) <= dEnd).length;
      const revenue = weekServices
        .filter(s => new Date(s.createdAt) >= d && new Date(s.createdAt) <= dEnd && s.finalAmount)
        .reduce((sum, s) => sum + s.finalAmount, 0);
      dailyBookings.push({ label, count, revenue });
    }

    const monthRevenue = monthServices.filter(s => s.finalAmount).reduce((sum, s) => sum + s.finalAmount, 0);
    const weekRevenue  = weekServices.filter(s => s.finalAmount).reduce((sum, s) => sum + s.finalAmount, 0);

    res.json({
      success: true,
      stats: {
        totalBookings,
        todayBookings,
        pendingBookings,
        completedToday,
        capacityUsed: todayBookings,
        capacityTotal: franchise.capacity,
        weekRevenue,
        monthRevenue,
        rating: franchise.rating,
      },
      wallet: franchise.wallet,
      dailyBookings,
      recentServices,
    });
  } catch (err) { next(err); }
});

// ── GET /api/franchise/bookings ────────────────────────────────────
router.get('/bookings', async (req, res, next) => {
  try {
    const franchise = await getMyFranchise(req.user._id);
    const { status, date } = req.query;

    const filter = { franchise: franchise._id };
    if (status && status !== 'all') filter.status = status;
    if (date) {
      const d = new Date(date); d.setHours(0, 0, 0, 0);
      const dEnd = new Date(date); dEnd.setHours(23, 59, 59, 999);
      filter.scheduledDate = { $gte: d, $lte: dEnd };
    }

    const bookingsDocs = await Service.find(filter)
      .sort({ createdAt: -1 })
      .populate('vehicle', 'registrationNumber make model vehicleType')
      .populate('owner', 'name phone email')
      .populate('franchise', 'name address phone');

    const Subscription = require('../models/Subscription');
    const SubscriptionPlan = require('../models/SubscriptionPlan');
    
    const ownerIds = bookingsDocs.map(b => b.owner && b.owner._id).filter(Boolean);
    const activeSubs = await Subscription.find({ user: { $in: ownerIds }, status: 'active' });
    const plans = await SubscriptionPlan.find();
    
    const bookings = bookingsDocs.map(b => {
      const obj = b.toObject();
      let sub = null;
      if (b.appliedSubscription) {
        sub = activeSubs.find(s => s._id.toString() === b.appliedSubscription.toString());
      } else if (b.owner && b.vehicle) {
        sub = activeSubs.find(s => s.user.toString() === b.owner._id.toString() && s.vehicle.toString() === b.vehicle._id.toString());
      }
      
      if (sub) {
        const planDetail = plans.find(p => p.key === sub.plan);
        obj.activeSubscription = {
          ...sub.toObject(),
          planDetail
        };
      }
      return obj;
    });

    res.json({ success: true, bookings });
  } catch (err) { next(err); }
});

// ── POST /api/franchise/bookings ───────────────────────────────────
router.post('/bookings', async (req, res, next) => {
  try {
    const franchise = await getMyFranchise(req.user._id);
    const { customerName, customerPhone, customerEmail, regNo, make, model, serviceType, description, pickupRequested } = req.body;

    // 1. Create or find customer (simplified for now: we'll create a dummy user or just store details)
    // For a real system, we'd look up by phone. 
    // Here we'll just store the details in the Service record for simplicity if no user exists.
    
    const service = await Service.create({
      franchise: franchise._id,
      serviceType: serviceType || 'general',
      description,
      pickupRequested: !!pickupRequested,
      pickupStatus: !!pickupRequested ? 'pending' : 'none',
      status: 'onboarded',
      jobCard: {
        customerName,
        customerContact: customerPhone,
        regNo,
        make,
        model,
      }
    });

    const Notification = require('../models/Notification');
    const User = require('../models/User');

    // Notify Franchise
    await Notification.create({
      recipient: req.user._id,
      title: 'Booking Created',
      message: `You have successfully created a new booking for ${customerName} (${regNo}).`,
      type: 'booking',
      link: '/franchise/bookings'
    });

    // Notify all admins
    const admins = await User.find({ role: 'admin' });
    if (admins.length > 0) {
      const adminNotifications = admins.map(admin => ({
        recipient: admin._id,
        title: 'New Franchise Booking',
        message: `Franchise ${franchise.name} created a new booking for ${customerName} (${regNo}).`,
        type: 'system',
        link: '/admin/services'
      }));
      await Notification.insertMany(adminNotifications);
    }

    res.status(201).json({ success: true, service });
  } catch (err) { next(err); }
});

// ── PATCH /api/franchise/bookings/:id/status ───────────────────────
router.patch('/bookings/:id/status', async (req, res, next) => {
  try {
    const franchise = await getMyFranchise(req.user._id);
    const { status, note, invoiceItems, technicianNotes } = req.body;

    const allowed = ['onboarded', 'diagnosis', 'in_progress', 'waiting_parts', 'quality_check', 'delivered', 'cancelled'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const service = await Service.findOne({ _id: req.params.id, franchise: franchise._id });
    if (!service) return res.status(404).json({ success: false, message: 'Booking not found' });

    service.status = status;
    service.progressUpdates.push({ status, note: note || '', updatedBy: req.user._id });

    if (status === 'delivered') {
      service.completedDate = new Date();
      if (invoiceItems && invoiceItems.length > 0) {
        
        let svcDiscount = 0;
        let partDiscount = 0;
        if (service.owner && service.vehicle) {
          const Subscription = require('../models/Subscription');
          const SubscriptionPlan = require('../models/SubscriptionPlan');
          let activeSub = null;
          if (service.appliedSubscription) {
            activeSub = await Subscription.findById(service.appliedSubscription);
          } else {
            activeSub = await Subscription.findOne({ user: service.owner, vehicle: service.vehicle, status: 'active' });
          }
          if (activeSub) {
            const planDetail = await SubscriptionPlan.findOne({ key: activeSub.plan });
            if (planDetail) {
              svcDiscount = planDetail.serviceDiscount || 0;
              partDiscount = planDetail.sparePartsDiscount || 0;
            }
          }
        }

        const processedItems = invoiceItems.map(item => {
          let amount = Number(item.amount);
          let originalAmount = amount;
          if (item.type === 'service' && svcDiscount > 0) {
            amount = amount - (amount * (svcDiscount / 100));
          } else if (item.type === 'part' && partDiscount > 0) {
            amount = amount - (amount * (partDiscount / 100));
          }
          // Optionally attach original amount to item description if discounted
          const finalDesc = amount < originalAmount ? `${item.description} (-${item.type === 'service' ? svcDiscount : partDiscount}%)` : item.description;
          return { ...item, description: finalDesc, amount };
        });

        service.invoiceItems = processedItems;
        service.finalAmount = processedItems.reduce((sum, item) => sum + item.amount, 0);
        service.invoiceDate = new Date();
        // Generate invoice number: INV-{franchiseId slice}-{timestamp}
        service.invoiceNumber = `INV-${franchise._id.toString().slice(-5).toUpperCase()}-${Date.now().toString().slice(-6)}`;
      }
      if (technicianNotes) service.technicianNotes = technicianNotes;
    }

    await service.save();
    res.json({ success: true, service });
  } catch (err) { next(err); }
});

// ── GET /api/franchise/queue ───────────────────────────────────────
router.get('/queue', async (req, res, next) => {
  try {
    const franchise = await getMyFranchise(req.user._id);
    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
    const todayEnd   = new Date(); todayEnd.setHours(23, 59, 59, 999);

    const todayBookings = await Service.find({
      franchise: franchise._id,
      status: { $in: ['onboarded', 'diagnosis', 'in_progress', 'waiting_parts', 'quality_check'] },
      $or: [
        { scheduledDate: { $gte: todayStart, $lte: todayEnd } },
        { createdAt: { $gte: todayStart, $lte: todayEnd } },
      ],
    })
      .sort({ createdAt: 1 })
      .populate('vehicle', 'registrationNumber make model')
      .populate('owner', 'name phone');

    const availableSlots = Math.max(0, franchise.capacity - todayBookings.length);

    res.json({
      success: true,
      queue: todayBookings,
      capacity: franchise.capacity,
      occupied: todayBookings.length,
      availableSlots,
    });
  } catch (err) { next(err); }
});

// ── GET /api/franchise/customers ──────────────────────────────────
router.get('/customers', async (req, res, next) => {
  try {
    const franchise = await getMyFranchise(req.user._id);

    const services = await Service.find({ franchise: franchise._id })
      .populate('owner', 'name phone email')
      .populate('vehicle', 'registrationNumber make model')
      .sort({ createdAt: -1 });

    // Group by customer
    const customerMap = {};
    services.forEach((s) => {
      if (!s.owner) return;
      const uid = s.owner._id.toString();
      if (!customerMap[uid]) {
        customerMap[uid] = {
          _id: uid,
          name: s.owner.name,
          phone: s.owner.phone,
          email: s.owner.email,
          vehicles: new Set(),
          totalVisits: 0,
          lastServiceDate: s.createdAt,
        };
      }
      customerMap[uid].totalVisits += 1;
      if (s.vehicle) customerMap[uid].vehicles.add(s.vehicle.registrationNumber);
      if (new Date(s.createdAt) > new Date(customerMap[uid].lastServiceDate)) {
        customerMap[uid].lastServiceDate = s.createdAt;
      }
    });

    const customers = Object.values(customerMap).map((c) => ({
      ...c,
      vehicles: Array.from(c.vehicles),
    }));

    res.json({ success: true, customers });
  } catch (err) { next(err); }
});

// ── GET /api/franchise/customers/:id/orders ───────────────────────
router.get('/customers/:id/orders', async (req, res, next) => {
  try {
    const { Order } = require('../models/SparePart');
    const orders = await Order.find({ user: req.params.id })
      .populate('items.part', 'name price')
      .sort({ createdAt: -1 });
    res.json({ success: true, orders });
  } catch (err) { next(err); }
});

// ── GET /api/franchise/history ─────────────────────────────────────
router.get('/history', async (req, res, next) => {
  try {
    const franchise = await getMyFranchise(req.user._id);
    const { period = 'month' } = req.query;

    const now = new Date();
    let since = new Date();
    if (period === 'today') { since.setHours(0, 0, 0, 0); }
    else if (period === 'week') { since.setDate(now.getDate() - 7); }
    else { since.setDate(1); since.setHours(0, 0, 0, 0); }

    const history = await Service.find({
      franchise: franchise._id,
      status: 'delivered',
      completedDate: { $gte: since },
    })
      .sort({ completedDate: -1 })
      .populate('vehicle', 'registrationNumber make model')
      .populate('owner', 'name phone');

    res.json({ success: true, history });
  } catch (err) { next(err); }
});

// ── GET /api/franchise/revenue ─────────────────────────────────────
router.get('/revenue', async (req, res, next) => {
  try {
    const franchise = await getMyFranchise(req.user._id);

    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
    const weekStart  = new Date(todayStart); weekStart.setDate(weekStart.getDate() - 6);
    const monthStart = new Date(todayStart); monthStart.setDate(1);

    const allCompleted = await Service.find({
      franchise: franchise._id,
      status: 'delivered',
      finalAmount: { $gt: 0 },
    }).select('finalAmount completedDate createdAt serviceType').sort({ completedDate: -1 });

    const sum = (arr) => arr.reduce((s, x) => s + (x.finalAmount || 0), 0);
    const todayRev   = sum(allCompleted.filter(s => new Date(s.completedDate) >= todayStart));
    const weekRev    = sum(allCompleted.filter(s => new Date(s.completedDate) >= weekStart));
    const monthRev   = sum(allCompleted.filter(s => new Date(s.completedDate) >= monthStart));

    res.json({ success: true, revenue: { today: todayRev, week: weekRev, month: monthRev }, payments: allCompleted });
  } catch (err) { next(err); }
});

// ── GET /api/franchise/feedback ────────────────────────────────────
router.get('/feedback', async (req, res, next) => {
  try {
    const franchise = await getMyFranchise(req.user._id);

    const reviews = await Review.find({ franchise: franchise._id })
      .populate('user', 'name email')
      .sort({ createdAt: -1 });

    const feedbacks = await Feedback.find({ category: 'service' })
      .populate({
        path: 'service',
        match: { franchise: franchise._id },
        populate: { path: 'owner', select: 'name' },
      })
      .sort({ createdAt: -1 });

    const filtered = feedbacks.filter(f => f.service !== null);

    res.json({ success: true, reviews, feedbacks: filtered });
  } catch (err) { next(err); }
});

// ── PATCH /api/franchise/bookings/:id/payment ──────────────────────
router.patch('/bookings/:id/payment', async (req, res, next) => {
  try {
    const franchise = await getMyFranchise(req.user._id);
    const { paymentStatus } = req.body;
    if (!['confirmed', 'waived', 'pending'].includes(paymentStatus)) {
      return res.status(400).json({ success: false, message: 'Invalid payment status' });
    }

    const service = await Service.findOne({ _id: req.params.id, franchise: franchise._id, status: 'delivered' });
    if (!service) return res.status(404).json({ success: false, message: 'Booking not found or not delivered' });

    const oldStatus = service.paymentStatus;
    service.paymentStatus = paymentStatus;
    if (paymentStatus === 'confirmed') service.paymentConfirmedAt = new Date();
    await service.save();

    // Credit wallet only when newly confirmed (not already confirmed)
    if (paymentStatus === 'confirmed' && oldStatus !== 'confirmed' && service.finalAmount > 0) {
      await Franchise.findByIdAndUpdate(franchise._id, {
        $inc: { 'wallet.pendingBalance': service.finalAmount },
        $push: {
          'wallet.transactions': {
            type: 'credit',
            amount: service.finalAmount,
            serviceId: service._id,
            note: `Payment received for ${service.invoiceNumber || service._id.toString().slice(-6).toUpperCase()}`,
            status: 'approved',
            createdAt: new Date(),
          },
        },
      });
      
      const Notification = require('../models/Notification');
      if (service.owner) {
        const User = require('../models/User');
        const userDoc = await User.findById(service.owner);
        const userName = userDoc ? userDoc.name : 'Customer';
        await Notification.create({
          recipient: service.owner,
          title: 'Payment Confirmed',
          message: `Hi ${userName}, your payment of ₹${service.finalAmount} for service at ${franchise.name} has been confirmed.`,
          type: 'payment',
          link: '/user/payments'
        });
      }
    }

    res.json({ success: true, service });
  } catch (err) { next(err); }
});

// ── PATCH /api/franchise/bookings/:id/job-card ────────────────────
router.patch('/bookings/:id/job-card', async (req, res, next) => {
  try {
    const franchise = await getMyFranchise(req.user._id);
    const service = await Service.findOne({ _id: req.params.id, franchise: franchise._id });
    if (!service) return res.status(404).json({ success: false, message: 'Booking not found' });

    // Ensure jobCard exists and merge updates
    const currentJobCard = (service.jobCard && service.jobCard.toObject ? service.jobCard.toObject() : service.jobCard) || {};
    service.jobCard = { ...currentJobCard, ...req.body };
    service.markModified('jobCard');
    await service.save();

    res.json({ success: true, service });
  } catch (err) { next(err); }
});

// ── GET /api/franchise/wallet ──────────────────────────────────────
router.get('/wallet', async (req, res, next) => {
  try {
    const franchise = await Franchise.findOne({ owner: req.user._id }).select('name wallet upiId');
    if (!franchise) return res.status(404).json({ success: false, message: 'Franchise not found' });
    res.json({ success: true, wallet: franchise.wallet, upiId: franchise.upiId });
  } catch (err) { next(err); }
});

// ── POST /api/franchise/wallet/redeem ─────────────────────────────
router.post('/wallet/redeem', async (req, res, next) => {
  try {
    const franchise = await Franchise.findOne({ owner: req.user._id });
    if (!franchise) return res.status(404).json({ success: false, message: 'Franchise not found' });
    const redeemAmount = Number(req.body.amount);
    if (!redeemAmount || redeemAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid amount' });
    }

    const pendingTotal = (franchise.wallet.transactions || [])
      .filter((t) => t.type === 'redeem_request' && t.status === 'pending')
      .reduce((sum, t) => sum + t.amount, 0);

    if (redeemAmount > (franchise.wallet.pendingBalance - pendingTotal)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Insufficient balance after considering other pending requests' 
      });
    }

    franchise.wallet.transactions.push({
      type: 'redeem_request',
      amount: redeemAmount,
      note: req.body.note || 'Redemption request',
      status: 'pending',
      requestedAt: new Date(),
      createdAt: new Date(),
    });

    await franchise.save();
    res.json({ success: true, wallet: franchise.wallet });
  } catch (err) { next(err); }
});

// ── PATCH /api/franchise/bookings/:id/logistics ──────────────────
router.patch('/bookings/:id/logistics', async (req, res, next) => {
  try {
    const franchise = await getMyFranchise(req.user._id);
    const { pickupStatus, dropStatus } = req.body;
    
    const service = await Service.findOne({ _id: req.params.id, franchise: franchise._id });
    if (!service) return res.status(404).json({ success: false, message: 'Booking not found' });

    let logisticsUpdates = [];

    if (pickupStatus && service.pickupStatus !== pickupStatus) {
      if (!['pending', 'completed', 'none'].includes(pickupStatus)) {
        return res.status(400).json({ success: false, message: 'Invalid pickup status' });
      }
      service.pickupStatus = pickupStatus;
      if (pickupStatus === 'completed') logisticsUpdates.push('Vehicle picked up');
    }

    if (dropStatus && service.dropStatus !== dropStatus) {
      if (!['pending', 'completed', 'none'].includes(dropStatus)) {
        return res.status(400).json({ success: false, message: 'Invalid drop status' });
      }
      service.dropStatus = dropStatus;
      if (dropStatus === 'completed') logisticsUpdates.push('Vehicle dropped off');
    }

    await service.save();

    if (logisticsUpdates.length > 0 && service.owner) {
      const Notification = require('../models/Notification');
      const User = require('../models/User');
      const userDoc = await User.findById(service.owner);
      const userName = userDoc ? userDoc.name : 'Customer';
      await Notification.create({
        recipient: service.owner,
        title: 'Logistics Update',
        message: `Hi ${userName}, ${franchise.name}: ${logisticsUpdates.join(' & ')}.`,
        type: 'booking',
        link: '/user/bookings'
      });
    }

    res.json({ success: true, service });
  } catch (err) { next(err); }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const Franchise = require('../models/Franchise');
const Notification = require('../models/Notification');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

// GET /api/franchises — public list (admin can pass status=all to see all)
router.get('/', async (req, res, next) => {
  try {
    const { city, status } = req.query;
    const filter = {};
    if (status && status !== 'all') filter.status = status;
    if (city) filter['address.city'] = new RegExp(city, 'i');

    const franchises = await Franchise.find(filter).populate('owner', 'name email phone').sort({ createdAt: -1 });
    res.json({ success: true, franchises });
  } catch (err) {
    next(err);
  }
});

// POST /api/franchises — admin creates franchise
router.post('/', protect, authorize('admin'), async (req, res, next) => {
  try {
    const User = require('../models/User');
    let ownerId = req.body.owner;

    if (!ownerId) {
      // Find user by email or phone
      let user = await User.findOne({ $or: [{ email: req.body.email }, { phone: req.body.phone }] });
      
      if (!user) {
        // Create new user for the franchise owner
        user = await User.create({
          name: req.body.name + ' Owner',
          email: req.body.email,
          phone: req.body.phone,
          password: req.body.phone || '123456', // default password
          role: 'franchise'
        });
      } else {
        // Update existing user role
        await User.findByIdAndUpdate(user._id, { role: 'franchise' });
      }
      ownerId = user._id;
    } else {
      await User.findByIdAndUpdate(ownerId, { role: 'franchise' });
    }

    const franchiseData = { ...req.body, owner: ownerId };
    const franchise = await Franchise.create(franchiseData);
    res.status(201).json({ success: true, franchise });
  } catch (err) {
    next(err);
  }
});

// GET /api/franchises/wallet/balances — admin: wallet balance for all franchises
router.get('/wallet/balances', protect, authorize('admin'), async (req, res, next) => {
  try {
    const franchises = await Franchise.find().select('name email phone wallet status');
    const balances = franchises.map((f) => ({
      franchiseId: f._id,
      franchiseName: f.name,
      franchiseEmail: f.email,
      franchisePhone: f.phone,
      status: f.status,
      pendingBalance: f.wallet?.pendingBalance || 0,
      totalRedeemed: f.wallet?.balance || 0,
      creditCount: (f.wallet?.transactions || []).filter((t) => t.type === 'credit').length,
    }));
    balances.sort((a, b) => b.pendingBalance - a.pendingBalance);
    res.json({ success: true, balances });
  } catch (err) { next(err); }
});

// GET /api/franchises/nearby?lat=&lng=&radius=  (radius in km, default 30)
router.get('/nearby', async (req, res, next) => {
  try {
    const lat = parseFloat(req.query.lat);
    const lng = parseFloat(req.query.lng);
    const radius = Math.min(parseFloat(req.query.radius) || 30, 50000); // cap at 50000 km

    if (isNaN(lat) || isNaN(lng)) {
      return res.status(400).json({ success: false, message: 'lat and lng are required' });
    }

    const franchises = await Franchise.find({
      status: 'active',
      location: {
        $near: {
          $geometry: { type: 'Point', coordinates: [lng, lat] },
          $maxDistance: radius * 1000, // metres
        },
      },
    }).select('name address location rating reviewCount schedules capacity upiId pickupDropService');

    // Attach distance (metres → km) to each result
    const results = franchises.map((f) => {
      const [fLng, fLat] = f.location?.coordinates || [0, 0];
      const R = 6371;
      const dLat = ((fLat - lat) * Math.PI) / 180;
      const dLng = ((fLng - lng) * Math.PI) / 180;
      const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat * Math.PI) / 180) * Math.cos((fLat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
      const distKm = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return { ...f.toObject(), distanceKm: Math.round(distKm * 10) / 10 };
    });

    res.json({ success: true, franchises: results, count: results.length });
  } catch (err) {
    next(err);
  }
});

// GET /api/franchises/:id
router.get('/:id', async (req, res, next) => {
  try {
    const franchise = await Franchise.findById(req.params.id).populate('owner', 'name email phone');
    if (!franchise) return res.status(404).json({ success: false, message: 'Franchise not found' });
    res.json({ success: true, franchise });
  } catch (err) {
    next(err);
  }
});

// PUT /api/franchises/:id — admin update
router.put('/:id', protect, authorize('admin'), async (req, res, next) => {
  try {
    const updateData = { ...req.body };
    const lat = parseFloat(updateData.lat);
    const lng = parseFloat(updateData.lng);
    if (!isNaN(lat) && !isNaN(lng)) {
      updateData.location = { type: 'Point', coordinates: [lng, lat] };
    }
    delete updateData.lat;
    delete updateData.lng;
    const franchise = await Franchise.findByIdAndUpdate(req.params.id, updateData, { returnDocument: 'after', runValidators: true });
    if (!franchise) return res.status(404).json({ success: false, message: 'Franchise not found' });
    
    await Notification.create({
      recipient: franchise.owner,
      title: 'Franchise Profile Updated',
      message: 'Your franchise details have been updated by the administrator.',
      type: 'system'
    });

    res.json({ success: true, franchise });
  } catch (err) {
    next(err);
  }
});

// PUT /api/franchises/:id/status — admin activate/suspend
router.put('/:id/status', protect, authorize('admin'), async (req, res, next) => {
  try {
    const franchise = await Franchise.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true }
    );
    if (!franchise) return res.status(404).json({ success: false, message: 'Franchise not found' });

    await Notification.create({
      recipient: franchise.owner,
      title: `Franchise Status Changed: ${req.body.status.toUpperCase()}`,
      message: `Your franchise status has been changed to ${req.body.status}.`,
      type: 'system'
    });

    res.json({ success: true, franchise });
  } catch (err) {
    next(err);
  }
});

// POST /api/franchises/:id/documents
router.post('/:id/documents', protect, authorize('admin', 'franchise'), upload.single('document'), async (req, res, next) => {
  try {
    const franchise = await Franchise.findById(req.params.id);
    if (!franchise) return res.status(404).json({ success: false, message: 'Franchise not found' });

    franchise.documents.push({ name: req.body.name || req.file.originalname, url: `/uploads/${req.file.filename}` });
    await franchise.save();
    res.json({ success: true, franchise });
  } catch (err) {
    next(err);
  }
});

// GET /api/franchises/wallet/redeem-requests — admin: all redeem requests
router.get('/wallet/redeem-requests', protect, authorize('admin'), async (req, res, next) => {
  try {
    const franchises = await Franchise.find({
      'wallet.transactions': { $elemMatch: { type: 'redeem_request' } },
    }).select('name email phone wallet');

    const requests = [];
    franchises.forEach((f) => {
      (f.wallet.transactions || []).forEach((t) => {
        if (t.type === 'redeem_request') {
          requests.push({
            ...t.toObject(),
            franchiseId: f._id,
            franchiseName: f.name,
            franchiseEmail: f.email,
            franchisePhone: f.phone,
          });
        }
      });
    });
    requests.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json({ success: true, requests });
  } catch (err) { next(err); }
});

// PUT /api/franchises/:franchiseId/wallet/redeem/:txId — admin approve/reject
router.put('/:franchiseId/wallet/redeem/:txId', protect, authorize('admin'), async (req, res, next) => {
  try {
    const { action } = req.body; // 'approve' | 'reject'
    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ success: false, message: 'Invalid action' });
    }

    const franchise = await Franchise.findById(req.params.franchiseId);
    if (!franchise) return res.status(404).json({ success: false, message: 'Franchise not found' });

    const tx = franchise.wallet.transactions.id(req.params.txId);
    if (!tx || tx.type !== 'redeem_request' || tx.status !== 'pending') {
      return res.status(404).json({ success: false, message: 'Redeem request not found or already processed' });
    }

    tx.status = action === 'approve' ? 'approved' : 'rejected';
    tx.processedAt = new Date();

    if (action === 'approve') {
      franchise.wallet.pendingBalance = (franchise.wallet.pendingBalance || 0) - tx.amount;
      franchise.wallet.balance = (franchise.wallet.balance || 0) + tx.amount;
      franchise.wallet.transactions.push({
        type: 'redeemed',
        amount: tx.amount,
        note: `Redemption of ₹${tx.amount.toLocaleString('en-IN')} approved by admin`,
        status: 'approved',
        createdAt: new Date(),
      });
    } else {
      // No refund logic needed anymore - it wasn't deducted during request
    }

    await franchise.save();
    res.json({ success: true, franchise });
  } catch (err) { next(err); }
});

module.exports = router;

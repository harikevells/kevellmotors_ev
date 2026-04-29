const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

// POST /api/auth/register
router.post(
  '/register',
  [
    body('name').notEmpty().trim().withMessage('Name is required'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('phone').notEmpty().trim().withMessage('Phone is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
      const { name, email, phone, password, referralCode } = req.body;

      let referrer = null;
      if (referralCode) {
        referrer = await User.findOne({ referralCode });
        if (referrer) {
          referrer.referralCount += 1;
          await referrer.save();
        }
      }

      const user = await User.create({
        name,
        email,
        phone,
        password,
        referralCode: uuidv4().slice(0, 8).toUpperCase(),
        referredBy: referrer ? referrer._id : undefined,
      });

      const token = signToken(user._id);
      res.status(201).json({
        success: true,
        token,
        user: { id: user._id, name: user.name, email: user.email, role: user.role, referralCode: user.referralCode },
      });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/auth/register-franchise
router.post(
  '/register-franchise',
  [
    body('name').notEmpty().trim().withMessage('Owner name is required'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('phone').notEmpty().trim().withMessage('Phone is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('franchiseName').notEmpty().trim().withMessage('Franchise name is required'),
    body('street').notEmpty().trim().withMessage('Street address is required'),
    body('city').notEmpty().trim().withMessage('City is required'),
    body('state').notEmpty().trim().withMessage('State is required'),
    body('pincode').notEmpty().trim().withMessage('Pincode is required'),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
      const { name, email, phone, password, franchiseName, street, city, state, pincode, licenseNumber, gstNumber, workingHours, availableDays, capacity, lat, lng, pickupDropService } = req.body;

      const existing = await User.findOne({ email });
      if (existing) return res.status(400).json({ success: false, message: 'Email already registered' });

      const Franchise = require('../models/Franchise');

      const user = await User.create({
        name,
        email,
        phone,
        password,
        role: 'franchise',
        referralCode: uuidv4().slice(0, 8).toUpperCase(),
      });

      await Franchise.create({
        name: franchiseName,
        owner: user._id,
        email,
        phone,
        address: { street, city, state, pincode },
        location: (lat && lng) ? { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] } : undefined,
        licenseNumber: licenseNumber || undefined,
        gstNumber: gstNumber || undefined,
        capacity: capacity ? Number(capacity) : 10,
        workingHours: workingHours || undefined,
        availableDays: availableDays || undefined,
        pickupDropService: pickupDropService || false,
        status: 'pending',
      });

      const token = signToken(user._id);
      res.status(201).json({
        success: true,
        token,
        user: { id: user._id, name: user.name, email: user.email, role: user.role },
        message: 'Franchise application submitted. Your account is pending admin approval.',
      });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/auth/login
router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
      const { email, password } = req.body;
      const user = await User.findOne({ email });
      if (!user || !(await user.comparePassword(password))) {
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
      }
      if (!user.isActive) {
        return res.status(401).json({ success: false, message: 'Account deactivated' });
      }

      const token = signToken(user._id);
      res.json({
        success: true,
        token,
        user: { id: user._id, name: user.name, email: user.email, role: user.role },
      });
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/auth/me
router.get('/me', protect, async (req, res) => {
  res.json({ success: true, user: req.user });
});

// PUT /api/auth/profile
router.put('/profile', protect, async (req, res, next) => {
  try {
    const updates = {};
    const allowed = ['name', 'phone', 'address', 'pushToken'];
    allowed.forEach((f) => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });

    const user = await User.findByIdAndUpdate(req.user._id, updates, { returnDocument: 'after', runValidators: true }).select('-password');
    res.json({ success: true, user });
  } catch (err) {
    next(err);
  }
});

// PUT /api/auth/change-password
router.put(
  '/change-password',
  protect,
  [
    body('currentPassword').notEmpty().withMessage('Current password required'),
    body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    try {
      const user = await User.findById(req.user._id);
      if (!(await user.comparePassword(req.body.currentPassword))) {
        return res.status(400).json({ success: false, message: 'Current password incorrect' });
      }
      user.password = req.body.newPassword;
      await user.save();
      res.json({ success: true, message: 'Password updated' });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;

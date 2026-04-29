const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect } = require('../middleware/auth');

// GET /api/referrals/me — user's referral info
router.get('/me', protect, async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id)
      .select('referralCode referralCount referredBy')
      .populate('referredBy', 'name');
    const referred = await User.find({ referredBy: req.user._id }).select('name createdAt');
    res.json({ success: true, referralCode: user.referralCode, referralCount: user.referralCount, referred });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const Vehicle = require('../models/Vehicle');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

// GET /api/vehicles — user's vehicles
router.get('/', protect, async (req, res, next) => {
  try {
    const vehicles = await Vehicle.find({ owner: req.user._id, isActive: true });
    res.json({ success: true, vehicles });
  } catch (err) {
    next(err);
  }
});

// GET /api/vehicles/user/:userId — admin/franchise get a user's vehicles
router.get('/user/:userId', protect, async (req, res, next) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'franchise') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    const vehicles = await Vehicle.find({ owner: req.params.userId, isActive: true });
    res.json({ success: true, vehicles });
  } catch (err) {
    next(err);
  }
});

// POST /api/vehicles — add vehicle
router.post('/', protect, async (req, res, next) => {
  try {
    const vehicle = await Vehicle.create({ ...req.body, owner: req.user._id });
    res.status(201).json({ success: true, vehicle });
  } catch (err) {
    next(err);
  }
});

// GET /api/vehicles/:id
router.get('/:id', protect, async (req, res, next) => {
  try {
    const vehicle = await Vehicle.findOne({ _id: req.params.id, owner: req.user._id });
    if (!vehicle) return res.status(404).json({ success: false, message: 'Vehicle not found' });
    res.json({ success: true, vehicle });
  } catch (err) {
    next(err);
  }
});

// PUT /api/vehicles/:id
router.put('/:id', protect, async (req, res, next) => {
  try {
    const vehicle = await Vehicle.findOneAndUpdate(
      { _id: req.params.id, owner: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!vehicle) return res.status(404).json({ success: false, message: 'Vehicle not found' });
    res.json({ success: true, vehicle });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/vehicles/:id
router.delete('/:id', protect, async (req, res, next) => {
  try {
    const vehicle = await Vehicle.findOneAndUpdate(
      { _id: req.params.id, owner: req.user._id },
      { isActive: false },
      { new: true }
    );
    if (!vehicle) return res.status(404).json({ success: false, message: 'Vehicle not found' });
    res.json({ success: true, message: 'Vehicle removed' });
  } catch (err) {
    next(err);
  }
});

// POST /api/vehicles/:id/documents — upload vehicle document
router.post('/:id/documents', protect, upload.single('document'), async (req, res, next) => {
  try {
    const vehicle = await Vehicle.findOne({ _id: req.params.id, owner: req.user._id });
    if (!vehicle) return res.status(404).json({ success: false, message: 'Vehicle not found' });

    vehicle.documents.push({
      name: req.body.name || req.file.originalname,
      url: `/uploads/${req.file.filename}`,
      uploadedAt: new Date(),
    });
    await vehicle.save();
    res.json({ success: true, vehicle });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

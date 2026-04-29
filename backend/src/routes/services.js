const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const Service = require('../models/Service');
const Reminder = require('../models/Reminder');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

// GET /api/services — user's services
router.get('/', protect, async (req, res, next) => {
  try {
    const { status, vehicleId } = req.query;
    const filter = { owner: req.user._id };
    if (status) filter.status = status;
    if (vehicleId) filter.vehicle = vehicleId;

    const services = await Service.find(filter)
      .populate('vehicle', 'registrationNumber make model')
      .populate('franchise', 'name address upiId')
      .sort({ createdAt: -1 });
    res.json({ success: true, services });
  } catch (err) {
    next(err);
  }
});

// POST /api/services — book a service
router.post('/', protect, async (req, res, next) => {
  try {
    const serviceData = { ...req.body, owner: req.user._id };

    // Handle base64-encoded voice note
    if (req.body.voiceNoteData) {
      const base64Data = req.body.voiceNoteData.replace(/^data:[^;]+;base64,/, '');
      const ext = req.body.voiceNoteExt || 'webm';
      const filename = `voice-${Date.now()}-${Math.round(Math.random() * 1e9)}.${ext}`;
      const uploadsDir = path.join(__dirname, '../../uploads');
      if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
      fs.writeFileSync(path.join(uploadsDir, filename), Buffer.from(base64Data, 'base64'));
      serviceData.voiceNote = filename;
      delete serviceData.voiceNoteData;
      delete serviceData.voiceNoteExt;
    }

    if (serviceData.pickupRequested) {
      serviceData.pickupStatus = 'pending';
    }

    const service = await Service.create(serviceData);

    // Auto-create reminder for next service (3 months later)
    await Reminder.create({
      user: req.user._id,
      vehicle: req.body.vehicle,
      type: 'service_due',
      dueDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      message: 'Your next service is due',
    });

    res.status(201).json({ success: true, service });
  } catch (err) {
    next(err);
  }
});

// GET /api/services/:id — service detail with progress
router.get('/:id', protect, async (req, res, next) => {
  try {
    const service = await Service.findOne({ _id: req.params.id, owner: req.user._id })
      .populate('vehicle')
      .populate('franchise', 'name address phone')
      .populate('spareParts.part', 'name price');
    if (!service) return res.status(404).json({ success: false, message: 'Service not found' });
    res.json({ success: true, service });
  } catch (err) {
    next(err);
  }
});

// PUT /api/services/:id/status — admin/franchise update service status
router.put('/:id/status', protect, authorize('admin', 'franchise'), async (req, res, next) => {
  try {
    const { status, note } = req.body;
    const service = await Service.findById(req.params.id);
    if (!service) return res.status(404).json({ success: false, message: 'Service not found' });

    service.status = status;
    service.progressUpdates.push({ status, note, updatedBy: req.user._id });
    if (status === 'delivered') service.completedDate = new Date();
    await service.save();

    res.json({ success: true, service });
  } catch (err) {
    next(err);
  }
});

// PUT /api/services/:id/deliverables — update deliverables
router.put('/:id/deliverables', protect, authorize('admin', 'franchise'), async (req, res, next) => {
  try {
    const service = await Service.findById(req.params.id);
    if (!service) return res.status(404).json({ success: false, message: 'Service not found' });
    service.deliverables = req.body.deliverables;
    await service.save();
    res.json({ success: true, service });
  } catch (err) {
    next(err);
  }
});

// PUT /api/services/:id/assign — admin assigns a franchise to a service
router.put('/:id/assign', protect, authorize('admin'), async (req, res, next) => {
  try {
    const { franchiseId } = req.body;
    const service = await Service.findByIdAndUpdate(
      req.params.id,
      { franchise: franchiseId || null },
      { new: true }
    ).populate('franchise', 'name address');
    if (!service) return res.status(404).json({ success: false, message: 'Service not found' });
    res.json({ success: true, service });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/services/:id/drop-request — user requests bike drop back
router.patch('/:id/drop-request', protect, async (req, res, next) => {
  try {
    const { dropRequested } = req.body;
    const service = await Service.findOne({ _id: req.params.id, owner: req.user._id });
    if (!service) return res.status(404).json({ success: false, message: 'Service not found' });

    service.dropRequested = !!dropRequested;
    if (service.dropRequested) {
      service.dropStatus = 'pending';
    } else {
      service.dropStatus = 'none';
    }
    await service.save();

    res.json({ success: true, service });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

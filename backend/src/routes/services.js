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

    // Check if user has an active subscription for this vehicle
    const Subscription = require('../models/Subscription');
    let activeSub = null;
    if (req.body.appliedSubscription) {
      activeSub = await Subscription.findOne({ _id: req.body.appliedSubscription, user: req.user._id, status: 'active' });
    } else {
      activeSub = await Subscription.findOne({
        user: req.user._id,
        vehicle: req.body.vehicle,
        status: 'active'
      });
    }

    if (activeSub) {
      serviceData.appliedSubscription = activeSub._id;
      if (activeSub.servicesUsed < activeSub.servicesIncluded) {
        activeSub.servicesUsed += 1;
        await activeSub.save();
        serviceData.technicianNotes = 'Service covered under active subscription. (Included free service used)';
        serviceData.paymentStatus = 'waived';
      }
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

    const Notification = require('../models/Notification');
    const User = require('../models/User');
    
    // Notify the user
    await Notification.create({
      recipient: req.user._id,
      title: 'Booking Confirmed',
      message: `Hi ${req.user.name}, your service booking for ${new Date(service.serviceDate).toLocaleDateString()} has been received.`,
      type: 'booking',
      link: '/user/bookings'
    });

    // Notify all admins
    const admins = await User.find({ role: 'admin' });
    if (admins.length > 0) {
      const adminNotifications = admins.map(admin => ({
        recipient: admin._id,
        title: 'Service Booking',
        message: `${req.user.name} has just booked a ${service.serviceType} service.`,
        type: 'system',
        link: '/admin/services'
      }));
      await Notification.insertMany(adminNotifications);
    }

    // Notify franchise if assigned during booking
    if (serviceData.franchise) {
      const Franchise = require('../models/Franchise');
      const assignedFranchise = await Franchise.findById(serviceData.franchise);
      if (assignedFranchise && assignedFranchise.owner) {
        await Notification.create({
          recipient: assignedFranchise.owner,
          title: 'New Service Booking',
          message: `Hi ${assignedFranchise.name}, ${req.user.name} has just booked a ${service.serviceType} service at your franchise.`,
          type: 'booking',
          link: '/franchise/bookings'
        });
      }
    }

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

    const populatedService = await Service.findById(service._id)
      .populate('owner', 'name')
      .populate('franchise', 'name');

    const Notification = require('../models/Notification');
    const franchiseName = populatedService.franchise ? populatedService.franchise.name : 'Kevell Motors';
    const userName = populatedService.owner ? populatedService.owner.name : 'Customer';

    await Notification.create({
      recipient: service.owner,
      title: 'Service Update',
      message: `Hi ${userName}, your vehicle service status at ${franchiseName} is now: ${status.replace('_', ' ')}. ${note || ''}`,
      type: 'system',
      link: '/user/bookings'
    });

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
    
    if (franchiseId) {
      const Franchise = require('../models/Franchise');
      const assignedFranchise = await Franchise.findById(franchiseId);
      if (assignedFranchise && assignedFranchise.owner) {
        const Notification = require('../models/Notification');
        await Notification.create({
          recipient: assignedFranchise.owner,
          title: 'New Service Assigned',
          message: `Hi ${assignedFranchise.name}, a new vehicle service (ID: ${service._id.toString().slice(-8).toUpperCase()}) has been assigned to your franchise.`,
          type: 'booking',
          link: '/franchise/bookings'
        });
      }
    }

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

    if (service.dropRequested) {
      const Notification = require('../models/Notification');
      let notifyId = null;
      if (service.franchise) {
        const Franchise = require('../models/Franchise');
        const assignedFranchise = await Franchise.findById(service.franchise);
        if (assignedFranchise && assignedFranchise.owner) notifyId = assignedFranchise.owner;
      }
      
      if (!notifyId) {
        const User = require('../models/User');
        const admin = await User.findOne({ role: 'admin' });
        if (admin) notifyId = admin._id;
      }

      if (notifyId) {
        await Notification.create({
          recipient: notifyId,
          title: 'Drop Requested',
          message: `Customer ${req.user.name || ''} has requested a drop for their vehicle service.`,
          type: 'booking',
          link: service.franchise ? '/franchise/bookings' : '/admin/services'
        });
      }
    }

    res.json({ success: true, service });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

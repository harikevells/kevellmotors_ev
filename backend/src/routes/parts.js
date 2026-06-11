const express = require('express');
const router = express.Router();
const { SparePart, Order } = require('../models/SparePart');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

// GET /api/parts — list spare parts (with optional filters)
router.get('/', async (req, res, next) => {
  try {
    const { category, search, page = 1, limit = 20 } = req.query;
    const filter = { isAvailable: true };
    if (category) filter.category = category;
    if (search) filter.name = { $regex: search, $options: 'i' };

    const total = await SparePart.countDocuments(filter);
    const parts = await SparePart.find(filter)
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({ success: true, parts, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    next(err);
  }
});

// GET /api/parts/:id
router.get('/:id', async (req, res, next) => {
  try {
    const part = await SparePart.findById(req.params.id);
    if (!part) return res.status(404).json({ success: false, message: 'Part not found' });
    res.json({ success: true, part });
  } catch (err) {
    next(err);
  }
});

// POST /api/parts — admin add spare part
router.post('/', protect, authorize('admin'), upload.any(), async (req, res, next) => {
  try {
    // Whitelist only valid fields
    const data = {
      name: req.body.name,
      partNumber: req.body.partNumber,
      category: req.body.category,
      description: req.body.description,
      price: req.body.price,
      stock: req.body.stock,
      brand: req.body.brand,
      warranty: req.body.warranty,
      isAvailable: req.body.isAvailable,
    };
    
    // Only set images if files were uploaded
    if (req.files && req.files.length > 0) {
      data.images = req.files.map(f => `/uploads/${f.filename}`);
      // Fallback for backwards compatibility with image field
      data.image = data.images[0];
    }
    
    const part = await SparePart.create(data);
    res.status(201).json({ success: true, part });
  } catch (err) {
    next(err);
  }
});

// PUT /api/parts/:id — admin update
router.put('/:id', protect, authorize('admin'), upload.any(), async (req, res, next) => {
  try {
    // Whitelist only valid fields
    const data = {
      name: req.body.name,
      partNumber: req.body.partNumber,
      category: req.body.category,
      description: req.body.description,
      price: req.body.price,
      stock: req.body.stock,
      brand: req.body.brand,
      warranty: req.body.warranty,
      isAvailable: req.body.isAvailable,
    };
    
    let updatedImages = [];
    if (req.body.existingImages) {
      try {
        updatedImages = JSON.parse(req.body.existingImages);
      } catch (e) {
        updatedImages = Array.isArray(req.body.existingImages) ? req.body.existingImages : [req.body.existingImages];
      }
    }

    if (req.files && req.files.length > 0) {
      const newImages = req.files.map(f => `/uploads/${f.filename}`);
      updatedImages = [...updatedImages, ...newImages];
    }
    
    data.images = updatedImages;
    data.image = updatedImages.length > 0 ? updatedImages[0] : null;
    
    const part = await SparePart.findByIdAndUpdate(req.params.id, data, { returnDocument: 'after', runValidators: true });
    if (!part) return res.status(404).json({ success: false, message: 'Part not found' });
    res.json({ success: true, part });
  } catch (err) {
    next(err);
  }
});

// POST /api/parts/orders — place order
router.post('/orders', protect, async (req, res, next) => {
  try {
    const { items, shippingAddress, part, quantity, deliveryAddress } = req.body;

    let orderItems = items || [];
    if (part && quantity) {
      orderItems = [{ partId: part, quantity }];
    }
    
    let addr = shippingAddress;
    if (!addr && deliveryAddress) {
      addr = { street: deliveryAddress };
    }

    let totalAmount = 0;
    for (const item of orderItems) {
      const partDoc = await SparePart.findById(item.partId);
      if (!partDoc || !partDoc.isAvailable || partDoc.stock < item.quantity) {
        return res.status(400).json({ success: false, message: `Part ${item.partId} not available` });
      }
      totalAmount += partDoc.price * item.quantity;
    }

    // Apply 10% discount if user has an active subscription
    const Subscription = require('../models/Subscription');
    const hasActiveSub = await Subscription.findOne({ user: req.user._id, status: 'active' });
    if (hasActiveSub) {
      totalAmount = totalAmount - (totalAmount * 0.10);
    }

    const order = await Order.create({
      user: req.user._id,
      items: await Promise.all(
        orderItems.map(async (item) => {
          const partDoc = await SparePart.findById(item.partId);
          return { part: item.partId, quantity: item.quantity, price: partDoc.price };
        })
      ),
      totalAmount,
      shippingAddress: addr,
    });

    const Notification = require('../models/Notification');
    const User = require('../models/User');

    // Notify the user
    await Notification.create({
      recipient: req.user._id,
      title: 'Order Placed',
      message: `Your order for spare parts (Total: ₹${totalAmount}) has been confirmed.`,
      type: 'order',
      link: '/user/orders'
    });

    // Notify all admins
    const admins = await User.find({ role: 'admin' });
    if (admins.length > 0) {
      const adminNotifications = admins.map(admin => ({
        recipient: admin._id,
        title: 'Spare Parts Order',
        message: `${req.user.name} has placed an order worth ₹${totalAmount}.`,
        type: 'order',
        link: '/admin/parts'
      }));
      await Notification.insertMany(adminNotifications);
    }

    res.status(201).json({ success: true, order });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/parts/:id — admin delete
router.delete('/:id', protect, authorize('admin'), async (req, res, next) => {
  try {
    const part = await SparePart.findByIdAndDelete(req.params.id);
    if (!part) return res.status(404).json({ success: false, message: 'Part not found' });
    res.json({ success: true, message: 'Part deleted' });
  } catch (err) {
    next(err);
  }
});

// GET /api/parts/admin/orders — admin: all orders
router.get('/admin/orders', protect, authorize('admin'), async (req, res, next) => {
  try {
    const orders = await Order.find()
      .populate('user', 'name email')
      .populate('items.part', 'name partNumber price')
      .sort({ createdAt: -1 });
    res.json({ success: true, orders });
  } catch (err) {
    next(err);
  }
});

// PUT /api/parts/orders/:id/status — admin: update order status
router.put('/orders/:id/status', protect, authorize('admin'), async (req, res, next) => {
  try {
    const { status } = req.body;
    const order = await Order.findByIdAndUpdate(req.params.id, { status }, { returnDocument: 'after' })
      .populate('user', 'name email')
      .populate('items.part', 'name partNumber price');
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    
    const Notification = require('../models/Notification');
    await Notification.create({
      recipient: order.user._id,
      title: 'Order Update',
      message: `Your spare parts order is now: ${status}.`,
      type: 'order',
      link: '/user/orders'
    });
    res.json({ success: true, order });
  } catch (err) {
    next(err);
  }
});

// GET /api/parts/orders/mine — user's orders
router.get('/orders/mine', protect, async (req, res, next) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .populate('items.part', 'name partNumber price')
      .sort({ createdAt: -1 });
    res.json({ success: true, orders });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

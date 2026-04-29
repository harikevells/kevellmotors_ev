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
router.post('/', protect, authorize('admin'), upload.single('image'), async (req, res, next) => {
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
    
    // Only set image if file was uploaded
    if (req.file) {
      data.image = `/uploads/${req.file.filename}`;
    }
    
    const part = await SparePart.create(data);
    res.status(201).json({ success: true, part });
  } catch (err) {
    next(err);
  }
});

// PUT /api/parts/:id — admin update
router.put('/:id', protect, authorize('admin'), upload.single('image'), async (req, res, next) => {
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
    
    // Handle image: only set if new file or remove flag
    if (req.file) {
      data.image = `/uploads/${req.file.filename}`;
    } else if (req.body.removeImage === 'true') {
      data.image = null;
    }
    // If neither, the image field is not included in update (keeps existing)
    
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
    const { items, shippingAddress } = req.body;

    let totalAmount = 0;
    for (const item of items) {
      const part = await SparePart.findById(item.partId);
      if (!part || !part.isAvailable || part.stock < item.quantity) {
        return res.status(400).json({ success: false, message: `Part ${item.partId} not available` });
      }
      totalAmount += part.price * item.quantity;
    }

    const order = await Order.create({
      user: req.user._id,
      items: await Promise.all(
        items.map(async (item) => {
          const part = await SparePart.findById(item.partId);
          return { part: item.partId, quantity: item.quantity, price: part.price };
        })
      ),
      totalAmount,
      shippingAddress,
    });

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

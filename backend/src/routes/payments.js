const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const Razorpay = require('razorpay');
const Payment = require('../models/Payment');
const Service = require('../models/Service');
const Subscription = require('../models/Subscription');
const { protect, authorize } = require('../middleware/auth');

const toInvoiceTxn = (serviceDoc) => {
  const service = serviceDoc.toObject ? serviceDoc.toObject() : serviceDoc;
  const amount =
    service.finalAmount ||
    (Array.isArray(service.invoiceItems)
      ? service.invoiceItems.reduce((sum, item) => sum + Number(item.amount || 0), 0)
      : 0);

  return {
    _id: `invoice-${service._id}`,
    user: service.owner,
    orderId: service.invoiceNumber || `INV-${String(service._id).slice(-8).toUpperCase()}`,
    razorpayPaymentId: null,
    razorpayOrderId: null,
    amount,
    currency: 'INR',
    status: 'success',
    paymentFor: 'service_invoice',
    referenceId: service._id,
    invoiceNumber: service.invoiceNumber,
    invoiceDate: service.invoiceDate,
    notes: service.technicianNotes,
    source: 'invoice',
    createdAt: service.invoiceDate || service.completedDate || service.updatedAt || service.createdAt,
  };
};

const getRazorpay = () => {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    throw new Error('Razorpay credentials not configured');
  }
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
};

// POST /api/payments/create-order
router.post('/create-order', protect, async (req, res, next) => {
  try {
    const { amount, currency = 'INR', paymentFor, referenceId } = req.body;
    const razorpay = getRazorpay();

    const order = await razorpay.orders.create({
      amount: Math.round(amount * 100),
      currency,
      receipt: `rcpt_${Date.now()}`,
    });

    const payment = await Payment.create({
      user: req.user._id,
      orderId: order.id,
      razorpayOrderId: order.id,
      amount,
      currency,
      paymentFor,
      referenceId,
    });

    res.json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      paymentId: payment._id,
      key: process.env.RAZORPAY_KEY_ID,
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/payments/verify
router.post('/verify', protect, async (req, res, next) => {
  try {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature, paymentDbId } = req.body;

    const body = `${razorpayOrderId}|${razorpayPaymentId}`;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    if (expectedSignature !== razorpaySignature) {
      await Payment.findByIdAndUpdate(paymentDbId, { status: 'failed' });
      return res.status(400).json({ success: false, message: 'Invalid payment signature' });
    }

    const payment = await Payment.findByIdAndUpdate(
      paymentDbId,
      { razorpayPaymentId, razorpaySignature, status: 'success' },
      { new: true }
    );

    // Activate subscription if applicable
    if (payment.paymentFor === 'subscription') {
      await Subscription.findByIdAndUpdate(payment.referenceId, { status: 'active', paymentId: payment._id });
    }

    res.json({ success: true, payment });
  } catch (err) {
    next(err);
  }
});

// GET /api/payments — user's payment history
router.get('/', protect, async (req, res, next) => {
  try {
    const [payments, invoicedServices] = await Promise.all([
      Payment.find({ user: req.user._id }).sort({ createdAt: -1 }),
      Service.find({ owner: req.user._id, status: 'delivered', finalAmount: { $gt: 0 } })
        .select('owner finalAmount invoiceItems invoiceNumber invoiceDate completedDate createdAt updatedAt technicianNotes')
        .sort({ invoiceDate: -1, completedDate: -1, createdAt: -1 }),
    ]);

    const merged = [
      ...payments.map((p) => ({ ...(p.toObject ? p.toObject() : p), source: 'payment' })),
      ...invoicedServices.map(toInvoiceTxn),
    ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json({ success: true, payments: merged });
  } catch (err) {
    next(err);
  }
});

// GET /api/payments/all — admin: all payments
router.get('/all', protect, authorize('admin'), async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 20;

    const filter = {};
    if (status) filter.status = status;

    const [paymentRows, invoiceRows] = await Promise.all([
      Payment.find(filter).populate('user', 'name email phone').sort({ createdAt: -1 }),
      status && status !== 'success'
        ? Promise.resolve([])
        : Service.find({ status: 'delivered', finalAmount: { $gt: 0 } })
            .populate('owner', 'name email phone')
            .select('owner finalAmount invoiceItems invoiceNumber invoiceDate completedDate createdAt updatedAt technicianNotes serviceType')
            .sort({ invoiceDate: -1, completedDate: -1, createdAt: -1 }),
    ]);

    const merged = [
      ...paymentRows.map((p) => ({ ...(p.toObject ? p.toObject() : p), source: 'payment' })),
      ...invoiceRows.map(toInvoiceTxn),
    ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const total = merged.length;
    const payments = merged.slice((pageNum - 1) * limitNum, pageNum * limitNum);

    res.json({ success: true, payments, total, page: pageNum });
  } catch (err) {
    next(err);
  }
});

// POST /api/payments/:id/refund — admin refund
router.post('/:id/refund', protect, authorize('admin'), async (req, res, next) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment || payment.status !== 'success') {
      return res.status(400).json({ success: false, message: 'Payment not eligible for refund' });
    }

    const razorpay = getRazorpay();
    const refund = await razorpay.payments.refund(payment.razorpayPaymentId, {
      amount: Math.round((req.body.amount || payment.amount) * 100),
    });

    await Payment.findByIdAndUpdate(req.params.id, {
      status: 'refunded',
      refundId: refund.id,
      refundAmount: refund.amount / 100,
      refundedAt: new Date(),
    });

    res.json({ success: true, refund });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

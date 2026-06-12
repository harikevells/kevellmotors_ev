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

const isRazorpayConfigured = () => {
  const key = process.env.RAZORPAY_KEY_ID;
  const secret = process.env.RAZORPAY_KEY_SECRET;
  return key && secret && key !== 'your_razorpay_key_id' && secret !== 'your_razorpay_key_secret';
};

const getRazorpay = () => {
  if (!isRazorpayConfigured()) {
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

    // Mock mode when Razorpay is not configured
    if (!isRazorpayConfigured()) {
      const mockOrderId = 'mock_order_' + Date.now();
      const payment = await Payment.create({
        user: req.user._id,
        orderId: mockOrderId,
        razorpayOrderId: mockOrderId,
        amount,
        currency,
        paymentFor,
        referenceId,
      });
      return res.json({
        success: true,
        orderId: mockOrderId,
        amount: Math.round(amount * 100),
        currency,
        paymentId: payment._id,
        key: 'mock',
      });
    }

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

    if (expectedSignature !== razorpaySignature && razorpaySignature !== 'mock') {
      await Payment.findByIdAndUpdate(paymentDbId, { status: 'failed' });
      return res.status(400).json({ success: false, message: 'Invalid payment signature' });
    }

    const payment = await Payment.findByIdAndUpdate(
      paymentDbId,
      { razorpayPaymentId, razorpaySignature, status: 'success' },
      { new: true }
    );

    // Link payment to subscription but DO NOT activate (Admin must approve)
    if (payment.paymentFor === 'subscription') {
      await Subscription.findByIdAndUpdate(payment.referenceId, { paymentId: payment._id });
    }

    const Notification = require('../models/Notification');
    await Notification.create({
      recipient: payment.user,
      title: 'Payment Successful',
      message: `Your payment of ₹${payment.amount} has been successfully processed.`,
      type: 'payment',
      link: '/user/payments'
    });

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

// GET /api/payments/invoice/:serviceId
router.get('/invoice/:serviceId', async (req, res, next) => {
  try {
    const service = await Service.findById(req.params.serviceId)
      .populate('owner', 'name phone email')
      .populate('vehicle', 'registrationNumber make model')
      .populate('franchise', 'name address phone email')
      .lean();

    if (!service) return res.status(404).send('Invoice not found');

    const SubscriptionPlan = require('../models/SubscriptionPlan');
    let activeSub = null;
    if (service.appliedSubscription) {
      activeSub = await Subscription.findById(service.appliedSubscription).lean();
    } else if (service.owner && service.vehicle) {
      activeSub = await Subscription.findOne({ user: service.owner._id, vehicle: service.vehicle._id, status: 'active' }).lean();
    }
    let planDetail = null;
    if (activeSub) planDetail = await SubscriptionPlan.findOne({ key: activeSub.plan }).lean();

    const svcDiscount = planDetail?.serviceDiscount || 0;
    const partDiscount = planDetail?.sparePartsDiscount || 0;

    const items = service.invoiceItems || [];
    const total = service.finalAmount || items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

    let grossService = 0;
    let grossParts = 0;
    let totalDiscount = 0;
    let discountService = 0;
    let discountParts = 0;

    const displayItems = items.map(item => {
      let amt = Number(item.amount) || 0;
      let orig = amt;
      let desc = item.description;
      const match = item.description.match(/(.*?)\s*\(-(\d+)%\)$/);
      if (match) {
        desc = match[1];
        const pct = Number(match[2]);
        orig = Math.round(amt / (1 - pct / 100));
        const discAmt = orig - amt;
        totalDiscount += discAmt;
        if (item.type === 'service') discountService += discAmt;
        else discountParts += discAmt;
      }
      if (item.type === 'service') grossService += orig;
      else grossParts += orig;
      return { ...item, cleanDescription: desc, originalAmount: orig, isDiscounted: !!match };
    });

    const escapeHtml = (val) => String(val || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    const formatAmount = (val) => `₹${Number(val || 0).toLocaleString('en-IN')}`;

    const rows = displayItems.length ? displayItems.map((item, index) => {
      const priceCalc = item.isDiscounted 
        ? `Base: ${formatAmount(item.originalAmount)}<br><span style="color:#ef4444;">Subscription: -${formatAmount(item.originalAmount - item.amount)}</span>` 
        : `Actual: ${formatAmount(item.amount)}`;
      
      return `
      <tr>
        <td class="center">${index + 1}</td>
        <td>${escapeHtml(item.cleanDescription)}</td>
        <td>${escapeHtml((item.type || 'item').toUpperCase())}</td>
        <td>${priceCalc}</td>
        <td class="right">${formatAmount(item.amount)}</td>
      </tr>
      `;
    }).join('') : `<tr><td colspan="5" class="center">No items</td></tr>`;

    const fs = require('fs');
    const path = require('path');
    let logoHtml = `<div class="logo-icon">K</div>`;
    try {
      const logoPath = path.join(__dirname, '../../../frontend/public/logo.png');
      if (fs.existsSync(logoPath)) {
        const logoBuffer = fs.readFileSync(logoPath);
        const base64Logo = logoBuffer.toString('base64');
        logoHtml = `<img src="data:image/png;base64,${base64Logo}" alt="Kevell Motors Logo" style="width: 50px; height: 50px; object-fit: contain; flex-shrink: 0;" />`;
      }
    } catch (err) {
      console.error('Error loading logo:', err);
    }

    const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8" />
      <title>Invoice #${escapeHtml(service.invoiceNumber || 'Pending')}</title>
      <style>
        @page { margin: 0; size: A4; }
        body { 
          font-family: Arial, sans-serif; 
          padding: 50px; 
          font-size: 11px; 
          color: #333; 
          background: white;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; }
        .logo-container { display: flex; align-items: center; }
        .logo-icon { width: 40px; height: 40px; background: #00e5ff; display:flex; align-items:center; justify-content:center; color:white; font-weight:bold; font-size: 20px; border-radius: 4px; }
        .logo-divider { border-left: 2px solid #ef4444; margin: 0 12px; height: 36px; }
        .logo-text h1 { font-size: 18px; font-weight: bold; color: #1e293b; margin: 0; letter-spacing: 1px; }
        .logo-text p { font-size: 10px; color: #64748b; margin: 0; }
        .header-right { text-align: right; line-height: 1.4; color: #475569; }
        .company-name { font-size: 14px; font-weight: bold; color: #1e293b; margin-bottom: 2px; }

        .divider { height: 1px; background: #e2e8f0; margin: 20px 0; }

        .invoice-header { display: flex; justify-content: space-between; margin-bottom: 30px; }
        .invoice-title { font-size: 14px; font-weight: bold; color: #2b3b55; margin-bottom: 12px; text-transform: uppercase; }
        .invoice-details { line-height: 1.6; color: #333; }

        .address-section { display: flex; justify-content: space-between; margin-bottom: 30px; }
        .address-block { width: 45%; line-height: 1.6; color: #333; }
        .address-title { font-size: 11px; font-weight: bold; color: #1e293b; margin-bottom: 8px; text-transform: uppercase; }

        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 10px; }
        th { background: #2b3b55; color: white; text-align: left; padding: 10px; font-weight: bold; text-transform: uppercase; border: 1px solid #2b3b55; }
        td { padding: 12px 10px; border: 1px solid #e2e8f0; vertical-align: top; }
        th.center, td.center { text-align: center; }
        th.right, td.right { text-align: right; }

        .totals-table { width: 40%; margin-left: auto; font-size: 11px; border-collapse: collapse; }
        .totals-table td { padding: 6px 10px; border: none; }
        .totals-table tr.offer td { color: #ef4444; }
        .totals-table tr.grand-total td { font-weight: bold; font-size: 12px; border-top: 1px solid #333; padding-top: 10px; }

        .footer { margin-top: 60px; display: flex; justify-content: space-between; font-size: 10px; color: #64748b; line-height: 1.5; }
        .footer-title { font-weight: bold; color: #333; margin-bottom: 5px; text-transform: uppercase; }
        .signatory { text-align: right; font-weight: bold; color: #333; display: flex; flex-direction: column; justify-content: flex-end; }
        .signatory span { font-weight: normal; color: #64748b; display: block; margin-top: 4px; }
      </style>
    </head>
    <body onload="setTimeout(() => window.print(), 500)">
      <div class="header">
        <div class="logo-container">
          ${logoHtml}
          <div class="logo-divider"></div>
          <div class="logo-text">
            <h1>KEVELL MOTORS</h1>
            <p>EV Service Excellence</p>
          </div>
        </div>
        <div class="header-right">
          <div class="company-name">${escapeHtml(service.franchise?.name || 'Kevell Motors Franchise')}</div>
          ${escapeHtml(service.franchise?.address?.street || '123 Main Street')}<br>
          ${escapeHtml(service.franchise?.address?.city || 'Chennai')}, ${escapeHtml(service.franchise?.address?.state || 'Tamil Nadu')} - ${escapeHtml(service.franchise?.address?.pincode || '600001')}<br>
          Email: ${escapeHtml(service.franchise?.email || 'contact@kevellmotors.com')}<br>
          Phone: ${escapeHtml(service.franchise?.phone || '1234567890')}
        </div>
      </div>

      <div class="divider"></div>

      <div class="invoice-header">
        <div class="invoice-details">
          <div class="invoice-title">TAX INVOICE</div>
          <div>Invoice No: ${escapeHtml(service.invoiceNumber || 'Pending')}</div>
          <div>Date: ${service.invoiceDate ? new Date(service.invoiceDate).toLocaleDateString('en-IN') : 'Date pending'}</div>
        </div>
        <div class="invoice-details" style="text-align: right; padding-top: 26px;">
          <div>Payment: Online</div>
          <div>Status: ${escapeHtml((service.status || '').toUpperCase())}</div>
        </div>
      </div>

      <div class="address-section">
        <div class="address-block">
          <div class="address-title">BILL TO:</div>
          <div>Name: ${escapeHtml(service.owner?.name || 'Customer')}</div>
          <div>Phone: ${escapeHtml(service.owner?.phone || '')}</div>
          <div>Email: ${escapeHtml(service.owner?.email || '')}</div>
          <div>Vehicle: ${escapeHtml(service.vehicle?.registrationNumber || '')} (${escapeHtml(service.vehicle?.make || '')} ${escapeHtml(service.vehicle?.model || '')})</div>
        </div>
        <div class="address-block">
          <div class="address-title">SERVICE STATUS:</div>
          <div>Status: ${escapeHtml((service.status || '').toUpperCase())}</div>
          <div>Completed: ${service.completedDate ? new Date(service.completedDate).toLocaleDateString('en-IN') : 'N/A'}</div>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th class="center" style="width: 5%">#</th>
            <th style="width: 40%">SERVICE & DESCRIPTION</th>
            <th style="width: 15%">TYPE</th>
            <th style="width: 25%">PRICE CALCULATION</th>
            <th class="right" style="width: 15%">TOTAL</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>

      <table class="totals-table">
        <tr>
          <td>Subtotal:</td>
          <td class="right">${formatAmount(grossService + grossParts)}</td>
        </tr>
        ${totalDiscount > 0 ? `
        <tr class="offer">
          <td>Subscription Discount:</td>
          <td class="right">-${formatAmount(totalDiscount)}</td>
        </tr>
        ` : ''}
        <tr class="grand-total">
          <td>GRAND TOTAL:</td>
          <td class="right">${formatAmount(total)}</td>
        </tr>
      </table>

      <div class="footer">
        <div>
          <div class="footer-title">TERMS & CONDITIONS:</div>
          <div>1. This is a computer generated invoice and does not require a signature.</div>
          <div>2. Please check your vehicle before leaving the service center.</div>
          <div>3. Warranties are applicable only for replaced parts within the specified period.</div>
        </div>
        <div class="signatory">
          <div>${escapeHtml(service.franchise?.name || 'Kevell Motors')}</div>
          <span>Authorized Signatory</span>
        </div>
      </div>
    </body>
    </html>
    `;

    res.send(html);
  } catch (err) {
    next(err);
  }
});

module.exports = router;

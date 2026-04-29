require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Vehicle = require('./models/Vehicle');
const Franchise = require('./models/Franchise');
const Service = require('./models/Service');
const Subscription = require('./models/Subscription');
const Payment = require('./models/Payment');
const { SparePart, Order } = require('./models/SparePart');
const { Feedback, Review } = require('./models/Feedback');
const Reminder = require('./models/Reminder');
const FeedPost = require('./models/FeedPost');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/evserv';

async function seed() {
  await mongoose.connect(MONGODB_URI);
  console.log('✅ Connected to MongoDB:', MONGODB_URI);

  // Clear all collections
  await Promise.all([
    User.deleteMany({}),
    Vehicle.deleteMany({}),
    Franchise.deleteMany({}),
    Service.deleteMany({}),
    Subscription.deleteMany({}),
    Payment.deleteMany({}),
    SparePart.deleteMany({}),
    Order.deleteMany({}),
    Feedback.deleteMany({}),
    Review.deleteMany({}),
    Reminder.deleteMany({}),
    FeedPost.deleteMany({}),
  ]);
  console.log('🗑️  Cleared existing data');

  // ─────────────────────────────────────────────
  // USERS  (plain-text passwords – pre-save hook hashes them)
  // ─────────────────────────────────────────────
  const [adminUser, franchiseUser1, franchiseUser2, user1, user2, user3] = await Promise.all([
    new User({ name: 'Admin EVserv', email: 'admin@evserv.com', phone: '9000000001', password: 'Admin@123', role: 'admin', referralCode: 'ADMIN001', address: { street: '1 Corporate Park', city: 'Bengaluru', state: 'Karnataka', pincode: '560001' } }).save(),
    new User({ name: 'Ravi Kumar', email: 'franchise1@evserv.com', phone: '9000000002', password: 'Franchise@123', role: 'franchise', referralCode: 'FRAN001', address: { street: '45 Koramangala', city: 'Bengaluru', state: 'Karnataka', pincode: '560034' } }).save(),
    new User({ name: 'Priya Mehta', email: 'franchise2@evserv.com', phone: '9000000003', password: 'Franchise@123', role: 'franchise', referralCode: 'FRAN002', address: { street: '12 Andheri West', city: 'Mumbai', state: 'Maharashtra', pincode: '400053' } }).save(),
    new User({ name: 'Arjun Sharma', email: 'user1@evserv.com', phone: '9000000004', password: 'User@123', role: 'user', referralCode: 'USER001', referralCount: 2, address: { street: '78 HSR Layout', city: 'Bengaluru', state: 'Karnataka', pincode: '560102' } }).save(),
    new User({ name: 'Sneha Patel', email: 'user2@evserv.com', phone: '9000000005', password: 'User@123', role: 'user', referralCode: 'USER002', address: { street: '23 Bandra East', city: 'Mumbai', state: 'Maharashtra', pincode: '400051' } }).save(),
    new User({ name: 'Kiran Reddy', email: 'user3@evserv.com', phone: '9000000006', password: 'User@123', role: 'user', referralCode: 'USER003', address: { street: '5 Jubilee Hills', city: 'Hyderabad', state: 'Telangana', pincode: '500033' } }).save(),
  ]);

  // Link referral
  await User.findByIdAndUpdate(user2._id, { referredBy: user1._id });

  console.log('👤 Created 6 users');

  // ─────────────────────────────────────────────
  // FRANCHISES
  // ─────────────────────────────────────────────
  const [franchise1, franchise2] = await Franchise.create([
    {
      name: 'EV Service Hub - Koramangala',
      owner: franchiseUser1._id,
      email: 'hub.koramangala@evserv.com',
      phone: '8000000001',
      address: { street: '45 Koramangala 5th Block', city: 'Bengaluru', state: 'Karnataka', pincode: '560034' },
      location: { type: 'Point', coordinates: [77.6245, 12.9352] },
      licenseNumber: 'KA-EV-2024-001',
      gstNumber: '29AABCU9603R1ZX',
      status: 'active',
      capacity: 15,
      technicianCount: 6,
      servicesOffered: ['general', 'battery', 'motor', 'software', 'amc'],
      workingHours: { open: '08:00', close: '20:00' },
      rating: 4.5,
      reviewCount: 12,
    },
    {
      name: 'Green Wheels Service - Andheri',
      owner: franchiseUser2._id,
      email: 'greenwheel.andheri@evserv.com',
      phone: '8000000002',
      address: { street: '12 Andheri West Link Road', city: 'Mumbai', state: 'Maharashtra', pincode: '400053' },
      location: { type: 'Point', coordinates: [72.8347, 19.1136] },
      licenseNumber: 'MH-EV-2024-002',
      gstNumber: '27AABCU9603R1ZP',
      status: 'active',
      capacity: 10,
      technicianCount: 4,
      servicesOffered: ['general', 'battery', 'charger', 'accident'],
      workingHours: { open: '09:00', close: '19:00' },
      rating: 4.2,
      reviewCount: 8,
    },
  ]);
  console.log('🏪 Created 2 franchises');

  // ─────────────────────────────────────────────
  // VEHICLES
  // ─────────────────────────────────────────────
  const [vehicle1, vehicle2, vehicle3, vehicle4] = await Vehicle.create([
    {
      owner: user1._id,
      registrationNumber: 'KA05MN1234',
      make: 'Ola Electric',
      model: 'S1 Pro',
      year: 2023,
      vehicleType: '2-wheeler',
      batteryCapacity: '3.97 kWh',
      color: 'Jet Black',
      vinNumber: 'OLA2023S1P00001',
      insuranceExpiry: new Date('2026-06-30'),
      warrantyExpiry: new Date('2026-03-15'),
      isActive: true,
    },
    {
      owner: user1._id,
      registrationNumber: 'KA01AB5678',
      make: 'Tata Motors',
      model: 'Nexon EV',
      year: 2022,
      vehicleType: '4-wheeler',
      batteryCapacity: '30.2 kWh',
      color: 'Pristine White',
      vinNumber: 'TATANXEV20220002',
      insuranceExpiry: new Date('2025-12-31'),
      warrantyExpiry: new Date('2027-01-10'),
      isActive: true,
    },
    {
      owner: user2._id,
      registrationNumber: 'MH02CD9999',
      make: 'Ather Energy',
      model: '450X',
      year: 2024,
      vehicleType: '2-wheeler',
      batteryCapacity: '3.7 kWh',
      color: 'Space Grey',
      vinNumber: 'ATH2024450X0003',
      insuranceExpiry: new Date('2026-09-01'),
      warrantyExpiry: new Date('2027-09-01'),
      isActive: true,
    },
    {
      owner: user3._id,
      registrationNumber: 'TS09EF2222',
      make: 'Mahindra',
      model: 'XUV400',
      year: 2023,
      vehicleType: '4-wheeler',
      batteryCapacity: '39.4 kWh',
      color: 'Everest White',
      vinNumber: 'MHIXUV4002023004',
      insuranceExpiry: new Date('2026-04-20'),
      warrantyExpiry: new Date('2028-04-20'),
      isActive: true,
    },
  ]);
  console.log('🚗 Created 4 vehicles');

  // ─────────────────────────────────────────────
  // SPARE PARTS
  // ─────────────────────────────────────────────
  const [part1, part2, part3, part4, part5, part6] = await SparePart.create([
    {
      name: 'Lithium-Ion Battery Cell 72V',
      partNumber: 'BAT-72V-001',
      category: 'battery',
      description: '72V lithium-ion battery cell compatible with most 2-wheeler EVs',
      price: 12500,
      stock: 20,
      compatibleModels: ['Ola S1 Pro', 'Ather 450X', 'Hero Electric Optima'],
      brand: 'Amara Raja',
      warranty: '12 months',
      isAvailable: true,
    },
    {
      name: 'BLDC Hub Motor 1500W',
      partNumber: 'MOT-1500W-002',
      category: 'motor',
      description: 'Brushless DC hub motor 1500W for 2-wheeler EVs',
      price: 8900,
      stock: 10,
      compatibleModels: ['Ola S1 Pro', 'TVS iQube', 'Bajaj Chetak'],
      brand: 'Bosch',
      warranty: '24 months',
      isAvailable: true,
    },
    {
      name: 'EV Motor Controller 72V 40A',
      partNumber: 'CTL-72V40A-003',
      category: 'controller',
      description: '72V 40A motor controller with regenerative braking support',
      price: 4500,
      stock: 15,
      compatibleModels: ['Ola S1 Pro', 'Ather 450X'],
      brand: 'Sevcon',
      warranty: '12 months',
      isAvailable: true,
    },
    {
      name: 'Smart EV Home Charger 7.2kW',
      partNumber: 'CHR-7K2-004',
      category: 'charger',
      description: '7.2 kW AC home charger with Type 2 connector',
      price: 18000,
      stock: 8,
      compatibleModels: ['Tata Nexon EV', 'Mahindra XUV400', 'MG ZS EV'],
      brand: 'Delta Electronics',
      warranty: '24 months',
      isAvailable: true,
    },
    {
      name: 'EV Front Fender Panel',
      partNumber: 'BDY-FFP-005',
      category: 'body',
      description: 'OEM front fender replacement panel',
      price: 2200,
      stock: 25,
      compatibleModels: ['Ather 450X'],
      brand: 'Ather Energy',
      warranty: '6 months',
      isAvailable: true,
    },
    {
      name: 'Throttle Sensor Assembly',
      partNumber: 'ELC-TSA-006',
      category: 'electrical',
      description: 'Hall-effect throttle sensor assembly with wiring harness',
      price: 1200,
      stock: 30,
      compatibleModels: ['Ola S1 Pro', 'Ather 450X', 'TVS iQube', 'Bajaj Chetak'],
      brand: 'Sensata',
      warranty: '6 months',
      isAvailable: true,
    },
  ]);
  console.log('🔧 Created 6 spare parts');

  // ─────────────────────────────────────────────
  // PAYMENTS
  // ─────────────────────────────────────────────
  const [payment1, payment2, payment3, payment4] = await Payment.create([
    {
      user: user1._id,
      orderId: 'order_seed_001',
      razorpayPaymentId: 'pay_seed_001',
      razorpayOrderId: 'order_rzp_001',
      razorpaySignature: 'sig_seed_001',
      amount: 2500,
      currency: 'INR',
      status: 'success',
      paymentFor: 'service',
      notes: 'General service payment',
    },
    {
      user: user1._id,
      orderId: 'order_seed_002',
      razorpayPaymentId: 'pay_seed_002',
      razorpayOrderId: 'order_rzp_002',
      razorpaySignature: 'sig_seed_002',
      amount: 4999,
      currency: 'INR',
      status: 'success',
      paymentFor: 'subscription',
      notes: 'Monthly plan subscription',
    },
    {
      user: user2._id,
      orderId: 'order_seed_003',
      razorpayPaymentId: 'pay_seed_003',
      razorpayOrderId: 'order_rzp_003',
      razorpaySignature: 'sig_seed_003',
      amount: 18000,
      currency: 'INR',
      status: 'success',
      paymentFor: 'amc',
      notes: 'AMC 1-year plan',
    },
    {
      user: user3._id,
      orderId: 'order_seed_004',
      amount: 9500,
      currency: 'INR',
      status: 'pending',
      paymentFor: 'spare_parts',
      notes: 'Spare parts order pending payment',
    },
  ]);
  console.log('💳 Created 4 payments');

  // ─────────────────────────────────────────────
  // SERVICES
  // ─────────────────────────────────────────────
  const [service1, service2, service3] = await Service.create([
    {
      vehicle: vehicle1._id,
      owner: user1._id,
      franchise: franchise1._id,
      serviceType: 'general',
      status: 'delivered',
      description: 'Routine general service - oil check, brakes, tyre inspection',
      scheduledDate: new Date('2025-02-10'),
      completedDate: new Date('2025-02-10'),
      estimatedAmount: 2500,
      finalAmount: 2400,
      technicianNotes: 'All checks passed. Front brake pads adjusted.',
      progressUpdates: [
        { status: 'onboarded', note: 'Vehicle received', updatedBy: franchiseUser1._id },
        { status: 'diagnosis', note: 'Diagnosis complete - minor adjustments needed', updatedBy: franchiseUser1._id },
        { status: 'in_progress', note: 'Service in progress', updatedBy: franchiseUser1._id },
        { status: 'quality_check', note: 'Quality check done', updatedBy: franchiseUser1._id },
        { status: 'delivered', note: 'Vehicle delivered to owner', updatedBy: franchiseUser1._id },
      ],
      deliverables: [
        { item: 'Brake inspection', delivered: true },
        { item: 'Tyre pressure check', delivered: true },
        { item: 'Battery health check', delivered: true },
      ],
    },
    {
      vehicle: vehicle2._id,
      owner: user1._id,
      franchise: franchise1._id,
      serviceType: 'battery',
      status: 'in_progress',
      description: 'Battery degradation check and calibration',
      scheduledDate: new Date('2026-03-12'),
      estimatedAmount: 3500,
      technicianNotes: 'Battery at 88% SOH. Calibration underway.',
      progressUpdates: [
        { status: 'onboarded', note: 'Vehicle onboarded', updatedBy: franchiseUser1._id },
        { status: 'diagnosis', note: 'Battery SOH check initiated', updatedBy: franchiseUser1._id },
        { status: 'in_progress', note: 'Battery calibration in progress', updatedBy: franchiseUser1._id },
      ],
      spareParts: [
        { part: part1._id, quantity: 1, price: 12500 },
      ],
      deliverables: [
        { item: 'Battery calibration', delivered: false },
        { item: 'Diagnostic report', delivered: false },
      ],
    },
    {
      vehicle: vehicle3._id,
      owner: user2._id,
      franchise: franchise2._id,
      serviceType: 'software',
      status: 'quality_check',
      description: 'Firmware update and performance tuning',
      scheduledDate: new Date('2026-03-08'),
      estimatedAmount: 1200,
      technicianNotes: 'Firmware updated to v3.2.1. Range improved by ~5%.',
      progressUpdates: [
        { status: 'onboarded', note: 'Vehicle received', updatedBy: franchiseUser2._id },
        { status: 'in_progress', note: 'Firmware update running', updatedBy: franchiseUser2._id },
        { status: 'quality_check', note: 'Post-update checks in progress', updatedBy: franchiseUser2._id },
      ],
      deliverables: [
        { item: 'Firmware v3.2.1 installed', delivered: true },
        { item: 'Performance report', delivered: false },
      ],
    },
  ]);
  console.log('🔨 Created 3 services');

  // ─────────────────────────────────────────────
  // SUBSCRIPTIONS
  // ─────────────────────────────────────────────
  await Subscription.create([
    {
      user: user1._id,
      vehicle: vehicle1._id,
      plan: 'monthly',
      status: 'active',
      startDate: new Date('2026-02-01'),
      endDate: new Date('2026-03-01'),
      amount: 4999,
      features: ['1 General Service', 'Priority Support', 'Free Pickup & Drop'],
      servicesIncluded: 1,
      servicesUsed: 0,
      autoRenew: true,
      paymentId: payment2._id,
    },
    {
      user: user2._id,
      vehicle: vehicle3._id,
      plan: 'amc_1yr',
      status: 'active',
      startDate: new Date('2025-11-01'),
      endDate: new Date('2026-11-01'),
      amount: 18000,
      features: ['4 General Services', '2 Battery Checks', 'Priority Support', 'Free Pickup & Drop', 'Software Updates'],
      servicesIncluded: 4,
      servicesUsed: 1,
      autoRenew: false,
      paymentId: payment3._id,
    },
    {
      user: user3._id,
      vehicle: vehicle4._id,
      plan: 'quarterly',
      status: 'pending',
      amount: 12999,
      features: ['2 General Services', 'Battery Health Report', 'Priority Support'],
      servicesIncluded: 2,
      servicesUsed: 0,
      autoRenew: false,
    },
  ]);
  console.log('📋 Created 3 subscriptions');

  // ─────────────────────────────────────────────
  // FEEDBACK
  // ─────────────────────────────────────────────
  await Feedback.create([
    {
      user: user1._id,
      service: service1._id,
      rating: 5,
      comment: 'Excellent service! The technician was very professional and the bike runs perfectly now.',
      category: 'service',
      isPublic: true,
      adminResponse: 'Thank you for your kind words, Arjun! We look forward to serving you again.',
      respondedAt: new Date('2025-02-11'),
    },
    {
      user: user2._id,
      rating: 4,
      comment: 'The app is very easy to use. Booking a service took less than 2 minutes.',
      category: 'app',
      isPublic: true,
    },
    {
      user: user3._id,
      rating: 3,
      comment: 'Service was decent but the wait time was a bit long.',
      category: 'staff',
      isPublic: true,
    },
  ]);

  await Review.create([
    {
      user: user1._id,
      franchise: franchise1._id,
      rating: 5,
      title: 'Best EV Service Centre in Bangalore!',
      comment: 'Very knowledgeable staff and quick turnaround. Highly recommended.',
      helpful: 7,
      isVerified: true,
    },
    {
      user: user2._id,
      franchise: franchise2._id,
      rating: 4,
      title: 'Good service, decent location',
      comment: 'Friendly staff and transparent billing. Parking can be an issue during peak hours.',
      helpful: 3,
      isVerified: true,
    },
  ]);
  console.log('⭐ Created 3 feedbacks and 2 reviews');

  // ─────────────────────────────────────────────
  // REMINDERS
  // ─────────────────────────────────────────────
  await Reminder.create([
    {
      user: user1._id,
      vehicle: vehicle1._id,
      type: 'service_due',
      dueDate: new Date('2026-04-10'),
      message: 'Your Ola S1 Pro is due for a general service check.',
      isSent: false,
      isAcknowledged: false,
    },
    {
      user: user1._id,
      vehicle: vehicle2._id,
      type: 'insurance_expiry',
      dueDate: new Date('2025-12-31'),
      message: 'Insurance for your Tata Nexon EV expires on 31 Dec 2025.',
      isSent: true,
      sentAt: new Date('2025-12-01'),
      isAcknowledged: true,
      acknowledgedAt: new Date('2025-12-02'),
    },
    {
      user: user2._id,
      vehicle: vehicle3._id,
      type: 'battery_check',
      dueDate: new Date('2026-05-01'),
      message: 'Schedule a battery health check for your Ather 450X.',
      isSent: false,
      isAcknowledged: false,
    },
    {
      user: user3._id,
      vehicle: vehicle4._id,
      type: 'warranty_expiry',
      dueDate: new Date('2028-04-20'),
      message: 'Warranty on your Mahindra XUV400 expires in Apr 2028.',
      isSent: false,
      isAcknowledged: false,
    },
    {
      user: user1._id,
      vehicle: vehicle1._id,
      type: 'subscription_renewal',
      dueDate: new Date('2026-03-01'),
      message: 'Your monthly subscription renews on 1 March 2026.',
      isSent: true,
      sentAt: new Date('2026-02-22'),
      isAcknowledged: false,
    },
  ]);
  console.log('🔔 Created 5 reminders');

  // ─────────────────────────────────────────────
  // FEED POSTS
  // ─────────────────────────────────────────────
  await FeedPost.create([
    {
      author: adminUser._id,
      title: 'Welcome to EVserv!',
      content: 'We are thrilled to launch EVserv – your one-stop platform for all EV servicing needs. Book services, track repairs, order spare parts, and more – all in one place!',
      type: 'announcement',
      tags: ['launch', 'evserv', 'electric-vehicles'],
      isPublished: true,
      isPinned: true,
      targetAudience: 'all',
      likeCount: 34,
    },
    {
      author: adminUser._id,
      title: '🎉 Summer EV Care Offer – 20% Off All Services',
      content: 'Beat the heat! Get 20% off on all general and battery services this summer. Valid till 30 April 2026. Book now through the app.',
      type: 'offer',
      tags: ['offer', 'discount', 'summer'],
      isPublished: true,
      isPinned: false,
      targetAudience: 'all',
      expiresAt: new Date('2026-04-30'),
      likeCount: 21,
    },
    {
      author: adminUser._id,
      title: 'EV Battery Maintenance Tips',
      content: '🔋 Top 5 tips to extend your EV battery life:\n1. Avoid charging to 100% daily – keep between 20%-80%.\n2. Use slow charging at home whenever possible.\n3. Park in shade to avoid thermal stress.\n4. Schedule a battery health check every 6 months.\n5. Keep battery contacts clean.\n\nFollow these tips and your battery will last years longer!',
      type: 'tip',
      tags: ['battery', 'maintenance', 'tips'],
      isPublished: true,
      isPinned: false,
      targetAudience: 'all',
      likeCount: 58,
    },
    {
      author: adminUser._id,
      title: 'New Service Centre in Hyderabad',
      content: 'We are happy to announce the opening of our new franchise in Hyderabad – Jubilee Hills EV Service Centre. Now serving all EV owners in Hyderabad and surrounding areas!',
      type: 'news',
      tags: ['expansion', 'hyderabad', 'new-centre'],
      isPublished: true,
      isPinned: false,
      targetAudience: 'all',
      likeCount: 15,
    },
    {
      author: franchiseUser1._id,
      title: 'Extended Hours at Koramangala Centre',
      content: 'Great news for Bengaluru EV owners! Our Koramangala service hub is now open from 8 AM to 8 PM, Monday to Saturday. Walk-ins welcome!',
      type: 'announcement',
      tags: ['bengaluru', 'koramangala', 'extended-hours'],
      isPublished: true,
      isPinned: false,
      targetAudience: 'all',
      likeCount: 9,
    },
    {
      author: adminUser._id,
      title: 'Exclusive AMC Offer for Subscribers',
      content: 'Renew or upgrade to our AMC 1-Year plan before 31 March 2026 and get a FREE home charger inspection worth ₹500. Offer exclusive to existing subscribers!',
      type: 'offer',
      tags: ['amc', 'exclusive', 'subscribers'],
      isPublished: true,
      isPinned: false,
      targetAudience: 'subscribers',
      expiresAt: new Date('2026-03-31'),
      likeCount: 27,
    },
  ]);
  console.log('📰 Created 6 feed posts');

  // ─────────────────────────────────────────────
  // SPARE PART ORDERS
  // ─────────────────────────────────────────────
  await Order.create([
    {
      user: user1._id,
      items: [
        { part: part6._id, quantity: 2, price: 1200 },
        { part: part3._id, quantity: 1, price: 4500 },
      ],
      totalAmount: 6900,
      status: 'delivered',
      shippingAddress: { street: '78 HSR Layout', city: 'Bengaluru', state: 'Karnataka', pincode: '560102' },
      paymentId: payment1._id,
      deliveredAt: new Date('2026-01-28'),
    },
    {
      user: user3._id,
      items: [
        { part: part4._id, quantity: 1, price: 18000 },
      ],
      totalAmount: 18000,
      status: 'pending',
      shippingAddress: { street: '5 Jubilee Hills', city: 'Hyderabad', state: 'Telangana', pincode: '500033' },
      paymentId: payment4._id,
    },
  ]);
  console.log('📦 Created 2 spare part orders');

  console.log('\n🌱 ===== SEED COMPLETE =====');
  console.log('\n🔑 LOGIN CREDENTIALS');
  console.log('─────────────────────────────────────────────');
  console.log('ADMIN');
  console.log('  Email    : admin@evserv.com');
  console.log('  Password : Admin@123');
  console.log('  Role     : admin');
  console.log('');
  console.log('FRANCHISE OWNER 1');
  console.log('  Email    : franchise1@evserv.com');
  console.log('  Password : Franchise@123');
  console.log('  Role     : franchise');
  console.log('');
  console.log('FRANCHISE OWNER 2');
  console.log('  Email    : franchise2@evserv.com');
  console.log('  Password : Franchise@123');
  console.log('  Role     : franchise');
  console.log('');
  console.log('USER 1 (Arjun Sharma – Bengaluru, 2 vehicles)');
  console.log('  Email    : user1@evserv.com');
  console.log('  Password : User@123');
  console.log('  Role     : user');
  console.log('');
  console.log('USER 2 (Sneha Patel – Mumbai, 1 vehicle)');
  console.log('  Email    : user2@evserv.com');
  console.log('  Password : User@123');
  console.log('  Role     : user');
  console.log('');
  console.log('USER 3 (Kiran Reddy – Hyderabad, 1 vehicle)');
  console.log('  Email    : user3@evserv.com');
  console.log('  Password : User@123');
  console.log('  Role     : user');
  console.log('─────────────────────────────────────────────\n');

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});

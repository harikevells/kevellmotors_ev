require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/error');
const { authLimiter, apiLimiter } = require('./middleware/rateLimiter');

const app = express();

// Connect to database
connectDB().catch((err) => console.error('DB connection error:', err));

// Middleware
app.use(cors({ origin: process.env.FRONTEND_URL || '*', credentials: true }));
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));

// Static files (uploads)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/api/auth', authLimiter, require('./routes/auth'));
app.use('/api/vehicles', apiLimiter, require('./routes/vehicles'));
app.use('/api/services', apiLimiter, require('./routes/services'));
app.use('/api/subscriptions', apiLimiter, require('./routes/subscriptions'));
app.use('/api/notifications', apiLimiter, require('./routes/notifications'));
app.use('/api/parts', apiLimiter, require('./routes/parts'));
app.use('/api/payments', apiLimiter, require('./routes/payments'));
app.use('/api/feedback', apiLimiter, require('./routes/feedback'));
app.use('/api/reminders', apiLimiter, require('./routes/reminders'));
app.use('/api/referrals', apiLimiter, require('./routes/referrals'));
app.use('/api/feed', apiLimiter, require('./routes/feed'));
app.use('/api/franchises', apiLimiter, require('./routes/franchises'));
app.use('/api/franchise', apiLimiter, require('./routes/franchise'));
app.use('/api/admin', apiLimiter, require('./routes/admin'));
app.use('/api/agent', apiLimiter, require('./routes/agent'));

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// Error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`EVserv API running on port ${PORT}`));

module.exports = app;

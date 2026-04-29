# ⚡ Kevell Motors — EV Vehicle Service App

A full-stack EV vehicle service management platform built with **Node.js/Express**, **MongoDB**, and **React**.

---

## 🚀 Features

### User App
| Feature | Description |
|---|---|
| **User Registration** | Register with name, email, phone, password. Referral code support at sign-up. |
| **Fleet Management** | Add/edit/remove multiple EV vehicles (2W, 3W, 4W) with specs |
| **Monthly Subscription & AMC** | Monthly, Quarterly, AMC 1-Year, AMC 2-Year plans |
| **Service Booking & Tracking** | Book general/battery/motor/software/accident/AMC services and track live status |
| **Service Progress** | Step-by-step progress tracker (Onboarded → Diagnosis → In Progress → QC → Delivered) |
| **Spare Parts Purchase** | Browse and order genuine EV spare parts with cart & delivery |
| **Payment Gateway** | Razorpay integration for all payments (services, subscriptions, parts) |
| **User Feedback** | Submit rated feedback with category and optional images |
| **Reminders** | Set service, insurance, warranty, battery reminders with due-date alerts |
| **Reviews** | Read and write reviews for service centers |
| **Referral Program** | Unique referral codes, share link, track referred users |
| **EV Feed** | Browse posts, offers, tips, and news; like posts |
| **Document Upload** | Upload vehicle documents (RC, insurance, warranty, etc.) per vehicle |
| **Profile Management** | Update name, phone, address; change password |

### Admin App
| Feature | Description |
|---|---|
| **Dashboard** | Service vehicle counts by status, payment revenue, recent activity |
| **Service Management** | View/update service status with technician notes for all vehicles |
| **Payment Status** | View all payments (success/failed/refunded), issue refunds |
| **Feedback Collections** | View all user feedback, respond to feedback |
| **Push Feed** | Create and publish announcements, news, tips |
| **Push Offers** | Create timed promotional offers with expiry dates |
| **User Access Control** | Change user roles (user/admin/franchise), enable/disable accounts |
| **Franchise Setup** | Create/manage franchise locations, activate/suspend franchises |

---

## 🏗️ Tech Stack

### Backend
- **Node.js** + **Express 5**
- **MongoDB** + **Mongoose 9**
- **JWT** authentication
- **Bcryptjs** password hashing
- **Multer** file uploads
- **Razorpay** payment gateway
- **Nodemailer** email reminders
- **Express-validator** input validation

### Frontend
- **React 18** + **Vite 6**
- **React Router 6**
- **Axios**
- Custom CSS (no UI library dependency)

---

## 📁 Project Structure

```
EVserv/
├── backend/
│   ├── src/
│   │   ├── config/        # DB connection
│   │   ├── middleware/    # Auth, upload, error handling
│   │   ├── models/        # Mongoose models
│   │   └── routes/        # API route handlers
│   ├── uploads/           # File upload storage
│   └── .env.example
└── frontend/
    ├── src/
    │   ├── api/           # Axios API client + endpoints
    │   ├── components/    # Navbar, Sidebar, UI components
    │   ├── context/       # Auth context
    │   └── pages/         # User & Admin pages
    └── vite.config.js
```

---

## ⚙️ Setup & Installation

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- Razorpay account (for payments)

### Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your MongoDB URI, JWT secret, Razorpay keys
npm run dev
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The frontend runs on `http://localhost:3000` and proxies API calls to `http://localhost:5000`.

---

## 🔑 API Endpoints

| Route | Methods | Description |
|---|---|---|
| `/api/auth` | POST /register, /login, GET /me, PUT /profile | Authentication |
| `/api/vehicles` | GET, POST, PUT /:id, DELETE /:id, POST /:id/documents | Fleet management |
| `/api/services` | GET, POST, GET /:id, PUT /:id/status | Service booking & tracking |
| `/api/subscriptions` | GET /plans, GET, POST, PUT /:id/activate | Subscriptions & AMC |
| `/api/parts` | GET, GET /:id, POST, POST /orders, GET /orders/mine | Spare parts & orders |
| `/api/payments` | POST /create-order, POST /verify, GET, GET /all, POST /:id/refund | Payments |
| `/api/feedback` | POST, GET /mine, GET /all, PUT /:id/respond, GET/POST /reviews | Feedback & reviews |
| `/api/reminders` | GET, POST, PUT /:id/acknowledge, DELETE /:id | Reminders |
| `/api/referrals` | GET /me | Referral info |
| `/api/feed` | GET, POST, GET /:id, PUT /:id/like, PUT /:id, DELETE /:id | Feed posts |
| `/api/franchises` | GET, POST, GET /:id, PUT /:id, PUT /:id/status | Franchise management |
| `/api/admin` | GET /dashboard, GET/PUT /users, GET /services, POST /push-offer, POST /push-feed | Admin operations |

---

## 🔒 Environment Variables

See `backend/.env.example` for all required environment variables. 

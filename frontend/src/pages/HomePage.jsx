import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function HomePage() {
  const { user } = useAuth();

  return (
    <div>
      {/* Hero */}
      <div className="hero">
        <div className="container">
          <h1>⚡ EV Service Made Simple</h1>
          <p>Book, track, and manage all your electric vehicle services in one place.</p>
          <div className="hero-actions">
            {user ? (
              <Link to={user.role === 'admin' ? '/admin' : '/dashboard'} className="btn btn-primary" style={{ fontSize: '1rem', padding: '.75rem 2rem' }}>
                Go to Dashboard →
              </Link>
            ) : (
              <>
                <Link to="/register" className="btn btn-primary" style={{ fontSize: '1rem', padding: '.75rem 2rem', background: 'white', color: 'var(--primary)' }}>
                  Get Started
                </Link>
                <Link to="/login" className="btn btn-outline" style={{ fontSize: '1rem', padding: '.75rem 2rem', color: 'white', borderColor: 'white' }}>
                  Sign In
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="container">
        <div className="feature-grid">
          {[
            { icon: '🔧', title: 'Service Booking', desc: 'Schedule general, battery, motor, or AMC services easily' },
            { icon: '📍', title: 'Live Tracking', desc: 'Track your vehicle service status in real time' },
            { icon: '📋', title: 'AMC Plans', desc: 'Monthly & Annual Maintenance Contracts to keep you covered' },
            { icon: '🔩', title: 'Spare Parts', desc: 'Order genuine EV spare parts delivered to your doorstep' },
            { icon: '💳', title: 'Easy Payments', desc: 'Secure Razorpay-powered payment gateway integration' },
            { icon: '🔔', title: 'Smart Reminders', desc: 'Never miss a service with automated reminders' },
            { icon: '⭐', title: 'Reviews', desc: 'Read and share genuine reviews of service centers' },
            { icon: '🎁', title: 'Referral Rewards', desc: 'Earn rewards by referring friends and family' },
            { icon: '📰', title: 'EV Feed', desc: 'Stay updated with the latest EV news and offers' },
            { icon: '📄', title: 'Document Vault', desc: 'Store vehicle documents, insurance, and warranty safely' },
            { icon: '🏪', title: 'Franchise Network', desc: 'Find nearest authorized EV service center near you' },
            { icon: '👤', title: 'Fleet Management', desc: 'Manage multiple EV vehicles under a single account' },
          ].map((f) => (
            <div key={f.title} className="feature-card">
              <div className="feature-icon">{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

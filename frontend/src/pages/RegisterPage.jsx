import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../api';

const MAPS_API_KEY = 'AIzaSyCjEatp-Gql5YwhrJQBByrHaA4WRpZ3VA4';

function loadGoogleMaps(callback) {
  if (window.google?.maps) { callback(); return; }
  if (document.getElementById('gmap-script')) {
    document.getElementById('gmap-script').addEventListener('load', callback);
    return;
  }
  const s = document.createElement('script');
  s.id = 'gmap-script';
  s.src = `https://maps.googleapis.com/maps/api/js?key=${MAPS_API_KEY}`;
  s.async = true;
  s.onload = callback;
  document.head.appendChild(s);
}

function LocationPicker({ lat, lng, onPick }) {
  const mapDivRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);

  useEffect(() => {
    loadGoogleMaps(() => {
      if (!mapDivRef.current || mapRef.current) return;
      const center = lat && lng
        ? { lat: parseFloat(lat), lng: parseFloat(lng) }
        : { lat: 20.5937, lng: 78.9629 }; // India centre
      const map = new window.google.maps.Map(mapDivRef.current, {
        center,
        zoom: lat && lng ? 14 : 5,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
      });
      mapRef.current = map;

      const marker = new window.google.maps.Marker({
        position: center,
        map,
        draggable: true,
        title: 'Drag to set location',
      });
      markerRef.current = marker;

      const update = (latLng) => onPick(latLng.lat(), latLng.lng());
      marker.addListener('dragend', (e) => update(e.latLng));
      map.addListener('click', (e) => { marker.setPosition(e.latLng); update(e.latLng); });
    });
  }, []); // eslint-disable-line

  // sync marker when lat/lng changes externally (e.g. "Locate Me")
  useEffect(() => {
    if (!markerRef.current || !lat || !lng) return;
    const pos = { lat: parseFloat(lat), lng: parseFloat(lng) };
    markerRef.current.setPosition(pos);
    mapRef.current?.panTo(pos);
  }, [lat, lng]);

  return (
    <div ref={mapDivRef}
      style={{ height: '280px', borderRadius: '10px', border: '1.5px solid #cbd5e1', marginTop: '.5rem', overflow: 'hidden' }}
    />
  );
}

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [role, setRole] = useState('user'); // 'user' | 'franchise'
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    referralCode: searchParams.get('ref') || '',
    // franchise-only
    franchiseName: '',
    street: '',
    city: '',
    state: '',
    pincode: '',
    licenseNumber: '',
    gstNumber: '',
    capacity: 10,
    workingHoursOpen: '09:00',
    workingHoursClose: '18:00',
    availableDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
    lat: '',
    lng: '',
    pickupDropService: false,
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      if (role === 'user') {
        await register({ name: form.name, email: form.email, phone: form.phone, password: form.password, referralCode: form.referralCode });
        navigate('/dashboard');
      } else {
        const res = await authAPI.registerFranchise({
          name: form.name,
          email: form.email,
          phone: form.phone,
          password: form.password,
          franchiseName: form.franchiseName,
          street: form.street,
          city: form.city,
          state: form.state,
          pincode: form.pincode,
          licenseNumber: form.licenseNumber,
          gstNumber: form.gstNumber,
          capacity: form.capacity,
          workingHours: { open: form.workingHoursOpen, close: form.workingHoursClose },
          availableDays: form.availableDays,
          pickupDropService: form.pickupDropService,
          ...(form.lat && form.lng ? { lat: form.lat, lng: form.lng } : {}),
        });
        setSuccess(res.data.message || 'Franchise application submitted! Pending admin approval.');
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || 'Registration failed';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card" style={{ maxWidth: '560px' }}>
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{ fontSize: '2.5rem' }}>⚡</div>
          <h1 className="auth-title">Join EVserv</h1>
          <p className="auth-subtitle">Register to start managing your EV services</p>
        </div>

        {/* Role Toggle */}
        <div style={{ display: 'flex', background: '#f0f4f8', borderRadius: '12px', padding: '5px', marginBottom: '1.5rem', gap: '4px' }}>
          {[['user', '👤 EV Owner'], ['franchise', '🏪 Franchise Partner']].map(([key, label]) => (
            <button key={key} type="button"
              onClick={() => { setRole(key); setError(''); setSuccess(''); }}
              style={{
                flex: 1, padding: '.6rem .5rem', border: 'none', borderRadius: '8px', cursor: 'pointer',
                fontWeight: 700, fontSize: '.875rem', transition: 'all .25s',
                background: role === key ? 'linear-gradient(135deg,#00b4d8,#0077b6)' : 'transparent',
                color: role === key ? '#fff' : '#64748b',
                boxShadow: role === key ? '0 4px 14px rgba(0,180,216,.4)' : 'none',
                transform: role === key ? 'scale(1.02)' : 'scale(1)',
              }}>
              {label}
            </button>
          ))}
        </div>

        {error && <div className="alert alert-danger">{error}</div>}
        {success && (
          <div style={{ background: 'linear-gradient(135deg,#ecfdf5,#d1fae5)', border: '1px solid #6ee7b7', borderRadius: '12px', padding: '1rem 1.25rem', marginBottom: '1rem' }}>
            <div style={{ color: '#065f46', fontWeight: 600, fontSize: '.9rem', marginBottom: '.75rem' }}>✅ {success}</div>
            <Link to="/login" style={{
              display: 'inline-flex', alignItems: 'center', gap: '.4rem',
              background: 'linear-gradient(135deg,#00b4d8,#0077b6)', color: '#fff',
              padding: '.5rem 1.25rem', borderRadius: '8px', fontWeight: 700,
              fontSize: '.875rem', textDecoration: 'none',
              boxShadow: '0 4px 14px rgba(0,180,216,.35)',
            }}>Go to Login →</Link>
          </div>
        )}

        {!success && (
          <form onSubmit={handleSubmit}>
            {/* Common fields */}
            <div className="grid grid-2">
              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <input type="text" name="name" className="form-control" value={form.name} onChange={handleChange} placeholder="John Doe" required />
              </div>
              <div className="form-group">
                <label className="form-label">Phone *</label>
                <input type="tel" name="phone" className="form-control" value={form.phone} onChange={handleChange} placeholder="+91 9876543210" required />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Email *</label>
              <input type="email" name="email" className="form-control" value={form.email} onChange={handleChange} placeholder="you@example.com" required />
            </div>
            <div className="form-group">
              <label className="form-label">Password *</label>
              <input type="password" name="password" className="form-control" value={form.password} onChange={handleChange} placeholder="Min 6 characters" required minLength={6} />
            </div>

            {/* User-only */}
            {role === 'user' && (
              <div className="form-group">
                <label className="form-label">Referral Code (optional)</label>
                <input type="text" name="referralCode" className="form-control" value={form.referralCode} onChange={handleChange} placeholder="Enter referral code" />
              </div>
            )}

            {/* Franchise-only */}
            {role === 'franchise' && (
              <>
                <hr style={{ margin: '1rem 0', borderColor: 'var(--border)' }} />
                <h4 style={{ marginBottom: '.75rem', color: 'var(--text)' }}>🏪 Franchise Details</h4>
                <div className="form-group">
                  <label className="form-label">Franchise / Business Name *</label>
                  <input type="text" name="franchiseName" className="form-control" value={form.franchiseName} onChange={handleChange} placeholder="e.g. Spark EV Service Center" required />
                </div>
                <div className="grid grid-2">
                  <div className="form-group">
                    <label className="form-label">License Number</label>
                    <input type="text" name="licenseNumber" className="form-control" value={form.licenseNumber} onChange={handleChange} placeholder="e.g. MH-EV-2024-001" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">GST Number</label>
                    <input type="text" name="gstNumber" className="form-control" value={form.gstNumber} onChange={handleChange} placeholder="e.g. 27AAAAA0000A1Z5" />
                  </div>
                </div>
                <h4 style={{ margin: '.75rem 0', color: 'var(--text)' }}>📍 Service Centre Address</h4>
                <div className="form-group">
                  <label className="form-label">Street *</label>
                  <input type="text" name="street" className="form-control" value={form.street} onChange={handleChange} placeholder="Street / Building / Area" required />
                </div>
                <div className="grid grid-3">
                  <div className="form-group">
                    <label className="form-label">City *</label>
                    <input type="text" name="city" className="form-control" value={form.city} onChange={handleChange} placeholder="e.g. Mumbai" required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">State *</label>
                    <input type="text" name="state" className="form-control" value={form.state} onChange={handleChange} placeholder="e.g. Maharashtra" required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Pincode *</label>
                    <input type="text" name="pincode" className="form-control" value={form.pincode} onChange={handleChange} placeholder="e.g. 400001" required />
                  </div>
                </div>

                <h4 style={{ margin: '.75rem 0', color: 'var(--text)' }}>⏰ Working Hours &amp; Availability</h4>
                <div className="grid grid-2" style={{ marginBottom: '.75rem' }}>
                  <div className="form-group">
                    <label className="form-label">Opens at</label>
                    <input type="time" name="workingHoursOpen" className="form-control" value={form.workingHoursOpen} onChange={handleChange} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Closes at</label>
                    <input type="time" name="workingHoursClose" className="form-control" value={form.workingHoursClose} onChange={handleChange} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Available Days</label>
                  <div style={{ display: 'flex', gap: '.4rem', flexWrap: 'wrap', marginTop: '.25rem' }}>
                    {['monday','tuesday','wednesday','thursday','friday','saturday','sunday'].map((day) => {
                      const checked = form.availableDays.includes(day);
                      return (
                        <button key={day} type="button"
                          onClick={() => setForm((f) => ({
                            ...f,
                            availableDays: checked
                              ? f.availableDays.filter((d) => d !== day)
                              : [...f.availableDays, day],
                          }))}
                          style={{
                            padding: '.3rem .65rem', borderRadius: '8px', fontSize: '.8rem',
                            fontWeight: 700, cursor: 'pointer', textTransform: 'capitalize',
                            border: `1.5px solid ${checked ? '#0077b6' : '#e2e8f0'}`,
                            background: checked ? '#dbeafe' : '#f8fafc',
                            color: checked ? '#0077b6' : '#64748b',
                            transition: 'all .15s',
                          }}>
                          {day.slice(0, 3)}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="form-group" style={{ marginTop: '1rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '.6rem', cursor: 'pointer', background: 'rgba(56,189,248,0.08)', padding: '.75rem 1rem', borderRadius: '10px', border: '1.5px solid rgba(56,189,248,0.15)' }}>
                    <input type="checkbox" name="pickupDropService" checked={form.pickupDropService}
                      onChange={(e) => setForm(f => ({ ...f, pickupDropService: e.target.checked }))}
                      style={{ width: '18px', height: '18px', cursor: 'pointer' }} />
                    <div>
                      <div style={{ fontWeight: 700, color: '#0369a1', fontSize: '.875rem' }}>Offers Pickup & Drop Service</div>
                      <div style={{ fontSize: '.75rem', color: '#0369a1', opacity: 0.8 }}>Check this if you can pick up and drop back customer vehicles.</div>
                    </div>
                  </label>
                </div>
                <h4 style={{ margin: '.75rem 0 .25rem', color: 'var(--text)' }}>📍 Service Centre Location</h4>
                <p style={{ fontSize: '.82rem', color: '#64748b', marginBottom: '.5rem' }}>
                  Click or drag the pin on the map to set your exact location so customers can find you.
                </p>
                <button type="button"
                  onClick={() => {
                    if (!navigator.geolocation) return;
                    navigator.geolocation.getCurrentPosition(
                      ({ coords }) => setForm((f) => ({ ...f, lat: coords.latitude.toFixed(6), lng: coords.longitude.toFixed(6) })),
                      () => {},
                    );
                  }}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '.35rem',
                    padding: '.38rem .9rem', borderRadius: '8px', fontSize: '.82rem',
                    fontWeight: 600, cursor: 'pointer', marginBottom: '.5rem',
                    background: 'linear-gradient(135deg,#e0f2fe,#bae6fd)',
                    border: '1.5px solid #38bdf8', color: '#0369a1',
                  }}>
                  🎯 Use My Location
                </button>
                <LocationPicker
                  lat={form.lat}
                  lng={form.lng}
                  onPick={(la, ln) => setForm((f) => ({ ...f, lat: la.toFixed(6), lng: ln.toFixed(6) }))}
                />
                <div className="grid grid-2" style={{ marginTop: '.75rem' }}>
                  <div className="form-group">
                    <label className="form-label">Latitude</label>
                    <input type="number" name="lat" className="form-control" value={form.lat}
                      onChange={handleChange} placeholder="e.g. 19.0760" step="any" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Longitude</label>
                    <input type="number" name="lng" className="form-control" value={form.lng}
                      onChange={handleChange} placeholder="e.g. 72.8777" step="any" />
                  </div>
                </div>

                <div className="alert" style={{ background: '#fff8e1', border: '1px solid #ffe082', borderRadius: '8px', fontSize: '.82rem', color: '#7c6200', padding: '.65rem .85rem', marginTop: '.25rem' }}>
                  ⏳ Your franchise application will be reviewed by an admin before activation.
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%', padding: '.9rem', marginTop: '.75rem',
                background: loading ? 'linear-gradient(135deg,#90d9ed,#7ab8d4)' : 'linear-gradient(135deg,#00b4d8,#0077b6)',
                color: '#fff', border: 'none', borderRadius: '12px',
                fontSize: '1rem', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all .2s', letterSpacing: '.3px',
                boxShadow: loading ? 'none' : '0 4px 20px rgba(0,180,216,.4)',
              }}
              onMouseEnter={(e) => { if (!loading) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 28px rgba(0,180,216,.5)'; } }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = loading ? 'none' : '0 4px 20px rgba(0,180,216,.4)'; }}
              onMouseDown={(e) => { if (!loading) e.currentTarget.style.transform = 'scale(.98)'; }}
              onMouseUp={(e) => { if (!loading) e.currentTarget.style.transform = 'translateY(-1px)'; }}
            >
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '.5rem' }}>
                  <span style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,.4)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin .7s linear infinite' }} />
                  {role === 'user' ? 'Creating account…' : 'Submitting application…'}
                </span>
              ) : (
                role === 'user' ? '⚡ Create Account' : '🏪 Submit Franchise Application'
              )}
            </button>
          </form>
        )}

        <p className="text-center mt-4" style={{ fontSize: '.875rem', color: '#64748b' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: '#00b4d8', fontWeight: 700, textDecoration: 'none', borderBottom: '1.5px solid rgba(0,180,216,.35)', paddingBottom: '1px' }}>Sign in →</Link>
        </p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

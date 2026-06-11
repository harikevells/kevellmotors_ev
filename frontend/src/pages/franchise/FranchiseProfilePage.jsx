import { useEffect, useState, useRef } from 'react';
import FranchiseSidebar from '../../components/franchise/FranchiseSidebar';
import { franchisePortalAPI } from '../../api';
import { useAuth } from '../../context/AuthContext';

const MAPS_KEY = 'AIzaSyCjEatp-Gql5YwhrJQBByrHaA4WRpZ3VA4';
function loadGoogleMaps(cb) {
  if (window.google?.maps) { cb(); return; }
  if (document.getElementById('gmap-s')) { document.getElementById('gmap-s').addEventListener('load', cb); return; }
  const s = document.createElement('script');
  s.id = 'gmap-s'; s.src = `https://maps.googleapis.com/maps/api/js?key=${MAPS_KEY}`; s.async = true; s.onload = cb;
  document.head.appendChild(s);
}
function LocationPicker({ lat, lng, onPick }) {
  const divRef = useRef(null); const mapRef = useRef(null); const markerRef = useRef(null);
  useEffect(() => {
    loadGoogleMaps(() => {
      if (!divRef.current || mapRef.current) return;
      const center = lat && lng ? { lat: parseFloat(lat), lng: parseFloat(lng) } : { lat: 20.5937, lng: 78.9629 };
      const map = new window.google.maps.Map(divRef.current, { center, zoom: lat && lng ? 14 : 5, mapTypeControl: false, streetViewControl: false, fullscreenControl: false });
      mapRef.current = map;
      const marker = new window.google.maps.Marker({ position: center, map, draggable: true, title: 'Drag to adjust' });
      markerRef.current = marker;
      const upd = (ll) => onPick(ll.lat(), ll.lng());
      marker.addListener('dragend', (e) => upd(e.latLng));
      map.addListener('click', (e) => { marker.setPosition(e.latLng); upd(e.latLng); });
    });
  }, []); // eslint-disable-line
  useEffect(() => {
    if (!markerRef.current || !lat || !lng) return;
    const pos = { lat: parseFloat(lat), lng: parseFloat(lng) };
    markerRef.current.setPosition(pos); mapRef.current?.panTo(pos);
  }, [lat, lng]);
  return <div ref={divRef} style={{ height: 260, borderRadius: 10, border: '1px solid rgba(255,255,255,0.12)', overflow: 'hidden', marginTop: '.5rem' }} />;
}

export default function FranchiseProfilePage() {
  const [franchise, setFranchise] = useState(null);
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [liveReviews, setLiveReviews] = useState([]);
  const [liveFeedbacks, setLiveFeedbacks] = useState([]);
  const { user } = useAuth();

  useEffect(() => {
    Promise.all([
      franchisePortalAPI.getProfile(),
      franchisePortalAPI.getFeedback().catch(() => ({ data: { reviews: [], feedbacks: [] } })),
    ]).then(([profileRes, feedbackRes]) => {
        setFranchise(profileRes.data.franchise);
        setLiveReviews(feedbackRes.data.reviews || []);
        setLiveFeedbacks(feedbackRes.data.feedbacks || []);
        const r = profileRes.data.franchise;
        // Map the new 'schedules' schema to the simple UI
        const mainSchedule = r.schedules?.[0] || {};
        setForm({
          name: r.name || '',
          email: r.email || '',
          phone: r.phone || '',
          licenseNumber: r.licenseNumber || '',
          gstNumber: r.gstNumber || '',
          capacity: r.capacity || 10,
          address: {
            street:  r.address?.street  || '',
            city:    r.address?.city    || '',
            state:   r.address?.state   || '',
            pincode: r.address?.pincode || '',
          },
          workingHours: {
            open:  mainSchedule.open  || '09:00',
            close: mainSchedule.close || '18:00',
          },
          availableDays: mainSchedule.days || ['monday','tuesday','wednesday','thursday','friday'],
          lat: r.location?.coordinates?.[1]?.toString() || '',
          lng: r.location?.coordinates?.[0]?.toString() || '',
          pickupDropService: !!r.pickupDropService,
        });
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const liveAvgRating = liveReviews.length
    ? Math.round((liveReviews.reduce((s, r) => s + r.rating, 0) / liveReviews.length) * 10) / 10
    : 0;
  const liveReviewCount = liveReviews.length;
  const liveFeedbackCount = liveFeedbacks.length;

  const set    = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const setAddr = (k, v) => setForm((f) => ({ ...f, address: { ...f.address, [k]: v } }));
  const setHrs  = (k, v) => setForm((f) => ({ ...f, workingHours: { ...f.workingHours, [k]: v } }));
  const toggleDay = (day) => setForm((f) => ({
    ...f,
    availableDays: f.availableDays?.includes(day)
      ? f.availableDays.filter((d) => d !== day)
      : [...(f.availableDays || []), day],
  }));

  const ALL_DAYS = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];
  const DAY_ABBR = { monday:'Mon', tuesday:'Tue', wednesday:'Wed', thursday:'Thu', friday:'Fri', saturday:'Sat', sunday:'Sun' };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true); setError(''); setSuccess('');
    try {
      const payload = { ...form };
      // Map simple UI back to the new 'schedules' schema
      payload.schedules = [{
        type: 'overall',
        days: form.availableDays,
        open: form.workingHours.open,
        close: form.workingHours.close
      }];
      await franchisePortalAPI.updateProfile(payload);
      setSuccess('Profile updated successfully!');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const bg   = { background: '#06071a', color: '#e2e8f0', minHeight: '100vh', display: 'flex' };
  const card = { background: '#0d0e2b', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, overflow: 'hidden', marginBottom: '1.25rem' };
  const ch   = { padding: '1rem 1.25rem', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' };
  const inp  = { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '.55rem .85rem', color: '#e2e8f0', fontSize: '.85rem', outline: 'none', width: '100%', boxSizing: 'border-box' };
  const lbl  = { display: 'block', fontSize: '.78rem', fontWeight: 600, color: '#6b7280', marginBottom: '.3rem' };

  if (loading || !form) return (
    <div style={bg}><FranchiseSidebar /><div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={{ width: 40, height: 40, border: '4px solid rgba(0,229,255,.2)', borderTopColor: '#00e5ff', borderRadius: '50%', animation: 'spin .8s linear infinite' }} /></div></div>
  );

  return (
    <div style={bg}>
      <FranchiseSidebar />
      <div style={{ flex: 1, padding: '1.5rem 2rem', overflowY: 'auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.75rem' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#e2e8f0', margin: 0 }}>Franchise Profile</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '6px 10px', color: '#9ca3af', cursor: 'pointer', fontSize: '.9rem' }}>🔍</button>
            <button style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '6px 10px', color: '#9ca3af', cursor: 'pointer', fontSize: '.9rem' }}>🔔</button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem' }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,#7c3aed,#1a6ef7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '.9rem', color: '#fff', flexShrink: 0 }}>{user?.name?.[0]?.toUpperCase() || 'F'}</div>
              <div>
                <div style={{ fontWeight: 600, fontSize: '.85rem', color: '#e2e8f0' }}>{user?.name || 'Franchise'}</div>
                <div style={{ fontSize: '.7rem', color: '#6b7280' }}>Franchise</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '.4rem', background: 'rgba(0,229,255,0.08)', border: '1px solid rgba(0,229,255,0.25)', borderRadius: 20, padding: '5px 14px', fontSize: '.75rem', fontWeight: 600, color: '#00e5ff', cursor: 'pointer' }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#ef4444', display: 'inline-block' }} />
              Live Feed
            </div>
          </div>
        </div>

        {/* Status banner */}
        <div style={{ ...card, borderLeft: `4px solid ${franchise.status === 'active' ? '#22c55e' : '#f59e0b'}` }}>
          <div style={{ padding: '1.25rem', display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
            <div>
              <div style={{ color: '#6b7280', fontSize: '.8rem' }}>Status</div>
              <span style={{ marginTop: '.25rem', display: 'inline-block', padding: '3px 10px', borderRadius: 20, fontSize: '.75rem', fontWeight: 600, color: franchise.status === 'active' ? '#22c55e' : '#f59e0b', background: franchise.status === 'active' ? 'rgba(34,197,94,0.15)' : 'rgba(245,158,11,0.15)', border: `1px solid ${franchise.status === 'active' ? 'rgba(34,197,94,0.3)' : 'rgba(245,158,11,0.3)'}` }}>
                {franchise.status}
              </span>
            </div>
            <div>
              <div style={{ color: '#6b7280', fontSize: '.8rem' }}>Rating</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '.4rem', marginTop: '.15rem' }}>
                <div style={{ display: 'flex', gap: '1px' }}>
                  {[1,2,3,4,5].map((star) => {
                    const filled = star <= Math.floor(liveAvgRating);
                    const half   = !filled && star === Math.ceil(liveAvgRating) && liveAvgRating % 1 >= 0.5;
                    return (
                      <span key={star} style={{ fontSize: '1rem', color: filled || half ? '#f59e0b' : '#374151' }}>
                        {filled || half ? '★' : '☆'}
                      </span>
                    );
                  })}
                </div>
                <span style={{ fontWeight: 700, color: '#f59e0b', fontSize: '.9rem' }}>
                  {liveAvgRating > 0 ? liveAvgRating.toFixed(1) : '—'}
                </span>
                <span style={{ color: '#6b7280', fontSize: '.8rem' }}>
                  ({liveReviewCount} {liveReviewCount === 1 ? 'review' : 'reviews'})
                </span>
              </div>
            </div>
            <div>
              <div style={{ color: '#6b7280', fontSize: '.8rem' }}>Service Feedbacks</div>
              <div style={{ fontWeight: 700, color: '#8b5cf6', fontSize: '.9rem', marginTop: '.15rem' }}>{liveFeedbackCount}</div>
            </div>
            <div>
              <div style={{ color: '#6b7280', fontSize: '.8rem' }}>Member since</div>
              <div style={{ fontWeight: 600, color: '#e2e8f0' }}>{new Date(franchise.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'long' })}</div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {success && <div style={{ marginBottom: '1rem', padding: '.75rem 1rem', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 8, color: '#22c55e', fontSize: '.875rem' }}>✅ {success}</div>}
          {error   && <div style={{ marginBottom: '1rem', padding: '.75rem 1rem', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, color: '#ef4444', fontSize: '.875rem' }}>❌ {error}</div>}

          {/* Business info */}
          <div style={card}>
            <div style={ch}><h3 style={{ margin: 0, fontWeight: 600, color: '#e2e8f0', fontSize: '1rem' }}>Business Information</h3></div>
            <div style={{ padding: '1.25rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                {[
                  { label: 'Business Name *', key: 'name', type: 'text', required: true },
                  { label: 'Email *', key: 'email', type: 'email', required: true },
                  { label: 'Phone *', key: 'phone', type: 'text', required: true },
                  { label: 'Service Capacity (vehicles/day)', key: 'capacity', type: 'number', min: 1 },
                  { label: 'License Number', key: 'licenseNumber', type: 'text' },
                  { label: 'GST Number', key: 'gstNumber', type: 'text' },
                ].map(({ label, key, type, required, min }) => (
                  <div key={key}>
                    <label style={lbl}>{label}</label>
                    <input type={type} min={min} style={inp} value={form[key]} onChange={(e) => set(key, type === 'number' ? Number(e.target.value) : e.target.value)} required={required} />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Address */}
          <div style={card}>
            <div style={ch}><h3 style={{ margin: 0, fontWeight: 600, color: '#e2e8f0', fontSize: '1rem' }}>Service Centre Address</h3></div>
            <div style={{ padding: '1.25rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div style={{ gridColumn: '1/-1' }}>
                  <label style={lbl}>Street *</label>
                  <input style={inp} value={form.address.street} onChange={(e) => setAddr('street', e.target.value)} required />
                </div>
                {[
                  { label: 'City *', key: 'city', required: true },
                  { label: 'State *', key: 'state', required: true },
                  { label: 'Pincode *', key: 'pincode', required: true },
                ].map(({ label, key, required }) => (
                  <div key={key}>
                    <label style={lbl}>{label}</label>
                    <input style={inp} value={form.address[key]} onChange={(e) => setAddr(key, e.target.value)} required={required} />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Location */}
          <div style={card}>
            <div style={ch}><h3 style={{ margin: 0, fontWeight: 600, color: '#e2e8f0', fontSize: '1rem' }}>📍 Location on Map</h3></div>
            <div style={{ padding: '1.25rem' }}>
              <p style={{ margin: '0 0 .5rem', color: '#6b7280', fontSize: '.8rem' }}>
                Click or drag the pin to set the exact location so customers can find you in nearby search.
              </p>
              <button type="button"
                onClick={() => navigator.geolocation?.getCurrentPosition(
                  ({ coords }) => setForm((f) => ({ ...f, lat: coords.latitude.toFixed(6), lng: coords.longitude.toFixed(6) })),
                  () => {},
                )}
                style={{ background: 'rgba(14,165,233,0.15)', border: '1px solid rgba(14,165,233,0.4)', borderRadius: 7, padding: '.3rem .85rem', color: '#0EA5E9', fontSize: '.78rem', fontWeight: 600, cursor: 'pointer', marginBottom: '.5rem' }}>
                🎯 Use My Location
              </button>
              <LocationPicker
                lat={form.lat}
                lng={form.lng}
                onPick={(la, ln) => setForm((f) => ({ ...f, lat: la.toFixed(6), lng: ln.toFixed(6) }))}
              />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '.75rem' }}>
                <div>
                  <label style={lbl}>Latitude</label>
                  <input type="number" step="any" style={inp} value={form.lat}
                    onChange={(e) => setForm((f) => ({ ...f, lat: e.target.value }))} placeholder="e.g. 9.9252" />
                </div>
                <div>
                  <label style={lbl}>Longitude</label>
                  <input type="number" step="any" style={inp} value={form.lng}
                    onChange={(e) => setForm((f) => ({ ...f, lng: e.target.value }))} placeholder="e.g. 78.1198" />
                </div>
              </div>
            </div>
          </div>

          {/* Working hours */}
          <div style={card}>
            <div style={ch}><h3 style={{ margin: 0, fontWeight: 600, color: '#e2e8f0', fontSize: '1rem' }}>Working Hours &amp; Availability</h3></div>
            <div style={{ padding: '1.25rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', maxWidth: '400px', marginBottom: '1rem' }}>
                <div>
                  <label style={lbl}>Opens at</label>
                  <input type="time" style={inp} value={form.workingHours.open} onChange={(e) => setHrs('open', e.target.value)} />
                </div>
                <div>
                  <label style={lbl}>Closes at</label>
                  <input type="time" style={inp} value={form.workingHours.close} onChange={(e) => setHrs('close', e.target.value)} />
                </div>
              </div>
              <div>
                <label style={lbl}>Available Days</label>
                <div style={{ display: 'flex', gap: '.4rem', flexWrap: 'wrap', marginTop: '.35rem' }}>
                  {ALL_DAYS.map((day) => {
                    const checked = form.availableDays?.includes(day);
                    return (
                      <button key={day} type="button" onClick={() => toggleDay(day)} style={{
                        padding: '.35rem .75rem', borderRadius: 8, fontSize: '.82rem',
                        fontWeight: 700, cursor: 'pointer', textTransform: 'capitalize',
                        border: `1.5px solid ${checked ? '#1a6ef7' : 'rgba(255,255,255,0.15)'}`,
                        background: checked ? 'rgba(26,110,247,0.2)' : 'rgba(255,255,255,0.05)',
                        color: checked ? '#1a6ef7' : '#6b7280',
                        transition: 'all .15s',
                      }}>{DAY_ABBR[day]}</button>
                    );
                  })}
                </div>
              </div>
              <div style={{ marginTop: '1.25rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '.75rem', cursor: 'pointer', background: 'rgba(26,110,247,0.1)', padding: '1rem', borderRadius: 10, border: '1px solid rgba(26,110,247,0.2)' }}>
                  <input type="checkbox" checked={form.pickupDropService} onChange={(e) => set('pickupDropService', e.target.checked)} style={{ width: 18, height: 18, cursor: 'pointer' }} />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '.9rem', color: '#1a6ef7' }}>Enable Pickup & Drop Service</div>
                    <div style={{ fontSize: '.75rem', color: '#6b7280' }}>Let customers know you can pick up and drop back their vehicles.</div>
                  </div>
                </label>
              </div>
            </div>
          </div>

          <button type="submit" disabled={saving} style={{ background: '#1a6ef7', border: 'none', borderRadius: 8, padding: '.55rem 1.5rem', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: '.875rem', opacity: saving ? .6 : 1 }}>
            {saving ? 'Saving…' : '💾 Save Changes'}
          </button>
        </form>
      </div>
    </div>
  );
}

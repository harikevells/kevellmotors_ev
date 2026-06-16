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
  const [newSchedule, setNewSchedule] = useState({
    type: 'overall', startDate: '', endDate: '', days: ['monday','tuesday','wednesday','thursday','friday'],
    open: '09:00', close: '18:00', isClosed: false, capacity: 10
  });
  const [editIndex, setEditIndex] = useState(null);

  useEffect(() => {
    Promise.all([
      franchisePortalAPI.getProfile(),
      franchisePortalAPI.getFeedback().catch(() => ({ data: { reviews: [], feedbacks: [] } })),
    ]).then(([profileRes, feedbackRes]) => {
        setFranchise(profileRes.data.franchise);
        setLiveReviews(feedbackRes.data.reviews || []);
        setLiveFeedbacks(feedbackRes.data.feedbacks || []);
        const r = profileRes.data.franchise;
        let initialSchedules = r.schedules || [];
        if (initialSchedules.length === 0 && r.workingHours) {
          initialSchedules = [{
            type: 'overall',
            startDate: '',
            endDate: '',
            days: r.availableDays || ['monday','tuesday','wednesday','thursday','friday'],
            open: r.workingHours.open || '09:00',
            close: r.workingHours.close || '18:00',
            isClosed: false,
            capacity: r.capacity || 10
          }];
        }
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
          schedules: initialSchedules,
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

  const ALL_DAYS = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];
  const DAY_ABBR = { monday:'Mon', tuesday:'Tue', wednesday:'Wed', thursday:'Thu', friday:'Fri', saturday:'Sat', sunday:'Sun' };

  const toggleNewScheduleDay = (day) => setNewSchedule(prev => ({ ...prev, days: prev.days.includes(day) ? prev.days.filter(d => d !== day) : [...prev.days, day] }));

  const handleEditSlot = (i) => {
    const sch = form.schedules[i];
    setNewSchedule({
      type: sch.type || 'overall',
      startDate: sch.startDate || '',
      endDate: sch.endDate || sch.startDate || '',
      days: sch.days || [],
      open: sch.open || '09:00',
      close: sch.close || '18:00',
      isClosed: sch.isClosed || false,
      capacity: sch.capacity || ''
    });
    setEditIndex(i);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editIndex !== null) {
      alert("You are currently editing a schedule slot. Please click '✓ Update Slot' (or 'Cancel Edit') in the Configure Slots section before saving the profile.");
      return;
    }
    setSaving(true); setError(''); setSuccess('');
    try {
      const payload = { ...form };
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

          {/* Availability & Capacity Settings */}
          <div style={card}>
            <div style={ch}><h3 style={{ margin: 0, fontWeight: 600, color: '#e2e8f0', fontSize: '1rem' }}>Availability &amp; Capacity Settings</h3></div>
            <div style={{ padding: '1.25rem' }}>
              <p style={{ margin: '0 0 1rem', color: '#6b7280', fontSize: '.78rem' }}>
                Define your service schedule and vehicle capacity below.
              </p>
              
              <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'stretch', flexWrap: 'wrap' }}>
                {/* Left Column: Generate Slots */}
                <div style={{ flex: '1 1 400px', background: 'linear-gradient(145deg, #0d0e2b, #111330)', borderRadius: '16px', padding: '1.75rem', border: '1px solid rgba(6,182,212,0.15)', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.5rem' }}>
                    <span style={{ fontSize: '1.4rem' }}>⚙️</span>
                    <h4 style={{ color: '#06b6d4', margin: 0, fontSize: '1.15rem', fontWeight: 800, letterSpacing: '0.5px' }}>Configure Slots</h4>
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.5rem' }}>
                    <div>
                      <label style={lbl}>Start Date</label>
                      <input type="date" style={inp} value={newSchedule.startDate} onChange={(e) => setNewSchedule(prev => ({ ...prev, startDate: e.target.value }))} />
                    </div>
                    <div>
                      <label style={lbl}>End Date</label>
                      <input type="date" style={inp} value={newSchedule.endDate} onChange={(e) => setNewSchedule(prev => ({ ...prev, endDate: e.target.value }))} />
                    </div>
                  </div>

                  <div style={{ marginBottom: '1.5rem' }}>
                    <label style={lbl}>Applicable Days</label>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      {ALL_DAYS.map(day => {
                        const checked = newSchedule.days.includes(day);
                        return (
                          <button key={day} type="button" onClick={() => toggleNewScheduleDay(day)}
                            style={{
                              background: checked ? 'rgba(6,182,212,0.15)' : 'rgba(255,255,255,0.03)',
                              border: checked ? '1px solid rgba(6,182,212,0.5)' : '1px solid rgba(255,255,255,0.08)',
                              color: checked ? '#00e5ff' : '#9ca3af',
                              borderRadius: '8px', padding: '0.5rem 0.8rem', fontSize: '0.78rem', fontWeight: 600,
                              display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', transition: 'all 0.2s',
                              boxShadow: checked ? '0 0 10px rgba(6,182,212,0.1)' : 'none'
                            }}>
                            <span style={{ fontSize: '0.9rem', opacity: checked ? 1 : 0.4 }}>{checked ? '✓' : '+'}</span> {DAY_ABBR[day]}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.25rem', marginBottom: '1.75rem' }}>
                    <div>
                      <label style={lbl}>Start Time</label>
                      <input type="time" style={inp} value={newSchedule.open} onChange={(e) => setNewSchedule(prev => ({ ...prev, open: e.target.value }))} />
                    </div>
                    <div>
                      <label style={lbl}>End Time</label>
                      <input type="time" style={inp} value={newSchedule.close} onChange={(e) => setNewSchedule(prev => ({ ...prev, close: e.target.value }))} />
                    </div>
                    <div>
                      <label style={lbl}>Capacity</label>
                      <input type="number" min="1" style={{...inp, color: '#fff'}} value={newSchedule.capacity} onChange={(e) => setNewSchedule({...newSchedule, capacity: e.target.value ? Number(e.target.value) : ''})} placeholder={form.capacity || 10} />
                    </div>
                  </div>

                  <button type="button" onClick={() => {
                    if (newSchedule.days.length === 0) return alert('Select at least one day');
                    if (!newSchedule.open || !newSchedule.close) return alert('Select open and close times');
                    
                    const newArr = [...(form.schedules || [])];
                    let dupCount = 0;
                    const generated = [];

                    if (newSchedule.startDate && newSchedule.endDate) {
                      const start = new Date(newSchedule.startDate + 'T00:00:00');
                      const end = new Date(newSchedule.endDate + 'T00:00:00');
                      if (start > end) return alert('End Date must be after Start Date');
                      
                      const dayMap = { 0: 'sunday', 1: 'monday', 2: 'tuesday', 3: 'wednesday', 4: 'thursday', 5: 'friday', 6: 'saturday' };
                      let current = new Date(start);
                      let matchCount = 0;

                      while (current <= end) {
                        const dayStr = dayMap[current.getDay()];
                        if (newSchedule.days.includes(dayStr)) {
                          matchCount++;
                          const localDateString = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}-${String(current.getDate()).padStart(2, '0')}`;
                          
                          const isOverlap = newArr.some((ex, idx) => {
                            if (idx === editIndex) return false;
                            if (ex.startDate === localDateString || (ex.type === 'overall' && ex.days.includes(dayStr))) {
                              return (newSchedule.open < ex.close && newSchedule.close > ex.open);
                            }
                            return false;
                          });

                          if (isOverlap) {
                            dupCount++;
                          } else {
                            generated.push({
                              type: 'single_date',
                              startDate: localDateString,
                              endDate: '',
                              days: [dayStr],
                              open: newSchedule.open,
                              close: newSchedule.close,
                              capacity: newSchedule.capacity || form.capacity || 10,
                              isClosed: false
                            });
                          }
                        }
                        current.setDate(current.getDate() + 1);
                      }
                      if (matchCount === 0) return alert('No matching days found in the selected date range.');
                      if (generated.length === 0 && dupCount > 0) return alert(`All ${dupCount} selected slots conflict with existing schedules!`);
                      if (dupCount > 0) alert(`Skipped ${dupCount} conflicting slots.`);
                    } else {
                      newSchedule.days.forEach(dayStr => {
                        const isOverlap = newArr.some((ex, idx) => {
                          if (idx === editIndex) return false;
                          if ((ex.startDate === '' || ex.type === 'overall') && ex.days.includes(dayStr)) {
                            return (newSchedule.open < ex.close && newSchedule.close > ex.open);
                          }
                          return false;
                        });

                        if (isOverlap) {
                          dupCount++;
                        } else {
                          generated.push({
                            type: 'overall',
                            startDate: '',
                            endDate: '',
                            days: [dayStr],
                            open: newSchedule.open,
                            close: newSchedule.close,
                            capacity: newSchedule.capacity || form.capacity || 10,
                            isClosed: false
                          });
                        }
                      });
                      if (generated.length === 0 && dupCount > 0) return alert(`All selected days conflict with existing schedules!`);
                      if (dupCount > 0) alert(`Skipped ${dupCount} conflicting days.`);
                    }

                    if (editIndex !== null) {
                      newArr.splice(editIndex, 1, ...generated);
                      setEditIndex(null);
                    } else {
                      newArr.push(...generated);
                    }

                    set('schedules', newArr);
                    setNewSchedule({ type: 'overall', startDate: '', endDate: '', days: ['monday','tuesday','wednesday','thursday','friday'], open: '09:00', close: '18:00', isClosed: false, capacity: form.capacity || 10 });
                  }} style={{ width: '100%', background: 'linear-gradient(90deg, #06b6d4, #3b82f6)', color: '#fff', border: 'none', padding: '0.9rem', borderRadius: '10px', fontWeight: 700, cursor: 'pointer', fontSize: '0.95rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', boxShadow: '0 4px 15px rgba(6,182,212,0.3)', transition: 'transform 0.1s' }}
                     onMouseDown={e => e.currentTarget.style.transform = 'scale(0.98)'}
                     onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
                     onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
                    <span style={{ fontSize: '1.1rem' }}>{editIndex !== null ? '✓' : '+'}</span> {editIndex !== null ? 'Update Slot' : 'Add Schedule Rule'}
                  </button>
                  
                  {editIndex !== null && (
                    <button type="button" onClick={() => {
                      setEditIndex(null);
                      setNewSchedule({ type: 'overall', startDate: '', endDate: '', days: ['monday','tuesday','wednesday','thursday','friday'], open: '09:00', close: '18:00', isClosed: false });
                    }} style={{ width: '100%', background: 'transparent', color: '#9ca3af', border: '1px solid rgba(255,255,255,0.1)', padding: '0.6rem', borderRadius: '10px', fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem', marginTop: '0.5rem' }}>
                      Cancel Edit
                    </button>
                  )}
                </div>

                {/* Right Column: All Scheduled Slots */}
                <div style={{ flex: '1 1 400px', background: 'rgba(0,0,0,0.25)', borderRadius: '16px', padding: '1.5rem', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', height: '100%', minHeight: '450px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', paddingBottom: '0.75rem', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                    <h4 style={{ color: '#e2e8f0', margin: 0, fontSize: '1.05rem', fontWeight: 700 }}>Active Schedules</h4>
                    <span style={{ background: 'rgba(6,182,212,0.15)', color: '#00e5ff', padding: '4px 12px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 700, border: '1px solid rgba(6,182,212,0.3)' }}>{form.schedules?.length || 0} Rules</span>
                  </div>

                  <div style={{ flex: 1, overflowY: 'auto', maxHeight: '400px', display: 'flex', flexDirection: 'column', gap: '0.85rem', paddingRight: '0.5rem' }}>
                    {form.schedules?.map((sch, i) => (
                      <div key={i} style={{ background: editIndex === i ? 'rgba(6,182,212,0.08)' : 'linear-gradient(135deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))', borderRadius: '12px', padding: '1.25rem', border: editIndex === i ? '1px solid rgba(6,182,212,0.4)' : '1px solid rgba(255,255,255,0.05)', borderLeft: editIndex === i ? '4px solid #06b6d4' : '4px solid #818cf8', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'all 0.2s', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                           onMouseOver={e => { if (editIndex !== i) e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
                           onMouseOut={e => { if (editIndex !== i) e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))' }}>
                        <div>
                          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
                            {sch.startDate && <span style={{ background: 'rgba(59,130,246,0.15)', color: '#60a5fa', fontSize: '0.65rem', padding: '3px 8px', borderRadius: '6px', fontWeight: 700, border: '1px solid rgba(59,130,246,0.3)' }}>{sch.startDate} {sch.endDate ? `to ${sch.endDate}` : ''}</span>}
                            {(sch.days || []).slice(0,3).map(d => (
                               <span key={d} style={{ background: 'rgba(255,255,255,0.06)', color: '#cbd5e1', fontSize: '0.65rem', padding: '3px 8px', borderRadius: '6px', fontWeight: 600 }}>{DAY_ABBR[d].toUpperCase()}</span>
                            ))}
                            {(sch.days?.length > 3) && <span style={{ background: 'rgba(255,255,255,0.06)', color: '#cbd5e1', fontSize: '0.65rem', padding: '3px 8px', borderRadius: '6px', fontWeight: 600 }}>+{sch.days.length - 3}</span>}
                          </div>
                          <div style={{ color: '#f1f5f9', fontWeight: 700, fontSize: '1.1rem', marginBottom: '0.4rem', letterSpacing: '0.5px' }}>
                            {sch.open} <span style={{ color: '#64748b', fontWeight: 400 }}>—</span> {sch.close}
                          </div>
                          <div style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 500 }}>
                            <span>Cap:</span> <span style={{ color: '#fff', fontWeight: 600 }}>{sch.capacity || form.capacity || 10}</span> <span style={{ margin: '0 6px', color: '#334155' }}>|</span> <span>Booked:</span> <span style={{ color: '#fff', fontWeight: 600 }}>0</span>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button type="button" onClick={() => handleEditSlot(i)} style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6', border: '1px solid rgba(59,130,246,0.2)', padding: '8px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}
                                  onMouseOver={e => e.currentTarget.style.background = 'rgba(59,130,246,0.2)'}
                                  onMouseOut={e => e.currentTarget.style.background = 'rgba(59,130,246,0.1)'}>
                            ✏️
                          </button>
                          <button type="button" onClick={() => {
                            if (editIndex === i) {
                              setEditIndex(null);
                              setNewSchedule({ type: 'overall', startDate: '', endDate: '', days: ['monday','tuesday','wednesday','thursday','friday'], open: '09:00', close: '18:00', isClosed: false, capacity: form.capacity || 10 });
                            }
                            if (editIndex !== null && i < editIndex) setEditIndex(editIndex - 1);
                            set('schedules', form.schedules.filter((_, idx) => idx !== i));
                          }} style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)', padding: '8px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}
                                  onMouseOver={e => e.currentTarget.style.background = 'rgba(239,68,68,0.2)'}
                                  onMouseOut={e => e.currentTarget.style.background = 'rgba(239,68,68,0.1)'}>
                            🗑️
                          </button>
                        </div>
                      </div>
                    ))}
                    {(!form.schedules || form.schedules.length === 0) && (
                      <div style={{ color: '#64748b', textAlign: 'center', marginTop: '3rem', fontSize: '0.85rem', fontWeight: 500 }}>
                        <div style={{ fontSize: '2rem', marginBottom: '0.5rem', opacity: 0.5 }}>🗓️</div>
                        No schedules configured yet.
                      </div>
                    )}
                  </div>
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

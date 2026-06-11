import { useEffect, useState, useRef } from 'react';
import AdminSidebar from '../../components/admin/AdminSidebar';
import AdminPageHeader from '../../components/admin/AdminPageHeader';
import { franchiseAPI } from '../../api';

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
  return <div ref={divRef} style={{ height: 240, borderRadius: 10, border: '1px solid rgba(255,255,255,0.12)', overflow: 'hidden', marginTop: '.5rem' }} />;
}

const EMPTY_FORM = {
  name: '', email: '', phone: '', owner: '',
  address: { street: '', city: '', state: '', pincode: '' },
  licenseNumber: '', gstNumber: '', capacity: 10,
  schedules: [{ type: 'overall', days: ['monday','tuesday','wednesday','thursday','friday'], open: '09:00', close: '18:00', isClosed: false }],
  lat: '', lng: '',
};

const ALL_DAYS = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];
const DAY_ABBR  = { monday:'Mon', tuesday:'Tue', wednesday:'Wed', thursday:'Thu', friday:'Fri', saturday:'Sat', sunday:'Sun' };

const STATUS_CFG = {
  pending:   { color: '#f59e0b', label: 'Pending'   },
  active:    { color: '#22c55e', label: 'Active'    },
  suspended: { color: '#ef4444', label: 'Suspended' },
};

function FrBadge({ status }) {
  const cfg = STATUS_CFG[status] || { color: '#6b7280', label: status };
  return (
    <span style={{ padding: '3px 11px', borderRadius: 20, fontSize: '.72rem', fontWeight: 600, color: cfg.color, background: `${cfg.color}18`, border: `1px solid ${cfg.color}40`, textTransform: 'capitalize' }}>{cfg.label}</span>
  );
}

function DarkModal({ title, onClose, children }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
      <div style={{ background: '#0d0e2b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16, width: '100%', maxWidth: 1050, maxHeight: '90vh', overflow: 'auto', boxShadow: '0 25px 60px rgba(0,0,0,.7)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <h3 style={{ margin: 0, fontWeight: 700, fontSize: '1.05rem', color: '#e2e8f0' }}>{title}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#6b7280', lineHeight: 1 }}>×</button>
        </div>
        <div style={{ padding: '1.5rem' }}>{children}</div>
      </div>
    </div>
  );
}

export default function AdminFranchisesPage() {
  const [franchises, setFranchises] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [tab, setTab]               = useState('all');
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState(EMPTY_FORM);
  const [createError, setCreateError] = useState('');
  const [creating, setCreating]     = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [editForm, setEditForm]     = useState(EMPTY_FORM);
  const [editError, setEditError]   = useState('');
  const [saving, setSaving]         = useState(false);

  const bg   = { background: '#06071a', color: '#e2e8f0', minHeight: '100vh', display: 'flex' };
  const card = { background: '#0d0e2b', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12 };

  const load = () => {
    setLoading(true);
    franchiseAPI.list({ status: 'all' })
      .then((r) => setFranchises(r.data.franchises || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const handleStatus = async (id, status) => {
    try { await franchiseAPI.updateStatus(id, { status }); load(); } catch (err) { console.error(err); }
  };

  const handleCreate = async (e) => {
    e.preventDefault(); setCreating(true); setCreateError('');
    try { await franchiseAPI.create(createForm); setShowCreate(false); setCreateForm(EMPTY_FORM); load(); }
    catch (err) { setCreateError(err.response?.data?.message || 'Failed to create franchise'); }
    finally { setCreating(false); }
  };

  const openEdit = (f) => {
    setEditTarget(f);
    let initialSchedules = f.schedules || [];
    if (initialSchedules.length === 0 && f.workingHours) {
      initialSchedules = [{
        type: 'overall',
        startDate: '',
        endDate: '',
        days: f.availableDays || ['monday','tuesday','wednesday','thursday','friday'],
        open: f.workingHours.open || '09:00',
        close: f.workingHours.close || '18:00',
        isClosed: false
      }];
    }

    setEditForm({
      name: f.name || '', email: f.email || '', phone: f.phone || '',
      licenseNumber: f.licenseNumber || '', gstNumber: f.gstNumber || '', capacity: f.capacity || 10,
      address: { street: f.address?.street || '', city: f.address?.city || '', state: f.address?.state || '', pincode: f.address?.pincode || '' },
      schedules: initialSchedules,
      lat: f.location?.coordinates?.[1]?.toString() || '',
      lng: f.location?.coordinates?.[0]?.toString() || '',
    });
    setEditError('');
  };

  const handleEdit = async (e) => {
    e.preventDefault(); setSaving(true); setEditError('');
    try { await franchiseAPI.update(editTarget._id, editForm); setEditTarget(null); load(); }
    catch (err) { setEditError(err.response?.data?.message || 'Failed to update franchise'); }
    finally { setSaving(false); }
  };

  const filtered = tab === 'all' ? franchises : franchises.filter((f) => f.status === tab);
  const counts = {
    all: franchises.length,
    pending:   franchises.filter((f) => f.status === 'pending').length,
    active:    franchises.filter((f) => f.status === 'active').length,
    suspended: franchises.filter((f) => f.status === 'suspended').length,
  };

  const STAT_CARDS = [
    { key: 'all',       label: 'Total',     icon: '🏪', color: '#0EA5E9' },
    { key: 'pending',   label: 'Pending',   icon: '⏳', color: '#f59e0b' },
    { key: 'active',    label: 'Active',    icon: '✅', color: '#22c55e' },
    { key: 'suspended', label: 'Suspended', icon: '🚫', color: '#ef4444' },
  ];

  if (loading) return (
    <div style={bg}>
      <AdminSidebar />
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 40, height: 40, border: '4px solid rgba(0,229,255,.2)', borderTopColor: '#00e5ff', borderRadius: '50%', animation: 'spin .8s linear infinite' }} />
      </div>
    </div>
  );

  return (
    <div style={bg}>
      <AdminSidebar />
      <div style={{ flex: 1, padding: '1.5rem 2rem', overflowY: 'auto' }}>

        {/* Header */}
        <AdminPageHeader 
          title="Service Centres" 
          subtitle="Manage franchise locations and inventory allocations" 
        />
        
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1.25rem' }}>
          <button onClick={() => setShowCreate(true)}
            style={{ background: '#1a6ef7', border: 'none', borderRadius: 8, padding: '.65rem 1.25rem', color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: '.85rem' }}>
            + Add Franchise
          </button>
        </div>

        {/* Stat Strip */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
          {STAT_CARDS.map(({ key, label, icon, color }) => (
            <div key={key} onClick={() => setTab(key)} style={{ background: tab === key ? `${color}14` : '#0d0e2b', border: `1px solid ${tab === key ? color + '50' : 'rgba(255,255,255,0.06)'}`, borderRadius: 12, padding: '1rem 1.25rem', cursor: 'pointer', transition: 'all .15s' }}>
              <div style={{ fontSize: '1.3rem', marginBottom: '.35rem' }}>{icon}</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color }}>{counts[key]}</div>
              <div style={{ fontSize: '.75rem', color: '#6b7280', marginTop: '.15rem' }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Tab Bar */}
        <div style={{ display: 'flex', gap: '.25rem', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '.75rem' }}>
          {['all', 'pending', 'active', 'suspended'].map((t) => (
            <button key={t} onClick={() => setTab(t)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '.4rem .9rem', borderRadius: 8, fontWeight: tab === t ? 700 : 500, color: tab === t ? '#00e5ff' : '#6b7280', fontSize: '.85rem', textTransform: 'capitalize', borderBottom: tab === t ? '2px solid #00e5ff' : '2px solid transparent' }}>
              {t}
              {counts[t] > 0 && <span style={{ marginLeft: 5, background: tab === t ? 'rgba(0,229,255,0.15)' : 'rgba(255,255,255,0.06)', color: tab === t ? '#00e5ff' : '#6b7280', borderRadius: 999, padding: '.1rem .45rem', fontSize: '.68rem', fontWeight: 700 }}>{counts[t]}</span>}
            </button>
          ))}
        </div>

        {/* Grid */}
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: '#4b5563' }}>
            <div style={{ fontSize: '3rem', marginBottom: '.5rem' }}>🏪</div>
            <p>No {tab === 'all' ? '' : tab} franchises found</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(340px,1fr))', gap: '1.25rem' }}>
            {filtered.map((f) => {
              const sc = STATUS_CFG[f.status] || { color: '#6b7280' };
              return (
                <div key={f._id} style={{ ...card, borderTop: `2px solid ${sc.color}`, padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div>
                    <div style={{ display: 'flex', gap: '.5rem', alignItems: 'center', flexWrap: 'wrap', marginBottom: '.3rem' }}>
                      <span style={{ fontWeight: 700, fontSize: '.95rem', color: '#e2e8f0' }}>{f.name}</span>
                      <FrBadge status={f.status} />
                    </div>
                    <p style={{ margin: 0, color: '#6b7280', fontSize: '.78rem' }}>📍 {f.address?.street}, {f.address?.city}, {f.address?.state} — {f.address?.pincode}</p>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.3rem .75rem', fontSize: '.82rem', color: '#9ca3af' }}>
                    <div>📧 {f.email}</div>
                    <div>📱 {f.phone}</div>
                    {f.owner?.name && <div>👤 {f.owner.name}</div>}
                    <div>🚗 Cap: {f.capacity}/day</div>
                    {f.licenseNumber && <div>🪪 {f.licenseNumber}</div>}
                    {f.gstNumber     && <div>🏛️ {f.gstNumber}</div>}
                  </div>
                  <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap' }}>
                    <button onClick={() => openEdit(f)} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 7, padding: '.35rem .85rem', color: '#9ca3af', fontSize: '.78rem', cursor: 'pointer', fontWeight: 600 }}>✏️ Edit</button>
                    {f.status === 'pending' && (
                      <>
                        <button onClick={() => handleStatus(f._id, 'active')} style={{ background: 'rgba(34,197,94,.12)', border: '1px solid rgba(34,197,94,.3)', borderRadius: 7, padding: '.35rem .85rem', color: '#22c55e', fontSize: '.78rem', cursor: 'pointer', fontWeight: 600 }}>✅ Approve</button>
                        <button onClick={() => handleStatus(f._id, 'suspended')} style={{ background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.3)', borderRadius: 7, padding: '.35rem .85rem', color: '#ef4444', fontSize: '.78rem', cursor: 'pointer', fontWeight: 600 }}>❌ Reject</button>
                      </>
                    )}
                    {f.status === 'active' && (
                      <button onClick={() => handleStatus(f._id, 'suspended')} style={{ background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.3)', borderRadius: 7, padding: '.35rem .85rem', color: '#ef4444', fontSize: '.78rem', cursor: 'pointer', fontWeight: 600 }}>🚫 Suspend</button>
                    )}
                    {f.status === 'suspended' && (
                      <button onClick={() => handleStatus(f._id, 'active')} style={{ background: 'rgba(34,197,94,.12)', border: '1px solid rgba(34,197,94,.3)', borderRadius: 7, padding: '.35rem .85rem', color: '#22c55e', fontSize: '.78rem', cursor: 'pointer', fontWeight: 600 }}>♻️ Reactivate</button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>

      {showCreate && (
        <DarkModal title="Add New Franchise" onClose={() => { setShowCreate(false); setCreateForm(EMPTY_FORM); setCreateError(''); }}>
          {createError && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', borderRadius: 8, padding: '.75rem', marginBottom: '1rem', fontSize: '.85rem' }}>{createError}</div>}
          <FranchiseForm form={createForm} setForm={setCreateForm} onSubmit={handleCreate} submitting={creating} submitLabel="Create Franchise" onCancel={() => { setShowCreate(false); setCreateForm(EMPTY_FORM); setCreateError(''); }} />
        </DarkModal>
      )}

      {editTarget && (
        <DarkModal title={`Edit — ${editTarget.name}`} onClose={() => setEditTarget(null)}>
          {editError && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', borderRadius: 8, padding: '.75rem', marginBottom: '1rem', fontSize: '.85rem' }}>{editError}</div>}
          <FranchiseForm form={editForm} setForm={setEditForm} onSubmit={handleEdit} submitting={saving} submitLabel="Save Changes" onCancel={() => setEditTarget(null)} hideOwner />
        </DarkModal>
      )}
    </div>
  );
}

/* ── Shared form component ── */
function FranchiseForm({ form, setForm, onSubmit, submitting, submitLabel, onCancel, hideOwner }) {
  const [newSchedule, setNewSchedule] = useState({
    type: 'overall', startDate: '', endDate: '', days: ['monday','tuesday','wednesday','thursday','friday'],
    open: '09:00', close: '18:00', isClosed: false, capacity: form?.capacity || 10
  });
  const [editIndex, setEditIndex] = useState(null);
  
  const toggleNewScheduleDay = (day) => setNewSchedule(prev => ({ ...prev, days: prev.days.includes(day) ? prev.days.filter(d => d !== day) : [...prev.days, day] }));
  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));
  const setAddr = (key, val) => setForm((f) => ({ ...f, address: { ...f.address, [key]: val } }));

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

  const inp  = { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '.55rem .85rem', color: '#e2e8f0', fontSize: '.85rem', outline: 'none', width: '100%', boxSizing: 'border-box' };
  const lbl  = { fontSize: '.73rem', color: '#6b7280', display: 'block', marginBottom: '.3rem', textTransform: 'uppercase', letterSpacing: '.5px' };
  const section = { margin: '1.25rem 0 .75rem', fontSize: '.9rem', fontWeight: 700, color: '#9ca3af' };
  const ch = { padding: '1.25rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.06)' };
  const card = { background: '#0d0e2b', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12 };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (editIndex !== null) {
      alert("You are currently editing a schedule slot. Please click '✓ Update Slot' (or 'Cancel Edit') in the Configure Slots section before saving the franchise.");
      return;
    }
    onSubmit(e);
  };

  return (
    <form onSubmit={handleFormSubmit}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div style={{ gridColumn: '1/-1' }}>
          <label style={lbl}>Franchise / Business Name *</label>
          <input style={inp} value={form.name} onChange={(e) => set('name', e.target.value)} required />
        </div>
        {!hideOwner && (
          <div style={{ gridColumn: '1/-1' }}>
            <label style={lbl}>Owner User ID *</label>
            <input style={inp} value={form.owner} onChange={(e) => set('owner', e.target.value)} placeholder="MongoDB User _id" required />
          </div>
        )}
        <div><label style={lbl}>Email *</label><input type="email" style={inp} value={form.email} onChange={(e) => set('email', e.target.value)} required /></div>
        <div><label style={lbl}>Phone *</label><input style={inp} value={form.phone} onChange={(e) => set('phone', e.target.value)} required /></div>
        <div><label style={lbl}>License Number</label><input style={inp} value={form.licenseNumber} onChange={(e) => set('licenseNumber', e.target.value)} /></div>
        <div><label style={lbl}>GST Number</label><input style={inp} value={form.gstNumber} onChange={(e) => set('gstNumber', e.target.value)} /></div>
        <div style={{ gridColumn: '1/-1' }}><label style={lbl}>Default Daily Capacity</label><input type="number" style={inp} value={form.capacity} onChange={(e) => set('capacity', e.target.value)} /></div>
      </div>

      <div style={section}>📍 Service Centre Address</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div style={{ gridColumn: '1/-1' }}><label style={lbl}>Street *</label><input style={inp} value={form.address.street} onChange={(e) => setAddr('street', e.target.value)} required /></div>
        <div><label style={lbl}>City *</label><input style={inp} value={form.address.city} onChange={(e) => setAddr('city', e.target.value)} required /></div>
        <div><label style={lbl}>State *</label><input style={inp} value={form.address.state} onChange={(e) => setAddr('state', e.target.value)} required /></div>
        <div><label style={lbl}>Pincode *</label><input style={inp} value={form.address.pincode} onChange={(e) => setAddr('pincode', e.target.value)} required /></div>
      </div>

      <div style={section}>📍 Location on Map</div>
      <p style={{ margin: '0 0 .5rem', color: '#6b7280', fontSize: '.78rem' }}>
        Click or drag the pin to set GPS coordinates for nearby-search.
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
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '.75rem', marginBottom: '.25rem' }}>
        <div><label style={lbl}>Latitude</label><input type="number" step="any" style={inp} value={form.lat} onChange={(e) => setForm((f) => ({ ...f, lat: e.target.value }))} placeholder="e.g. 9.9252" /></div>
        <div><label style={lbl}>Longitude</label><input type="number" step="any" style={inp} value={form.lng} onChange={(e) => setForm((f) => ({ ...f, lng: e.target.value }))} placeholder="e.g. 78.1198" /></div>
      </div>

      <div style={section}>⏰ Availability & Capacity Settings</div>
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

      <div style={{ display: 'flex', gap: '.75rem', marginTop: '1.75rem' }}>
        <button type="submit" disabled={submitting} style={{ background: '#1a6ef7', border: 'none', borderRadius: 8, padding: '.6rem 1.75rem', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: '.88rem' }}>
          {submitting ? 'Saving…' : submitLabel}
        </button>
        <button type="button" onClick={onCancel} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, padding: '.6rem 1.25rem', color: '#9ca3af', cursor: 'pointer', fontSize: '.85rem' }}>Cancel</button>
      </div>
    </form>
  );
}

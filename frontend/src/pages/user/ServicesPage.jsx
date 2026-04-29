import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import UserSidebar from '../../components/user/UserSidebar';
import UserPageHeader from '../../components/user/UserPageHeader';
import Spinner from '../../components/common/Spinner';
import { StatusBadge, ServiceProgressBar } from '../../components/common/UI';
import { serviceAPI, vehicleAPI, franchiseAPI, feedbackAPI } from '../../api';

function InvoiceViewModal({ service, onClose }) {
  const items = service.invoiceItems || [];
  const total = service.finalAmount || items.reduce((s, i) => s + (Number(i.amount) || 0), 0);
  const upiId = service.franchise?.upiId;
  const upiString = upiId
    ? `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(service.franchise?.name || 'EVserv')}&am=${total}&cu=INR&tn=${encodeURIComponent('INV-' + (service.invoiceNumber || ''))}`
    : null;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1200, padding: '1rem' }}>
      <div style={{ background: '#0a0f1e', border: '1px solid #1e3a5f', borderRadius: '18px', width: '100%', maxWidth: '620px', maxHeight: '92vh', overflow: 'auto', boxShadow: '0 30px 80px rgba(0,0,0,.7)', color: '#e2e8f0' }}>

        {/* Modal header bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.5rem', borderBottom: '1px solid #1e2d3d' }}>
          <span style={{ fontWeight: 700, color: '#e2e8f0', fontSize: '.95rem' }}>🧾 Tax Invoice</span>
          <div style={{ display: 'flex', gap: '.5rem' }}>
            <button onClick={() => window.print()} style={{ background: 'linear-gradient(135deg,#6366f1,#06b6d4)', color: '#fff', border: 'none', borderRadius: '8px', padding: '.35rem .9rem', cursor: 'pointer', fontSize: '.8rem', fontWeight: 600 }}>🖨️ Print</button>
            <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer', color: '#64748b', lineHeight: 1 }}>×</button>
          </div>
        </div>

        <div style={{ padding: '1.5rem', fontFamily: 'sans-serif' }} id="invoice-print-area">

          {/* Logo banner */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', background: 'linear-gradient(135deg,#0d1b3e,#0a2a4a)', border: '1px solid #1e3a5f', borderRadius: '12px', padding: '14px 20px', marginBottom: '14px' }}>
            <div style={{ width: 44, height: 44, background: 'linear-gradient(135deg,#6366f1,#06b6d4)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', flexShrink: 0 }}>⚡</div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#38bdf8', letterSpacing: '.3px' }}>Kevell Motors</div>
              <div style={{ fontSize: '.7rem', color: '#475569', letterSpacing: '1.2px', textTransform: 'uppercase', marginTop: '2px' }}>EV Service Center</div>
            </div>
          </div>

          {/* Single-line: franchise info left | invoice meta right */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#111827', border: '1px solid #1e3a5f', borderRadius: '10px', padding: '12px 16px', marginBottom: '14px', gap: '12px' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              {service.franchise?.name && <div style={{ fontWeight: 700, fontSize: '.875rem', color: '#cbd5e1', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{service.franchise.name}</div>}
              {service.franchise?.address && <div style={{ fontSize: '.75rem', color: '#475569', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: '2px' }}>{service.franchise.address.street}{service.franchise.address.city ? `, ${service.franchise.address.city}` : ''}</div>}
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{ fontSize: '.7rem', fontWeight: 700, letterSpacing: '1.2px', textTransform: 'uppercase', color: '#38bdf8' }}>Tax Invoice</div>
              {service.invoiceNumber && <div style={{ color: '#94a3b8', fontSize: '.75rem', marginTop: '2px' }}>#{service.invoiceNumber}</div>}
              {service.invoiceDate && <div style={{ color: '#475569', fontSize: '.7rem', marginTop: '2px' }}>{new Date(service.invoiceDate).toLocaleDateString('en-IN')}</div>}
            </div>
          </div>

          {/* Bill to */}
          <div style={{ background: '#111827', border: '1px solid #1e3a5f', borderRadius: '10px', padding: '12px 16px', marginBottom: '14px' }}>
            <div style={{ fontSize: '.7rem', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', color: '#38bdf8', marginBottom: '8px' }}>Bill To</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
              <span style={{ fontWeight: 700, fontSize: '.9rem', color: '#f1f5f9' }}>{service.vehicle?.registrationNumber} — {service.vehicle?.make} {service.vehicle?.model}</span>
            </div>
            <div style={{ fontSize: '.8rem', color: '#64748b', textTransform: 'capitalize', marginTop: '4px' }}>{service.serviceType} Service</div>
          </div>

          {/* Line items */}
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '12px', fontSize: '.875rem' }}>
            <thead>
              <tr style={{ background: '#0d1b3e', borderBottom: '2px solid #1e3a5f' }}>
                <th style={{ textAlign: 'left', padding: '9px 12px', color: '#38bdf8', fontWeight: 600, fontSize: '.7rem', letterSpacing: '.6px', textTransform: 'uppercase' }}>Description</th>
                <th style={{ textAlign: 'left', padding: '9px 12px', color: '#38bdf8', fontWeight: 600, fontSize: '.7rem', letterSpacing: '.6px', textTransform: 'uppercase' }}>Type</th>
                <th style={{ textAlign: 'right', padding: '9px 12px', color: '#38bdf8', fontWeight: 600, fontSize: '.7rem', letterSpacing: '.6px', textTransform: 'uppercase' }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {items.length > 0 ? items.map((item, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #1e2d3d', background: i % 2 === 1 ? '#0d1320' : 'transparent' }}>
                  <td style={{ padding: '10px 12px', color: '#cbd5e1' }}>{item.description}</td>
                  <td style={{ padding: '10px 12px', textTransform: 'capitalize', color: '#64748b', fontSize: '.82rem' }}>{item.type}</td>
                  <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700, color: '#4ade80' }}>₹{Number(item.amount).toLocaleString('en-IN')}</td>
                </tr>
              )) : (
                <tr><td colSpan={3} style={{ padding: '16px 12px', textAlign: 'center', color: '#475569', fontStyle: 'italic' }}>No invoice line items recorded</td></tr>
              )}
            </tbody>
          </table>

          {/* Total */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '14px' }}>
            <div style={{ background: 'linear-gradient(135deg,#0d1b3e,#0a2a4a)', border: '1px solid #1e3a5f', borderRadius: '10px', padding: '12px 20px', textAlign: 'right', minWidth: '200px' }}>
              <div style={{ color: '#64748b', fontSize: '.7rem', fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '4px' }}>Total Paid</div>
              <div style={{ fontWeight: 800, fontSize: '1.6rem', color: '#4ade80' }}>₹{total.toLocaleString('en-IN')}</div>
            </div>
          </div>

          {service.technicianNotes && (
            <div style={{ background: '#1a1700', border: '1px solid #3d3000', borderRadius: '8px', padding: '.75rem', fontSize: '.8rem', color: '#fde68a', marginBottom: '14px' }}>
              <strong>Technician Notes:</strong> {service.technicianNotes}
            </div>
          )}

          {/* UPI QR Code */}
          {upiString ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '1.25rem', background: '#0a1f0a', border: '1px solid #166534', borderRadius: '12px' }}>
              <div style={{ fontSize: '.85rem', fontWeight: 700, color: '#4ade80', marginBottom: '.75rem' }}>📱 Scan to Pay via UPI</div>
              <QRCodeSVG value={upiString} size={140} />
              <div style={{ fontSize: '.75rem', color: '#64748b', marginTop: '.6rem', textAlign: 'center' }}>
                Works with GPay, PhonePe, Paytm & all UPI apps
              </div>
              <div style={{ fontSize: '.75rem', color: '#475569', marginTop: '.3rem', fontFamily: 'monospace' }}>{upiId}</div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '.75rem', background: '#111827', border: '1px solid #1e3a5f', borderRadius: '8px', color: '#475569', fontSize: '.8rem' }}>
              UPI payment QR not available for this service centre
            </div>
          )}

          <div style={{ textAlign: 'center', marginTop: '1.25rem', color: '#334155', fontSize: '.75rem', borderTop: '1px solid #1e2d3d', paddingTop: '14px' }}>Thank you for choosing EVserv! 🚗⚡</div>
        </div>
      </div>
    </div>
  );
}

const SERVICE_TYPES = ['general', 'battery', 'motor', 'software', 'accident', 'amc', 'custom'];
const ALL_DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const DAY_ABBR = { monday: 'Mon', tuesday: 'Tue', wednesday: 'Wed', thursday: 'Thu', friday: 'Fri', saturday: 'Sat', sunday: 'Sun' };

function VoiceQueryBox({ description, setDescription, activeFranchises, selectedFranchise, setFranchise, onBlob }) {
  const [recState, setRecState] = useState('idle'); // 'idle' | 'recording' | 'done'
  const [audioURL, setAudioURL] = useState(null);
  const [interim, setInterim] = useState('');
  const [autoMatch, setAutoMatch] = useState('');
  const mediaRef = useRef(null);
  const chunksRef = useRef([]);
  const srRef = useRef(null);
  const txRef = useRef('');

  const tryMatchFranchise = (text) => {
    if (!text || selectedFranchise) return;
    const lower = text.toLowerCase();
    const match = activeFranchises.find(f => {
      const n = f.name.toLowerCase();
      return lower.includes(n) || n.split(/\W+/).some(w => w.length > 2 && lower.includes(w));
    });
    if (match) { setFranchise(match._id); setAutoMatch(match.name); }
  };

  const startRec = async () => {
    setAutoMatch('');
    txRef.current = '';
    setInterim('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SR) {
        const sr = new SR();
        sr.lang = 'en-IN'; sr.continuous = true; sr.interimResults = true;
        sr.onresult = (e) => {
          let inter = '';
          for (let i = e.resultIndex; i < e.results.length; i++) {
            if (e.results[i].isFinal) {
              txRef.current += (txRef.current ? ' ' : '') + e.results[i][0].transcript.trim();
              setDescription(txRef.current);
            } else inter += e.results[i][0].transcript;
          }
          setInterim(inter);
        };
        sr.onerror = () => {}; sr.onend = () => setInterim('');
        sr.start(); srRef.current = sr;
      }
      const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/ogg';
      const mr = new MediaRecorder(stream, { mimeType });
      chunksRef.current = [];
      mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        const url = URL.createObjectURL(blob);
        if (audioURL) URL.revokeObjectURL(audioURL);
        setAudioURL(url);
        onBlob(blob, mimeType);
        stream.getTracks().forEach(t => t.stop());
        tryMatchFranchise(txRef.current);
        setRecState('done');
      };
      mr.start(); mediaRef.current = mr;
      setRecState('recording');
    } catch { alert('Microphone access denied. Please allow microphone access.'); }
  };

  const stopRec = () => { srRef.current?.stop(); mediaRef.current?.stop(); };

  const deleteRec = () => {
    if (audioURL) URL.revokeObjectURL(audioURL);
    setAudioURL(null); setAutoMatch(''); txRef.current = '';
    setInterim(''); setDescription(''); onBlob(null, null);
    setRecState('idle');
  };

  const isRecording = recState === 'recording';
  const isDone = recState === 'done';

  return (
    <div className="form-group">
      <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem', marginBottom: '.35rem', flexWrap: 'wrap' }}>
        <label className="form-label" style={{ margin: 0 }}>Description</label>
        {!isRecording && !isDone && (
          <button type="button" onClick={startRec} style={{ background: '#f0fdf4', color: '#15803d', border: '1.5px solid #86efac', borderRadius: '8px', padding: '.25rem .65rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '.35rem', fontSize: '.78rem', fontWeight: 600 }}>
            🎤 Voice your Query
          </button>
        )}
        {isRecording && (
          <button type="button" onClick={stopRec} style={{ background: '#ef4444', color: '#fff', border: '1.5px solid #dc2626', borderRadius: '8px', padding: '.25rem .65rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '.35rem', fontSize: '.78rem', fontWeight: 600, animation: 'voice-pulse 1.5s infinite' }}>
            🔴 Recording… tap to Stop
          </button>
        )}
        {isDone && (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '.4rem', flexWrap: 'wrap' }}>
            <audio controls src={audioURL} style={{ height: 28 }} />
            <button type="button" onClick={startRec} style={{ background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '.2rem .5rem', cursor: 'pointer', fontSize: '.75rem' }}>🔄 Re-record</button>
            <button type="button" onClick={deleteRec} style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '6px', padding: '.2rem .5rem', cursor: 'pointer', fontSize: '.75rem' }}>🗑️ Delete</button>
          </div>
        )}
      </div>
      {isRecording && interim && (
        <div style={{ fontSize: '.8rem', color: '#64748b', fontStyle: 'italic', marginBottom: '.3rem' }}>"{interim}"</div>
      )}
      <textarea
        className="form-control"
        rows={3}
        value={description}
        onChange={(e) => { txRef.current = e.target.value; setDescription(e.target.value); }}
        placeholder={isRecording ? 'Listening… speak now' : 'Describe the issue, or tap 🎤 to record your voice query…'}
        readOnly={isRecording}
        style={{ background: isRecording ? '#fafafa' : undefined }}
      />
      {autoMatch && (
        <div style={{ marginTop: '.35rem', fontSize: '.8rem', color: '#15803d', fontWeight: 500 }}>
          ✅ Auto-selected service centre: <strong>{autoMatch}</strong>
        </div>
      )}
    </div>
  );
}

function FranchiseCard({ f, selected, onSelect, distanceKm }) {
  const today = ALL_DAYS[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1];
  const openToday = f.availableDays?.includes(today);
  const travelMins = distanceKm != null ? Math.max(1, Math.round(distanceKm * 2)) : null; // ~30 km/h avg
  return (
    <div
      onClick={() => onSelect(f._id)}
      style={{
        border: `2px solid ${selected ? '#0077b6' : '#e2e8f0'}`,
        borderRadius: '12px', padding: '1rem', cursor: 'pointer',
        background: selected ? '#eff8ff' : '#fff',
        transition: 'all .2s',
      }}
    >
      <div style={{ marginBottom: '.5rem' }}>
        <div style={{ fontWeight: 700, fontSize: '.95rem', marginBottom: '.35rem', wordBreak: 'break-word' }}>{f.name}</div>
        <div style={{ display: 'flex', gap: '.3rem', flexWrap: 'wrap', alignItems: 'center' }}>
          {distanceKm != null && (
            <span style={{
              fontSize: '.7rem', fontWeight: 700, padding: '.15rem .55rem', borderRadius: '999px',
              background: distanceKm <= 5 ? '#eff6ff' : distanceKm <= 15 ? '#f0fdf4' : '#fff8e1',
              color: distanceKm <= 5 ? '#1d4ed8' : distanceKm <= 15 ? '#15803d' : '#92400e',
              whiteSpace: 'nowrap',
            }}>📍 {distanceKm} km · ~{travelMins} min</span>
          )}
          <span style={{
            fontSize: '.7rem', fontWeight: 700, padding: '.15rem .5rem', borderRadius: '999px',
            background: openToday ? '#dcfce7' : '#fef2f2',
            color: openToday ? '#15803d' : '#dc2626',
          }}>{openToday ? 'Open Today' : 'Closed Today'}</span>
        </div>
      </div>
      <div style={{ fontSize: '.8rem', color: '#64748b', marginBottom: '.4rem' }}>
        🏠 {f.address?.street}, {f.address?.city}
      </div>
      <div style={{ fontSize: '.8rem', color: '#64748b', marginBottom: '.4rem' }}>
        🕐 {f.workingHours?.open} – {f.workingHours?.close}
        {f.rating > 0 && <span style={{ marginLeft: '.75rem' }}>⭐ {f.rating.toFixed(1)}</span>}
      </div>
      {f.pickupDropService && (
        <div style={{ marginTop: '.5rem', display: 'flex', alignItems: 'center', gap: '.4rem', color: '#0ea5e9', fontSize: '.75rem', fontWeight: 700 }}>
          <span style={{ fontSize: '1rem' }}>📦</span> Pickup & Drop available
        </div>
      )}
      <div style={{ display: 'flex', gap: '.25rem', flexWrap: 'wrap', marginTop: '.5rem' }}>
        {ALL_DAYS.map((d) => (
          <span key={d} style={{
            fontSize: '.68rem', padding: '.1rem .35rem', borderRadius: '4px',
            background: f.availableDays?.includes(d) ? '#dbeafe' : '#f1f5f9',
            color: f.availableDays?.includes(d) ? '#1d4ed8' : '#94a3b8',
            fontWeight: f.availableDays?.includes(d) ? 700 : 400,
          }}>{DAY_ABBR[d]}</span>
        ))}
      </div>
    </div>
  );
}

function FeedbackModal({ service, onClose }) {
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!comment.trim()) { setError('Please write a comment'); return; }
    setSaving(true);
    setError('');
    try {
      const fd = new FormData();
      fd.append('service', service._id);
      fd.append('rating', rating);
      fd.append('comment', comment.trim());
      fd.append('category', 'service');
      await feedbackAPI.submit(fd);
      if (service.franchise?._id) {
        await feedbackAPI.submitReview({
          franchise: service.franchise._id,
          rating,
          title: title.trim(),
          comment: comment.trim(),
        });
      }
      onClose(service._id);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit. Please try again.');
      setSaving(false);
    }
  };

  const modalStyles = {
    overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
    box: { background: '#0d0e2b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', padding: '2rem', width: '100%', maxWidth: '460px', boxShadow: '0 20px 60px rgba(0,0,0,.6)', margin: '1rem' },
    title: { margin: 0, color: '#fff' },
    closeBtn: { background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer', color: '#94a3b8' },
    subtitle: { fontSize: '.85rem', color: '#94a3b8', marginBottom: '1.25rem' },
    label: { color: '#cbd5e1', fontSize: '.875rem', fontWeight: 500, marginBottom: '.4rem', display: 'block' },
    input: { background: '#06071a', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', color: '#fff', padding: '.55rem .85rem', width: '100%', outline: 'none', fontSize: '.9rem', boxSizing: 'border-box' },
    textarea: { background: '#06071a', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', color: '#fff', padding: '.55rem .85rem', width: '100%', outline: 'none', fontSize: '.9rem', resize: 'vertical', boxSizing: 'border-box' },
    starActive: { color: '#f59e0b', transition: 'color .15s' },
    starInactive: { color: '#334155', transition: 'color .15s' },
  };

  return (
    <div style={modalStyles.overlay}>
      <div style={modalStyles.box}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h3 style={modalStyles.title}>Rate Your Service</h3>
          <button onClick={() => onClose(null)} style={modalStyles.closeBtn}>✕</button>
        </div>
        <p style={modalStyles.subtitle}>
          {service.serviceType?.charAt(0).toUpperCase() + service.serviceType?.slice(1)} Service — {service.franchise?.name || 'Service Centre'}
        </p>
        {error && <div className="alert alert-danger" style={{ marginBottom: '1rem' }}>{error}</div>}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={modalStyles.label}>Rating *</label>
            <div style={{ display: 'flex', gap: '.35rem', fontSize: '2rem', cursor: 'pointer', lineHeight: 1 }}>
              {[1, 2, 3, 4, 5].map((star) => (
                <span key={star} onClick={() => setRating(star)} style={star <= rating ? modalStyles.starActive : modalStyles.starInactive}>★</span>
              ))}
            </div>
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label style={modalStyles.label}>Title (optional)</label>
            <input type="text" style={modalStyles.input} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Great service!" maxLength={100} />
          </div>
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={modalStyles.label}>Your Review *</label>
            <textarea style={modalStyles.textarea} rows={4} value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Tell us about your experience..." required />
          </div>
          <div style={{ display: 'flex', gap: '.75rem', justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-outline" onClick={() => onClose(null)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Submitting...' : 'Submit Review'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ServicesPage() {
  const [services, setServices] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [activeFranchises, setActiveFranchises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [showBook, setShowBook] = useState(false);
  const [form, setForm] = useState({ vehicle: '', serviceType: 'general', description: '', scheduledDate: '', franchise: '', pickupRequested: false });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [feedbackTarget, setFeedbackTarget] = useState(null);
  const [invoiceViewTarget, setInvoiceViewTarget] = useState(null);
  const [submittedFeedbacks, setSubmittedFeedbacks] = useState(new Set());
  const [voiceBlob, setVoiceBlob] = useState(null);
  const [voiceMimeType, setVoiceMimeType] = useState(null);
  const [nearbyList, setNearbyList] = useState(null);   // null = not fetched; [] = fetched but empty
  const [locationLoading, setLocationLoading] = useState(false);

  const load = () => Promise.all([serviceAPI.list(), vehicleAPI.list(), franchiseAPI.listActive(), feedbackAPI.myFeedback()])
    .then(([s, v, fr, fb]) => {
      setServices(s.data.services);
      setVehicles(v.data.vehicles);
      setActiveFranchises(fr.data.franchises || []);
      const submitted = new Set((fb.data.feedback || []).map(f => f.service?._id).filter(Boolean));
      setSubmittedFeedbacks(submitted);
    })
    .catch(console.error)
    .finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  // When booking form opens, fetch nearby franchises sorted by distance
  useEffect(() => {
    if (!showBook) { setNearbyList(null); return; }
    if (!navigator.geolocation) return;
    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const res = await franchiseAPI.nearby(coords.latitude, coords.longitude, 500);
          setNearbyList(res.data.franchises || []);
        } catch {
          setNearbyList(null);
        } finally {
          setLocationLoading(false);
        }
      },
      () => setLocationLoading(false),
      { timeout: 8000, maximumAge: 60000 },
    );
  }, [showBook]);

  // franchises to render in booking form:
  // - If nearby fetched and has results → show those (sorted by distance), top up to 4 with unlisted ones
  // - If nearby returned empty (franchises have no coords) or failed → fall back to full active list
  const displayFranchises = (() => {
    if (!nearbyList || nearbyList.length === 0) return activeFranchises;
    if (nearbyList.length >= 4) return nearbyList;
    // top up to at least 4 with franchises that don't have coords
    const nearbyIds = new Set(nearbyList.map((f) => String(f._id)));
    const extras = activeFranchises.filter((f) => !nearbyIds.has(String(f._id)));
    return [...nearbyList, ...extras];
  })();

  useEffect(() => {
    if (document.getElementById('evserv-voice-style')) return;
    const s = document.createElement('style');
    s.id = 'evserv-voice-style';
    s.textContent = '@keyframes voice-pulse { 0%,100% { box-shadow: 0 0 0 0 rgba(239,68,68,.4); } 50% { box-shadow: 0 0 0 7px rgba(239,68,68,0); } } @keyframes spin { to { transform: rotate(360deg); } }';
    document.head.appendChild(s);
    return () => document.getElementById('evserv-voice-style')?.remove();
  }, []);

  const handleBook = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (voiceBlob) {
        const ext = voiceMimeType === 'audio/ogg' ? 'ogg' : 'webm';
        const base64 = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(voiceBlob);
        });
        await serviceAPI.create({ ...form, voiceNoteData: base64, voiceNoteExt: ext });
      } else {
        await serviceAPI.create(form);
      }
      setShowBook(false);
      setVoiceBlob(null);
      setVoiceMimeType(null);
      setForm({ vehicle: '', serviceType: 'general', description: '', scheduledDate: '', franchise: '', pickupRequested: false });
      load();
    } catch (err) {
      setError(err.message || err.response?.data?.message || 'Failed to book service');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="layout user-dark"><UserSidebar /><div className="main-content"><Spinner /></div></div>;

  if (selected) {
    return (
      <div className="layout user-dark">
        <UserSidebar />
        <div className="main-content">
          <UserPageHeader
            title="Service Details"
            subtitle="Track progress, updates, and invoice"
            actions={<button className="btn btn-outline btn-sm" onClick={() => setSelected(null)}>← Back</button>}
          />
          <div className="card">
            <div className="card-header">
              <h2>Service Details</h2>
              <StatusBadge status={selected.status} />
            </div>
            <div className="card-body">
              <div className="grid grid-2 mb-4">
                <div>
                  <p className="text-muted" style={{ fontSize: '.8rem' }}>Vehicle</p>
                  <p style={{ fontWeight: 500 }}>{selected.vehicle?.registrationNumber} — {selected.vehicle?.make} {selected.vehicle?.model}</p>
                </div>
                <div>
                  <p className="text-muted" style={{ fontSize: '.8rem' }}>Service Type</p>
                  <p style={{ fontWeight: 500, textTransform: 'capitalize' }}>{selected.serviceType}</p>
                </div>
                {selected.franchise && (
                  <div>
                    <p className="text-muted" style={{ fontSize: '.8rem' }}>Service Center</p>
                    <p style={{ fontWeight: 500 }}>{selected.franchise?.name}</p>
                  </div>
                )}
                  <p style={{ fontWeight: 500 }}>{selected.scheduledDate ? new Date(selected.scheduledDate).toLocaleDateString() : 'Not set'}</p>
                </div>
                {selected.pickupRequested && (
                  <div>
                    <p className="text-muted" style={{ fontSize: '.8rem' }}>Pickup Service</p>
                    <p style={{ fontWeight: 700, color: '#0ea5e9' }}>🚛 Requested</p>
                  </div>
                )}
                {selected.dropRequested && (
                  <div>
                    <p className="text-muted" style={{ fontSize: '.8rem' }}>Drop-off Service</p>
                    <p style={{ fontWeight: 700, color: '#10b981' }}>🏠 Requested</p>
                  </div>
                )}
              </div>

              <h3 style={{ marginBottom: '1rem' }}>Service Progress</h3>
              <ServiceProgressBar status={selected.status} />

              {selected.description && (
                <div className="mt-4">
                  <p className="text-muted" style={{ fontSize: '.8rem' }}>Description</p>
                  <p>{selected.description}</p>
                </div>
              )}

              {selected.progressUpdates?.length > 0 && (
                <div className="mt-4">
                  <h4 style={{ marginBottom: '.75rem' }}>Progress Updates</h4>
                  {selected.progressUpdates.map((u, i) => (
                    <div key={i} style={{ padding: '.75rem', background: 'var(--bg)', borderRadius: 'var(--radius)', marginBottom: '.5rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <StatusBadge status={u.status} />
                        <span className="text-muted" style={{ fontSize: '.8rem' }}>{new Date(u.updatedAt).toLocaleString()}</span>
                      </div>
                      {u.note && <p style={{ marginTop: '.5rem', fontSize: '.875rem' }}>{u.note}</p>}
                    </div>
                  ))}
                </div>
              )}

              {selected.deliverables?.length > 0 && (
                <div className="mt-4">
                  <h4 style={{ marginBottom: '.75rem' }}>Deliverables</h4>
                  {selected.deliverables.map((d, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '.5rem', padding: '.5rem 0' }}>
                      <span>{d.delivered ? '✅' : '⏳'}</span>
                      <span style={{ textDecoration: d.delivered ? 'line-through' : 'none' }}>{d.item}</span>
                    </div>
                  ))}
                </div>
              )}

              {selected.invoiceNumber && (
                <div style={{ marginTop: '1.25rem', border: '1px solid #bfdbfe', borderRadius: '12px', overflow: 'hidden' }}>
                  {/* Invoice header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', background: '#eff6ff', padding: '1rem 1.25rem', borderBottom: '1px solid #bfdbfe' }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '.95rem', color: '#1d4ed8' }}>🧾 Tax Invoice</div>
                      <div style={{ color: '#64748b', fontSize: '.78rem', marginTop: '.15rem' }}>#{selected.invoiceNumber}</div>
                    </div>
                    <div style={{ textAlign: 'right', fontSize: '.78rem', color: '#64748b' }}>
                      <div>{selected.invoiceDate ? new Date(selected.invoiceDate).toLocaleDateString('en-IN') : ''}</div>
                      <button
                        onClick={() => window.print()}
                        style={{ marginTop: '.3rem', background: '#1d4ed8', color: '#fff', border: 'none', borderRadius: '6px', padding: '.2rem .65rem', cursor: 'pointer', fontSize: '.75rem' }}>
                        🖨️ Print
                      </button>
                    </div>
                  </div>

                  {/* Line items */}
                  {selected.invoiceItems?.length > 0 && (
                    <div style={{ padding: '0 1.25rem' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.85rem' }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                            <th style={{ textAlign: 'left', padding: '.6rem .3rem', color: '#64748b', fontWeight: 600 }}>Description</th>
                            <th style={{ textAlign: 'left', padding: '.6rem .3rem', color: '#64748b', fontWeight: 600 }}>Type</th>
                            <th style={{ textAlign: 'right', padding: '.6rem .3rem', color: '#64748b', fontWeight: 600 }}>Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selected.invoiceItems.map((item, i) => (
                            <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                              <td style={{ padding: '.55rem .3rem' }}>{item.description}</td>
                              <td style={{ padding: '.55rem .3rem', textTransform: 'capitalize', color: '#64748b', fontSize: '.78rem' }}>
                                <span style={{ background: item.type === 'service' ? '#dbeafe' : item.type === 'part' ? '#fef9c3' : '#f1f5f9', color: item.type === 'service' ? '#1d4ed8' : item.type === 'part' ? '#92400e' : '#64748b', borderRadius: '4px', padding: '.1rem .4rem' }}>{item.type}</span>
                              </td>
                              <td style={{ padding: '.55rem .3rem', textAlign: 'right' }}>₹{Number(item.amount).toLocaleString('en-IN')}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Total */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '.75rem 1.25rem', borderTop: '2px solid #bfdbfe', background: '#eff6ff' }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '.78rem', color: '#64748b' }}>Total Paid</div>
                      <div style={{ fontWeight: 800, fontSize: '1.35rem', color: '#1d4ed8' }}>₹{(selected.finalAmount || 0).toLocaleString('en-IN')}</div>
                    </div>
                  </div>

                  {selected.technicianNotes && (
                    <div style={{ background: '#fff8e1', borderTop: '1px solid #ffe082', padding: '.7rem 1.25rem', fontSize: '.8rem' }}>
                      <strong>Technician Notes:</strong> {selected.technicianNotes}
                    </div>
                  )}
                </div>
              )}

              {!selected.invoiceNumber && selected.finalAmount && (
                <div className="mt-4 alert alert-info">
                  💰 Final Amount: <strong>₹{selected.finalAmount}</strong>
                </div>
              )}
                  {selected.status === 'delivered' && selected.franchise?.pickupDropService !== false && (
                    <div style={{ marginTop: '1.5rem', padding: '1.25rem', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontWeight: 700, color: '#166534', fontSize: '.95rem' }}>🏡 Deliver vehicle back to me?</div>
                          <div style={{ color: '#4b5563', fontSize: '.8rem', marginTop: '.25rem' }}>The service centre will drop your bike at your registered location.</div>
                        </div>
                        <button
                          onClick={async () => {
                            const newValue = !selected.dropRequested;
                            try {
                              await serviceAPI.updateDropRequest(selected._id, newValue);
                              setSelected({ ...selected, dropRequested: newValue });
                            } catch (err) { alert('Failed to update drop request'); }
                          }}
                          style={{
                            background: selected.dropRequested ? '#10b981' : '#fff',
                            color: selected.dropRequested ? '#fff' : '#10b981',
                            border: `2px solid #10b981`,
                            borderRadius: '8px', padding: '.45rem 1rem', fontWeight: 700, cursor: 'pointer', transition: 'all .2s'
                          }}
                        >
                          {selected.dropRequested ? '✅ Requested' : 'Request Drop'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
    );
  }

  return (
    <div className="layout user-dark">
      <UserSidebar />
      <div className="main-content">
        <UserPageHeader
          title="My Services"
          subtitle="Book and monitor all service requests"
          actions={<button className="btn btn-primary" onClick={() => setShowBook(true)}>+ Book Service</button>}
        />

        {showBook && (
          <div className="card mb-4">
            <div className="card-header">
              <h3>Book a Service</h3>
              <button className="btn btn-sm btn-outline" onClick={() => setShowBook(false)}>Cancel</button>
            </div>
            <div className="card-body">
              {error && <div className="alert alert-danger">{error}</div>}
              <form onSubmit={handleBook}>
                {/* ── Service Centre Selection ── */}
                <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '.65rem', marginBottom: '.5rem', flexWrap: 'wrap' }}>
                    <label className="form-label" style={{ margin: 0 }}>Select Service Centre *</label>
                    {locationLoading && (
                      <span style={{ fontSize: '.78rem', color: '#0077b6', display: 'inline-flex', alignItems: 'center', gap: '.3rem' }}>
                        <span style={{ display: 'inline-block', width: 12, height: 12, border: '2px solid #bfdbfe', borderTopColor: '#1d4ed8', borderRadius: '50%', animation: 'spin .7s linear infinite' }} />
                        Finding nearby centres…
                      </span>
                    )}
                    {!locationLoading && nearbyList && nearbyList.length > 0 && (
                      <span style={{ fontSize: '.78rem', color: '#15803d', fontWeight: 600 }}>📍 Sorted by distance</span>
                    )}
                    {!locationLoading && nearbyList && nearbyList.length === 0 && activeFranchises.length > 0 && (
                      <span style={{ fontSize: '.78rem', color: '#92400e' }}>⚠️ No location data for centres — showing all</span>
                    )}
                    {!locationLoading && !nearbyList && activeFranchises.length > 0 && (
                      <span style={{ fontSize: '.78rem', color: '#92400e' }}>⚠️ Enable location for nearest centres</span>
                    )}
                  </div>
                  {displayFranchises.length === 0 && !locationLoading ? (
                    <div className="alert" style={{ background: '#fff8e1', border: '1px solid #ffe082', color: '#7c5200', fontSize: '.85rem', padding: '.65rem .85rem', borderRadius: '8px' }}>
                      No active service centres available at the moment.
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '.75rem' }}>
                      {displayFranchises.map((f) => (
                        <FranchiseCard
                          key={f._id}
                          f={f}
                          selected={form.franchise === f._id}
                          onSelect={(id) => setForm((prev) => ({ ...prev, franchise: id }))}
                          distanceKm={f.distanceKm ?? null}
                        />
                      ))}
                    </div>
                  )}
                </div>

                <div className="grid grid-2">
                  <div className="form-group">
                    <label className="form-label">Vehicle *</label>
                    <select className="form-select" value={form.vehicle} onChange={(e) => setForm((f) => ({ ...f, vehicle: e.target.value }))} required>
                      <option value="">Select vehicle</option>
                      {vehicles.map((v) => (
                        <option key={v._id} value={v._id}>{v.make} {v.model} — {v.registrationNumber}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Service Type *</label>
                    <select className="form-select" value={form.serviceType} onChange={(e) => setForm((f) => ({ ...f, serviceType: e.target.value }))}>
                      {SERVICE_TYPES.map((t) => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Preferred Date</label>
                    <input type="date" className="form-control" value={form.scheduledDate} onChange={(e) => setForm((f) => ({ ...f, scheduledDate: e.target.value }))} />
                  </div>
                </div>
                <VoiceQueryBox
                  description={form.description}
                  setDescription={(val) => setForm(f => ({ ...f, description: val }))}
                  activeFranchises={activeFranchises}
                  selectedFranchise={form.franchise}
                  setFranchise={(id) => setForm(f => ({ ...f, franchise: id }))}
                  onBlob={(blob, mime) => { setVoiceBlob(blob); setVoiceMimeType(mime); }}
                />

                {displayFranchises.find(f => f._id === form.franchise)?.pickupDropService && (
                  <div style={{ marginBottom: '1.5rem', background: 'rgba(14,165,233,0.06)', border: '1px solid rgba(14,165,233,0.2)', borderRadius: '12px', padding: '1rem' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '.75rem', cursor: 'pointer' }}>
                      <input 
                        type="checkbox" 
                        checked={form.pickupRequested} 
                        onChange={(e) => setForm(f => ({ ...f, pickupRequested: e.target.checked }))} 
                        style={{ width: 18, height: 18, cursor: 'pointer' }}
                      />
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '.9rem', color: '#0369a1' }}>Request Vehicle Pickup</div>
                        <div style={{ fontSize: '.75rem', color: '#64748b' }}>A technician will collect the bike from your location.</div>
                      </div>
                    </label>
                  </div>
                )}
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Booking...' : 'Book Service'}</button>
              </form>
            </div>
          </div>
        )}

        {services.length === 0 ? (
          <div className="card">
            <div className="card-body text-center" style={{ padding: '3rem' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔧</div>
              <p className="text-muted">No services booked yet.</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-2">
            {services.map((s) => (
              <div key={s._id} className="card" style={{ cursor: 'pointer' }} onClick={() => setSelected(s)}>
                <div className="card-body">
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '.75rem' }}>
                    <StatusBadge status={s.status} />
                    <span className="text-muted" style={{ fontSize: '.8rem' }}>{new Date(s.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p style={{ fontWeight: 600, textTransform: 'capitalize' }}>{s.serviceType} Service</p>
                  <p className="text-muted" style={{ fontSize: '.875rem' }}>{s.vehicle?.registrationNumber}</p>
                  {s.franchise && <p className="text-muted" style={{ fontSize: '.8rem' }}>{s.franchise?.name}</p>}
                  {s.status === 'delivered' && (
                    <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap', marginTop: '.75rem' }}>
                      {s.invoiceNumber && (
                        <button
                          onClick={(e) => { e.stopPropagation(); setInvoiceViewTarget(s); }}
                          style={{ background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', borderRadius: '6px', padding: '.3rem .75rem', cursor: 'pointer', fontSize: '.8rem', fontWeight: 600 }}
                        >
                          📄 View Invoice
                        </button>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); if (!submittedFeedbacks.has(s._id)) setFeedbackTarget(s); }}
                        disabled={submittedFeedbacks.has(s._id)}
                        style={{
                          background: submittedFeedbacks.has(s._id) ? '#f0fdf4' : '#fffbeb',
                          color: submittedFeedbacks.has(s._id) ? '#15803d' : '#92400e',
                          border: `1px solid ${submittedFeedbacks.has(s._id) ? '#bbf7d0' : '#fde68a'}`,
                          borderRadius: '6px', padding: '.3rem .75rem',
                          cursor: submittedFeedbacks.has(s._id) ? 'default' : 'pointer',
                          fontSize: '.8rem', fontWeight: 600,
                        }}
                      >
                        {submittedFeedbacks.has(s._id) ? '✅ Rated' : '⭐ Rate Service'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {feedbackTarget && (
        <FeedbackModal
          service={feedbackTarget}
          onClose={(serviceId) => {
            if (serviceId) setSubmittedFeedbacks(prev => new Set([...prev, serviceId]));
            setFeedbackTarget(null);
          }}
        />
      )}
      {invoiceViewTarget && (
        <InvoiceViewModal service={invoiceViewTarget} onClose={() => setInvoiceViewTarget(null)} />
      )}
    </div>
  );
}

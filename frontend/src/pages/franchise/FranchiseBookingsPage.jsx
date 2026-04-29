import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import FranchiseSidebar from '../../components/franchise/FranchiseSidebar';
import { franchisePortalAPI } from '../../api';
import { useAuth } from '../../context/AuthContext';

const STATUS_MAP = {
  onboarded:     { label: 'New',           badge: 'badge-info',      next: 'diagnosis',     nextLabel: 'Accept' },
  diagnosis:     { label: 'Accepted',      badge: 'badge-warning',   next: 'in_progress',   nextLabel: 'Start Service' },
  in_progress:   { label: 'In Service',    badge: 'badge-secondary', next: 'quality_check', nextLabel: 'Quality Check' },
  waiting_parts: { label: 'Waiting Parts', badge: 'badge-warning',   next: 'in_progress',   nextLabel: 'Resume' },
  quality_check: { label: 'QC Check',      badge: 'badge-secondary', next: 'delivered',     nextLabel: 'Mark Complete' },
  delivered:     { label: 'Completed',     badge: 'badge-success',   next: null,            nextLabel: null },
  cancelled:     { label: 'Cancelled',     badge: 'badge-danger',    next: null,            nextLabel: null },
};

const STATUS_TABS = ['all', 'onboarded', 'diagnosis', 'in_progress', 'waiting_parts', 'quality_check', 'delivered'];

/* ── Invoice Modal ─────────────────────────────────────────────── */
function InvoiceModal({ booking, onClose, onConfirm, saving }) {
  const [serviceCharge, setServiceCharge] = useState('');
  const [parts, setParts] = useState([{ description: '', quantity: '1', rate: '', amount: '' }]);
  const [notes, setNotes] = useState('');

  const addPart = () => setParts((p) => [...p, { description: '', quantity: '1', rate: '', amount: '' }]);
  const removePart = (i) => setParts((p) => p.filter((_, idx) => idx !== i));
  const updatePart = (i, key, val) => setParts((p) => p.map((r, idx) => {
    if (idx !== i) return r;
    const updated = { ...r, [key]: val };
    if (key === 'quantity' || key === 'rate') {
      const q = Number(key === 'quantity' ? val : r.quantity) || 0;
      const rt = Number(key === 'rate' ? val : r.rate) || 0;
      updated.amount = q * rt;
    }
    return updated;
  }));

  const validParts = parts.filter((p) => p.description && p.amount);
  const total = (Number(serviceCharge) || 0) + validParts.reduce((s, p) => s + (Number(p.amount) || 0), 0);

  const handleSubmit = (e) => {
    e.preventDefault();
    const items = [];
    if (serviceCharge) items.push({ description: `${booking.serviceType} Service`, type: 'service', quantity: 1, rate: Number(serviceCharge), amount: Number(serviceCharge) });
    validParts.forEach((p) => items.push({ description: p.description, type: 'part', quantity: Number(p.quantity), rate: Number(p.rate), amount: Number(p.amount) }));
    if (items.length === 0) return;
    onConfirm({ invoiceItems: items, technicianNotes: notes });
  };

  const inputStyle = { background: '#06071a', border: '1px solid #1e3a5f', borderRadius: '8px', color: '#e2e8f0', padding: '.55rem .85rem', width: '100%', outline: 'none', fontSize: '.9rem', boxSizing: 'border-box' };
  const labelStyle = { display: 'block', fontWeight: 600, marginBottom: '.4rem', fontSize: '.875rem', color: '#94a3b8' };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
      <div style={{ background: '#0a0f1e', border: '1px solid #1e3a5f', borderRadius: '18px', width: '100%', maxWidth: '600px', maxHeight: '92vh', overflow: 'auto', boxShadow: '0 30px 80px rgba(0,0,0,.6)', color: '#e2e8f0' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.1rem 1.5rem', borderBottom: '1px solid #1e2d3d' }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: '1rem', color: '#e2e8f0' }}>🧾 Generate Invoice</div>
            <div style={{ marginTop: '.2rem', color: '#475569', fontSize: '.8rem' }}>
              {booking.owner?.name} — {booking.vehicle?.registrationNumber} ({booking.serviceType} service)
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer', color: '#64748b', lineHeight: 1 }}>×</button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '1.5rem' }}>

          {/* Service charge */}
          <div style={{ marginBottom: '1.15rem' }}>
            <label style={labelStyle}>Service / Labour Charge (₹) *</label>
            <input
              type="number" min="0"
              placeholder="e.g. 1500"
              value={serviceCharge}
              onChange={(e) => setServiceCharge(e.target.value)}
              required
              style={inputStyle}
            />
          </div>

          {/* Spare parts */}
          <div style={{ marginBottom: '1.15rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '.5rem' }}>
              <label style={{ ...labelStyle, marginBottom: 0 }}>Spare Parts / Additional Items</label>
              <button type="button" onClick={addPart} style={{ fontSize: '.78rem', color: '#38bdf8', background: 'none', border: '1px solid #1e3a5f', borderRadius: '6px', padding: '.2rem .6rem', cursor: 'pointer' }}>+ Add Row</button>
            </div>
            {parts.map((p, i) => (
              <div key={i} style={{ display: 'flex', gap: '.5rem', marginBottom: '.75rem', alignItems: 'center' }}>
                <input
                  placeholder="Part / Item name"
                  value={p.description}
                  onChange={(e) => updatePart(i, 'description', e.target.value)}
                  style={{ ...inputStyle, flex: 2.5 }}
                />
                <input
                  type="number" min="1"
                  placeholder="Qty"
                  value={p.quantity}
                  onChange={(e) => updatePart(i, 'quantity', e.target.value)}
                  style={{ ...inputStyle, flex: 0.8, textAlign: 'center' }}
                />
                <input
                  type="number" min="0"
                  placeholder="Rate"
                  value={p.rate}
                  onChange={(e) => updatePart(i, 'rate', e.target.value)}
                  style={{ ...inputStyle, flex: 1.2 }}
                />
                <div style={{ flex: 1, textAlign: 'right', fontWeight: 700, color: '#4ade80', fontSize: '.85rem' }}>
                  ₹{Number(p.amount || 0).toLocaleString()}
                </div>
                {parts.length > 1 && (
                  <button type="button" onClick={() => removePart(i)} style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '1.2rem', cursor: 'pointer', padding: '.2rem' }}>×</button>
                )}
              </div>
            ))}
          </div>

          {/* Technician notes */}
          <div style={{ marginBottom: '1.15rem' }}>
            <label style={labelStyle}>Technician Notes (optional)</label>
            <textarea
              rows={2}
              placeholder="Work done, observations…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              style={{ ...inputStyle, resize: 'vertical' }}
            />
          </div>

          {/* Total */}
          <div style={{ background: 'linear-gradient(135deg,#0a1f0a,#0d2b0d)', border: '1px solid #166534', borderRadius: '10px', padding: '1rem 1.25rem', marginBottom: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 600, color: '#4ade80', fontSize: '.9rem' }}>Total Invoice Amount</span>
            <span style={{ fontWeight: 800, fontSize: '1.3rem', color: '#4ade80' }}>₹{total.toLocaleString('en-IN')}</span>
          </div>

          <div style={{ display: 'flex', gap: '.75rem' }}>
            <button
              type="submit"
              disabled={saving || !serviceCharge}
              style={{ background: saving || !serviceCharge ? '#1e2d3d' : 'linear-gradient(135deg,#6366f1,#06b6d4)', color: saving || !serviceCharge ? '#475569' : '#fff', border: 'none', borderRadius: '9px', padding: '.6rem 1.25rem', fontWeight: 700, fontSize: '.875rem', cursor: saving || !serviceCharge ? 'not-allowed' : 'pointer' }}
            >
              {saving ? 'Generating…' : '✅ Complete & Generate Invoice'}
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{ background: 'none', border: '1px solid #1e3a5f', borderRadius: '9px', padding: '.6rem 1.1rem', fontWeight: 600, fontSize: '.875rem', color: '#64748b', cursor: 'pointer' }}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ── New Booking Modal ─────────────────────────────────────────── */
function NewBookingModal({ onClose, onConfirm, saving }) {
  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    regNo: '',
    make: '',
    model: '',
    serviceType: 'general',
    description: '',
    pickupRequested: false,
    scheduledDate: new Date().toISOString().slice(0, 10),
  });

  const inp = { background: '#06071a', border: '1px solid #1e3a5f', borderRadius: '8px', color: '#e2e8f0', padding: '.55rem .85rem', width: '100%', outline: 'none', fontSize: '.9rem', boxSizing: 'border-box' };
  const lbl = { display: 'block', fontWeight: 600, marginBottom: '.4rem', fontSize: '.875rem', color: '#94a3b8' };

  const handleSubmit = (e) => {
    e.preventDefault();
    onConfirm(formData);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
      <div style={{ background: '#0a0f1e', border: '1px solid #1e3a5f', borderRadius: '18px', width: '100%', maxWidth: '650px', maxHeight: '92vh', overflow: 'auto', boxShadow: '0 30px 80px rgba(0,0,0,.6)', color: '#e2e8f0' }}>
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #1e2d3d', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: '1.1rem' }}>🆕 Create New Booking</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
        </div>
        <form onSubmit={handleSubmit} style={{ padding: '1.5rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
            <div><label style={lbl}>Customer Name *</label><input required style={inp} value={formData.customerName} onChange={e => setFormData({...formData, customerName: e.target.value})} /></div>
            <div><label style={lbl}>Phone Number *</label><input required style={inp} value={formData.customerPhone} onChange={e => setFormData({...formData, customerPhone: e.target.value})} /></div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
            <div><label style={lbl}>Registration No *</label><input required style={inp} value={formData.regNo} onChange={e => setFormData({...formData, regNo: e.target.value.toUpperCase()})} /></div>
            <div><label style={lbl}>Service Type</label>
              <select style={inp} value={formData.serviceType} onChange={e => setFormData({...formData, serviceType: e.target.value})}>
                <option value="general">General Service</option>
                <option value="battery">Battery Check</option>
                <option value="accident">Accident Repair</option>
                <option value="software">Software Update</option>
                <option value="amc">AMC Service</option>
              </select>
            </div>
          </div>
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={lbl}>Vehicle Make & Model</label>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <input placeholder="Make (e.g. Ather)" style={inp} value={formData.make} onChange={e => setFormData({...formData, make: e.target.value})} />
              <input placeholder="Model (e.g. 450X)" style={inp} value={formData.model} onChange={e => setFormData({...formData, model: e.target.value})} />
            </div>
          </div>
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={lbl}>Problem Description</label>
            <textarea style={{...inp, height: '80px', resize: 'none'}} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
          </div>
          
          <div style={{ background: 'rgba(56,189,248,0.08)', border: '1px solid rgba(56,189,248,0.15)', borderRadius: '10px', padding: '1rem', marginBottom: '1.5rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '.75rem', cursor: 'pointer' }}>
              <input type="checkbox" checked={formData.pickupRequested} onChange={e => setFormData({...formData, pickupRequested: e.target.checked})} style={{ width: 18, height: 18, cursor: 'pointer' }} />
              <div>
                <div style={{ fontWeight: 700, fontSize: '.9rem', color: '#38bdf8' }}>Request Pickup & Drop</div>
                <div style={{ fontSize: '.75rem', color: '#94a3b8' }}>Check this if the customer needs their vehicle picked up.</div>
              </div>
            </label>
          </div>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
            <button type="button" onClick={onClose} style={{ padding: '.55rem 1.25rem', background: 'none', border: '1px solid #1e3a5f', borderRadius: '8px', color: '#94a3b8', cursor: 'pointer' }}>Cancel</button>
            <button type="submit" disabled={saving} style={{ padding: '.55rem 1.75rem', background: 'linear-gradient(135deg,#6366f1,#06b6d4)', border: 'none', borderRadius: '8px', color: '#fff', fontWeight: 700, cursor: 'pointer', opacity: saving ? .6 : 1 }}>{saving ? 'Creating...' : 'Create Booking'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ── Invoice View Modal ─────────────────────────────────────────── */
function InvoiceViewModal({ booking, onClose, navigate }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
      <div style={{ background: '#0a0f1e', border: '1px solid #1e3a5f', borderRadius: '18px', width: '100%', maxWidth: '600px', maxHeight: '92vh', overflow: 'auto', boxShadow: '0 30px 80px rgba(0,0,0,.6)' }}>
        {/* Modal header bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.5rem', borderBottom: '1px solid #1e2d3d' }}>
          <span style={{ fontWeight: 700, color: '#e2e8f0', fontSize: '.95rem' }}>🧾 Tax Invoice</span>
          <div style={{ display: 'flex', gap: '.5rem' }}>
            <button onClick={() => navigate(`/franchise/bookings/${booking._id}`)} style={{ background: 'none', border: '1px solid #1e3a5f', color: '#e2e8f0', padding: '.35rem .9rem', borderRadius: '8px', cursor: 'pointer', fontSize: '.8rem' }}>View</button>
            <button onClick={() => window.print()} style={{ background: 'linear-gradient(135deg,#6366f1,#06b6d4)', color: '#fff', border: 'none', borderRadius: '8px', padding: '.35rem .9rem', cursor: 'pointer', fontSize: '.8rem', fontWeight: 600 }}>🖨️ Print</button>
            <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer', color: '#64748b', lineHeight: 1 }}>×</button>
          </div>
        </div>
        <div style={{ padding: '1.5rem' }} id="invoice-print-area">
          <InvoiceContent booking={booking} />
        </div>
      </div>
    </div>
  );
}

export function InvoiceContent({ booking }) {
  const items = booking.invoiceItems || [];
  const services = items.filter(i => i.type === 'service');
  const spareParts = items.filter(i => i.type === 'part');
  
  const subtotal = items.reduce((s, i) => s + (Number(i.amount) || 0), 0);
  const cgst = subtotal * 0.09;
  const sgst = subtotal * 0.09;
  const total = subtotal + cgst + sgst;

  const tableHeaderStyle = { background: '#007b7c', color: '#fff', textAlign: 'left', padding: '10px 12px', fontSize: '.75rem', fontWeight: 700, textTransform: 'uppercase' };
  const cellStyle = { padding: '10px 12px', borderBottom: '1px solid #e1e7ee', color: '#334155', fontSize: '.85rem' };

  return (
    <div style={{ fontFamily: '"Inter", sans-serif', color: '#1e293b', background: '#fff', padding: '10px' }}>
      
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <div style={{ flex: 1 }}>
          <h1 style={{ margin: 0, color: '#000', fontSize: '1.4rem', fontWeight: 900 }}>KEVELL MOTORS</h1>
          <p style={{ margin: '8px 0 0', fontSize: '.8rem', color: '#475569', maxWidth: '280px', lineHeight: 1.5 }}>
            2nd Kamala Street Chinnachokikulam Madurai 625 014<br/>
            Phone : 97894 00470<br/>
            Email : Minzenth@gmail.com<br/>
            GSTIN : 33AYHPK8929M1ZT
          </p>
        </div>
        <div style={{ textAlign: 'right', fontSize: '.8rem', color: '#1e293b' }}>
          <p style={{ margin: '4px 0' }}><strong>Invoice No :</strong> {booking.invoiceNumber || 'INV-TEMP'}</p>
          <p style={{ margin: '4px 0' }}><strong>invoice Date :</strong> {new Date(booking.invoiceDate || Date.now()).toLocaleDateString('en-GB')}</p>
          <p style={{ margin: '4px 0' }}><strong>Service Date:</strong> {new Date(booking.scheduledDate || booking.createdAt).toLocaleDateString('en-GB')}</p>
        </div>
      </div>

      {/* Section Header: Customer Details */}
      <div style={{ background: '#007b7c', color: '#fff', padding: '6px 15px', borderRadius: '4px', fontWeight: 600, fontSize: '.85rem', marginBottom: '15px' }}>
        Customer Details
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px', padding: '0 10px', fontSize: '.85rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex' }}><span style={{ width: '180px', fontWeight: 600 }}>Customer Name :</span> <span>{booking.jobCard?.customerName || booking.owner?.name}</span></div>
        <div style={{ display: 'flex' }}><span style={{ width: '180px', fontWeight: 600 }}>Mobile Number :</span> <span>{booking.jobCard?.customerContact || booking.owner?.phone}</span></div>
        <div style={{ display: 'flex' }}><span style={{ width: '180px', fontWeight: 600 }}>Vechicle Number :</span> <span>{booking.jobCard?.regNo || booking.vehicle?.registrationNumber}</span></div>
        <div style={{ display: 'flex' }}><span style={{ width: '180px', fontWeight: 600 }}>Vechicle Model :</span> <span>{booking.jobCard?.make} {booking.jobCard?.model || booking.vehicle?.model}</span></div>
        <div style={{ display: 'flex' }}><span style={{ width: '180px', fontWeight: 600 }}>Odometer :</span> <span>{booking.jobCard?.speedo || 'N/A'}</span></div>
        <div style={{ display: 'flex' }}><span style={{ width: '180px', fontWeight: 600 }}>Customer Address :</span> <span style={{ flex: 1 }}>{booking.jobCard?.address || booking.owner?.address || 'N/A'}</span></div>
        <div style={{ display: 'flex' }}><span style={{ width: '180px', fontWeight: 600 }}>GSTIN/UIN:</span> <span>{booking.jobCard?.gstNo || '33AAPCM4417P1ZY'}</span></div>
        <div style={{ display: 'flex' }}><span style={{ width: '180px', fontWeight: 600 }}>State Name:</span> <span>Tamil Nadu, Code: 33</span></div>
        <div style={{ display: 'flex' }}><span style={{ width: '180px', fontWeight: 600 }}>E-Mail:</span> <span>{booking.owner?.email || 'reach@cuptime.in'}</span></div>
      </div>

      {/* Section: Service Details */}
      <div style={{ background: '#007b7c', color: '#fff', padding: '6px 15px', borderRadius: '4px', fontWeight: 600, fontSize: '.85rem', marginBottom: '10px' }}>
        Service Details
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '1.5rem' }}>
        <thead>
          <tr>
            <th style={{ ...tableHeaderStyle, width: '50px' }}>S.No</th>
            <th style={tableHeaderStyle}>Service Description</th>
            <th style={{ ...tableHeaderStyle, textAlign: 'center' }}>Rate</th>
            <th style={{ ...tableHeaderStyle, textAlign: 'right' }}>Amount</th>
          </tr>
        </thead>
        <tbody>
          {services.map((s, idx) => (
            <tr key={idx}>
              <td style={{ ...cellStyle, textAlign: 'center' }}>{idx + 1}</td>
              <td style={cellStyle}>{s.description}</td>
              <td style={{ ...cellStyle, textAlign: 'center' }}>-</td>
              <td style={{ ...cellStyle, textAlign: 'right', fontWeight: 600 }}>{s.amount.toLocaleString('en-IN')}</td>
            </tr>
          ))}
          {!services.length && (
            <tr><td colSpan={4} style={{ ...cellStyle, textAlign: 'center', fontStyle: 'italic' }}>No service charges recorded</td></tr>
          )}
          <tr style={{ background: '#f8fafc' }}>
            <td colSpan={3} style={{ ...cellStyle, textAlign: 'right', fontWeight: 700, border: '1px solid #e1e7ee' }}>Sub Total</td>
            <td style={{ ...cellStyle, textAlign: 'right', fontWeight: 700, border: '1px solid #e1e7ee' }}>{services.reduce((acc, s) => acc + s.amount, 0).toLocaleString('en-IN')}</td>
          </tr>
        </tbody>
      </table>

      {/* Section: Spare Parts Details */}
      <div style={{ background: '#007b7c', color: '#fff', padding: '6px 15px', borderRadius: '4px', fontWeight: 600, fontSize: '.85rem', marginBottom: '10px' }}>
        Spare Parts Details
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '1.5rem' }}>
        <thead>
          <tr>
            <th style={{ ...tableHeaderStyle, width: '50px' }}>S.No</th>
            <th style={tableHeaderStyle}>Part Name</th>
            <th style={{ ...tableHeaderStyle, textAlign: 'center' }}>Qty</th>
            <th style={{ ...tableHeaderStyle, textAlign: 'center' }}>Rate</th>
            <th style={{ ...tableHeaderStyle, textAlign: 'right' }}>Amount</th>
          </tr>
        </thead>
        <tbody>
          {spareParts.map((p, idx) => (
            <tr key={idx}>
              <td style={{ ...cellStyle, textAlign: 'center' }}>{idx + 1}</td>
              <td style={cellStyle}>{p.description}</td>
              <td style={{ ...cellStyle, textAlign: 'center' }}>{p.quantity || 1}</td>
              <td style={{ ...cellStyle, textAlign: 'center' }}>{p.rate?.toLocaleString() || '-'}</td>
              <td style={{ ...cellStyle, textAlign: 'right', fontWeight: 600 }}>{p.amount.toLocaleString('en-IN')}</td>
            </tr>
          ))}
          {!spareParts.length && (
            <tr><td colSpan={5} style={{ ...cellStyle, textAlign: 'center', fontStyle: 'italic' }}>No spare parts used</td></tr>
          )}
          <tr style={{ background: '#f8fafc' }}>
            <td colSpan={4} style={{ ...cellStyle, textAlign: 'right', fontWeight: 700, border: '1px solid #e1e7ee' }}>Sub Total</td>
            <td style={{ ...cellStyle, textAlign: 'right', fontWeight: 700, border: '1px solid #e1e7ee' }}>{spareParts.reduce((acc, p) => acc + p.amount, 0).toLocaleString('en-IN')}</td>
          </tr>
        </tbody>
      </table>

      {/* Banking and Totals Row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '30px' }}>
        <div style={{ flex: 1.2 }}>
          <div style={{ background: '#007b7c', color: '#fff', padding: '6px 15px', borderRadius: '4px', fontWeight: 600, fontSize: '.85rem', marginBottom: '10px' }}>
            BANKING DETAILS
          </div>
          <div style={{ fontSize: '.85rem', lineHeight: 1.6, color: '#1e293b' }}>
            <p style={{ margin: '4px 0' }}><strong>Bank Name :</strong> Indian Bank</p>
            <p style={{ margin: '4px 0' }}><strong>Acc Name :</strong> Kevell Corp</p>
            <p style={{ margin: '4px 0' }}><strong>Acc Number :</strong> 7642668853</p>
            <p style={{ margin: '4px 0' }}><strong>IFSC Code :</strong> IDIB000T003</p>
            <p style={{ margin: '4px 0' }}><strong>SWIFT Code :</strong> IDIBINBBMDM</p>
          </div>
        </div>
        
        <div style={{ flex: 1 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #e1e7ee' }}>
            <tbody>
              <tr>
                <td style={{ ...cellStyle, background: '#f8fafc', fontWeight: 600 }}>Sub Total</td>
                <td style={{ ...cellStyle, textAlign: 'right' }}>{subtotal.toLocaleString('en-IN')}</td>
              </tr>
              <tr>
                <td style={{ ...cellStyle, background: '#f8fafc', fontWeight: 600 }}>Discount</td>
                <td style={{ ...cellStyle, textAlign: 'right' }}>N/A</td>
              </tr>
              <tr>
                <td style={{ ...cellStyle, background: '#f8fafc', fontWeight: 600 }}>CGST (9 %)</td>
                <td style={{ ...cellStyle, textAlign: 'right' }}>{cgst.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td>
              </tr>
              <tr>
                <td style={{ ...cellStyle, background: '#f8fafc', fontWeight: 600 }}>SGST (9 %)</td>
                <td style={{ ...cellStyle, textAlign: 'right' }}>{sgst.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td>
              </tr>
              <tr style={{ background: '#007b7c', color: '#fff' }}>
                <td style={{ padding: '10px 12px', fontWeight: 700 }}>Total Amount</td>
                <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 900, fontSize: '1.1rem' }}>₹{total.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Signature Section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '60px', padding: '0 20px' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ borderTop: '1.5px solid #475569', width: '200px', paddingTop: '8px' }}>
            <span style={{ fontSize: '.85rem', fontWeight: 600, fontStyle: 'italic', color: '#1e293b' }}>Authorized Signature</span>
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ borderTop: '1.5px solid #475569', width: '200px', paddingTop: '8px' }}>
            <span style={{ fontSize: '.85rem', fontWeight: 600, fontStyle: 'italic', color: '#1e293b' }}>Customer Signature</span>
          </div>
        </div>
      </div>

    </div>
  );
}

/* ── Job Card Modal ────────────────────────────────────────────── */
function JobCardModal({ booking, onClose, onConfirm, saving }) {
  const [formData, setFormData] = useState({
    jobNo: booking.jobCard?.jobNo || '',
    date: booking.jobCard?.date?.slice(0, 10) || new Date().toISOString().slice(0, 10),
    make: booking.jobCard?.make || booking.vehicle?.make || '',
    year: booking.jobCard?.year || booking.vehicle?.year || '',
    model: booking.jobCard?.model || booking.vehicle?.model || '',
    colour: booking.jobCard?.colour || '',
    regNo: booking.jobCard?.regNo || booking.vehicle?.registrationNumber || '',
    speedo: booking.jobCard?.speedo || '',
    customerName: booking.jobCard?.customerName || booking.owner?.name || '',
    customerContact: booking.jobCard?.customerContact || booking.owner?.phone || '',
    address: booking.jobCard?.address || '',
    postCode: booking.jobCard?.postCode || '',
    repairOrderNo: booking.jobCard?.repairOrderNo || '',
    vehicleInfo: booking.jobCard?.vehicleInfo || '',
  });

  const updateField = (k, v) => setFormData(p => ({ ...p, [k]: v }));

  const inputStyle = { background: '#06071a', border: '1px solid #1e3a5f', borderRadius: '8px', color: '#e2e8f0', padding: '.5rem .8rem', width: '100%', outline: 'none', fontSize: '.85rem' };
  const labelStyle = { display: 'block', fontWeight: 600, marginBottom: '.3rem', fontSize: '.75rem', color: '#94a3b8', textTransform: 'uppercase' };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
      <div style={{ background: '#0a0f1e', border: '1px solid #1e3a5f', borderRadius: '18px', width: '100%', maxWidth: '700px', maxHeight: '92vh', overflow: 'auto', color: '#e2e8f0' }}>
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #1e2d3d', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div><h3 style={{ margin: 0, fontSize: '1.1rem' }}>🛠️ Service Job Card</h3></div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
        </div>
        <div style={{ padding: '1.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
          <div><label style={labelStyle}>Job No</label><input style={inputStyle} value={formData.jobNo} onChange={e => updateField('jobNo', e.target.value)} /></div>
          <div><label style={labelStyle}>Date</label><input type="date" style={inputStyle} value={formData.date} onChange={e => updateField('date', e.target.value)} /></div>
          
          <div style={{ gridColumn: 'span 2', borderBottom: '1px solid #1e2d3d', paddingBottom: '.25rem', marginTop: '.5rem' }}><span style={{ fontSize: '.75rem', fontWeight: 800, color: '#38bdf8' }}>VEHICLE DETAILS</span></div>
          <div><label style={labelStyle}>Make</label><input style={inputStyle} value={formData.make} onChange={e => updateField('make', e.target.value)} /></div>
          <div><label style={labelStyle}>Model</label><input style={inputStyle} value={formData.model} onChange={e => updateField('model', e.target.value)} /></div>
          <div><label style={labelStyle}>Year</label><input style={inputStyle} value={formData.year} onChange={e => updateField('year', e.target.value)} /></div>
          <div><label style={labelStyle}>Colour</label><input style={inputStyle} value={formData.colour} onChange={e => updateField('colour', e.target.value)} /></div>
          <div><label style={labelStyle}>Reg No</label><input style={inputStyle} value={formData.regNo} onChange={e => updateField('regNo', e.target.value)} /></div>
          <div><label style={labelStyle}>Speedo (KM)</label><input style={inputStyle} value={formData.speedo} onChange={e => updateField('speedo', e.target.value)} /></div>

          <div style={{ gridColumn: 'span 2', borderBottom: '1px solid #1e2d3d', paddingBottom: '.25rem', marginTop: '.5rem' }}><span style={{ fontSize: '.75rem', fontWeight: 800, color: '#38bdf8' }}>CUSTOMER DETAILS</span></div>
          <div><label style={labelStyle}>Customer Name</label><input style={inputStyle} value={formData.customerName} onChange={e => updateField('customerName', e.target.value)} /></div>
          <div><label style={labelStyle}>Contact No</label><input style={inputStyle} value={formData.customerContact} onChange={e => updateField('customerContact', e.target.value)} /></div>
          <div style={{ gridColumn: 'span 2' }}><label style={labelStyle}>Address</label><textarea style={{ ...inputStyle, resize: 'none', height: '60px' }} value={formData.address} onChange={e => updateField('address', e.target.value)} /></div>
          
          <div style={{ gridColumn: 'span 2' }}><label style={labelStyle}>Repair Instructions</label><textarea style={{ ...inputStyle, resize: 'none', height: '80px' }} value={formData.vehicleInfo} onChange={e => updateField('vehicleInfo', e.target.value)} placeholder="Enter service/repair requirements..." /></div>
        </div>
        <div style={{ padding: '1.25rem 1.5rem', borderTop: '1px solid #1e2d3d', display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '.5rem 1.25rem', background: 'none', border: '1px solid #1e3a5f', borderRadius: '8px', color: '#94a3b8', cursor: 'pointer' }}>Cancel</button>
          <button onClick={() => onConfirm(formData)} disabled={saving} style={{ padding: '.5rem 1.75rem', background: 'linear-gradient(135deg,#6366f1,#06b6d4)', border: 'none', borderRadius: '8px', color: '#fff', fontWeight: 700, cursor: 'pointer', opacity: saving ? .6 : 1 }}>{saving ? 'Saving...' : 'Save Job Card'}</button>
        </div>
      </div>
    </div>
  );
}

export default function FranchiseBookingsPage() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('all');
  const [updating, setUpdating] = useState(null);
  const [paymentUpdating, setPaymentUpdating] = useState(null);
  const [logisticsUpdating, setLogisticsUpdating] = useState(null);
  const [invoiceTarget, setInvoiceTarget] = useState(null);
  const [addInvoiceTarget, setAddInvoiceTarget] = useState(null);
  const [viewInvoice, setViewInvoice] = useState(null);
  const [jobCardTarget, setJobCardTarget] = useState(null);
  const [newBookingModal, setNewBookingModal] = useState(false);
  const { user } = useAuth();

  const load = (status = tab) => {
    setLoading(true);
    franchisePortalAPI.getBookings({ status })
      .then((r) => setBookings(r.data.bookings || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(tab); }, [tab]);

  const handleCreateBooking = async (data) => {
    setUpdating('new');
    try {
      const payload = { ...data, status: 'onboarded' };
      await franchisePortalAPI.createBooking(payload);
      setNewBookingModal(false);
      load();
    } catch (err) {
      alert('Failed to create booking');
    } finally {
      setUpdating(null);
    }
  };

  const changeStatus = async (id, status) => {
    setUpdating(id);
    try {
      await franchisePortalAPI.updateBookingStatus(id, { status });
      load(tab);
    } catch (err) {
      console.error(err);
    } finally {
      setUpdating(null);
    }
  };

  const handleComplete = async ({ invoiceItems, technicianNotes }) => {
    const targetId = invoiceTarget._id;
    setUpdating(targetId);
    try {
      await franchisePortalAPI.updateBookingStatus(targetId, {
        status: 'delivered',
        invoiceItems,
        technicianNotes,
      });
      setInvoiceTarget(null);
      load(tab);
    } catch (err) {
      console.error(err);
    } finally {
      setUpdating(null);
    }
  };

  const handleAddInvoice = async ({ invoiceItems, technicianNotes }) => {
    const targetId = addInvoiceTarget._id;
    setUpdating(targetId);
    try {
      await franchisePortalAPI.updateBookingStatus(targetId, {
        status: 'delivered',
        invoiceItems,
        technicianNotes,
      });
      setAddInvoiceTarget(null);
      load(tab);
    } catch (err) {
      console.error(err);
    } finally {
      setUpdating(null);
    }
  };

  const handleJobCardSave = async (data) => {
    setUpdating(jobCardTarget._id);
    try {
      await franchisePortalAPI.updateJobCard(jobCardTarget._id, data);
      setJobCardTarget(null);
      load();
    } catch (err) {
      alert('Failed to save Job Card');
    } finally {
      setUpdating(null);
    }
  };

  const toggleLogistics = async (id, type, current) => {
    setLogisticsUpdating(`${id}-${type}`);
    try {
      // 'none' and 'pending' both mean not-yet-collected; first press marks as completed
      const next = current === 'completed' ? 'pending' : 'completed';
      const field = type === 'pickup' ? 'pickupStatus' : 'dropStatus';
      await franchisePortalAPI.updateLogisticsStatus(id, { [field]: next });
      setBookings(prev => prev.map(bk => bk._id === id ? { ...bk, [field]: next } : bk));
    } catch (err) {
      console.error('Logistics update failed:', err.response?.data || err.message);
      alert('Failed to update logistics status');
    } finally {
      setLogisticsUpdating(null);
    }
  };

  const tabCounts = {};
  STATUS_TABS.forEach((t) => {
    tabCounts[t] = t === 'all' ? bookings.length : bookings.filter(b => b.status === t).length;
  });

  const bg   = { background: '#06071a', color: '#e2e8f0', minHeight: '100vh', display: 'flex' };
  const card = { background: '#0d0e2b', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, overflow: 'hidden' };
  const th   = { padding: '.65rem 1.25rem', textAlign: 'left', fontSize: '.7rem', fontWeight: 700, color: '#4b5563', borderBottom: '1px solid rgba(255,255,255,0.04)', background: 'rgba(255,255,255,0.02)', textTransform: 'uppercase', letterSpacing: '.6px' };
  const scColors = { onboarded: '#1a6ef7', diagnosis: '#00e5ff', in_progress: '#f59e0b', waiting_parts: '#ff9100', quality_check: '#a855f7', delivered: '#22c55e', cancelled: '#ef4444' };

  return (
    <div className="layout user-dark">
      <FranchiseSidebar />
      <div className="main-content" style={{ padding: '1.5rem 2rem' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#e2e8f0', margin: 0 }}>Bookings</h1>
            <button 
              onClick={() => setNewBookingModal(true)}
              style={{ background: 'linear-gradient(135deg,#6366f1,#06b6d4)', color: '#fff', border: 'none', borderRadius: 8, padding: '.45rem 1.25rem', fontWeight: 700, cursor: 'pointer', fontSize: '.85rem' }}
            >
              + New Booking
            </button>
          </div>
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

        {/* Status tabs */}
        <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap', marginBottom: '1.25rem', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '.5rem' }}>
          {STATUS_TABS.map((t) => (
            <button key={t} onClick={() => setTab(t)} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              padding: '.35rem .85rem', fontWeight: tab === t ? 700 : 500,
              color: tab === t ? '#00e5ff' : '#6b7280',
              borderBottom: tab === t ? '2px solid #00e5ff' : '2px solid transparent',
              fontSize: '.8rem', textTransform: 'capitalize', transition: 'all .15s',
            }}>
              {STATUS_MAP[t]?.label || 'All'}
              {tabCounts[t] > 0 && (
                <span style={{ marginLeft: '.3rem', background: tab === t ? 'rgba(0,229,255,0.15)' : 'rgba(255,255,255,0.06)', color: tab === t ? '#00e5ff' : '#6b7280', borderRadius: '999px', padding: '.1rem .4rem', fontSize: '.7rem', fontWeight: 700 }}>
                  {tabCounts[t]}
                </span>
              )}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4rem' }}><div style={{ width: 36, height: 36, border: '4px solid rgba(0,229,255,.2)', borderTopColor: '#00e5ff', borderRadius: '50%', animation: 'spin .8s linear infinite' }} /></div>
        ) : bookings.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: '#4b5563' }}>
            <div style={{ fontSize: '3rem' }}>📅</div>
            <p style={{ marginTop: '.5rem' }}>No bookings found</p>
          </div>
        ) : (
          <div style={card}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.82rem' }}>
                <thead>
                  <tr>{['Customer', 'Vehicle', 'Service', 'Logistics', 'Scheduled', 'Amount', 'Status', 'Payment', 'Actions'].map(h => <th key={h} style={th}>{h}</th>)}</tr>
                </thead>
                <tbody>
                  {bookings.map((b) => {
                    const sm = STATUS_MAP[b.status] || { label: b.status, next: null };
                    const sc = scColors[b.status] || '#6b7280';
                    return (
                      <tr key={b._id}>
                        <td style={{ padding: '.55rem 1.25rem' }}>
                          <div style={{ fontWeight: 600, color: '#e2e8f0' }}>{b.owner?.name || '—'}</div>
                          <div style={{ color: '#6b7280', fontSize: '.75rem' }}>{b.owner?.phone}</div>
                          {b.voiceNote && (
                            <div style={{ marginTop: '.35rem' }}>
                              <div style={{ fontSize: '.7rem', color: '#6b7280', marginBottom: '.15rem', fontWeight: 600 }}>🎙️ Voice Note</div>
                              <audio controls src={`/uploads/${b.voiceNote}`} style={{ width: '180px', height: '28px' }} />
                            </div>
                          )}
                        </td>
                        <td style={{ padding: '.55rem 1.25rem' }}>
                          <div style={{ fontWeight: 600, color: '#e2e8f0' }}>{b.vehicle?.registrationNumber || '—'}</div>
                          <div style={{ color: '#6b7280', fontSize: '.75rem' }}>{b.vehicle?.make} {b.vehicle?.model}</div>
                        </td>
                        <td style={{ padding: '.55rem 1.25rem', color: '#9ca3af', textTransform: 'capitalize' }}>{b.serviceType}</td>
                        <td style={{ padding: '.55rem 1.25rem' }}>
                          <div style={{ display: 'flex', gap: '.4rem' }}>
                            {b.pickupRequested ? (() => {
                              const pickupDone = b.pickupStatus === 'completed';
                              const dropDone   = b.dropStatus  === 'completed';
                              if (!pickupDone) {
                                return (
                                  <button
                                    onClick={() => toggleLogistics(b._id, 'pickup', b.pickupStatus)}
                                    disabled={logisticsUpdating === `${b._id}-pickup`}
                                    title="Mark as Picked Up"
                                    style={{ background: '#451a03', color: '#fb923c', border: '1px solid #78350f', borderRadius: 6, padding: '3px 10px', fontSize: '.68rem', fontWeight: 700, cursor: 'pointer', opacity: logisticsUpdating === `${b._id}-pickup` ? .6 : 1, transition: 'all .2s' }}
                                  >
                                    {logisticsUpdating === `${b._id}-pickup` ? '…' : '🚛 Pickup'}
                                  </button>
                                );
                              }
                              if (!dropDone) {
                                return (
                                  <button
                                    onClick={() => toggleLogistics(b._id, 'drop', b.dropStatus)}
                                    disabled={logisticsUpdating === `${b._id}-drop`}
                                    title="Mark as Dropped"
                                    style={{ background: '#1e3a5f', color: '#38bdf8', border: '1px solid #1e4976', borderRadius: 6, padding: '3px 10px', fontSize: '.68rem', fontWeight: 700, cursor: 'pointer', opacity: logisticsUpdating === `${b._id}-drop` ? .6 : 1, transition: 'all .2s' }}
                                  >
                                    {logisticsUpdating === `${b._id}-drop` ? '…' : '🏠 Drop'}
                                  </button>
                                );
                              }
                              return (
                                <span style={{ background: '#14532d', color: '#4ade80', border: '1px solid #166534', borderRadius: 6, padding: '3px 10px', fontSize: '.68rem', fontWeight: 700 }}>
                                  ✅ Done
                                </span>
                              );
                            })() : (
                              <span style={{ color: '#4b5563', fontSize: '.75rem' }}>—</span>
                            )}
                          </div>
                        </td>
                        <td style={{ padding: '.55rem 1.25rem', color: '#9ca3af' }}>{b.scheduledDate ? new Date(b.scheduledDate).toLocaleDateString('en-IN') : new Date(b.createdAt).toLocaleDateString('en-IN')}</td>
                        <td style={{ padding: '.55rem 1.25rem', fontWeight: 600, color: '#e2e8f0' }}>{b.finalAmount ? `₹${b.finalAmount.toLocaleString('en-IN')}` : b.estimatedAmount ? `~₹${b.estimatedAmount.toLocaleString('en-IN')}` : '—'}</td>
                        <td style={{ padding: '.55rem 1.25rem' }}>
                          <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: '.72rem', fontWeight: 600, color: sc, background: `${sc}18`, border: `1px solid ${sc}40` }}>{sm.label}</span>
                        </td>
                        <td style={{ padding: '.55rem 1.25rem' }}>
                          {b.status === 'delivered' ? (
                            <select
                              value={b.paymentStatus || 'pending'}
                              disabled={paymentUpdating === b._id}
                              onChange={async (e) => {
                                setPaymentUpdating(b._id);
                                try {
                                  await franchisePortalAPI.confirmPayment(b._id, { paymentStatus: e.target.value });
                                  setBookings(prev => prev.map(bk => bk._id === b._id ? { ...bk, paymentStatus: e.target.value } : bk));
                                } catch (err) { console.error(err); }
                                finally { setPaymentUpdating(null); }
                              }}
                              style={{ background: b.paymentStatus === 'confirmed' ? '#f0fdf4' : b.paymentStatus === 'waived' ? '#fefce8' : '#0d0e2b', color: b.paymentStatus === 'confirmed' ? '#15803d' : b.paymentStatus === 'waived' ? '#92400e' : '#9ca3af', border: `1px solid ${b.paymentStatus === 'confirmed' ? '#86efac' : b.paymentStatus === 'waived' ? '#fde68a' : 'rgba(255,255,255,0.1)'}`, borderRadius: '7px', padding: '.3rem .6rem', fontSize: '.75rem', fontWeight: 600, cursor: 'pointer', opacity: paymentUpdating === b._id ? .6 : 1 }}
                            >
                              <option value="pending">⏳ Pending</option>
                              <option value="confirmed">✅ Confirmed</option>
                              <option value="waived">🔄 Waived</option>
                            </select>
                          ) : (
                            <span style={{ color: '#4b5563', fontSize: '.75rem' }}>—</span>
                          )}
                        </td>
                        <td style={{ padding: '.55rem 1.25rem' }}>
                          <div style={{ display: 'flex', gap: '.4rem', flexWrap: 'wrap' }}>
                            <button onClick={() => navigate(`/franchise/bookings/${b._id}`)} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 7, padding: '.35rem .8rem', color: '#e2e8f0', fontSize: '.75rem', fontWeight: 600, cursor: 'pointer' }}>
                              View
                            </button>
                            {sm.next && sm.next !== 'delivered' && (
                              <button disabled={updating === b._id} onClick={() => changeStatus(b._id, sm.next)} style={{ background: '#1a6ef7', border: 'none', borderRadius: 7, padding: '.35rem .8rem', color: '#fff', fontSize: '.75rem', fontWeight: 600, cursor: 'pointer', opacity: updating === b._id ? .6 : 1 }}>
                                {updating === b._id ? '…' : sm.nextLabel}
                              </button>
                            )}
                            {sm.next === 'delivered' && (
                              <button disabled={updating === b._id} onClick={() => setInvoiceTarget(b)} style={{ background: '#22c55e', border: 'none', borderRadius: 7, padding: '.35rem .8rem', color: '#fff', fontSize: '.75rem', fontWeight: 600, cursor: 'pointer', opacity: updating === b._id ? .6 : 1 }}>
                                🧾 Mark Complete
                              </button>
                            )}
                            {b.status === 'delivered' && b.invoiceItems?.length > 0 && (
                              <button onClick={() => setViewInvoice(b)} style={{ background: 'rgba(26,110,247,0.15)', border: '1px solid rgba(26,110,247,0.3)', borderRadius: 7, padding: '.35rem .8rem', color: '#1a6ef7', fontSize: '.75rem', fontWeight: 600, cursor: 'pointer' }}>
                                📄 Invoice
                              </button>
                            )}
                            {b.status === 'delivered' && !b.invoiceItems?.length && (
                              <button onClick={() => setAddInvoiceTarget(b)} style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 7, padding: '.35rem .8rem', color: '#f59e0b', fontSize: '.75rem', fontWeight: 600, cursor: 'pointer' }}>
                                ➕ Add Invoice
                              </button>
                            )}
                            {b.status !== 'delivered' && b.status !== 'cancelled' && (
                              <button
                                disabled={updating === b._id}
                                onClick={() => changeStatus(b._id, 'cancelled')}
                                title="Cancel booking"
                                style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 7, width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444', fontSize: '1rem', cursor: 'pointer', opacity: updating === b._id ? .5 : 1, flexShrink: 0, transition: 'all .15s' }}
                              >
                                ✕
                              </button>
                            )}
                          </div>
                        </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
        )}
      </div>

      {jobCardTarget && (
        <JobCardModal
          booking={jobCardTarget}
          saving={updating === jobCardTarget._id}
          onClose={() => setJobCardTarget(null)}
          onConfirm={handleJobCardSave}
        />
      )}

      {invoiceTarget && (
        <InvoiceModal
          booking={invoiceTarget}
          saving={updating === invoiceTarget._id}
          onClose={() => setInvoiceTarget(null)}
          onConfirm={handleComplete}
        />
      )}

      {/* Add invoice to an already-completed booking */}
      {addInvoiceTarget && (
        <InvoiceModal
          booking={addInvoiceTarget}
          saving={updating === addInvoiceTarget._id}
          onClose={() => setAddInvoiceTarget(null)}
          onConfirm={handleAddInvoice}
        />
      )}

      {/* Invoice view modal */}
      {viewInvoice && (
        <InvoiceViewModal booking={viewInvoice} onClose={() => setViewInvoice(null)} />
      )}

      {newBookingModal && (
        <NewBookingModal 
          saving={updating === 'new'}
          onClose={() => setNewBookingModal(false)}
          onConfirm={handleCreateBooking}
        />
      )}
    </div>
  );
}




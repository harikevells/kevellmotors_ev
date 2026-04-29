import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { franchisePortalAPI as franchiseApi } from '../../api';
import { InvoiceContent } from './FranchiseBookingsPage';

export default function FranchiseBookingDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchBooking = useCallback(async () => {
    setLoading(true);
    try {
      const res = await franchiseApi.getBookings();
      const all = res.data.bookings || [];
      const found = all.find(b => b._id === id);
      if (found) {
        setBooking(found);
      } else {
        setError('Booking not found');
      }
    } catch (err) {
      console.error(err);
      setError('Failed to load booking details');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchBooking();
  }, [fetchBooking]);

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>Loading booking details...</div>;
  if (error) return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <p style={{ color: '#ef4444', marginBottom: '1rem' }}>{error}</p>
      <button onClick={() => navigate('/franchise/bookings')} style={{ background: '#38bdf8', color: '#fff', border: 'none', padding: '.5rem 1rem', borderRadius: '8px', cursor: 'pointer' }}>Back to Bookings</button>
    </div>
  );
  if (!booking) return null;

  return (
    <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto', minHeight: '100vh', background: '#0a0f1e', color: '#e2e8f0' }}>
      
      {/* Header / Nav */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <button 
          onClick={() => navigate('/franchise/bookings')} 
          style={{ background: 'none', border: '1px solid #1e3a5f', color: '#38bdf8', padding: '.5rem 1rem', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          ← Back to Bookings
        </button>
        <div style={{ textAlign: 'right' }}>
          <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800 }}>Booking Details</h2>
          <p style={{ margin: 0, fontSize: '.85rem', color: '#64748b' }}>ID: {booking._id}</p>
        </div>
      </div>

      {/* Main Content Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '2rem', alignItems: 'start' }}>
        
        {/* Left Col: Invoice (The Professional View) */}
        <div style={{ background: '#fff', borderRadius: '12px', padding: '1rem', boxShadow: '0 10px 25px rgba(0,0,0,0.3)' }}>
          <InvoiceContent booking={booking} />
          
          <div style={{ marginTop: '2rem', borderTop: '1px solid #e1e7ee', paddingTop: '1.5rem', textAlign: 'center' }}>
             <button 
              onClick={() => window.print()} 
              style={{ background: '#007b7c', color: '#fff', border: 'none', padding: '.75rem 2rem', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', fontSize: '.9rem' }}
             >
                🖨️ Print Invoice
             </button>
          </div>
        </div>

        {/* Right Col: Supplementary Details (Job Card Info) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Job Card Section */}
          <div style={{ background: '#111827', border: '1px solid #1e3a5f', borderRadius: '12px', padding: '1.25rem' }}>
            <h3 style={{ margin: '0 0 1rem', fontSize: '.9rem', color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '1px' }}>🛠️ Job Card Summary</h3>
            <DetailRow label="Job No" value={booking.jobCard?.jobNo} />
            <DetailRow label="Speedo" value={booking.jobCard?.speedo ? `${booking.jobCard.speedo} KM` : 'N/A'} />
            <DetailRow label="Technician Notes" value={booking.technicianNotes} />
            
            <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #1e2d3d' }}>
              <h4 style={{ fontSize: '.75rem', fontWeight: 800, color: '#94a3b8', margin: '0 0 .5rem', textTransform: 'uppercase' }}>Instruction / Info</h4>
              <p style={{ fontSize: '.85rem', color: '#cbd5e1', lineHeight: 1.5, margin: 0 }}>{booking.jobCard?.vehicleInfo || 'No extra instructions.'}</p>
            </div>
          </div>

          {/* Status Section */}
          <div style={{ background: '#111827', border: '1px solid #1e3a5f', borderRadius: '12px', padding: '1.25rem' }}>
            <h3 style={{ margin: '0 0 1rem', fontSize: '.9rem', color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '1px' }}>✨ Service Status</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '6px', background: booking.status === 'completed' ? '#22c55e' : '#f59e0b' }}></div>
              <span style={{ fontSize: '1rem', fontWeight: 700, textTransform: 'capitalize' }}>{booking.status.replace(/_/g, ' ')}</span>
            </div>
          </div>

        </div>
      </div>
      
      {/* Print Specific Styles */}
      <style>{`
        @media print {
          body * { visibility: hidden; background: #fff !important; }
          #print-area, #print-area * { visibility: visible; }
          #print-area { position: absolute; left: 0; top: 0; width: 100%; }
          .no-print { display: none !important; }
        }
      `}</style>
    </div>
  );
}

function DetailRow({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '.6rem', fontSize: '.85rem' }}>
      <span style={{ color: '#94a3b8' }}>{label}</span>
      <span style={{ fontWeight: 600, color: '#f1f5f9' }}>{value || '—'}</span>
    </div>
  );
}

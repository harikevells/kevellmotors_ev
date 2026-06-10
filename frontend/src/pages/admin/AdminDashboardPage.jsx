import { useEffect, useState } from 'react';
import AdminSidebar from '../../components/admin/AdminSidebar';
import AdminPageHeader from '../../components/admin/AdminPageHeader';
import { adminAPI } from '../../api';
import { useAuth } from '../../context/AuthContext';

/* ── Mini Sparkline ─────────────────────────────────── */
function Sparkline({ color = '#00e5ff' }) {
  const pts = [[0,18],[12,14],[24,17],[36,10],[48,13],[60,8],[72,11]];
  return (
    <svg viewBox="0 0 72 22" width="72" height="22">
      <polyline
        points={pts.map(p => p.join(',')).join(' ')}
        fill="none" stroke={color} strokeWidth="1.8"
        strokeLinecap="round" strokeLinejoin="round" opacity="0.8"
      />
    </svg>
  );
}

/* ── Donut Chart ────────────────────────────────────── */
function DonutChart({ segments }) {
  const total = segments.reduce((s, x) => s + (x.value || 0), 0) || 0;
  const r = 52, cx = 65, cy = 65, circ = 2 * Math.PI * r;
  let cumFrac = 0;
  return (
    <svg viewBox="0 0 130 130" width={130} height={130} style={{ flexShrink: 0 }}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#1a1a40" strokeWidth="16" />
      {segments.map((seg, i) => {
        const frac = total > 0 ? (seg.value || 0) / total : 0;
        const dashArray = `${frac * circ} ${circ}`;
        const dashOffset = -cumFrac * circ;
        cumFrac += frac;
        return (
          <circle key={i} cx={cx} cy={cy} r={r}
            fill="none" stroke={seg.color} strokeWidth="16"
            strokeDasharray={dashArray} strokeDashoffset={dashOffset}
            style={{ transform: 'rotate(-90deg)', transformOrigin: `${cx}px ${cy}px` }}
          />
        );
      })}
      {/* Center total */}
      <text x={cx} y={cy - 6} textAnchor="middle" fill="#e2e8f0" fontSize="22" fontWeight="700">
        {String(total).padStart(2, '0')}
      </text>
      <text x={cx} y={cy + 13} textAnchor="middle" fill="#6b7280" fontSize="9" letterSpacing="0.8">
        TOTAL
      </text>
    </svg>
  );
}

/* ── Payment Bar Chart ──────────────────────────────── */
function PaymentBars({ success = 0, failed = 0, refunded = 0 }) {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Fri', 'Thur', 'Sat'];
  // Realistic variation pattern matching Figma
  const patterns = [
    [0.25, 0.21, 0.30],
    [0.34, 0.29, 0.42],
    [0.27, 0.23, 0.33],
    [0.20, 0.17, 0.23],
    [0.27, 0.23, 0.33],
    [0.34, 0.29, 0.42],
    [0.25, 0.21, 0.30],
  ];
  const scale = Math.max(success, failed, refunded, 1);
  const h = 180, bw = 10, gap = 4, gw = 50, leftPad = 40;
  const totalW = days.length * gw + leftPad + 12;
  const maxPct = 0.5;
  return (
    <svg viewBox={`0 0 ${totalW} ${h + 30}`} width="100%" style={{ display: 'block' }}>
      <defs>
        <linearGradient id="gBlue" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#38bdf8"/>
          <stop offset="100%" stopColor="#0EA5E9" stopOpacity="0.8"/>
        </linearGradient>
        <linearGradient id="gGrey" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#e5e7eb" stopOpacity="0.85"/>
          <stop offset="100%" stopColor="#9ca3af" stopOpacity="0.65"/>
        </linearGradient>
        <linearGradient id="gGreen" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#4ade80"/>
          <stop offset="100%" stopColor="#02FF7F" stopOpacity="0.85"/>
        </linearGradient>
      </defs>
      {/* Horizontal grid lines */}
      {[0.1, 0.2, 0.3, 0.4, 0.5].map(pct => {
        const y = h * (1 - pct / maxPct);
        return (
          <g key={pct}>
            <line x1={leftPad} y1={y} x2={totalW - 4} y2={y}
              stroke="rgba(255,255,255,0.06)" strokeWidth="1" strokeDasharray="4 4"/>
            <text x={leftPad - 6} y={y + 4} textAnchor="end"
              fontSize="9" fill="#6b7280">{Math.round(pct * 100)}%</text>
          </g>
        );
      })}
      {/* Bars */}
      {days.map((day, i) => {
        const x = leftPad + i * gw + 2;
        const [sp, fp, rp] = patterns[i];
        const sh = Math.max(6, sp * h);
        const fh = Math.max(6, fp * h);
        const rh = Math.max(6, rp * h);
        const cx = x + (bw * 1.5 + gap);
        return (
          <g key={day}>
            <rect x={x}             y={h - sh} width={bw} height={sh} fill="url(#gBlue)"  rx="3"/>
            <rect x={x + bw + gap}  y={h - fh} width={bw} height={fh} fill="url(#gGrey)"  rx="3"/>
            <rect x={x+(bw+gap)*2}  y={h - rh} width={bw} height={rh} fill="url(#gGreen)" rx="3"/>
            <text x={cx} y={h + 20} textAnchor="middle" fontSize="9" fill="#6b7280">{day}</text>
          </g>
        );
      })}
    </svg>
  );
}

/* ── Dark Status Badge ──────────────────────────────── */
const BADGE = {
  onboarded:     { label: 'On Board',      color: '#1a6ef7', bg: 'rgba(26,110,247,.15)'  },
  'in-progress': { label: 'In Progress',   color: '#f59e0b', bg: 'rgba(245,158,11,.15)'  },
  delivered:     { label: 'Delivered',     color: '#22c55e', bg: 'rgba(34,197,94,.15)'   },
  battery:       { label: 'Diagnosis',     color: '#00e5ff', bg: 'rgba(0,229,255,.12)'   },
  software:      { label: 'Quality Check', color: '#a855f7', bg: 'rgba(168,85,247,.15)'  },
  general:       { label: 'General',       color: '#f59e0b', bg: 'rgba(245,158,11,.15)'  },
  inspection:    { label: 'Inspection',    color: '#22c55e', bg: 'rgba(34,197,94,.15)'   },
};
function DarkBadge({ status }) {
  const key = Object.keys(BADGE).find(k => status?.toLowerCase().includes(k));
  const cfg = key ? BADGE[key] : { label: status || '—', color: '#6b7280', bg: 'rgba(107,114,128,.15)' };
  return (
    <span style={{
      padding: '3px 12px', borderRadius: 20, fontSize: '.72rem', fontWeight: 600,
      color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.color}40`,
      letterSpacing: '.3px', whiteSpace: 'nowrap',
    }}>{cfg.label}</span>
  );
}

/* ── Star Rating ───────────────────────────────────── */
function StarRating({ rating = 0, max = 5 }) {
  return (
    <div style={{ display: 'flex', gap: 2 }}>
      {Array.from({ length: max }, (_, i) => (
        <svg key={i} viewBox="0 0 16 16" width="14" height="14">
          <polygon
            points="8,1 10,6 15,6 11,9.5 12.5,15 8,12 3.5,15 5,9.5 1,6 6,6"
            fill={i < rating ? '#0EA5E9' : 'rgba(255,255,255,0.1)'}
            stroke={i < rating ? '#38bdf8' : 'rgba(255,255,255,0.12)'}
            strokeWidth="0.5"
          />
        </svg>
      ))}
    </div>
  );
}

/* ── Stat Card ──────────────────────────────────────── */
function StatCard({ label, value, color, sub }) {
  return (
    <div style={{
      background: 'linear-gradient(135deg,#0d0e2b 0%,#0a0b22 100%)',
      border: `1px solid ${color}30`, borderRadius: 12,
      padding: '1.25rem 1.5rem', position: 'relative', overflow: 'hidden',
    }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,${color},${color}60)` }} />
      <div style={{ fontSize: '.72rem', color: '#6b7280', marginBottom: '.4rem', textTransform: 'uppercase', letterSpacing: '.8px' }}>{label}</div>
      <div style={{ fontSize: '2rem', fontWeight: 700, color: '#e2e8f0', letterSpacing: '-1px', marginBottom: '.35rem' }}>{value}</div>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '.7rem', color: color, fontWeight: 600 }}>{sub}</span>
        <Sparkline color={color} />
      </div>
    </div>
  );
}

/* ══════════════ Main Page ═══════════════════════════ */
export default function AdminDashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    adminAPI.dashboard()
      .then(r => setData(r.data.dashboard))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const bg    = { background: '#06071a', color: '#e2e8f0', minHeight: '100vh', display: 'flex' };
  const card  = { background: '#0d0e2b', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12 };
  const iconBtn = {
    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 8, padding: '6px 10px', color: '#9ca3af', cursor: 'pointer', fontSize: '.9rem',
  };

  if (loading) return (
    <div style={bg}>
      <AdminSidebar />
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 40, height: 40, border: '4px solid rgba(0,229,255,.2)', borderTopColor: '#00e5ff', borderRadius: '50%', animation: 'spin .8s linear infinite' }} />
      </div>
    </div>
  );

  const svcSegments = [
    { value: data?.services?.onboarded  || 0, color: '#1a6ef7', label: 'On Boarded' },
    { value: data?.services?.inProgress || 0, color: '#00e5ff', label: 'In Progress' },
    { value: data?.services?.delivered  || 0, color: '#4b5563', label: 'Delivered'   },
  ];

  return (
    <div style={bg}>
      <AdminSidebar />
      <div style={{ flex: 1, padding: '1.5rem 2rem', overflowY: 'auto' }}>

        {/* ── Header ── */}
        <AdminPageHeader title="Dashboard" />

        {/* ── Stat Cards ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
          <StatCard label="Total Users"    value={String(data?.users?.total          || 0).padStart(2, '0')} color="#00e5ff" sub="+2 this month" />
          <StatCard label="Total Services" value={String(data?.services?.total       || 0).padStart(2, '0')} color="#1a6ef7" sub="+4 this week"  />
          <StatCard label="Total Revenue"  value={`₹${(data?.payments?.revenue || 0).toLocaleString()}`}    color="#22c55e" sub="+12% growth"  />
          <StatCard label="Active Plans"   value={String(data?.subscriptions?.active || 0).padStart(2, '0')} color="#a855f7" sub="2 renewals"   />
        </div>

        {/* ── Charts Row ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '1.25rem', marginBottom: '1.25rem' }}>

          {/* Service Status */}
          <div style={{ ...card, padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontWeight: 700, fontSize: '1.05rem', color: '#e2e8f0', marginBottom: '1.25rem' }}>Service Status</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flex: 1 }}>
              <div style={{ flexShrink: 0 }}>
                <DonutChart segments={svcSegments} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                {svcSegments.map((seg, idx) => (
                  <div key={seg.label} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '.75rem 0',
                    borderBottom: idx < svcSegments.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem' }}>
                      <span style={{ width: 11, height: 11, borderRadius: 3, background: seg.color, display: 'inline-block', flexShrink: 0, boxShadow: `0 0 6px ${seg.color}60` }} />
                      <span style={{ fontSize: '.83rem', color: '#9ca3af' }}>{seg.label}</span>
                    </div>
                    <span style={{ fontWeight: 700, color: seg.color, fontSize: '1.05rem', minWidth: 28, textAlign: 'right' }}>
                      {String(seg.value).padStart(2, '0')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Payment Status */}
          <div style={{ ...card, padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '.5rem' }}>
              <span style={{ fontWeight: 700, fontSize: '1.05rem', color: '#e2e8f0' }}>Payment Status</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '.78rem' }}>
                {[['#0EA5E9','Successful'], ['#C6C6C6','Failed'], ['#02FF7F','Refund']].map(([c, l]) => (
                  <span key={l} style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#9ca3af' }}>
                    <span style={{ width: 11, height: 11, borderRadius: 3, background: c, display: 'inline-block', flexShrink: 0, boxShadow: `0 0 6px ${c}80` }} />
                    {l}
                  </span>
                ))}
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <PaymentBars
                success={data?.payments?.success   || 0}
                failed={data?.payments?.failed     || 0}
                refunded={data?.payments?.refunded || 0}
              />
            </div>
          </div>
        </div>

        {/* ── Recent Services ── */}
        <div style={{ ...card, overflow: 'hidden', marginTop: '1.25rem' }}>
          <div style={{
            padding: '1rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.06)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <span style={{ fontWeight: 700, fontSize: '1.05rem', color: '#e2e8f0' }}>Recent Services</span>
            <span style={{ fontSize: '.75rem', color: '#6b7280' }}>Latest service records</span>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.82rem', tableLayout: 'fixed' }}>
              <colgroup>
                <col style={{ width: '14%' }} />
                <col style={{ width: '13%' }} />
                <col style={{ width: '14%' }} />
                <col style={{ width: '13%' }} />
                <col style={{ width: '12%' }} />
                <col style={{ width: '14%' }} />
                <col style={{ width: '10%' }} />
              </colgroup>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                  {['Customer','Phone No','Vehicle','Vehicle No','Type','Status','Date'].map(h => (
                    <th key={h} style={{
                      padding: '.75rem 1.25rem', textAlign: 'left',
                      fontSize: '.7rem', fontWeight: 700, color: '#4b5563',
                      borderBottom: '1px solid rgba(255,255,255,0.06)',
                      background: 'transparent', textTransform: 'uppercase', letterSpacing: '.6px',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data?.recentServices?.map((s, idx) => (
                  <tr key={s._id} style={{
                    borderBottom: '1px solid rgba(255,255,255,0.04)',
                    background: idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)',
                    transition: 'background .15s',
                  }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,229,255,0.04)'}
                    onMouseLeave={e => e.currentTarget.style.background = idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)'}
                  >
                    <td style={{ padding: '.8rem 1.25rem', color: '#e2e8f0', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.owner?.name}</td>
                    <td style={{ padding: '.8rem 1.25rem', color: '#9ca3af' }}>{s.owner?.phone}</td>
                    <td style={{ padding: '.8rem 1.25rem', color: '#9ca3af', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.vehicle?.make} {s.vehicle?.model}</td>
                    <td style={{ padding: '.8rem 1.25rem', color: '#9ca3af' }}>{s.vehicle?.registrationNumber}</td>
                    <td style={{ padding: '.8rem 1.25rem', color: '#9ca3af', textTransform: 'capitalize' }}>{s.serviceType}</td>
                    <td style={{ padding: '.8rem 1.25rem' }}><DarkBadge status={s.serviceType || s.status} /></td>
                    <td style={{ padding: '.8rem 1.25rem', color: '#9ca3af' }}>{new Date(s.createdAt).toLocaleDateString('en-GB')}</td>
                  </tr>
                ))}
                {(!data?.recentServices || data.recentServices.length === 0) && (
                  <tr><td colSpan={7} style={{ padding: '2.5rem', textAlign: 'center', color: '#4b5563' }}>No recent services</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Recent Feedback ── */}
        <div style={{ ...card, overflow: 'hidden', marginTop: '1.25rem' }}>
          <div style={{
            padding: '1rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.06)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <span style={{ fontWeight: 700, fontSize: '1.05rem', color: '#e2e8f0' }}>Recent Feedback</span>
            <span style={{ fontSize: '.75rem', color: '#6b7280' }}>Latest customer reviews</span>
          </div>
          <div style={{ padding: '1.25rem 1.5rem' }}>
            {data?.recentFeedback?.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1rem' }}>
                {data.recentFeedback.map((fb, idx) => (
                  <div key={fb._id || idx} style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.07)',
                    borderRadius: 10, padding: '1rem',
                    display: 'flex', flexDirection: 'column', gap: '.6rem',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem' }}>
                      <div style={{
                        width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
                        background: 'linear-gradient(135deg,#1a2540,#0d1a36)',
                        border: '1px solid rgba(14,165,233,0.3)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '.9rem', fontWeight: 700, color: '#0EA5E9',
                      }}>
                        {fb.user?.name?.[0]?.toUpperCase() || '?'}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '.85rem', color: '#e2e8f0', marginBottom: 3 }}>
                          {fb.user?.name || 'Anonymous'}
                        </div>
                        <StarRating rating={fb.rating} />
                      </div>
                    </div>
                    {fb.comment && (
                      <p style={{
                        fontSize: '.78rem', color: '#9ca3af', margin: 0,
                        lineHeight: 1.5, textAlign: 'left',
                        borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '.6rem',
                      }}>{fb.comment}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', color: '#4b5563', padding: '2rem' }}>No feedback yet</div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

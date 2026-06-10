import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import UserSidebar from '../../components/user/UserSidebar';
import UserPageHeader from '../../components/user/UserPageHeader';
import Spinner from '../../components/common/Spinner';
import { StatusBadge } from '../../components/common/UI';
import { vehicleAPI, serviceAPI, subscriptionAPI, reminderAPI, feedAPI } from '../../api';
import { useAuth } from '../../context/AuthContext';

export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState({ vehicles: [], services: [], subscriptions: [], reminders: [] });
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    setError('');
    Promise.all([
      vehicleAPI.list(),
      serviceAPI.list(),
      subscriptionAPI.list(),
      reminderAPI.list(),
      feedAPI.list({ limit: 20 }),
    ]).then(([v, s, sub, r, f]) => {
      setData({
        vehicles: v.data.vehicles || [],
        services: s.data.services || [],
        subscriptions: sub.data.subscriptions || [],
        reminders: r.data.reminders || [],
      });
      const allPosts = f.data.posts || [];
      setAnnouncements(
        allPosts
          .filter((p) => p.type === 'announcement' || p.type === 'offer')
          .slice(0, 5)
      );
    }).catch((err) => {
      setError(err.response?.data?.message || 'Failed to load dashboard data. Please refresh.');
    }).finally(() => setLoading(false));
  }, [user?._id]);

  if (loading) return <div className="layout user-dark"><UserSidebar /><div className="main-content"><Spinner /></div></div>;

  const activeServices = data.services.filter((s) => s.status !== 'delivered');
  const pendingReminders = data.reminders.filter((r) => !r.isAcknowledged);
  const activePlans = data.subscriptions.filter((s) => s.status === 'active').length;

  const statCards = [
    { icon: '🚗', label: 'My Vehicles', value: data.vehicles.length, accent: '#06b6d4', bg: 'rgba(6,182,212,.1)', link: '/vehicles' },
    { icon: '🔧', label: 'Active Services', value: activeServices.length, accent: '#818cf8', bg: 'rgba(129,140,248,.1)', link: '/services' },
    { icon: '⚡', label: 'Active Plans', value: activePlans, accent: '#4ade80', bg: 'rgba(74,222,128,.1)', link: '/subscriptions' },
    { icon: '🔔', label: 'Reminders', value: pendingReminders.length, accent: '#fb923c', bg: 'rgba(251,146,60,.1)', link: '/reminders' },
  ];

  return (
    <div className="layout user-dark">
      <UserSidebar />
      <div className="main-content" style={{ padding: '1.5rem 2rem' }}>

        {/* Header */}
        <UserPageHeader 
          title={<span>Welcome back, <span style={{ color: '#06b6d4' }}>{user?.name?.split(' ')[0] || 'User'}</span> 👋</span>}
          subtitle="Here's what's happening with your EV today."
        />

        {error && (
          <div style={{ background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.3)', borderRadius: '10px', padding: '.75rem 1rem', marginBottom: '1.25rem', color: '#f87171', fontSize: '.9rem' }}>
            ⚠️ {error}
          </div>
        )}

        {/* Stat Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '1rem', marginBottom: '1.75rem' }}>
          {statCards.map((s) => (
            <Link key={s.label} to={s.link} style={{ textDecoration: 'none' }}>
              <div style={{
                background: 'linear-gradient(135deg, #0d0e2b 0%, #111330 100%)',
                border: `1px solid ${s.accent}30`,
                borderRadius: '14px',
                padding: '1.25rem 1.4rem',
                display: 'flex', alignItems: 'center', gap: '1rem',
                transition: 'transform .18s, box-shadow .18s',
                cursor: 'pointer',
                boxShadow: `0 4px 24px ${s.accent}10`,
              }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 8px 32px ${s.accent}22`; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = `0 4px 24px ${s.accent}10`; }}
              >
                <div style={{
                  width: 48, height: 48, borderRadius: '12px', flexShrink: 0,
                  background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem',
                }}>
                  {s.icon}
                </div>
                <div>
                  <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#f1f5f9', lineHeight: 1 }}>{s.value}</div>
                  <div style={{ fontSize: '.75rem', color: '#64748b', marginTop: '.25rem', fontWeight: 500 }}>{s.label}</div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Reminder banner */}
        {pendingReminders.length > 0 && (
          <div style={{
            background: 'linear-gradient(90deg, rgba(251,146,60,.12) 0%, rgba(251,146,60,.05) 100%)',
            border: '1px solid rgba(251,146,60,.3)',
            borderRadius: '10px', padding: '.75rem 1.25rem', marginBottom: '1.75rem',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <span style={{ color: '#fdba74', fontSize: '.9rem' }}>
              🔔 You have <strong>{pendingReminders.length}</strong> pending reminder{pendingReminders.length > 1 ? 's' : ''}
            </span>
            <Link to="/reminders" style={{ color: '#fb923c', fontSize: '.8rem', fontWeight: 600, textDecoration: 'none' }}>View all →</Link>
          </div>
        )}

        {/* Two-column: main content + feed sidebar */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '1.5rem', alignItems: 'start' }}>

          {/* ── LEFT COLUMN ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

            {/* Recent Services */}
            <div style={{ background: 'linear-gradient(135deg,#0d0e2b,#111330)', border: '1px solid rgba(99,102,241,.18)', borderRadius: '16px', overflow: 'hidden' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.1rem 1.5rem', borderBottom: '1px solid rgba(99,102,241,.12)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem' }}>
                  <span style={{ fontSize: '1.1rem' }}>🔧</span>
                  <span style={{ fontWeight: 700, color: '#e2e8f0', fontSize: '1rem' }}>Recent Services</span>
                </div>
                <Link to="/services" style={{ fontSize: '.75rem', fontWeight: 600, color: '#06b6d4', textDecoration: 'none', padding: '.3rem .8rem', border: '1px solid rgba(6,182,212,.3)', borderRadius: '8px' }}>View All →</Link>
              </div>
              <div style={{ padding: '0 1.5rem' }}>
                {data.services.length === 0 ? (
                  <p style={{ color: '#64748b', padding: '1.5rem 0', margin: 0, fontSize: '.9rem' }}>No services yet. <Link to="/services" style={{ color: '#06b6d4' }}>Book one</Link></p>
                ) : (
                  data.services.slice(0, 5).map((s, i) => (
                    <div key={s._id} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '.9rem 0',
                      borderBottom: i < Math.min(data.services.length, 5) - 1 ? '1px solid rgba(99,102,241,.1)' : 'none',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '.85rem' }}>
                        <div style={{ width: 36, height: 36, borderRadius: '10px', background: 'rgba(129,140,248,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.95rem' }}>⚙️</div>
                        <div>
                          <div style={{ fontWeight: 600, color: '#e2e8f0', fontSize: '.9rem', textTransform: 'capitalize' }}>{s.serviceType?.replace(/_/g, ' ')}</div>
                          <div style={{ fontSize: '.75rem', color: '#64748b', marginTop: '1px' }}>{s.vehicle?.registrationNumber}</div>
                        </div>
                      </div>
                      <StatusBadge status={s.status} />
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* My Vehicles */}
            <div style={{ background: 'linear-gradient(135deg,#0d0e2b,#111330)', border: '1px solid rgba(99,102,241,.18)', borderRadius: '16px', overflow: 'hidden' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.1rem 1.5rem', borderBottom: '1px solid rgba(99,102,241,.12)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem' }}>
                  <span style={{ fontSize: '1.1rem' }}>🚗</span>
                  <span style={{ fontWeight: 700, color: '#e2e8f0', fontSize: '1rem' }}>My Vehicles</span>
                </div>
                <Link to="/vehicles" style={{ fontSize: '.75rem', fontWeight: 600, color: '#06b6d4', textDecoration: 'none', padding: '.3rem .8rem', border: '1px solid rgba(6,182,212,.3)', borderRadius: '8px' }}>Manage →</Link>
              </div>
              <div style={{ padding: '0 1.5rem' }}>
                {data.vehicles.length === 0 ? (
                  <p style={{ color: '#64748b', padding: '1.5rem 0', margin: 0, fontSize: '.9rem' }}>No vehicles yet. <Link to="/vehicles" style={{ color: '#06b6d4' }}>Add one</Link></p>
                ) : (
                  data.vehicles.map((v, i) => (
                    <div key={v._id} style={{
                      display: 'flex', alignItems: 'center', gap: '1rem',
                      padding: '.9rem 0',
                      borderBottom: i < data.vehicles.length - 1 ? '1px solid rgba(99,102,241,.1)' : 'none',
                    }}>
                      <div style={{ width: 42, height: 42, borderRadius: '12px', background: 'rgba(6,182,212,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem' }}>
                        {v.vehicleType === '2-wheeler' ? '🛵' : v.vehicleType === '3-wheeler' ? '🛺' : '🚗'}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, color: '#e2e8f0', fontSize: '.9rem' }}>{v.make} {v.model}</div>
                        <div style={{ fontSize: '.75rem', color: '#64748b', marginTop: '2px' }}>{v.registrationNumber}</div>
                      </div>
                      <span style={{ fontSize: '.7rem', fontWeight: 600, padding: '3px 10px', borderRadius: '999px', background: 'rgba(74,222,128,.1)', color: '#4ade80', textTransform: 'uppercase', letterSpacing: '.05em' }}>
                        {v.vehicleType}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* ── RIGHT COLUMN — Feed sidebar ── */}
          <div style={{
            background: 'linear-gradient(160deg,#0d0e2b,#0a0c20)',
            border: '1px solid rgba(6,182,212,.18)',
            borderRadius: '16px',
            overflow: 'hidden',
            position: 'sticky',
            top: '1.5rem',
          }}>
            {/* Feed header */}
            <div style={{
              padding: '1.1rem 1.25rem',
              borderBottom: '1px solid rgba(6,182,212,.12)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              background: 'rgba(6,182,212,.05)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
                <span style={{ fontSize: '1.05rem' }}>📢</span>
                <span style={{ fontWeight: 700, color: '#e2e8f0', fontSize: '.95rem' }}>Latest Updates</span>
              </div>
              <Link to="/feed" style={{ fontSize: '.7rem', fontWeight: 600, color: '#22d3ee', textDecoration: 'none', padding: '.25rem .7rem', border: '1px solid rgba(6,182,212,.3)', borderRadius: '8px' }}>See All →</Link>
            </div>

            {/* Feed items */}
            <div style={{ padding: '.75rem', display: 'flex', flexDirection: 'column', gap: '.6rem', maxHeight: '520px', overflowY: 'auto' }}>
              {announcements.length === 0 ? (
                <div style={{ padding: '2.5rem 1rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '.5rem' }}>📭</div>
                  <p style={{ color: '#475569', fontSize: '.85rem', margin: 0 }}>No announcements yet</p>
                </div>
              ) : (
                announcements.map((post) => {
                  const isOffer = post.type === 'offer';
                  return (
                    <div key={post._id} style={{
                      padding: '.9rem 1rem',
                      borderRadius: '12px',
                      background: isOffer ? 'rgba(249,115,22,.07)' : 'rgba(6,182,212,.07)',
                      border: post.isPinned
                        ? '1px solid rgba(6,182,212,.45)'
                        : isOffer ? '1px solid rgba(249,115,22,.2)' : '1px solid rgba(6,182,212,.15)',
                      position: 'relative',
                    }}>
                      {post.isPinned && (
                        <div style={{ position: 'absolute', top: '.55rem', right: '.75rem', fontSize: '.6rem', fontWeight: 700, letterSpacing: '.06em', color: '#22d3ee' }}>📌 PINNED</div>
                      )}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginBottom: '.45rem' }}>
                        <span style={{
                          fontSize: '.6rem', fontWeight: 700, letterSpacing: '.07em', textTransform: 'uppercase',
                          padding: '2px 7px', borderRadius: '999px',
                          background: isOffer ? 'rgba(249,115,22,.2)' : 'rgba(6,182,212,.2)',
                          color: isOffer ? '#fb923c' : '#22d3ee',
                        }}>{isOffer ? '🎁 Offer' : '📣 Announce'}</span>
                        <span style={{ fontSize: '.68rem', color: '#475569' }}>{new Date(post.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                      </div>
                      <div style={{ fontWeight: 700, fontSize: '.88rem', color: '#f1f5f9', marginBottom: '.3rem', lineHeight: 1.3 }}>{post.title}</div>
                      <div style={{ fontSize: '.8rem', color: '#94a3b8', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {post.content}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

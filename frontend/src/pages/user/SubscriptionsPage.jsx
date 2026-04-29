import { useEffect, useState } from 'react';
import UserSidebar from '../../components/user/UserSidebar';
import UserPageHeader from '../../components/user/UserPageHeader';
import Spinner from '../../components/common/Spinner';
import { StatusBadge } from '../../components/common/UI';
import { subscriptionAPI, vehicleAPI } from '../../api';

const fmt = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

const STATUS_COLOR = {
  active:    { bg: 'rgba(74,222,128,.1)',   color: '#4ade80' },
  expired:   { bg: 'rgba(248,113,113,.1)',  color: '#f87171' },
  cancelled: { bg: 'rgba(100,116,139,.12)', color: '#94a3b8' },
  pending:   { bg: 'rgba(251,191,36,.1)',   color: '#fbbf24' },
};

function PlanCard({ plan, selected, onSelect }) {
  const isSelected = selected?._id === plan._id;
  return (
    <div
      onClick={() => onSelect(plan)}
      style={{
        background: isSelected ? 'rgba(0,229,255,.08)' : 'rgba(255,255,255,0.03)',
        border: `2px solid ${isSelected ? '#00e5ff' : 'rgba(255,255,255,0.07)'}`,
        borderRadius: 14,
        padding: '1.25rem',
        cursor: 'pointer',
        transition: 'all .2s',
        position: 'relative',
      }}
    >
      {plan.badge && (
        <div style={{ position: 'absolute', top: '-11px', left: '50%', transform: 'translateX(-50%)', fontSize: '.65rem', fontWeight: 700, padding: '.2rem .65rem', borderRadius: '999px', background: '#fb923c', color: '#fff', whiteSpace: 'nowrap', letterSpacing: '.04em' }}>
          {plan.badge}
        </div>
      )}
      <div style={{ fontWeight: 700, fontSize: '.95rem', color: isSelected ? '#00e5ff' : '#e2e8f0', marginBottom: '.3rem' }}>{plan.name}</div>
      <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#00e5ff', marginBottom: '.25rem' }}>₹{plan.amount.toLocaleString('en-IN')}</div>
      <div style={{ fontSize: '.75rem', color: '#475569', marginBottom: plan.highlights?.length ? '.75rem' : 0 }}>
        {plan.duration} days · {plan.services} service{plan.services > 1 ? 's' : ''}
      </div>
      {plan.highlights?.length > 0 && (
        <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '.25rem' }}>
          {plan.highlights.map((h, i) => (
            <li key={i} style={{ fontSize: '.75rem', color: '#94a3b8', display: 'flex', gap: '.35rem', alignItems: 'flex-start' }}>
              <span style={{ color: '#00e5ff', fontWeight: 700, flexShrink: 0, fontSize: '.6rem', marginTop: '.15rem' }}>✓</span>{h}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState([]);
  const [plans, setPlans]               = useState([]);
  const [vehicles, setVehicles]         = useState([]);
  const [loading, setLoading]           = useState(true);
  const [showNew, setShowNew]           = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [saving, setSaving]             = useState(false);
  const [error, setError]               = useState('');

  const load = () =>
    Promise.all([subscriptionAPI.list(), subscriptionAPI.getPlans(), vehicleAPI.list()])
      .then(([s, p, v]) => {
        setSubscriptions(s.data.subscriptions);
        setPlans(p.data.plans);
        setVehicles(v.data.vehicles);
      })
      .catch(console.error)
      .finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  const handleSubscribe = async (e) => {
    e.preventDefault();
    if (!selectedPlan) return setError('Please select a plan');
    setSaving(true); setError('');
    try {
      await subscriptionAPI.create({ planId: selectedPlan._id, vehicleId: selectedVehicle });
      setShowNew(false);
      setSelectedPlan(null);
      setSelectedVehicle('');
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create subscription');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="layout user-dark"><UserSidebar /><div className="main-content"><Spinner /></div></div>;

  return (
    <div className="layout user-dark">
      <UserSidebar />
      <div className="main-content">
        <UserPageHeader
          title="Subscriptions & AMC"
          subtitle="Manage plans and renewals"
          actions={<button className="btn btn-primary" onClick={() => { setShowNew(!showNew); setSelectedPlan(null); setSelectedVehicle(''); setError(''); }}>
            {showNew ? 'Cancel' : '+ New Subscription'}
          </button>}
        />

        {showNew && (
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: '1.5rem', marginBottom: '1.75rem' }}>
            <h3 style={{ margin: '0 0 1.25rem', fontSize: '1rem', color: '#e2e8f0' }}>Choose a Plan</h3>
            {error && <div style={{ marginBottom: '1rem', padding: '.6rem .85rem', background: 'rgba(248,113,113,.1)', border: '1px solid rgba(248,113,113,.3)', borderRadius: 8, color: '#f87171', fontSize: '.82rem' }}>{error}</div>}

            {plans.length === 0 ? (
              <p style={{ color: '#64748b', fontSize: '.875rem' }}>No plans available. Please contact admin.</p>
            ) : (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
                  {plans.map(p => <PlanCard key={p._id} plan={p} selected={selectedPlan} onSelect={setSelectedPlan} />)}
                </div>
                <form onSubmit={handleSubscribe} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                  <div style={{ flex: '1', minWidth: 200 }}>
                    <label style={{ fontSize: '.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.06em', display: 'block', marginBottom: '.3rem' }}>Vehicle *</label>
                    <select
                      style={{ background: '#06071a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#e2e8f0', padding: '.55rem .85rem', fontSize: '.875rem', outline: 'none', width: '100%' }}
                      value={selectedVehicle}
                      onChange={(e) => setSelectedVehicle(e.target.value)}
                      required
                    >
                      <option value="">Select vehicle</option>
                      {vehicles.map((v) => (
                        <option key={v._id} value={v._id}>{v.make} {v.model} — {v.registrationNumber}</option>
                      ))}
                    </select>
                  </div>
                  <button type="submit" className="btn btn-primary" disabled={saving || !selectedPlan} style={{ flexShrink: 0 }}>
                    {saving ? 'Processing…' : selectedPlan ? `Subscribe for ₹${selectedPlan.amount.toLocaleString('en-IN')}` : 'Select a Plan'}
                  </button>
                </form>
              </>
            )}
          </div>
        )}

        {subscriptions.length === 0 ? (
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: '4rem 1rem', textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '.75rem' }}>📋</div>
            <p style={{ color: '#334155', margin: 0 }}>No subscriptions yet. Get a plan to save on services!</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1rem' }}>
            {subscriptions.map((s) => {
              const sc = STATUS_COLOR[s.status] || STATUS_COLOR.pending;
              const usedPct = s.servicesIncluded > 0 ? Math.round((s.servicesUsed / s.servicesIncluded) * 100) : 0;
              return (
                <div key={s._id} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '.75rem' }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '1rem', color: '#e2e8f0' }}>{s.plan?.name || s.plan}</div>
                      <div style={{ fontSize: '.8rem', color: '#475569', marginTop: '.15rem' }}>
                        {s.vehicle?.make} {s.vehicle?.model} · {s.vehicle?.registrationNumber}
                      </div>
                    </div>
                    <span style={{ fontSize: '.7rem', fontWeight: 700, padding: '.2rem .6rem', borderRadius: '999px', background: sc.bg, color: sc.color, textTransform: 'capitalize', flexShrink: 0 }}>
                      {s.status}
                    </span>
                  </div>

                  <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#00e5ff', marginBottom: '.65rem' }}>
                    ₹{s.amount.toLocaleString('en-IN')}
                  </div>

                  <div style={{ display: 'flex', gap: '1.25rem', fontSize: '.8rem', color: '#64748b', marginBottom: '.9rem', flexWrap: 'wrap' }}>
                    {s.startDate && <span>📅 From {fmt(s.startDate)}</span>}
                    {s.endDate && <span>⏱ Until {fmt(s.endDate)}</span>}
                  </div>

                  {/* Services progress */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.72rem', color: '#475569', marginBottom: '.35rem' }}>
                      <span>Services used</span>
                      <span style={{ fontWeight: 600, color: '#94a3b8' }}>{s.servicesUsed} / {s.servicesIncluded}</span>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,.07)', borderRadius: 999, height: 5, overflow: 'hidden' }}>
                      <div style={{ width: `${usedPct}%`, height: '100%', background: usedPct >= 100 ? '#f87171' : '#00e5ff', borderRadius: 999, transition: 'width .4s' }} />
                    </div>
                  </div>

                  {s.features?.length > 0 && (
                    <div style={{ marginTop: '.9rem', borderTop: '1px solid rgba(255,255,255,.05)', paddingTop: '.8rem' }}>
                      <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '.25rem' }}>
                        {s.features.map((f, i) => (
                          <li key={i} style={{ fontSize: '.75rem', color: '#475569', display: 'flex', gap: '.35rem', alignItems: 'flex-start' }}>
                            <span style={{ color: '#00e5ff', fontWeight: 700, flexShrink: 0, fontSize: '.6rem', marginTop: '.15rem' }}>✓</span>{f}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}


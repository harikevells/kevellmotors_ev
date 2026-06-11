import { useEffect, useState } from 'react';
import AdminSidebar from '../../components/admin/AdminSidebar';
import FranchiseSidebar from '../../components/franchise/FranchiseSidebar';
import AdminPageHeader from '../../components/admin/AdminPageHeader';
import Spinner from '../../components/common/Spinner';
import { subscriptionPlanAPI, subscriptionAPI, adminAPI, vehicleAPI } from '../../api';
import { useAuth } from '../../context/AuthContext';

const bg   = { background: '#06071a', color: '#e2e8f0', minHeight: '100vh', display: 'flex' };
const card = { background: '#0d0e2b', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12 };
const inp  = { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '.55rem .85rem', color: '#e2e8f0', fontSize: '.85rem', outline: 'none', width: '100%', boxSizing: 'border-box' };
const lbl  = { fontSize: '.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.06em', display: 'block', marginBottom: '.3rem' };

const EMPTY_FORM = { name: '', key: '', amount: '', duration: '', services: '', badge: '', highlights: '', isActive: true, sortOrder: '' };

const STATUS_COLOR = {
  active:    { bg: 'rgba(74,222,128,.1)',   color: '#4ade80' },
  expired:   { bg: 'rgba(248,113,113,.1)',  color: '#f87171' },
  cancelled: { bg: 'rgba(100,116,139,.12)', color: '#94a3b8' },
  pending:   { bg: 'rgba(251,191,36,.1)',   color: '#fbbf24' },
};

const fmt = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

const getPlanName = (plan, plansList) => {
  if (plan && typeof plan === 'object') return plan.name || plan.key;
  const key = plan;
  const found = plansList.find(p => p.key === key);
  if (found) return found.name;
  if (key === 'monthly') return 'Monthly';
  if (key === 'quarterly') return 'Quarterly';
  if (key === 'amc_1yr') return 'AMC 1 Year';
  if (key === 'amc_2yr') return 'AMC 2 Years';
  return key;
};

function PlanCard({ plan, onEdit, onToggle, onDelete, isAllowedPlanManage }) {
  const [confirmDel, setConfirmDel] = useState(false);

  const handleDel = () => {
    if (!confirmDel) { setConfirmDel(true); return; }
    onDelete(plan._id);
  };

  return (
    <div style={{ ...card, padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0', position: 'relative', border: plan.isActive ? '1px solid rgba(0,229,255,0.12)' : '1px solid rgba(255,255,255,0.04)', opacity: plan.isActive ? 1 : 0.55 }}>
      {/* Top row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '.75rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 700, fontSize: '1rem', color: '#e2e8f0' }}>{plan.name}</span>
            {plan.badge && (
              <span style={{ fontSize: '.65rem', fontWeight: 700, padding: '.15rem .5rem', borderRadius: '4px', background: 'rgba(251,146,60,.15)', color: '#fb923c', border: '1px solid rgba(251,146,60,.3)', textTransform: 'uppercase' }}>{plan.badge}</span>
            )}
            <span style={{ fontSize: '.65rem', fontWeight: 600, padding: '.15rem .45rem', borderRadius: '4px', background: plan.isActive ? 'rgba(74,222,128,.1)' : 'rgba(248,113,113,.1)', color: plan.isActive ? '#4ade80' : '#f87171' }}>
              {plan.isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
          <div style={{ fontSize: '.72rem', color: '#475569', marginTop: '.2rem' }}>key: <code style={{ color: '#94a3b8' }}>{plan.key}</code></div>
        </div>
        {isAllowedPlanManage && (
          <div style={{ display: 'flex', gap: '.35rem', flexShrink: 0 }}>
            <button onClick={() => onEdit(plan)} style={{ background: 'rgba(0,229,255,.08)', border: 'none', borderRadius: 6, color: '#00e5ff', cursor: 'pointer', padding: '.3rem .6rem', fontSize: '.78rem' }}>✏️ Edit</button>
            <button onClick={() => onToggle(plan)} style={{ background: 'rgba(251,146,60,.08)', border: 'none', borderRadius: 6, color: '#fb923c', cursor: 'pointer', padding: '.3rem .6rem', fontSize: '.78rem' }}>
              {plan.isActive ? '⏸ Disable' : '▶ Enable'}
            </button>
            <button onClick={handleDel} style={{ background: confirmDel ? 'rgba(248,113,113,.2)' : 'rgba(255,255,255,.04)', border: 'none', borderRadius: 6, color: confirmDel ? '#f87171' : '#64748b', cursor: 'pointer', padding: '.3rem .6rem', fontSize: '.78rem' }}>
              {confirmDel ? '⚠️ Confirm' : '🗑️'}
            </button>
          </div>
        )}
      </div>

      {/* Price + meta */}
      <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '.9rem', flexWrap: 'wrap' }}>
        <div>
          <div style={{ ...lbl }}>Price</div>
          <div style={{ fontSize: '1.3rem', fontWeight: 700, color: '#00e5ff' }}>₹{plan.amount.toLocaleString('en-IN')}</div>
        </div>
        <div>
          <div style={{ ...lbl }}>Duration</div>
          <div style={{ fontSize: '.95rem', color: '#94a3b8' }}>{plan.duration} days</div>
        </div>
        <div>
          <div style={{ ...lbl }}>Services</div>
          <div style={{ fontSize: '.95rem', color: '#94a3b8' }}>{plan.services} included</div>
        </div>
        {plan.sortOrder !== undefined && (
          <div>
            <div style={{ ...lbl }}>Order</div>
            <div style={{ fontSize: '.95rem', color: '#64748b' }}>{plan.sortOrder}</div>
          </div>
        )}
      </div>

      {/* Highlights */}
      {plan.highlights?.length > 0 && (
        <div>
          <div style={{ ...lbl, marginBottom: '.5rem' }}>Highlights</div>
          <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '.3rem' }}>
            {plan.highlights.map((h, i) => (
              <li key={i} style={{ fontSize: '.8rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '.4rem' }}>
                <span style={{ color: '#00e5ff', fontWeight: 700, fontSize: '.65rem' }}>✓</span> {h}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function PlanFormModal({ initial, onSave, onClose, saving }) {
  const [form, setForm] = useState(
    initial
      ? { ...initial, highlights: (initial.highlights || []).join('\n') }
      : { ...EMPTY_FORM }
  );
  const [err, setErr] = useState('');

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.key.trim() || !form.amount || !form.duration || !form.services) {
      return setErr('Name, key, amount, duration, and services are required.');
    }
    const payload = {
      name: form.name.trim(),
      key: form.key.trim().toLowerCase().replace(/\s+/g, '_'),
      amount: Number(form.amount),
      duration: Number(form.duration),
      services: Number(form.services),
      badge: form.badge.trim(),
      highlights: form.highlights.split('\n').map(h => h.trim()).filter(Boolean),
      isActive: form.isActive,
      sortOrder: form.sortOrder !== '' ? Number(form.sortOrder) : 0,
    };
    onSave(payload);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: '1rem' }}>
      <div style={{ ...card, padding: '1.75rem', width: '100%', maxWidth: 540, maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h3 style={{ margin: 0, color: '#e2e8f0' }}>{initial ? 'Edit Plan' : 'New Plan'}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
        </div>
        {err && <div style={{ marginBottom: '1rem', padding: '.6rem .85rem', background: 'rgba(248,113,113,.1)', border: '1px solid rgba(248,113,113,.3)', borderRadius: 8, color: '#f87171', fontSize: '.82rem' }}>{err}</div>}
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.85rem', marginBottom: '.85rem' }}>
            <div>
              <label style={lbl}>Plan Name *</label>
              <input style={inp} value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Monthly" />
            </div>
            <div>
              <label style={lbl}>Plan Key *</label>
              <input style={inp} value={form.key} onChange={e => set('key', e.target.value)} placeholder="e.g. monthly" />
            </div>
            <div>
              <label style={lbl}>Amount (₹) *</label>
              <input style={inp} type="number" min="0" value={form.amount} onChange={e => set('amount', e.target.value)} placeholder="999" />
            </div>
            <div>
              <label style={lbl}>Duration (days) *</label>
              <input style={inp} type="number" min="1" value={form.duration} onChange={e => set('duration', e.target.value)} placeholder="30" />
            </div>
            <div>
              <label style={lbl}>Services Included *</label>
              <input style={inp} type="number" min="1" value={form.services} onChange={e => set('services', e.target.value)} placeholder="1" />
            </div>
            <div>
              <label style={lbl}>Badge (optional)</label>
              <input style={inp} value={form.badge} onChange={e => set('badge', e.target.value)} placeholder="Most Popular" />
            </div>
            <div>
              <label style={lbl}>Sort Order</label>
              <input style={inp} type="number" value={form.sortOrder} onChange={e => set('sortOrder', e.target.value)} placeholder="0" />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem', paddingTop: '1.4rem' }}>
              <input type="checkbox" id="isActive" checked={form.isActive} onChange={e => set('isActive', e.target.checked)} style={{ accentColor: '#00e5ff', width: 16, height: 16 }} />
              <label htmlFor="isActive" style={{ color: '#94a3b8', fontSize: '.85rem', cursor: 'pointer' }}>Active (visible to users)</label>
            </div>
          </div>
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={lbl}>Highlights (one per line)</label>
            <textarea style={{ ...inp, resize: 'vertical', lineHeight: 1.6 }} rows={6} value={form.highlights} onChange={e => set('highlights', e.target.value)} placeholder={'Free pickup & drop\nService history\nPriority support'} />
          </div>
          <div style={{ display: 'flex', gap: '.75rem', justifyContent: 'flex-end' }}>
            <button type="button" onClick={onClose} style={{ background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 8, color: '#94a3b8', cursor: 'pointer', padding: '.55rem 1.2rem', fontSize: '.875rem' }}>Cancel</button>
            <button type="submit" disabled={saving} style={{ background: '#00e5ff', border: 'none', borderRadius: 8, color: '#06071a', fontWeight: 700, cursor: 'pointer', padding: '.55rem 1.4rem', fontSize: '.875rem' }}>
              {saving ? 'Saving…' : initial ? 'Save Changes' : 'Create Plan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdminSubscriptionsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const isAllowedPlanManage = user?.role === 'admin' || user?.role === 'franchise';

  const [plans, setPlans]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [saving, setSaving]       = useState(false);
  const [err, setErr]             = useState('');

  // Usage state
  const [showUsageModal, setShowUsageModal] = useState(false);
  const [usageData, setUsageData]           = useState([]);
  const [loadingUsage, setLoadingUsage]     = useState(false);
  const [selectedSubForUsage, setSelectedSubForUsage] = useState(null);

  // Tab & requests state
  const [tab, setTab]             = useState('plans'); // 'plans' or 'requests'
  const [subscriptions, setSubscriptions] = useState([]);
  const [loadingSubs, setLoadingSubs] = useState(false);
  const [searchTerm, setSearchTerm]   = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [activatingId, setActivatingId] = useState(null);

  // Subscription Creation States
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [usersList, setUsersList]           = useState([]);
  const [vehiclesList, setVehiclesList]     = useState([]);
  const [selectedUser, setSelectedUser]     = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [selectedPlanId, setSelectedPlanId]   = useState('');
  const [creatingSub, setCreatingSub]       = useState(false);
  const [createErr, setCreateErr]           = useState('');

  const loadPlans = () =>
    subscriptionPlanAPI.listAll()
      .then(r => setPlans(r.data.plans))
      .catch(console.error)
      .finally(() => setLoading(false));

  const loadSubscriptions = () => {
    setLoadingSubs(true);
    subscriptionAPI.list()
      .then(r => setSubscriptions(r.data.subscriptions || []))
      .catch(console.error)
      .finally(() => setLoadingSubs(false));
  };

  useEffect(() => {
    loadPlans();
  }, []);

  useEffect(() => {
    if (tab === 'requests') {
      loadSubscriptions();
    }
  }, [tab]);

  // Load all users for the selection list
  useEffect(() => {
    if (showCreateForm) {
      adminAPI.listUsers({ limit: 100, role: 'user' })
        .then(res => setUsersList(res.data.users || []))
        .catch(console.error);
    }
  }, [showCreateForm]);

  // Load vehicles when user is selected
  useEffect(() => {
    if (selectedUser) {
      vehicleAPI.listForUser(selectedUser)
        .then(res => {
          setVehiclesList(res.data.vehicles || []);
          setSelectedVehicle('');
        })
        .catch(console.error);
    } else {
      setVehiclesList([]);
      setSelectedVehicle('');
    }
  }, [selectedUser]);

  const handleSave = async (payload) => {
    setSaving(true); setErr('');
    try {
      if (editTarget) {
        const res = await subscriptionPlanAPI.update(editTarget._id, payload);
        setPlans(prev => prev.map(p => p._id === editTarget._id ? res.data.plan : p));
      } else {
        const res = await subscriptionPlanAPI.create(payload);
        setPlans(prev => [...prev, res.data.plan].sort((a, b) => a.sortOrder - b.sortOrder));
      }
      setShowModal(false);
      setEditTarget(null);
    } catch (e) {
      setErr(e.response?.data?.message || 'Failed to save');
    }
    setSaving(false);
  };

  const handleToggle = async (plan) => {
    try {
      const res = await subscriptionPlanAPI.update(plan._id, { isActive: !plan.isActive });
      setPlans(prev => prev.map(p => p._id === plan._id ? res.data.plan : p));
    } catch {}
  };

  const handleDelete = async (id) => {
    try {
      await subscriptionPlanAPI.remove(id);
      setPlans(prev => prev.filter(p => p._id !== id));
    } catch {}
  };

  const handleActivate = async (id) => {
    setActivatingId(id);
    try {
      await subscriptionAPI.activate(id, { paymentId: null });
      // Reload subscriptions list
      const res = await subscriptionAPI.list();
      setSubscriptions(res.data.subscriptions || []);
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to activate subscription');
    } finally {
      setActivatingId(null);
    }
  };

  const handleReject = async (id) => {
    setActivatingId(id);
    try {
      await subscriptionAPI.reject(id);
      // Reload subscriptions list
      const res = await subscriptionAPI.list();
      setSubscriptions(res.data.subscriptions || []);
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to reject subscription');
    } finally {
      setActivatingId(null);
    }
  };

  const handleViewUsage = async (sub) => {
    setSelectedSubForUsage(sub);
    setShowUsageModal(true);
    setLoadingUsage(true);
    try {
      const res = await subscriptionAPI.getUsage(sub._id);
      setUsageData(res.data.services || []);
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to fetch usage');
      setUsageData([]);
    } finally {
      setLoadingUsage(false);
    }
  };

  const handleCreateSubscription = async (e) => {
    e.preventDefault();
    if (!selectedUser || !selectedVehicle || !selectedPlanId) {
      return setCreateErr('Please select user, vehicle and plan.');
    }
    setCreatingSub(true); setCreateErr('');
    try {
      await subscriptionAPI.create({
        planId: selectedPlanId,
        vehicleId: selectedVehicle,
        userId: selectedUser
      });
      setShowCreateForm(false);
      setSelectedUser('');
      setSelectedVehicle('');
      setSelectedPlanId('');
      if (tab === 'requests') {
        loadSubscriptions();
      } else {
        setTab('requests');
      }
    } catch (err) {
      setCreateErr(err.response?.data?.message || 'Failed to create subscription');
    } finally {
      setCreatingSub(false);
    }
  };

  const filteredSubs = subscriptions.filter(sub => {
    const matchesSearch =
      (sub.user?.name && sub.user.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (sub.user?.email && sub.user.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (sub.user?.phone && sub.user.phone.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (sub.vehicle?.registrationNumber && sub.vehicle.registrationNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (sub.vehicle?.make && sub.vehicle.make.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (sub.vehicle?.model && sub.vehicle.model.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === 'all' || sub.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div style={bg}>
      {isAdmin ? <AdminSidebar /> : <FranchiseSidebar />}
      <div style={{ flex: 1, padding: '2rem', overflowY: 'auto' }}>
        {/* Header */}
        <AdminPageHeader title="Subscriptions" subtitle="Manage vehicle maintenance plans" />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <p style={{ margin: '.25rem 0 0', fontSize: '.85rem', color: '#475569' }}>
              {isAllowedPlanManage ? 'Manage plans and view subscription requests' : 'View plans and create customer subscription requests'}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              onClick={() => { setShowCreateForm(!showCreateForm); setCreateErr(''); }}
              style={{ background: 'rgba(0, 229, 255, 0.1)', border: '1px solid #00e5ff', borderRadius: 8, color: '#00e5ff', fontWeight: 700, cursor: 'pointer', padding: '.6rem 1.4rem', fontSize: '.875rem' }}
            >
              {showCreateForm ? 'Cancel Create' : '＋ Create Subscription'}
            </button>
            {isAllowedPlanManage && tab === 'plans' && (
              <button
                onClick={() => { setEditTarget(null); setShowModal(true); }}
                style={{ background: '#00e5ff', border: 'none', borderRadius: 8, color: '#06071a', fontWeight: 700, cursor: 'pointer', padding: '.6rem 1.4rem', fontSize: '.875rem' }}
              >
                + New Plan
              </button>
            )}
          </div>
        </div>

        {/* Subscription Creation Form (Rendered when toggled) */}
        {showCreateForm && (
          <div style={{ ...card, padding: '1.5rem', marginBottom: '2rem', border: '1px solid rgba(0, 229, 255, 0.2)' }}>
            <h3 style={{ margin: '0 0 1.25rem', fontSize: '1.05rem', color: '#00e5ff', fontWeight: 700 }}>Create Subscription for Customer</h3>
            {createErr && <div style={{ marginBottom: '1.25rem', padding: '.6rem .85rem', background: 'rgba(248,113,113,.1)', border: '1px solid rgba(248,113,113,.3)', borderRadius: 8, color: '#f87171', fontSize: '.82rem' }}>{createErr}</div>}
            
            <form onSubmit={handleCreateSubscription} style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
              <div style={{ flex: '1', minWidth: '220px' }}>
                <label style={lbl}>Customer *</label>
                <select
                  style={inp}
                  value={selectedUser}
                  onChange={e => setSelectedUser(e.target.value)}
                  required
                >
                  <option value="">Select Customer</option>
                  {usersList.map(u => (
                    <option key={u._id} value={u._id}>{u.name} ({u.phone})</option>
                  ))}
                </select>
              </div>

              <div style={{ flex: '1', minWidth: '220px' }}>
                <label style={lbl}>Vehicle *</label>
                <select
                  style={inp}
                  value={selectedVehicle}
                  onChange={e => setSelectedVehicle(e.target.value)}
                  disabled={!selectedUser}
                  required
                >
                  <option value="">{selectedUser ? 'Select Vehicle' : 'Select Customer First'}</option>
                  {vehiclesList.map(v => (
                    <option key={v._id} value={v._id}>{v.make} {v.model} ({v.registrationNumber})</option>
                  ))}
                </select>
              </div>

              <div style={{ flex: '1', minWidth: '220px' }}>
                <label style={lbl}>Plan *</label>
                <select
                  style={inp}
                  value={selectedPlanId}
                  onChange={e => setSelectedPlanId(e.target.value)}
                  required
                >
                  <option value="">Select Plan</option>
                  {plans.filter(p => p.isActive).map(p => (
                    <option key={p._id} value={p._id}>{p.name} (₹{p.amount})</option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={creatingSub}
                style={{
                  background: '#00e5ff',
                  border: 'none',
                  borderRadius: 8,
                  color: '#06071a',
                  fontWeight: 700,
                  cursor: 'pointer',
                  padding: '.6rem 1.5rem',
                  fontSize: '.875rem',
                  height: '38px',
                  boxSizing: 'border-box'
                }}
              >
                {creatingSub ? 'Creating…' : 'Submit Request'}
              </button>
            </form>
          </div>
        )}

        {/* Tab Navigation */}
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '0.75rem' }}>
          <button
            onClick={() => setTab('plans')}
            style={{
              background: tab === 'plans' ? 'rgba(0, 229, 255, 0.08)' : 'transparent',
              border: tab === 'plans' ? '1px solid #00e5ff' : '1px solid transparent',
              borderRadius: 8,
              color: tab === 'plans' ? '#00e5ff' : '#94a3b8',
              cursor: 'pointer',
              padding: '.6rem 1.4rem',
              fontSize: '.875rem',
              fontWeight: 600,
              transition: 'all 0.2s'
            }}
          >
            📋 Subscription Plans
          </button>
          <button
            onClick={() => setTab('requests')}
            style={{
              background: tab === 'requests' ? 'rgba(0, 229, 255, 0.08)' : 'transparent',
              border: tab === 'requests' ? '1px solid #00e5ff' : '1px solid transparent',
              borderRadius: 8,
              color: tab === 'requests' ? '#00e5ff' : '#94a3b8',
              cursor: 'pointer',
              padding: '.6rem 1.4rem',
              fontSize: '.875rem',
              fontWeight: 600,
              transition: 'all 0.2s'
            }}
          >
            ⚡ Subscription Requests
          </button>
        </div>

        {err && <div style={{ marginBottom: '1.25rem', padding: '.75rem 1rem', background: 'rgba(248,113,113,.1)', border: '1px solid rgba(248,113,113,.25)', borderRadius: 8, color: '#f87171', fontSize: '.85rem' }}>{err}</div>}

        {tab === 'plans' ? (
          loading ? (
            <Spinner />
          ) : plans.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '5rem 1rem', color: '#334155' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '.75rem' }}>📋</div>
              <p style={{ margin: 0 }}>No plans yet. Create your first subscription plan.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '1.25rem' }}>
              {plans.map(plan => (
                <PlanCard
                  key={plan._id}
                  plan={plan}
                  onEdit={(p) => { setEditTarget(p); setShowModal(true); }}
                  onToggle={handleToggle}
                  onDelete={handleDelete}
                  isAllowedPlanManage={isAllowedPlanManage}
                />
              ))}
            </div>
          )
        ) : (
          <div>
            {/* Search and Filters bar */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ flex: 1, minWidth: 260 }}>
                <input
                  type="text"
                  placeholder="Search by customer name, email, or vehicle reg..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 8,
                    padding: '.6rem 1rem',
                    color: '#e2e8f0',
                    fontSize: '.875rem',
                    outline: 'none',
                    width: '100%',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
              <div style={{ display: 'flex', gap: '.5rem', alignItems: 'center' }}>
                <span style={{ fontSize: '.8rem', color: '#64748b', fontWeight: 600 }}>Filter:</span>
                {['all', 'pending', 'active', 'expired', 'cancelled'].map(st => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    style={{
                      background: statusFilter === st ? '#00e5ff' : 'rgba(255,255,255,0.04)',
                      border: 'none',
                      borderRadius: 6,
                      color: statusFilter === st ? '#06071a' : '#94a3b8',
                      cursor: 'pointer',
                      padding: '.4rem .8rem',
                      fontSize: '.78rem',
                      fontWeight: 600,
                      textTransform: 'capitalize',
                      transition: 'all 0.15s'
                    }}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {loadingSubs ? (
              <Spinner />
            ) : filteredSubs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '5rem 1rem', color: '#475569' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '.75rem' }}>🔍</div>
                <p style={{ margin: 0 }}>No subscriptions match your query.</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto', ...card }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '.85rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.01)' }}>
                      <th style={{ padding: '1rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', fontSize: '.72rem', letterSpacing: '.05em' }}>Customer</th>
                      <th style={{ padding: '1rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', fontSize: '.72rem', letterSpacing: '.05em' }}>Vehicle</th>
                      <th style={{ padding: '1rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', fontSize: '.72rem', letterSpacing: '.05em' }}>Plan Info</th>
                      <th style={{ padding: '1rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', fontSize: '.72rem', letterSpacing: '.05em' }}>Status</th>
                      <th style={{ padding: '1rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', fontSize: '.72rem', letterSpacing: '.05em' }}>Dates</th>
                      <th style={{ padding: '1rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', fontSize: '.72rem', letterSpacing: '.05em', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSubs.map((sub) => {
                      const sc = STATUS_COLOR[sub.status] || { bg: 'rgba(255,255,255,.05)', color: '#94a3b8' };
                      return (
                        <tr key={sub._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', transition: 'background .15s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.01)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                          <td style={{ padding: '1rem' }}>
                            <div style={{ fontWeight: 600, color: '#e2e8f0' }}>{sub.user?.name || 'Unknown User'}</div>
                            <div style={{ fontSize: '.75rem', color: '#64748b', marginTop: '.15rem' }}>{sub.user?.phone}</div>
                            <div style={{ fontSize: '.75rem', color: '#475569' }}>{sub.user?.email}</div>
                          </td>
                          <td style={{ padding: '1rem' }}>
                            {sub.vehicle ? (
                              <>
                                <div style={{ fontWeight: 600, color: '#94a3b8' }}>{sub.vehicle.make} {sub.vehicle.model}</div>
                                <div style={{ fontSize: '.75rem', color: '#00e5ff', marginTop: '.15rem', fontFamily: 'monospace', letterSpacing: '.05em' }}>{sub.vehicle.registrationNumber}</div>
                              </>
                            ) : (
                              <span style={{ color: '#475569' }}>N/A</span>
                            )}
                          </td>
                          <td style={{ padding: '1rem' }}>
                            <div style={{ fontWeight: 700, color: '#e2e8f0' }}>{getPlanName(sub.plan, plans)}</div>
                            <div style={{ fontSize: '.85rem', color: '#00e5ff', fontWeight: 600, marginTop: '.2rem' }}>₹{sub.amount?.toLocaleString('en-IN')}</div>
                          </td>
                          <td style={{ padding: '1rem' }}>
                            <span style={{ fontSize: '.7rem', fontWeight: 700, padding: '.25rem .6rem', borderRadius: '999px', background: sc.bg, color: sc.color, textTransform: 'uppercase', letterSpacing: '.04em' }}>
                              {sub.status}
                            </span>
                          </td>
                          <td style={{ padding: '1rem', color: '#94a3b8', fontSize: '.78rem' }}>
                            {sub.startDate ? (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '.15rem' }}>
                                <span>🟢 Start: {fmt(sub.startDate)}</span>
                                <span>🔴 End: {fmt(sub.endDate)}</span>
                              </div>
                            ) : (
                              <span style={{ color: '#475569' }}>Pending Activation</span>
                            )}
                          </td>
                          <td style={{ padding: '1rem', textAlign: 'right' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', alignItems: 'flex-end' }}>
                              <button
                                onClick={() => handleViewUsage(sub)}
                                style={{
                                  background: 'rgba(0, 229, 255, 0.1)',
                                  border: '1px solid #00e5ff',
                                  borderRadius: 6,
                                  color: '#00e5ff',
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                  padding: '.35rem .75rem',
                                  fontSize: '.72rem',
                                  transition: 'all 0.2s',
                                  marginBottom: '0.3rem'
                                }}
                              >
                                View Usage
                              </button>
                              {sub.status === 'pending' ? (
                              isAdmin ? (
                                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                  <button
                                    disabled={activatingId === sub._id}
                                    onClick={() => handleActivate(sub._id)}
                                    style={{
                                      background: '#10b981',
                                      border: 'none',
                                      borderRadius: 6,
                                      color: '#ffffff',
                                      fontWeight: 700,
                                      cursor: 'pointer',
                                      padding: '.45rem .9rem',
                                      fontSize: '.78rem',
                                      boxShadow: '0 0 10px rgba(16, 185, 129, 0.25)',
                                      transition: 'all 0.2s'
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.boxShadow = '0 0 15px rgba(16, 185, 129, 0.5)'}
                                    onMouseLeave={e => e.currentTarget.style.boxShadow = '0 0 10px rgba(16, 185, 129, 0.25)'}
                                  >
                                    Approve ✓
                                  </button>
                                  <button
                                    disabled={activatingId === sub._id}
                                    onClick={() => handleReject(sub._id)}
                                    style={{
                                      background: '#ef4444',
                                      border: 'none',
                                      borderRadius: 6,
                                      color: '#ffffff',
                                      fontWeight: 700,
                                      cursor: 'pointer',
                                      padding: '.45rem .9rem',
                                      fontSize: '.78rem',
                                      boxShadow: '0 0 10px rgba(239, 68, 68, 0.25)',
                                      transition: 'all 0.2s'
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.boxShadow = '0 0 15px rgba(239, 68, 68, 0.5)'}
                                    onMouseLeave={e => e.currentTarget.style.boxShadow = '0 0 10px rgba(239, 68, 68, 0.25)'}
                                  >
                                    Reject ✕
                                  </button>
                                </div>
                              ) : (
                                <span style={{ color: '#fbbf24', fontSize: '.75rem', fontWeight: 600 }}>🕒 Pending Admin Approval</span>
                              )
                            ) : sub.status === 'active' ? (
                              isAdmin ? (
                                <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', justifyContent: 'flex-end' }}>
                                  <span style={{ color: '#10b981', fontSize: '.78rem', fontWeight: 700 }}>Approved ✓</span>
                                  <button
                                    disabled={activatingId === sub._id}
                                    onClick={() => handleReject(sub._id)}
                                    style={{
                                      background: 'rgba(239, 68, 68, 0.1)',
                                      border: '1px solid #ef4444',
                                      borderRadius: 6,
                                      color: '#ef4444',
                                      fontWeight: 600,
                                      cursor: 'pointer',
                                      padding: '.25rem .65rem',
                                      fontSize: '.72rem',
                                      transition: 'all 0.2s'
                                    }}
                                    onMouseEnter={e => { e.currentTarget.style.background = '#ef4444'; e.currentTarget.style.color = '#ffffff'; }}
                                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'; e.currentTarget.style.color = '#ef4444'; }}
                                  >
                                    Reject ✕
                                  </button>
                                </div>
                              ) : (
                                <span style={{ color: '#10b981', fontSize: '.78rem', fontWeight: 700 }}>Approved ✓</span>
                              )
                            ) : sub.status === 'cancelled' ? (
                              isAdmin ? (
                                <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', justifyContent: 'flex-end' }}>
                                  <span style={{ color: '#ef4444', fontSize: '.78rem', fontWeight: 700 }}>Rejected ✕</span>
                                  <button
                                    disabled={activatingId === sub._id}
                                    onClick={() => handleActivate(sub._id)}
                                    style={{
                                      background: 'rgba(16, 185, 129, 0.1)',
                                      border: '1px solid #10b981',
                                      borderRadius: 6,
                                      color: '#10b981',
                                      fontWeight: 600,
                                      cursor: 'pointer',
                                      padding: '.25rem .65rem',
                                      fontSize: '.72rem',
                                      transition: 'all 0.2s'
                                    }}
                                    onMouseEnter={e => { e.currentTarget.style.background = '#10b981'; e.currentTarget.style.color = '#ffffff'; }}
                                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(16, 185, 129, 0.1)'; e.currentTarget.style.color = '#10b981'; }}
                                  >
                                    Approve ✓
                                  </button>
                                </div>
                              ) : (
                                <span style={{ color: '#ef4444', fontSize: '.78rem', fontWeight: 700 }}>Rejected ✕</span>
                              )
                            ) : (
                              <span style={{ color: '#475569', fontSize: '.75rem' }}>N/A</span>
                            )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {showModal && (
        <PlanFormModal
          initial={editTarget}
          onSave={handleSave}
          onClose={() => { setShowModal(false); setEditTarget(null); }}
          saving={saving}
        />
      )}

      {/* Usage Modal */}
      {showUsageModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: '1rem' }}>
          <div style={{ ...card, padding: '1.75rem', width: '100%', maxWidth: 700, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ margin: 0, color: '#e2e8f0' }}>Usage History</h3>
              <button onClick={() => setShowUsageModal(false)} style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
            </div>
            
            {loadingUsage ? (
              <Spinner />
            ) : usageData.length === 0 ? (
              <p style={{ color: '#94a3b8', textAlign: 'center', padding: '2rem 0' }}>No service usage found for this subscription vehicle.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {usageData.map(service => (
                  <div key={service._id} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, padding: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '.5rem' }}>
                      <span style={{ fontWeight: 700, color: '#e2e8f0', textTransform: 'capitalize' }}>{service.serviceType} Service</span>
                      <span style={{ fontSize: '.75rem', color: '#64748b' }}>{fmt(service.createdAt)}</span>
                    </div>
                    <div style={{ fontSize: '.8rem', color: '#94a3b8', marginBottom: '1rem' }}>
                      Status: <strong style={{ color: '#00e5ff' }}>{service.status.replace('_', ' ')}</strong> | Amount: ₹{service.finalAmount || service.estimatedAmount || 0}
                    </div>
                    
                    {service.spareParts && service.spareParts.length > 0 && (
                      <div>
                        <div style={{ fontSize: '.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '.4rem' }}>Spare Parts Used</div>
                        <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '.8rem', color: '#cbd5e1' }}>
                          {service.spareParts.map((sp, i) => (
                            <li key={i} style={{ marginBottom: '.2rem' }}>
                              {sp.part ? sp.part.name : 'Unknown Part'} (Qty: {sp.quantity}) - ₹{sp.price}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            
            <div style={{ marginTop: '1.5rem', textAlign: 'right' }}>
              <button onClick={() => setShowUsageModal(false)} style={{ background: '#00e5ff', border: 'none', borderRadius: 8, color: '#06071a', fontWeight: 700, cursor: 'pointer', padding: '.55rem 1.4rem', fontSize: '.875rem' }}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

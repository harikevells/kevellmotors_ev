import { useEffect, useState } from 'react';
import AdminSidebar from '../../components/admin/AdminSidebar';
import Spinner from '../../components/common/Spinner';
import { subscriptionPlanAPI } from '../../api';

const bg   = { background: '#06071a', color: '#e2e8f0', minHeight: '100vh', display: 'flex' };
const card = { background: '#0d0e2b', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12 };
const inp  = { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '.55rem .85rem', color: '#e2e8f0', fontSize: '.85rem', outline: 'none', width: '100%', boxSizing: 'border-box' };
const lbl  = { fontSize: '.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.06em', display: 'block', marginBottom: '.3rem' };

const EMPTY_FORM = { name: '', key: '', amount: '', duration: '', services: '', badge: '', highlights: '', isActive: true, sortOrder: '' };

function PlanCard({ plan, onEdit, onToggle, onDelete }) {
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
        <div style={{ display: 'flex', gap: '.35rem', flexShrink: 0 }}>
          <button onClick={() => onEdit(plan)} style={{ background: 'rgba(0,229,255,.08)', border: 'none', borderRadius: 6, color: '#00e5ff', cursor: 'pointer', padding: '.3rem .6rem', fontSize: '.78rem' }}>✏️ Edit</button>
          <button onClick={() => onToggle(plan)} style={{ background: 'rgba(251,146,60,.08)', border: 'none', borderRadius: 6, color: '#fb923c', cursor: 'pointer', padding: '.3rem .6rem', fontSize: '.78rem' }}>
            {plan.isActive ? '⏸ Disable' : '▶ Enable'}
          </button>
          <button onClick={handleDel} style={{ background: confirmDel ? 'rgba(248,113,113,.2)' : 'rgba(255,255,255,.04)', border: 'none', borderRadius: 6, color: confirmDel ? '#f87171' : '#64748b', cursor: 'pointer', padding: '.3rem .6rem', fontSize: '.78rem' }}>
            {confirmDel ? '⚠️ Confirm' : '🗑️'}
          </button>
        </div>
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
  const [plans, setPlans]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [saving, setSaving]       = useState(false);
  const [err, setErr]             = useState('');

  const load = () =>
    subscriptionPlanAPI.listAll()
      .then(r => setPlans(r.data.plans))
      .catch(console.error)
      .finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

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

  return (
    <div style={bg}>
      <AdminSidebar />
      <div style={{ flex: 1, padding: '2rem', overflowY: 'auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 700, color: '#e2e8f0' }}>Subscription Plans</h1>
            <p style={{ margin: '.25rem 0 0', fontSize: '.85rem', color: '#475569' }}>Create and manage plans shown to users</p>
          </div>
          <button
            onClick={() => { setEditTarget(null); setShowModal(true); }}
            style={{ background: '#00e5ff', border: 'none', borderRadius: 8, color: '#06071a', fontWeight: 700, cursor: 'pointer', padding: '.6rem 1.4rem', fontSize: '.875rem' }}
          >
            + New Plan
          </button>
        </div>

        {err && <div style={{ marginBottom: '1.25rem', padding: '.75rem 1rem', background: 'rgba(248,113,113,.1)', border: '1px solid rgba(248,113,113,.25)', borderRadius: 8, color: '#f87171', fontSize: '.85rem' }}>{err}</div>}

        {loading ? (
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
              />
            ))}
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
    </div>
  );
}

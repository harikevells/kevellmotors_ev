import { useEffect, useState } from 'react';
import UserSidebar from '../../components/user/UserSidebar';
import UserPageHeader from '../../components/user/UserPageHeader';
import Spinner from '../../components/common/Spinner';
import { reminderAPI, vehicleAPI } from '../../api';

const TYPES = ['service_due', 'insurance_expiry', 'warranty_expiry', 'subscription_renewal', 'battery_check'];

export default function RemindersPage() {
  const [reminders, setReminders] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ vehicle: '', type: 'service_due', dueDate: '', message: '' });
  const [saving, setSaving] = useState(false);

  const load = () =>
    Promise.all([reminderAPI.list(), vehicleAPI.list()])
      .then(([r, v]) => { setReminders(r.data.reminders); setVehicles(v.data.vehicles); })
      .catch(console.error)
      .finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await reminderAPI.create(form);
      setShowForm(false);
      setForm({ vehicle: '', type: 'service_due', dueDate: '', message: '' });
      load();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const acknowledge = async (id) => {
    await reminderAPI.acknowledge(id);
    load();
  };

  const remove = async (id) => {
    if (!confirm('Delete this reminder?')) return;
    await reminderAPI.remove(id);
    load();
  };

  if (loading) return <div className="layout user-dark"><UserSidebar /><div className="main-content"><Spinner /></div></div>;

  const upcoming = reminders.filter((r) => !r.isAcknowledged);
  const done = reminders.filter((r) => r.isAcknowledged);

  return (
    <div className="layout user-dark">
      <UserSidebar />
      <div className="main-content">
        <UserPageHeader
          title="Service Reminders"
          subtitle="Stay ahead of due services and renewals"
          actions={<button className="btn btn-primary" onClick={() => setShowForm(true)}>+ Add Reminder</button>}
        />

        {showForm && (
          <div className="card mb-4">
            <div className="card-header">
              <h3>New Reminder</h3>
              <button className="btn btn-sm btn-outline" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
            <div className="card-body">
              <form onSubmit={handleCreate}>
                <div className="grid grid-2">
                  <div className="form-group">
                    <label className="form-label">Vehicle *</label>
                    <select className="form-select" value={form.vehicle} onChange={(e) => setForm((f) => ({ ...f, vehicle: e.target.value }))} required>
                      <option value="">Select vehicle</option>
                      {vehicles.map((v) => <option key={v._id} value={v._id}>{v.make} {v.model} — {v.registrationNumber}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Type *</label>
                    <select className="form-select" value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}>
                      {TYPES.map((t) => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Due Date *</label>
                    <input type="date" className="form-control" value={form.dueDate} onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))} required />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Message</label>
                  <input className="form-control" value={form.message} onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))} placeholder="Optional reminder message" />
                </div>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save Reminder'}</button>
              </form>
            </div>
          </div>
        )}

        {upcoming.length > 0 && (
          <div className="card mb-4">
            <div className="card-header"><h3>🔔 Upcoming ({upcoming.length})</h3></div>
            <div className="card-body" style={{ padding: 0 }}>
              {upcoming.map((r) => {
                const isOverdue = new Date(r.dueDate) < new Date();
                return (
                  <div key={r._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', borderBottom: '1px solid var(--border)', background: isOverdue ? '#fff5f5' : 'inherit' }}>
                    <div>
                      <div style={{ fontWeight: 500, textTransform: 'capitalize' }}>{r.type.replace(/_/g, ' ')}</div>
                      <div className="text-muted" style={{ fontSize: '.875rem' }}>{r.vehicle?.make} {r.vehicle?.model} — {r.vehicle?.registrationNumber}</div>
                      {r.message && <div style={{ fontSize: '.8rem', color: 'var(--text-muted)' }}>{r.message}</div>}
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 600, color: isOverdue ? 'var(--danger)' : 'var(--text)' }}>
                        {new Date(r.dueDate).toLocaleDateString()}
                      </div>
                      {isOverdue && <div style={{ fontSize: '.75rem', color: 'var(--danger)' }}>Overdue!</div>}
                      <div style={{ display: 'flex', gap: '.5rem', marginTop: '.5rem', justifyContent: 'flex-end' }}>
                        <button className="btn btn-sm btn-primary" onClick={() => acknowledge(r._id)}>✓ Done</button>
                        <button className="btn btn-sm btn-danger" onClick={() => remove(r._id)}>×</button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {done.length > 0 && (
          <div className="card">
            <div className="card-header"><h3>✅ Completed ({done.length})</h3></div>
            <div className="card-body" style={{ padding: 0 }}>
              {done.map((r) => (
                <div key={r._id} style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', borderBottom: '1px solid var(--border)', opacity: .6 }}>
                  <div>
                    <div style={{ fontWeight: 500, textTransform: 'capitalize' }}>{r.type.replace(/_/g, ' ')}</div>
                    <div className="text-muted" style={{ fontSize: '.875rem' }}>{r.vehicle?.registrationNumber}</div>
                  </div>
                  <span>{new Date(r.dueDate).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {reminders.length === 0 && (
          <div className="card">
            <div className="card-body text-center" style={{ padding: '3rem' }}>
              <div style={{ fontSize: '3rem' }}>🔔</div>
              <p className="text-muted mt-2">No reminders set. Add one to never miss a service!</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

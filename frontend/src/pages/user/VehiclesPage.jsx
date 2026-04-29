import { useEffect, useState } from 'react';
import UserSidebar from '../../components/user/UserSidebar';
import UserPageHeader from '../../components/user/UserPageHeader';
import Spinner from '../../components/common/Spinner';
import { vehicleAPI } from '../../api';

const EMPTY_FORM = { registrationNumber: '', make: '', model: '', year: '', vehicleType: '2-wheeler', batteryCapacity: '', color: '' };

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [editId, setEditId] = useState(null);

  const load = () => vehicleAPI.list().then((r) => setVehicles(r.data.vehicles)).catch(console.error).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (editId) {
        await vehicleAPI.update(editId, form);
      } else {
        await vehicleAPI.create(form);
      }
      setShowForm(false);
      setEditId(null);
      setForm(EMPTY_FORM);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Error saving vehicle');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (v) => {
    setForm({ registrationNumber: v.registrationNumber, make: v.make, model: v.model, year: v.year || '', vehicleType: v.vehicleType, batteryCapacity: v.batteryCapacity || '', color: v.color || '' });
    setEditId(v._id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Remove this vehicle?')) return;
    await vehicleAPI.remove(id);
    load();
  };

  if (loading) return <div className="layout user-dark"><UserSidebar /><div className="main-content"><Spinner /></div></div>;

  return (
    <div className="layout user-dark">
      <UserSidebar />
      <div className="main-content">
        <UserPageHeader
          title="Fleet Management"
          subtitle="Add and manage your EVs"
          actions={(
            <button className="btn btn-primary" onClick={() => { setShowForm(true); setEditId(null); setForm(EMPTY_FORM); }}>
              + Add Vehicle
            </button>
          )}
        />

        {showForm && (
          <div className="card mb-4">
            <div className="card-header">
              <h3>{editId ? 'Edit Vehicle' : 'Add New Vehicle'}</h3>
              <button className="btn btn-sm btn-outline" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
            <div className="card-body">
              {error && <div className="alert alert-danger">{error}</div>}
              <form onSubmit={handleSubmit}>
                <div className="grid grid-3">
                  <div className="form-group">
                    <label className="form-label">Registration Number *</label>
                    <input name="registrationNumber" className="form-control" value={form.registrationNumber} onChange={handleChange} placeholder="MH01AB1234" required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Make *</label>
                    <input name="make" className="form-control" value={form.make} onChange={handleChange} placeholder="Ola, Ather, etc." required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Model *</label>
                    <input name="model" className="form-control" value={form.model} onChange={handleChange} placeholder="S1 Pro, 450X" required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Year</label>
                    <input name="year" type="number" className="form-control" value={form.year} onChange={handleChange} placeholder="2023" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Vehicle Type *</label>
                    <select name="vehicleType" className="form-select" value={form.vehicleType} onChange={handleChange}>
                      <option value="2-wheeler">2-Wheeler</option>
                      <option value="3-wheeler">3-Wheeler</option>
                      <option value="4-wheeler">4-Wheeler</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Battery Capacity</label>
                    <input name="batteryCapacity" className="form-control" value={form.batteryCapacity} onChange={handleChange} placeholder="3.97 kWh" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Color</label>
                    <input name="color" className="form-control" value={form.color} onChange={handleChange} placeholder="Jet Black" />
                  </div>
                </div>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : editId ? 'Update' : 'Add Vehicle'}</button>
              </form>
            </div>
          </div>
        )}

        {vehicles.length === 0 ? (
          <div className="card">
            <div className="card-body text-center" style={{ padding: '3rem' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🚗</div>
              <p className="text-muted">No vehicles registered yet. Add your first EV!</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-3">
            {vehicles.map((v) => (
              <div key={v._id} className="card">
                <div className="card-body">
                  <div style={{ textAlign: 'center', fontSize: '3rem', marginBottom: '.75rem' }}>
                    {v.vehicleType === '2-wheeler' ? '🛵' : v.vehicleType === '3-wheeler' ? '🛺' : '🚗'}
                  </div>
                  <h3 style={{ textAlign: 'center', marginBottom: '.5rem' }}>{v.make} {v.model}</h3>
                  <p className="text-center text-muted" style={{ fontSize: '.875rem', marginBottom: '1rem' }}>{v.registrationNumber}</p>
                  <div style={{ fontSize: '.875rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                    {v.year && <div>Year: {v.year}</div>}
                    {v.batteryCapacity && <div>Battery: {v.batteryCapacity}</div>}
                    {v.color && <div>Color: {v.color}</div>}
                  </div>
                  <div style={{ display: 'flex', gap: '.5rem', justifyContent: 'center' }}>
                    <button className="btn btn-sm btn-outline" onClick={() => handleEdit(v)}>Edit</button>
                    <button className="btn btn-sm btn-danger" onClick={() => handleDelete(v._id)}>Remove</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

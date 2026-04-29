import { useState } from 'react';
import UserSidebar from '../../components/user/UserSidebar';
import UserPageHeader from '../../components/user/UserPageHeader';
import { useAuth } from '../../context/AuthContext';
import { authAPI } from '../../api';

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const [form, setForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    address: {
      street: user?.address?.street || '',
      city: user?.address?.city || '',
      state: user?.address?.state || '',
      pincode: user?.address?.pincode || '',
    },
  });
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '' });
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(''); setSuccess('');
    try {
      await authAPI.updateProfile(form);
      setSuccess('Profile updated!');
    } catch (err) {
      setError(err.response?.data?.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(''); setSuccess('');
    try {
      await authAPI.changePassword(pwForm);
      setSuccess('Password changed!');
      setPwForm({ currentPassword: '', newPassword: '' });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to change password');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="layout user-dark">
      <UserSidebar />
      <div className="main-content">
        <UserPageHeader title="My Profile" subtitle="Manage account, address, and security settings" />

        {success && <div className="alert alert-success">{success}</div>}
        {error && <div className="alert alert-danger">{error}</div>}

        <div className="grid grid-2">
          <div className="card">
            <div className="card-header"><h3>Personal Information</h3></div>
            <div className="card-body">
              <form onSubmit={handleUpdate}>
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input className="form-control" value={user?.email} disabled />
                </div>
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input className="form-control" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone</label>
                  <input className="form-control" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
                </div>
                <h4 style={{ margin: '1rem 0 .75rem' }}>Address</h4>
                {['street', 'city', 'state', 'pincode'].map((f) => (
                  <div key={f} className="form-group">
                    <label className="form-label">{f.charAt(0).toUpperCase() + f.slice(1)}</label>
                    <input className="form-control" value={form.address[f]} onChange={(e) => setForm((prev) => ({ ...prev, address: { ...prev.address, [f]: e.target.value } }))} />
                  </div>
                ))}
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</button>
              </form>
            </div>
          </div>

          <div>
            <div className="card mb-4">
              <div className="card-header"><h3>Account Info</h3></div>
              <div className="card-body">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem', fontSize: '.875rem' }}>
                  <div><strong>Role:</strong> <span style={{ textTransform: 'capitalize' }}>{user?.role}</span></div>
                  <div><strong>Referral Code:</strong> {user?.referralCode}</div>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-header"><h3>Change Password</h3></div>
              <div className="card-body">
                <form onSubmit={handlePasswordChange}>
                  <div className="form-group">
                    <label className="form-label">Current Password</label>
                    <input type="password" className="form-control" value={pwForm.currentPassword} onChange={(e) => setPwForm((f) => ({ ...f, currentPassword: e.target.value }))} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">New Password</label>
                    <input type="password" className="form-control" value={pwForm.newPassword} onChange={(e) => setPwForm((f) => ({ ...f, newPassword: e.target.value }))} minLength={6} required />
                  </div>
                  <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Changing...' : 'Change Password'}</button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

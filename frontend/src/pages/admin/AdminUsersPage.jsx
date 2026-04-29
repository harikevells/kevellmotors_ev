import { useEffect, useState } from 'react';
import AdminSidebar from '../../components/admin/AdminSidebar';
import { adminAPI } from '../../api';

const ROLES = ['user', 'admin', 'franchise'];
const ROLE_COLOR = { user: '#0EA5E9', admin: '#a855f7', franchise: '#22c55e' };

export default function AdminUsersPage() {
  const [users, setUsers]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');
  const [role, setRole]       = useState('');
  const [editing, setEditing] = useState(null);
  const [saving, setSaving]   = useState(false);

  const bg   = { background: '#06071a', color: '#e2e8f0', minHeight: '100vh', display: 'flex' };
  const card = { background: '#0d0e2b', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12 };
  const inp  = { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '.55rem .85rem', color: '#e2e8f0', fontSize: '.85rem', outline: 'none', boxSizing: 'border-box' };
  const th   = { padding: '.75rem 1.25rem', textAlign: 'left', fontSize: '.7rem', fontWeight: 700, color: '#4b5563', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)', textTransform: 'uppercase', letterSpacing: '.6px', whiteSpace: 'nowrap' };

  const load = () => {
    const params = {};
    if (search) params.search = search;
    if (role)   params.role   = role;
    adminAPI.listUsers(params).then((r) => setUsers(r.data.users)).catch(console.error).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, [search, role]);

  const handleUpdate = async (id, updates) => {
    setSaving(true);
    try { await adminAPI.updateUserAccess(id, updates); setEditing(null); load(); }
    catch (err) { console.error(err); }
    finally { setSaving(false); }
  };

  if (loading) return (
    <div style={bg}>
      <AdminSidebar />
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 40, height: 40, border: '4px solid rgba(0,229,255,.2)', borderTopColor: '#00e5ff', borderRadius: '50%', animation: 'spin .8s linear infinite' }} />
      </div>
    </div>
  );

  return (
    <div style={bg}>
      <AdminSidebar />
      <div style={{ flex: 1, padding: '1.5rem 2rem', overflowY: 'auto' }}>

        {/* Header */}
        <div style={{ marginBottom: '1.75rem' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#e2e8f0', margin: 0 }}>User Access Control</h1>
          <p style={{ color: '#6b7280', fontSize: '.83rem', marginTop: '.25rem' }}>Manage roles and account status</p>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          <input style={{ ...inp, maxWidth: 300 }} placeholder="Search by name or email..." value={search} onChange={(e) => setSearch(e.target.value)} />
          <select style={{ ...inp, maxWidth: 180 }} value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="">All Roles</option>
            {ROLES.map((r) => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
          </select>
        </div>

        {/* Table */}
        <div style={{ ...card, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.82rem' }}>
              <thead>
                <tr>{['Name', 'Email', 'Phone', 'Role', 'Status', 'Joined', 'Actions'].map(h => <th key={h} style={th}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {users.map((u, idx) => (
                  <tr key={u._id}
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', background: idx % 2 !== 0 ? 'rgba(255,255,255,0.015)' : 'transparent', transition: 'background .15s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,229,255,0.04)'}
                    onMouseLeave={e => e.currentTarget.style.background = idx % 2 !== 0 ? 'rgba(255,255,255,0.015)' : 'transparent'}
                  >
                    <td style={{ padding: '.8rem 1.25rem', color: '#e2e8f0', fontWeight: 600 }}>{u.name}</td>
                    <td style={{ padding: '.8rem 1.25rem', color: '#9ca3af' }}>{u.email}</td>
                    <td style={{ padding: '.8rem 1.25rem', color: '#9ca3af' }}>{u.phone}</td>
                    <td style={{ padding: '.8rem 1.25rem' }}>
                      {editing === u._id ? (
                        <select style={{ ...inp, width: 'auto', padding: '.3rem .6rem' }} defaultValue={u.role} onChange={(e) => handleUpdate(u._id, { role: e.target.value })}>
                          {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                        </select>
                      ) : (
                        <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: '.72rem', fontWeight: 600, color: ROLE_COLOR[u.role] || '#9ca3af', background: `${ROLE_COLOR[u.role] || '#9ca3af'}18`, border: `1px solid ${ROLE_COLOR[u.role] || '#9ca3af'}40`, textTransform: 'capitalize' }}>{u.role}</span>
                      )}
                    </td>
                    <td style={{ padding: '.8rem 1.25rem' }}>
                      <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: '.72rem', fontWeight: 600, color: u.isActive ? '#22c55e' : '#ef4444', background: u.isActive ? 'rgba(34,197,94,.15)' : 'rgba(239,68,68,.15)', border: `1px solid ${u.isActive ? '#22c55e40' : '#ef444440'}` }}>
                        {u.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={{ padding: '.8rem 1.25rem', color: '#6b7280', whiteSpace: 'nowrap' }}>{new Date(u.createdAt).toLocaleDateString('en-GB')}</td>
                    <td style={{ padding: '.8rem 1.25rem' }}>
                      <div style={{ display: 'flex', gap: '.4rem' }}>
                        <button onClick={() => setEditing(editing === u._id ? null : u._id)} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 7, padding: '.3rem .75rem', color: '#9ca3af', fontSize: '.75rem', cursor: 'pointer', fontWeight: 600 }}>
                          {editing === u._id ? 'Cancel' : 'Edit Role'}
                        </button>
                        <button onClick={() => handleUpdate(u._id, { isActive: !u.isActive })} disabled={saving}
                          style={{ background: u.isActive ? 'rgba(239,68,68,.12)' : 'rgba(34,197,94,.12)', border: `1px solid ${u.isActive ? 'rgba(239,68,68,.4)' : 'rgba(34,197,94,.4)'}`, borderRadius: 7, padding: '.3rem .75rem', color: u.isActive ? '#ef4444' : '#22c55e', fontSize: '.75rem', cursor: 'pointer', fontWeight: 600 }}>
                          {u.isActive ? 'Disable' : 'Enable'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {users.length === 0 && <div style={{ padding: '2.5rem', textAlign: 'center', color: '#4b5563' }}>No users found</div>}
          </div>
        </div>

      </div>
    </div>
  );
}

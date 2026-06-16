import { useEffect, useState } from 'react';
import AdminSidebar from '../../components/admin/AdminSidebar';
import AdminPageHeader from '../../components/admin/AdminPageHeader';
import Spinner from '../../components/common/Spinner';
import { partsAPI } from '../../api';

const CATEGORIES = ['battery', 'motor', 'controller', 'charger', 'body', 'electrical', 'other'];
const CAT_ICONS = { battery: '🔋', motor: '⚙️', controller: '🖥️', charger: '⚡', body: '🚘', electrical: '🔌', other: '🔩' };

const ORDER_STATUSES = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];
const STATUS_STYLES = {
  pending: { bg: 'rgba(251,146,60,.15)', color: '#fb923c' },
  confirmed: { bg: 'rgba(129,140,248,.15)', color: '#818cf8' },
  shipped: { bg: 'rgba(6,182,212,.15)', color: '#22d3ee' },
  delivered: { bg: 'rgba(74,222,128,.15)', color: '#4ade80' },
  cancelled: { bg: 'rgba(239,68,68,.15)', color: '#f87171' },
};

const EMPTY_FORM = { name: '', partNumber: '', category: 'other', description: '', price: '', stock: '', brand: '', warranty: '', isAvailable: true, images: [] };

const bg = { background: '#06071a', minHeight: '100vh', color: '#e2e8f0' };
const panelStyle = { background: 'linear-gradient(135deg,#0d0e2b,#111330)', border: '1px solid rgba(99,102,241,.18)', borderRadius: '16px', overflow: 'hidden' };
const panelHeader = { padding: '1rem 1.5rem', borderBottom: '1px solid rgba(99,102,241,.12)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' };
const inputStyle = { width: '100%', background: '#06071a', color: '#e2e8f0', border: '1px solid rgba(99,102,241,.3)', borderRadius: '10px', padding: '.55rem .85rem', fontSize: '.88rem', boxSizing: 'border-box', outline: 'none' };
const labelStyle = { display: 'block', fontSize: '.72rem', fontWeight: 700, color: '#64748b', marginBottom: '.3rem', textTransform: 'uppercase', letterSpacing: '.06em' };

export default function AdminPartsPage() {
  const [tab, setTab] = useState('parts');
  const [parts, setParts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  const loadAll = () =>
    Promise.all([partsAPI.list({ limit: 200 }), partsAPI.allOrders()])
      .then(([p, o]) => { setParts(p.data.parts || []); setOrders(o.data.orders || []); })
      .catch(console.error)
      .finally(() => setLoading(false));

  useEffect(() => { loadAll(); }, []);

  const openCreate = () => { setEditing(null); setForm(EMPTY_FORM); setError(''); setShowModal(true); };
  const openEdit = (part) => {
    setEditing(part._id);
    setForm({
      name: part.name, partNumber: part.partNumber || '', category: part.category || 'other',
      description: part.description || '', price: part.price, stock: part.stock,
      brand: part.brand || '', warranty: part.warranty || '', isAvailable: part.isAvailable,
      images: part.images?.length > 0 ? part.images : (part.image ? [part.image] : []),
    });
    setError('');
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('name', form.name);
      formData.append('partNumber', form.partNumber);
      formData.append('category', form.category);
      formData.append('description', form.description);
      formData.append('price', Number(form.price));
      formData.append('stock', Number(form.stock));
      formData.append('brand', form.brand);
      formData.append('warranty', form.warranty);
      formData.append('isAvailable', form.isAvailable);
      
      // Handle images: Append all files and send existing image URLs
      if (form.images && form.images.length > 0) {
        const existingImages = [];
        form.images.forEach(img => {
          if (img instanceof File) {
            formData.append('images', img);
          } else if (typeof img === 'string') {
            existingImages.push(img);
          }
        });
        formData.append('existingImages', JSON.stringify(existingImages));
      } else {
        formData.append('existingImages', JSON.stringify([]));
      }
      
      if (editing) await partsAPI.update(editing, formData);
      else await partsAPI.create(formData);
      setShowModal(false);
      loadAll();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save part');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (deleteConfirm !== id) { setDeleteConfirm(id); return; }
    try {
      await partsAPI.remove(id);
      setDeleteConfirm(null);
      loadAll();
    } catch (err) {
      console.error(err);
    }
  };

  const handleOrderStatus = async (orderId, status) => {
    try {
      const res = await partsAPI.updateOrderStatus(orderId, status);
      setOrders((prev) => prev.map((o) => o._id === orderId ? res.data.order : o));
    } catch (err) {
      console.error(err);
    }
  };

  const filteredParts = parts.filter((p) =>
    !search || p.name.toLowerCase().includes(search.toLowerCase()) || (p.partNumber || '').toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return (
    <div style={{ display: 'flex', ...bg }}>
      <AdminSidebar />
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Spinner /></div>
    </div>
  );

  return (
    <div style={{ display: 'flex', ...bg }}>
      <AdminSidebar />
      <div style={{ flex: 1, padding: '1.75rem 2rem', overflowY: 'auto' }}>

        {/* Header */}
        <AdminPageHeader 
          title="🔩 Spare Parts" 
          subtitle="Manage inventory and customer orders" 
        />

        {/* Tabs and Actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', gap: '.4rem', background: '#0d0e2b', padding: '.3rem', borderRadius: '12px', border: '1px solid rgba(99,102,241,.2)', width: 'fit-content' }}>
            {[{ id: 'parts', label: `🔩 Parts (${parts.length})` }, { id: 'orders', label: `📦 Orders (${orders.length})` }].map((t) => (
              <button key={t.id} onClick={() => setTab(t.id)} style={{
                padding: '.45rem 1.2rem', borderRadius: '9px', border: 'none', cursor: 'pointer',
                fontSize: '.83rem', fontWeight: 700,
                background: tab === t.id ? 'linear-gradient(135deg,#6366f1,#06b6d4)' : 'transparent',
                color: tab === t.id ? '#fff' : '#64748b', transition: 'all .2s',
              }}>{t.label}</button>
            ))}
          </div>

          {tab === 'parts' && (
            <button onClick={openCreate} style={{
              padding: '.6rem 1.4rem', borderRadius: '10px', border: 'none', cursor: 'pointer',
              background: 'linear-gradient(135deg,#6366f1,#06b6d4)', color: '#fff', fontWeight: 700, fontSize: '.88rem',
            }}>
              + Add Part
            </button>
          )}
        </div>

        {/* ══════ PARTS TAB ══════ */}
        {tab === 'parts' && (
          <>
            {/* Search */}
            <div style={{ marginBottom: '1.25rem', position: 'relative', maxWidth: 320 }}>
              <span style={{ position: 'absolute', left: '.85rem', top: '50%', transform: 'translateY(-50%)', color: '#475569' }}>🔍</span>
              <input style={{ ...inputStyle, paddingLeft: '2.4rem' }} placeholder="Search by name or part number..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>

            {filteredParts.length === 0 ? (
              <div style={{ ...panelStyle, textAlign: 'center', padding: '4rem' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔍</div>
                <p style={{ color: '#475569' }}>No parts found.</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: '1.1rem' }}>
                {filteredParts.map((p) => (
                  <div key={p._id} style={{ ...panelStyle, display: 'flex', flexDirection: 'column' }}>
                    {/* Card image area */}
                    <div style={{
                      height: 100, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      backgroundImage: (p.images && p.images.length > 0) ? `url("${p.images[0]}")` : (p.image ? `url("${p.image}")` : 'linear-gradient(160deg,rgba(99,102,241,.08),rgba(6,182,212,.05))'),
                      backgroundSize: (p.images?.length > 0 || p.image) ? 'contain' : 'cover',
                      backgroundPosition: 'center',
                      backgroundRepeat: 'no-repeat',
                      fontSize: '2.8rem', borderBottom: '1px solid rgba(99,102,241,.1)', position: 'relative',
                    }}>
                      {!(p.images?.length > 0 || p.image) && (CAT_ICONS[p.category] || '🔩')}
                      {p.images && p.images.length > 1 && (
                        <div style={{ position: 'absolute', bottom: '6px', left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: '4px' }}>
                          {p.images.map((_, i) => <div key={i} style={{ width: 5, height: 5, borderRadius: '50%', background: i === 0 ? '#06b6d4' : 'rgba(255,255,255,.4)' }} />)}
                        </div>
                      )}
                      <span style={{
                        position: 'absolute', top: '.5rem', right: '.65rem',
                        fontSize: '.6rem', fontWeight: 700, padding: '2px 7px', borderRadius: '999px', letterSpacing: '.06em', textTransform: 'uppercase',
                        background: p.isAvailable ? 'rgba(74,222,128,.15)' : 'rgba(239,68,68,.15)',
                        color: p.isAvailable ? '#4ade80' : '#f87171',
                      }}>
                        {p.isAvailable ? 'Active' : 'Hidden'}
                      </span>
                    </div>

                    <div style={{ padding: '.9rem 1.1rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '.2rem' }}>
                      <div style={{ fontSize: '.62rem', fontWeight: 700, color: '#6366f1', textTransform: 'uppercase', letterSpacing: '.07em' }}>{p.category}</div>
                      <div style={{ fontWeight: 700, color: '#f1f5f9', fontSize: '.95rem', lineHeight: 1.3 }}>{p.name}</div>
                      <div style={{ fontSize: '.72rem', color: '#475569', fontFamily: 'monospace' }}>{p.partNumber}</div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '.5rem' }}>
                        <span style={{ fontWeight: 800, color: '#06b6d4', fontSize: '1.15rem' }}>₹{p.price?.toLocaleString('en-IN')}</span>
                        <span style={{
                          fontSize: '.72rem', fontWeight: 600, padding: '2px 8px', borderRadius: '999px',
                          background: p.stock > 10 ? 'rgba(74,222,128,.12)' : p.stock > 0 ? 'rgba(251,146,60,.12)' : 'rgba(239,68,68,.12)',
                          color: p.stock > 10 ? '#4ade80' : p.stock > 0 ? '#fb923c' : '#f87171',
                        }}>
                          Stock: {p.stock}
                        </span>
                      </div>

                      <div style={{ display: 'flex', gap: '.5rem', marginTop: '.75rem' }}>
                        <button onClick={() => openEdit(p)} style={{
                          flex: 1, padding: '.45rem', borderRadius: '8px', border: '1px solid rgba(6,182,212,.3)',
                          background: 'rgba(6,182,212,.08)', color: '#22d3ee', cursor: 'pointer', fontWeight: 600, fontSize: '.8rem',
                        }}>✏️ Edit</button>
                        <button
                          onClick={() => handleDelete(p._id)}
                          style={{
                            flex: 1, padding: '.45rem', borderRadius: '8px', border: '1px solid rgba(239,68,68,.3)',
                            background: deleteConfirm === p._id ? 'rgba(239,68,68,.25)' : 'rgba(239,68,68,.08)',
                            color: '#f87171', cursor: 'pointer', fontWeight: 600, fontSize: '.8rem',
                          }}
                          onBlur={() => setDeleteConfirm(null)}
                        >
                          {deleteConfirm === p._id ? '⚠️ Confirm?' : '🗑️ Delete'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ══════ ORDERS TAB ══════ */}
        {tab === 'orders' && (
          <>
            {orders.length === 0 ? (
              <div style={{ ...panelStyle, textAlign: 'center', padding: '4rem' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📦</div>
                <p style={{ color: '#475569' }}>No orders yet.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {orders.map((o) => {
                  const st = STATUS_STYLES[o.status] || STATUS_STYLES.pending;
                  return (
                    <div key={o._id} style={panelStyle}>
                      <div style={{ ...panelHeader, background: 'rgba(99,102,241,.04)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                          <div style={{ width: 38, height: 38, borderRadius: '10px', background: 'rgba(99,102,241,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem' }}>📦</div>
                          <div>
                            <div style={{ fontWeight: 700, color: '#e2e8f0', fontSize: '.88rem' }}>#{o._id.slice(-8).toUpperCase()}</div>
                            <div style={{ fontSize: '.72rem', color: '#64748b' }}>
                              {o.user?.name} · {o.user?.email} · {new Date(o.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem' }}>
                          <span style={{ fontSize: '.7rem', fontWeight: 700, padding: '3px 10px', borderRadius: '999px', background: st.bg, color: st.color, textTransform: 'uppercase', letterSpacing: '.06em' }}>
                            {o.status}
                          </span>
                          {/* Status dropdown */}
                          <select
                            value={o.status}
                            onChange={(e) => handleOrderStatus(o._id, e.target.value)}
                            style={{ background: '#0d0e2b', color: '#94a3b8', border: '1px solid rgba(99,102,241,.3)', borderRadius: '8px', padding: '.3rem .6rem', fontSize: '.78rem', cursor: 'pointer' }}
                          >
                            {ORDER_STATUSES.map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                          </select>
                        </div>
                      </div>

                      <div style={{ padding: '0 1.5rem' }}>
                        {o.items.map((item, i) => (
                          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '.75rem 0', borderBottom: i < o.items.length - 1 ? '1px solid rgba(99,102,241,.08)' : 'none' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem' }}>
                              <div style={{ width: 32, height: 32, borderRadius: '8px', background: 'rgba(6,182,212,.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.95rem' }}>🔩</div>
                              <div>
                                <div style={{ fontWeight: 600, color: '#e2e8f0', fontSize: '.85rem' }}>{item.part?.name || 'Part'}</div>
                                <div style={{ fontSize: '.7rem', color: '#64748b' }}>Qty: {item.quantity} · ₹{item.price?.toLocaleString('en-IN')} each</div>
                              </div>
                            </div>
                            <span style={{ fontWeight: 700, color: '#94a3b8', fontSize: '.88rem' }}>₹{(item.price * item.quantity).toLocaleString('en-IN')}</span>
                          </div>
                        ))}
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '.85rem 0', borderTop: '1px solid rgba(99,102,241,.1)' }}>
                          <div style={{ fontSize: '.78rem', color: '#64748b' }}>
                            📍 {o.shippingAddress?.street}, {o.shippingAddress?.city}, {o.shippingAddress?.state} — {o.shippingAddress?.pincode}
                          </div>
                          <span style={{ fontWeight: 800, color: '#06b6d4', fontSize: '1rem' }}>₹{o.totalAmount?.toLocaleString('en-IN')}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      {/* ══════ ADD / EDIT MODAL ══════ */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.7)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
          <div style={{ background: '#0d0e2b', border: '1px solid rgba(99,102,241,.3)', borderRadius: '18px', width: '100%', maxWidth: '560px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid rgba(99,102,241,.15)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#f1f5f9' }}>{editing ? '✏️ Edit Part' : '➕ Add New Part'}</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '1.3rem' }}>✕</button>
            </div>

            <form onSubmit={handleSave} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {error && (
                <div style={{ background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.3)', borderRadius: '8px', padding: '.6rem 1rem', color: '#f87171', fontSize: '.85rem' }}>⚠️ {error}</div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div style={{ gridColumn: '1/-1' }}>
                  <label style={labelStyle}>Part Name *</label>
                  <input required style={inputStyle} placeholder="e.g. Lithium-Ion Battery Cell 72V" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
                </div>
                <div>
                  <label style={labelStyle}>Part Number</label>
                  <input style={inputStyle} placeholder="e.g. BAT-72V-001" value={form.partNumber} onChange={(e) => setForm((f) => ({ ...f, partNumber: e.target.value }))} />
                </div>
                <div>
                  <label style={labelStyle}>Category *</label>
                  <select required style={inputStyle} value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}>
                    {CATEGORIES.map((c) => <option key={c} value={c}>{CAT_ICONS[c]} {c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Price (₹) *</label>
                  <input required type="number" min="0" style={inputStyle} placeholder="e.g. 12500" value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} />
                </div>
                <div>
                  <label style={labelStyle}>Stock Qty *</label>
                  <input required type="number" min="0" style={inputStyle} placeholder="e.g. 50" value={form.stock} onChange={(e) => setForm((f) => ({ ...f, stock: e.target.value }))} />
                </div>
                <div>
                  <label style={labelStyle}>Brand</label>
                  <input style={inputStyle} placeholder="e.g. Nexgen" value={form.brand} onChange={(e) => setForm((f) => ({ ...f, brand: e.target.value }))} />
                </div>
                <div>
                  <label style={labelStyle}>Warranty</label>
                  <input style={inputStyle} placeholder="e.g. 1 Year" value={form.warranty} onChange={(e) => setForm((f) => ({ ...f, warranty: e.target.value }))} />
                </div>
                <div style={{ gridColumn: '1/-1' }}>
                  <label style={labelStyle}>Product Images (Max 5)</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(e) => {
                        const files = Array.from(e.target.files);
                        const currentImages = form.images || [];
                        if (currentImages.length + files.length > 5) {
                          alert('You can only upload up to 5 images.');
                          return;
                        }
                        setForm((f) => ({ ...f, images: [...currentImages, ...files].slice(0, 5) }));
                      }}
                      style={{ ...inputStyle, cursor: 'pointer' }}
                    />
                    {(form.images || []).length > 0 && (
                      <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap', marginTop: '.25rem' }}>
                        {(form.images || []).map((img, idx) => (
                          <div key={idx} style={{ position: 'relative', width: 60, height: 60, borderRadius: '8px', overflow: 'hidden', border: '1px solid rgba(99,102,241,.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(99,102,241,.05)' }}>
                            <img 
                              src={typeof img === 'string' ? img : URL.createObjectURL(img)} 
                              alt="preview" 
                              style={{ width: '100%', height: '100%', objectFit: 'contain', background: '#000' }} 
                            />
                            <button
                              type="button"
                              onClick={() => setForm((f) => ({ ...f, images: (f.images || []).filter((_, i) => i !== idx) }))}
                              style={{
                                position: 'absolute', top: 2, right: 2, background: 'rgba(239,68,68,.9)', color: '#fff',
                                border: 'none', borderRadius: '50%', width: 18, height: 18, fontSize: '.6rem', cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                              }}
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div style={{ gridColumn: '1/-1' }}>
                  <label style={labelStyle}>Description</label>
                  <textarea rows={3} style={{ ...inputStyle, resize: 'vertical' }} placeholder="Brief description of the part..." value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
                </div>
                <div style={{ gridColumn: '1/-1', display: 'flex', alignItems: 'center', gap: '.75rem' }}>
                  <label style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', cursor: 'pointer' }}>
                    <input type="checkbox" checked={form.isAvailable} onChange={(e) => setForm((f) => ({ ...f, isAvailable: e.target.checked }))} style={{ display: 'none' }} />
                    <div style={{ width: 40, height: 22, borderRadius: '999px', background: form.isAvailable ? '#06b6d4' : 'rgba(99,102,241,.2)', transition: 'background .2s', position: 'relative' }}>
                      <div style={{ position: 'absolute', top: 3, left: form.isAvailable ? 20 : 3, width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left .2s' }} />
                    </div>
                  </label>
                  <span style={{ fontSize: '.85rem', color: form.isAvailable ? '#4ade80' : '#64748b', fontWeight: 600 }}>
                    {form.isAvailable ? 'Listed (visible to customers)' : 'Hidden from shop'}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '.75rem', justifyContent: 'flex-end', paddingTop: '.5rem' }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ padding: '.6rem 1.4rem', borderRadius: '10px', border: '1px solid rgba(99,102,241,.3)', background: 'transparent', color: '#94a3b8', cursor: 'pointer', fontWeight: 600 }}>
                  Cancel
                </button>
                <button type="submit" disabled={saving} style={{
                  padding: '.6rem 1.6rem', borderRadius: '10px', border: 'none', cursor: saving ? 'not-allowed' : 'pointer',
                  background: saving ? 'rgba(99,102,241,.3)' : 'linear-gradient(135deg,#6366f1,#06b6d4)',
                  color: '#fff', fontWeight: 700, fontSize: '.9rem',
                }}>
                  {saving ? '⏳ Saving...' : editing ? 'Save Changes' : 'Add Part'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

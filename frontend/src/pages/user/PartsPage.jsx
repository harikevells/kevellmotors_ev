import { useEffect, useState } from 'react';
import UserSidebar from '../../components/user/UserSidebar';
import Spinner from '../../components/common/Spinner';
import { partsAPI } from '../../api';

const CATEGORIES = ['all', 'battery', 'motor', 'controller', 'charger', 'body', 'electrical', 'other'];

const CAT_ICONS = { battery: '🔋', motor: '⚙️', controller: '🖥️', charger: '⚡', body: '🚘', electrical: '🔌', other: '🔩', all: '🌐' };
const STATUS_STYLES = {
  pending:    { bg: 'rgba(251,146,60,.15)', color: '#fb923c', label: 'Pending' },
  processing: { bg: 'rgba(129,140,248,.15)', color: '#818cf8', label: 'Processing' },
  shipped:    { bg: 'rgba(6,182,212,.15)',   color: '#22d3ee', label: 'Shipped' },
  delivered:  { bg: 'rgba(74,222,128,.15)',  color: '#4ade80', label: 'Delivered' },
  cancelled:  { bg: 'rgba(239,68,68,.15)',   color: '#f87171', label: 'Cancelled' },
};

export default function PartsPage() {
  const [parts, setParts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState([]);
  const [view, setView] = useState('shop');
  const [shippingAddress, setShippingAddress] = useState({ street: '', city: '', state: '', pincode: '' });
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadParts = () => {
    const params = {};
    if (category !== 'all') params.category = category;
    if (search) params.search = search;
    partsAPI.list(params).then((r) => setParts(r.data.parts)).catch(console.error);
  };

  const loadOrders = () => partsAPI.myOrders().then((r) => setOrders(r.data.orders)).catch(console.error);

  useEffect(() => {
    Promise.all([
      partsAPI.list(),
      partsAPI.myOrders(),
    ]).then(([p, o]) => {
      setParts(p.data.parts);
      setOrders(o.data.orders);
    }).finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadParts(); }, [category, search]);

  const addToCart = (part) => {
    setCart((c) => {
      const existing = c.find((i) => i.partId === part._id);
      if (existing) return c.map((i) => i.partId === part._id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...c, { partId: part._id, name: part.name, price: part.price, quantity: 1 }];
    });
  };

  const removeFromCart = (partId) => setCart((c) => c.filter((i) => i.partId !== partId));

  const total = cart.reduce((s, i) => s + i.price * i.quantity, 0);

  const placeOrder = async (e) => {
    e.preventDefault();
    setPlacing(true);
    setError('');
    try {
      await partsAPI.placeOrder({ items: cart, shippingAddress });
      setCart([]);
      setSuccess('Order placed successfully!');
      setView('orders');
      loadOrders();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to place order');
    } finally {
      setPlacing(false);
    }
  };

  if (loading) return <div className="layout user-dark"><UserSidebar /><div className="main-content"><Spinner /></div></div>;

  const cartCount = cart.reduce((s, i) => s + i.quantity, 0);

  /* ─── shared styles ─── */
  const panelStyle = {
    background: 'linear-gradient(135deg,#0d0e2b,#111330)',
    border: '1px solid rgba(99,102,241,.18)',
    borderRadius: '16px',
    overflow: 'hidden',
  };
  const panelHeader = {
    padding: '1.1rem 1.5rem',
    borderBottom: '1px solid rgba(99,102,241,.12)',
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  };
  const inputStyle = {
    background: '#06071a', color: '#e2e8f0',
    border: '1px solid rgba(99,102,241,.3)', borderRadius: '10px',
    padding: '.6rem 1rem', fontSize: '.9rem', outline: 'none',
    boxSizing: 'border-box',
  };

  return (
    <div className="layout user-dark">
      <UserSidebar />
      <div className="main-content" style={{ padding: '1.5rem 2rem' }}>

        {/* ── Page Header ── */}
        <div style={{ marginBottom: '1.75rem' }}>
          <div style={{ fontSize: '.75rem', fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', color: '#06b6d4', marginBottom: '.3rem' }}>Store</div>
          <h1 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 700, color: '#f1f5f9' }}>
            🔩 Spare <span style={{ color: '#06b6d4' }}>Parts</span>
          </h1>
          <p style={{ margin: '.3rem 0 0', color: '#64748b', fontSize: '.9rem' }}>Shop genuine EV parts, manage your cart & track orders.</p>
        </div>

        {/* ── Nav Tabs ── */}
        <div style={{ display: 'flex', gap: '.5rem', marginBottom: '1.75rem', background: '#0d0e2b', padding: '.35rem', borderRadius: '12px', border: '1px solid rgba(99,102,241,.2)', width: 'fit-content' }}>
          {[
            { id: 'shop',   label: '🛒 Shop' },
            { id: 'cart',   label: `🛍️ Cart${cartCount > 0 ? ` (${cartCount})` : ''}` },
            { id: 'orders', label: '📦 My Orders' },
          ].map((t) => (
            <button key={t.id} onClick={() => setView(t.id)} style={{
              padding: '.5rem 1.25rem', borderRadius: '9px', border: 'none', cursor: 'pointer',
              fontSize: '.85rem', fontWeight: 600,
              background: view === t.id ? 'linear-gradient(135deg,#6366f1,#06b6d4)' : 'transparent',
              color: view === t.id ? '#fff' : '#64748b',
              transition: 'all .2s',
              position: 'relative',
            }}>
              {t.label}
              {t.id === 'cart' && cartCount > 0 && view !== 'cart' && (
                <span style={{ position: 'absolute', top: '2px', right: '6px', width: 8, height: 8, borderRadius: '50%', background: '#06b6d4' }} />
              )}
            </button>
          ))}
        </div>

        {success && (
          <div style={{ background: 'rgba(74,222,128,.1)', border: '1px solid rgba(74,222,128,.3)', borderRadius: '10px', padding: '.75rem 1.25rem', marginBottom: '1.25rem', color: '#4ade80', fontSize: '.9rem' }}>
            ✅ {success}
          </div>
        )}

        {/* ══════════════ SHOP VIEW ══════════════ */}
        {view === 'shop' && (
          <>
            {/* Search + Category filters */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ position: 'relative', flex: '1', maxWidth: '320px' }}>
                <span style={{ position: 'absolute', left: '.85rem', top: '50%', transform: 'translateY(-50%)', color: '#475569', pointerEvents: 'none' }}>🔍</span>
                <input
                  style={{ ...inputStyle, width: '100%', paddingLeft: '2.4rem' }}
                  placeholder="Search parts..."
                  value={search} onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div style={{ display: 'flex', gap: '.4rem', flexWrap: 'wrap' }}>
                {CATEGORIES.map((c) => (
                  <button key={c} onClick={() => setCategory(c)} style={{
                    padding: '.4rem .9rem', borderRadius: '999px', border: 'none', cursor: 'pointer',
                    fontSize: '.78rem', fontWeight: 600,
                    background: category === c ? 'linear-gradient(135deg,#6366f1,#06b6d4)' : 'rgba(99,102,241,.1)',
                    color: category === c ? '#fff' : '#94a3b8',
                    transition: 'all .2s',
                  }}>
                    {CAT_ICONS[c]} {c.charAt(0).toUpperCase() + c.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {parts.length === 0 ? (
              <div style={{ ...panelStyle, textAlign: 'center', padding: '4rem 2rem' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔍</div>
                <p style={{ color: '#475569' }}>No parts found matching your search.</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1.25rem' }}>
                {parts.map((p) => {
                  const inCart = cart.find((i) => i.partId === p._id);
                  return (
                    <div key={p._id} style={{
                      ...panelStyle,
                      display: 'flex', flexDirection: 'column',
                      transition: 'transform .18s, box-shadow .18s',
                      cursor: 'default',
                    }}
                      onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 12px 40px rgba(99,102,241,.18)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
                    >
                      {/* Part image area */}
                      <div style={{
                        height: '130px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: p.image ? `url(${p.image})` : 'linear-gradient(160deg,rgba(99,102,241,.08),rgba(6,182,212,.05))',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        fontSize: '3.5rem', borderBottom: '1px solid rgba(99,102,241,.1)',
                        position: 'relative',
                      }}>
                        {!p.image && (CAT_ICONS[p.category] || '🔩')}
                        {p.stock <= 5 && p.stock > 0 && (
                          <span style={{ position: 'absolute', top: '.6rem', right: '.75rem', fontSize: '.6rem', fontWeight: 700, padding: '2px 8px', borderRadius: '999px', background: 'rgba(251,146,60,.2)', color: '#fb923c', letterSpacing: '.05em' }}>
                            Only {p.stock} left
                          </span>
                        )}
                        {p.stock === 0 && (
                          <span style={{ position: 'absolute', top: '.6rem', right: '.75rem', fontSize: '.6rem', fontWeight: 700, padding: '2px 8px', borderRadius: '999px', background: 'rgba(239,68,68,.2)', color: '#f87171', letterSpacing: '.05em' }}>
                            Out of Stock
                          </span>
                        )}
                      </div>

                      {/* Part info */}
                      <div style={{ padding: '1rem 1.25rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                        <div style={{ fontSize: '.65rem', fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: '#6366f1', marginBottom: '.3rem' }}>
                          {p.category}
                        </div>
                        <div style={{ fontWeight: 700, fontSize: '1rem', color: '#f1f5f9', marginBottom: '.25rem', lineHeight: 1.3 }}>{p.name}</div>
                        <div style={{ fontSize: '.75rem', color: '#475569', fontFamily: 'monospace', marginBottom: 'auto' }}>{p.partNumber}</div>

                        <div style={{ marginTop: '.9rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#06b6d4' }}>₹{p.price.toLocaleString('en-IN')}</div>
                          {inCart && (
                            <span style={{ fontSize: '.7rem', padding: '2px 8px', borderRadius: '999px', background: 'rgba(74,222,128,.15)', color: '#4ade80', fontWeight: 600 }}>
                              In cart ×{inCart.quantity}
                            </span>
                          )}
                        </div>

                        <button
                          disabled={p.stock === 0}
                          onClick={() => addToCart(p)}
                          style={{
                            marginTop: '.75rem', width: '100%', padding: '.6rem',
                            borderRadius: '10px', border: 'none', cursor: p.stock === 0 ? 'not-allowed' : 'pointer',
                            fontWeight: 700, fontSize: '.85rem',
                            background: p.stock === 0
                              ? 'rgba(99,102,241,.1)'
                              : inCart
                                ? 'rgba(6,182,212,.15)'
                                : 'linear-gradient(135deg,#6366f1,#06b6d4)',
                            color: p.stock === 0 ? '#475569' : inCart ? '#22d3ee' : '#fff',
                            transition: 'opacity .2s',
                          }}
                        >
                          {p.stock === 0 ? 'Out of Stock' : inCart ? '+ Add More' : 'Add to Cart'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* ══════════════ CART VIEW ══════════════ */}
        {view === 'cart' && (
          <>
            {cart.length === 0 ? (
              <div style={{ ...panelStyle, textAlign: 'center', padding: '5rem 2rem' }}>
                <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🛒</div>
                <div style={{ fontWeight: 700, color: '#e2e8f0', marginBottom: '.5rem' }}>Your cart is empty</div>
                <p style={{ color: '#475569', marginBottom: '1.5rem' }}>Browse the shop and add parts to get started.</p>
                <button onClick={() => setView('shop')} style={{
                  padding: '.6rem 1.5rem', borderRadius: '10px', border: 'none', cursor: 'pointer',
                  background: 'linear-gradient(135deg,#6366f1,#06b6d4)', color: '#fff', fontWeight: 700,
                }}>Browse Parts</button>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '1.5rem', alignItems: 'start' }}>

                {/* Cart items */}
                <div style={panelStyle}>
                  <div style={panelHeader}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem' }}>
                      <span>🛍️</span>
                      <span style={{ fontWeight: 700, color: '#e2e8f0' }}>Cart Items</span>
                      <span style={{ fontSize: '.7rem', padding: '2px 8px', borderRadius: '999px', background: 'rgba(6,182,212,.15)', color: '#22d3ee', fontWeight: 600 }}>{cartCount} item{cartCount !== 1 ? 's' : ''}</span>
                    </div>
                    <button onClick={() => setCart([])} style={{ background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.25)', borderRadius: '8px', padding: '.3rem .75rem', color: '#f87171', cursor: 'pointer', fontSize: '.78rem', fontWeight: 600 }}>
                      Clear All
                    </button>
                  </div>
                  <div style={{ padding: '0 1.5rem' }}>
                    {cart.map((item, i) => (
                      <div key={item.partId} style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        padding: '1rem 0',
                        borderBottom: i < cart.length - 1 ? '1px solid rgba(99,102,241,.1)' : 'none',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '.85rem' }}>
                          <div style={{ width: 42, height: 42, borderRadius: '10px', background: 'rgba(99,102,241,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>🔩</div>
                          <div>
                            <div style={{ fontWeight: 600, color: '#e2e8f0', fontSize: '.9rem' }}>{item.name}</div>
                            <div style={{ fontSize: '.75rem', color: '#64748b', marginTop: '2px' }}>₹{item.price.toLocaleString('en-IN')} × {item.quantity}</div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                          <span style={{ fontWeight: 800, color: '#06b6d4', fontSize: '1rem' }}>₹{(item.price * item.quantity).toLocaleString('en-IN')}</span>
                          <button onClick={() => removeFromCart(item.partId)} style={{ width: 28, height: 28, borderRadius: '8px', border: 'none', cursor: 'pointer', background: 'rgba(239,68,68,.15)', color: '#f87171', fontWeight: 700, fontSize: '1rem', lineHeight: 1 }}>×</button>
                        </div>
                      </div>
                    ))}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 0', borderTop: '1px solid rgba(99,102,241,.15)', marginTop: '.25rem' }}>
                      <span style={{ color: '#94a3b8', fontWeight: 600 }}>Order Total</span>
                      <span style={{ fontSize: '1.3rem', fontWeight: 800, color: '#f1f5f9' }}>₹{total.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                </div>

                {/* Shipping + place order */}
                <div style={panelStyle}>
                  <div style={panelHeader}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem' }}>
                      <span>📍</span>
                      <span style={{ fontWeight: 700, color: '#e2e8f0' }}>Shipping Address</span>
                    </div>
                  </div>
                  <div style={{ padding: '1.25rem 1.5rem' }}>
                    {error && (
                      <div style={{ background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.3)', borderRadius: '8px', padding: '.65rem 1rem', marginBottom: '1rem', color: '#f87171', fontSize: '.85rem' }}>
                        ⚠️ {error}
                      </div>
                    )}
                    <form onSubmit={placeOrder} style={{ display: 'flex', flexDirection: 'column', gap: '.85rem' }}>
                      {[
                        { key: 'street', label: 'Street Address', placeholder: '123, Main Street' },
                        { key: 'city',   label: 'City',           placeholder: 'Chennai' },
                        { key: 'state',  label: 'State',          placeholder: 'Tamil Nadu' },
                        { key: 'pincode',label: 'Pincode',        placeholder: '600001' },
                      ].map((f) => (
                        <div key={f.key}>
                          <label style={{ display: 'block', fontSize: '.75rem', fontWeight: 600, color: '#64748b', marginBottom: '.35rem', textTransform: 'uppercase', letterSpacing: '.06em' }}>{f.label}</label>
                          <input
                            required
                            style={{ ...inputStyle, width: '100%' }}
                            placeholder={f.placeholder}
                            value={shippingAddress[f.key]}
                            onChange={(e) => setShippingAddress((a) => ({ ...a, [f.key]: e.target.value }))}
                          />
                        </div>
                      ))}
                      <button type="submit" disabled={placing} style={{
                        marginTop: '.5rem', padding: '.8rem', borderRadius: '12px', border: 'none',
                        cursor: placing ? 'not-allowed' : 'pointer', fontWeight: 700, fontSize: '.95rem',
                        background: placing ? 'rgba(99,102,241,.3)' : 'linear-gradient(135deg,#6366f1,#06b6d4)',
                        color: '#fff', transition: 'opacity .2s',
                      }}>
                        {placing ? '⏳ Placing Order...' : `Place Order — ₹${total.toLocaleString('en-IN')}`}
                      </button>
                    </form>
                  </div>
                </div>

              </div>
            )}
          </>
        )}

        {/* ══════════════ ORDERS VIEW ══════════════ */}
        {view === 'orders' && (
          <>
            {orders.length === 0 ? (
              <div style={{ ...panelStyle, textAlign: 'center', padding: '5rem 2rem' }}>
                <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📦</div>
                <div style={{ fontWeight: 700, color: '#e2e8f0', marginBottom: '.5rem' }}>No orders yet</div>
                <p style={{ color: '#475569' }}>Your order history will appear here.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {orders.map((o) => {
                  const st = STATUS_STYLES[o.status] || STATUS_STYLES.pending;
                  return (
                    <div key={o._id} style={panelStyle}>
                      {/* Order header */}
                      <div style={{ ...panelHeader, background: 'rgba(99,102,241,.04)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                          <div style={{ width: 38, height: 38, borderRadius: '10px', background: 'rgba(99,102,241,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem' }}>📦</div>
                          <div>
                            <div style={{ fontWeight: 700, color: '#e2e8f0', fontSize: '.9rem' }}>Order #{o._id.slice(-8).toUpperCase()}</div>
                            <div style={{ fontSize: '.73rem', color: '#64748b', marginTop: '1px' }}>{new Date(o.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                          </div>
                        </div>
                        <span style={{ fontSize: '.72rem', fontWeight: 700, padding: '4px 12px', borderRadius: '999px', background: st.bg, color: st.color, textTransform: 'uppercase', letterSpacing: '.06em' }}>
                          {st.label}
                        </span>
                      </div>

                      {/* Items */}
                      <div style={{ padding: '0 1.5rem' }}>
                        {o.items.map((item, i) => (
                          <div key={i} style={{
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            padding: '.85rem 0',
                            borderBottom: i < o.items.length - 1 ? '1px solid rgba(99,102,241,.08)' : 'none',
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem' }}>
                              <div style={{ width: 34, height: 34, borderRadius: '8px', background: 'rgba(6,182,212,.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem' }}>🔩</div>
                              <div>
                                <div style={{ fontWeight: 600, color: '#e2e8f0', fontSize: '.88rem' }}>{item.part?.name || 'Part'}</div>
                                <div style={{ fontSize: '.72rem', color: '#64748b' }}>Qty: {item.quantity}</div>
                              </div>
                            </div>
                            <span style={{ fontWeight: 700, color: '#94a3b8', fontSize: '.9rem' }}>₹{(item.price * item.quantity).toLocaleString('en-IN')}</span>
                          </div>
                        ))}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '.9rem 0', borderTop: '1px solid rgba(99,102,241,.12)' }}>
                          <span style={{ color: '#64748b', fontSize: '.85rem' }}>Order Total</span>
                          <span style={{ fontWeight: 800, fontSize: '1.1rem', color: '#06b6d4' }}>₹{o.totalAmount?.toLocaleString('en-IN')}</span>
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
    </div>
  );
}

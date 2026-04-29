import { useCallback, useEffect, useState } from 'react';
import FranchiseSidebar from '../../components/franchise/FranchiseSidebar';
import { franchisePortalAPI } from '../../api';
import { Wallet, History, ArrowUpCircle, Banknote } from 'lucide-react';

const TransactionRow = ({ item }) => {
  const isCredit = item.type === 'credit';
  const isPending = item.status === 'pending';
  const color = isCredit ? '#22c55e' : item.type === 'redeem_request' ? '#f59e0b' : '#0ea5e9';
  const Icon = isCredit ? Banknote : item.type === 'redeem_request' ? ArrowUpCircle : History;

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      background: '#0d0e2b',
      border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: 14,
      padding: 14,
      marginBottom: 10,
    }}>
      <div style={{
        width: 40,
        height: 40,
        borderRadius: 20,
        background: `${color}18`,
        border: `1px solid ${color}30`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
      }}>
        <Icon size={18} color={color} />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#e2e8f0', textTransform: 'capitalize' }}>
          {item.type.replace(/_/g, ' ')}
        </div>
        {item.note && <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{item.note}</div>}
      </div>
      <div style={{ textAlign: 'right' }}>
        <div style={{ fontSize: 16, fontWeight: 800, color }}>
          {isCredit ? '+' : '-'}{item.amount.toLocaleString('en-IN')}
        </div>
        <div style={{
          fontSize: 10,
          fontWeight: 800,
          textTransform: 'uppercase',
          color: isPending ? '#f59e0b' : '#64748b',
          marginTop: 2,
        }}>
          {item.status}
        </div>
        <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>
          {new Date(item.createdAt).toLocaleDateString()}
        </div>
      </div>
    </div>
  );
};

export default function FranchiseWalletPage() {
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const [redeemAmount, setRedeemAmount] = useState('');
  const [redeemNote, setRedeemNote] = useState('');
  const [redeemSaving, setRedeemSaving] = useState(false);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const res = await franchisePortalAPI.getWallet();
      setWallet(res.data.wallet);
    } catch {
      setError('Failed to load wallet data.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const onRefresh = () => { setRefreshing(true); load(true); };

  const transactions = (wallet?.transactions || []).slice().reverse();
  const pendingRequestsTotal = (wallet?.transactions || [])
    .filter(t => t.type === 'redeem_request' && t.status === 'pending')
    .reduce((sum, t) => sum + t.amount, 0);

  const actualAvailable = (wallet?.pendingBalance || 0) - pendingRequestsTotal;
  const hasPendingRedeem = transactions.some(t => t.type === 'redeem_request' && t.status === 'pending');

  const handleRedeem = async () => {
    const amt = Number(redeemAmount);
    if (!amt || amt <= 0) {
      alert('Enter a valid amount');
      return;
    }

    if (amt > actualAvailable) {
      alert('Amount exceeds actual available balance after accounting for pending requests.');
      return;
    }

    setRedeemSaving(true);
    try {
      const res = await franchisePortalAPI.requestRedeem({ amount: amt, note: redeemNote });
      setWallet(res.data.wallet);
      setRedeemAmount('');
      setRedeemNote('');
      alert('Redemption request submitted successfully.');
    } catch (err) {
      alert(err.response?.data?.message || 'Unable to submit request.');
    } finally {
      setRedeemSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ background: '#06071a', color: '#e2e8f0', minHeight: '100vh', display: 'flex' }}>
        <FranchiseSidebar />
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: 40, height: 40, border: '4px solid rgba(0,229,255,.2)', borderTopColor: '#00e5ff', borderRadius: '50%', animation: 'spin .8s linear infinite' }} />
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: '#06071a', color: '#e2e8f0', minHeight: '100vh', display: 'flex' }}>
      <FranchiseSidebar />
      <div style={{ flex: 1, padding: '1.5rem 2rem' }}>
        {/* Header */}
        <div style={{ marginBottom: '1.75rem' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#e2e8f0', margin: 0 }}>Wallet</h1>
        </div>

        {/* Balance Grid */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
          <div style={{
            flex: 1,
            background: '#0d0e2b',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 14,
            borderLeftWidth: 4,
            borderLeftColor: '#22c55e',
            padding: 16,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <Banknote size={16} color="#22c55e" />
              <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5 }}>Available</div>
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#22c55e' }}>₹{actualAvailable.toLocaleString('en-IN')}</div>
            {pendingRequestsTotal > 0 && (
              <div style={{ fontSize: 10, color: '#64748b', marginTop: 4 }}>
                (₹{pendingRequestsTotal.toLocaleString('en-IN')} pending)
              </div>
            )}
          </div>
          <div style={{
            flex: 1,
            background: '#0d0e2b',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 14,
            borderLeftWidth: 4,
            borderLeftColor: '#0ea5e9',
            padding: 16,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <History size={16} color="#0ea5e9" />
              <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5 }}>Redeemed</div>
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#0ea5e9' }}>₹{(wallet?.balance || 0).toLocaleString('en-IN')}</div>
          </div>
        </div>

        {/* Redeem Section */}
        <div style={{ marginBottom: 24 }}>
          <div style={{
            background: '#0d0e2b',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 16,
            padding: 18,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <ArrowUpCircle size={20} color="#00e5ff" />
              <div style={{ fontSize: 16, fontWeight: 800, color: '#e2e8f0' }}>Request Redemption</div>
            </div>

            {hasPendingRedeem && (
              <div style={{
                background: 'rgba(245,158,11,0.1)',
                borderRadius: 10,
                padding: 12,
                marginBottom: 16,
                border: '1px solid rgba(245,158,11,0.2)',
              }}>
                <div style={{ color: '#f59e0b', fontSize: 12, fontWeight: 600, textAlign: 'center' }}>
                  ⏳ You have a pending request awaiting admin approval.
                </div>
              </div>
            )}

            <div style={{ gap: 12, display: 'flex', flexDirection: 'column' }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#64748b', marginBottom: 2 }}>Amount (₹) *</div>
                <input
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 10,
                    padding: 12,
                    color: '#e2e8f0',
                    fontSize: 14,
                    width: '100%',
                    outline: 'none',
                  }}
                  placeholder="Enter amount"
                  type="number"
                  value={redeemAmount}
                  onChange={(e) => setRedeemAmount(e.target.value)}
                  disabled={hasPendingRedeem}
                />
              </div>

              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#64748b', marginBottom: 2 }}>Note (optional)</div>
                <input
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 10,
                    padding: 12,
                    color: '#e2e8f0',
                    fontSize: 14,
                    width: '100%',
                    outline: 'none',
                  }}
                  placeholder="e.g. Monthly payout request"
                  value={redeemNote}
                  onChange={(e) => setRedeemNote(e.target.value)}
                  disabled={hasPendingRedeem}
                  maxLength={120}
                />
              </div>

              <button
                style={{
                  background: '#00e5ff',
                  borderRadius: 12,
                  paddingVertical: 14,
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: 'none',
                  cursor: 'pointer',
                  opacity: redeemSaving || hasPendingRedeem || actualAvailable <= 0 || !redeemAmount ? 0.4 : 1,
                  color: '#000',
                  fontWeight: 800,
                  fontSize: 15,
                }}
                onClick={handleRedeem}
                disabled={redeemSaving || hasPendingRedeem || actualAvailable <= 0 || !redeemAmount}
              >
                {redeemSaving ? 'Submitting...' : 'Request Redemption'}
              </button>
            </div>
          </div>
        </div>

        {/* History Header */}
        <div style={{ marginBottom: 8 }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: '#e2e8f0' }}>Transaction History</div>
        </div>

        {/* Transactions */}
        <div style={{ paddingBottom: 40 }}>
          {transactions.length === 0 ? (
            <div style={{ alignItems: 'center', paddingTop: 60, opacity: 0.6, textAlign: 'center' }}>
              <History size={48} color="#374151" />
              <div style={{ color: '#64748b', fontSize: 15, fontWeight: 600, marginTop: 12 }}>No transactions yet</div>
            </div>
          ) : (
            transactions.map((item, idx) => <TransactionRow key={item._id || idx} item={item} />)
          )}
        </div>
      </div>
    </div>
  );
}
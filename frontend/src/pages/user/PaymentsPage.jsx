import { useEffect, useState } from 'react';
import UserSidebar from '../../components/user/UserSidebar';
import UserPageHeader from '../../components/user/UserPageHeader';
import Spinner from '../../components/common/Spinner';
import { StatusBadge } from '../../components/common/UI';
import { paymentAPI } from '../../api';

export default function PaymentsPage() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    paymentAPI.list().then((r) => setPayments(r.data.payments)).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="layout user-dark"><UserSidebar /><div className="main-content"><Spinner /></div></div>;

  const totalPaid = payments.filter((p) => p.status === 'success').reduce((s, p) => s + p.amount, 0);

  return (
    <div className="layout user-dark">
      <UserSidebar />
      <div className="main-content">
        <UserPageHeader title="Payment History" subtitle="Track all your service and plan payments" />

        <div className="grid grid-3 mb-4">
          <div className="stat-card">
            <div className="stat-value">₹{totalPaid.toLocaleString()}</div>
            <div className="stat-label">Total Paid</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{payments.filter((p) => p.status === 'success').length}</div>
            <div className="stat-label">Successful</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{payments.filter((p) => p.status === 'refunded').length}</div>
            <div className="stat-label">Refunded</div>
          </div>
        </div>

        <div className="card">
          <div className="card-header"><h3>Transactions</h3></div>
          <div className="card-body" style={{ padding: 0 }}>
            {payments.length === 0 ? (
              <p className="text-muted" style={{ padding: '2rem', textAlign: 'center' }}>No payments yet</p>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>For</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>Order ID</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((p) => (
                      <tr key={p._id}>
                        <td>{new Date(p.createdAt).toLocaleDateString()}</td>
                        <td style={{ textTransform: 'capitalize' }}>{p.paymentFor?.replace(/_/g, ' ')}</td>
                        <td style={{ fontWeight: 600 }}>₹{p.amount}</td>
                        <td><StatusBadge status={p.status} /></td>
                        <td style={{ fontSize: '.8rem', color: 'var(--text-muted)' }}>
                          {p.razorpayPaymentId || p.orderId || p.invoiceNumber || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

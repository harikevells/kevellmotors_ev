import { useEffect, useState } from 'react';
import UserSidebar from '../../components/user/UserSidebar';
import UserPageHeader from '../../components/user/UserPageHeader';
import Spinner from '../../components/common/Spinner';
import { referralAPI } from '../../api';

export default function ReferralsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    referralAPI.getMyReferral().then((r) => setData(r.data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  const copyCode = () => {
    navigator.clipboard.writeText(data.referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareLink = `${window.location.origin}/register?ref=${data?.referralCode}`;

  if (loading) return <div className="layout user-dark"><UserSidebar /><div className="main-content"><Spinner /></div></div>;

  return (
    <div className="layout user-dark">
      <UserSidebar />
      <div className="main-content">
        <UserPageHeader title="Referral Program" subtitle="Share your code and track your referrals" />

        <div className="grid grid-2 mb-4">
          <div className="card">
            <div className="card-body" style={{ textAlign: 'center', padding: '2rem' }}>
              <div style={{ fontSize: '3rem', marginBottom: '.5rem' }}>🎁</div>
              <h3>Your Referral Code</h3>
              <div style={{ fontSize: '2rem', fontWeight: 700, letterSpacing: '4px', color: 'var(--primary)', margin: '1rem 0', padding: '1rem', background: 'var(--primary-light)', borderRadius: 'var(--radius)' }}>
                {data?.referralCode}
              </div>
              <button className="btn btn-primary" onClick={copyCode}>{copied ? '✓ Copied!' : '📋 Copy Code'}</button>
            </div>
          </div>
          <div className="card">
            <div className="card-body" style={{ padding: '2rem' }}>
              <h3 style={{ marginBottom: '1rem' }}>Share & Earn</h3>
              <p className="text-muted" style={{ fontSize: '.875rem', marginBottom: '1.5rem' }}>
                Share your referral link with friends. When they register and book their first service, you&apos;ll earn rewards!
              </p>
              <div className="form-group">
                <label className="form-label">Your Referral Link</label>
                <div style={{ display: 'flex', gap: '.5rem' }}>
                  <input className="form-control" value={shareLink} readOnly />
                  <button className="btn btn-outline btn-sm" onClick={() => { navigator.clipboard.writeText(shareLink); setCopied(true); setTimeout(() => setCopied(false), 2000); }}>
                    Copy
                  </button>
                </div>
              </div>
              <div className="stat-card" style={{ textAlign: 'center' }}>
                <div className="stat-value">{data?.referralCount || 0}</div>
                <div className="stat-label">Total Referrals</div>
              </div>
            </div>
          </div>
        </div>

        {data?.referred?.length > 0 && (
          <div className="card">
            <div className="card-header"><h3>People You Referred</h3></div>
            <div className="card-body" style={{ padding: 0 }}>
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {data.referred.map((u) => (
                    <tr key={u._id}>
                      <td>{u.name}</td>
                      <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

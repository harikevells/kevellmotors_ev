import { useEffect, useState } from 'react';
import UserSidebar from '../../components/user/UserSidebar';
import UserPageHeader from '../../components/user/UserPageHeader';
import Spinner from '../../components/common/Spinner';
import { vehicleAPI } from '../../api';

export default function DocumentsPage() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState('');
  const [docName, setDocName] = useState('');
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const load = () => vehicleAPI.list().then((r) => setVehicles(r.data.vehicles)).catch(console.error).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selected || !file) return;
    setUploading(true);
    setError(''); setSuccess('');
    try {
      const fd = new FormData();
      fd.append('document', file);
      fd.append('name', docName || file.name);
      await vehicleAPI.uploadDocument(selected, fd);
      setSuccess('Document uploaded successfully!');
      setFile(null); setDocName('');
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  if (loading) return <div className="layout user-dark"><UserSidebar /><div className="main-content"><Spinner /></div></div>;

  const currentVehicle = vehicles.find((v) => v._id === selected);

  return (
    <div className="layout user-dark">
      <UserSidebar />
      <div className="main-content">
        <UserPageHeader title="Document Vault 📄" subtitle="Upload and manage vehicle documents" />

        <div className="card mb-4">
          <div className="card-header"><h3>Upload Document</h3></div>
          <div className="card-body">
            {success && <div className="alert alert-success">{success}</div>}
            {error && <div className="alert alert-danger">{error}</div>}
            <form onSubmit={handleUpload}>
              <div className="grid grid-3">
                <div className="form-group">
                  <label className="form-label">Vehicle</label>
                  <select className="form-select" value={selected} onChange={(e) => setSelected(e.target.value)} required>
                    <option value="">Select vehicle</option>
                    {vehicles.map((v) => <option key={v._id} value={v._id}>{v.make} {v.model} — {v.registrationNumber}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Document Name</label>
                  <input className="form-control" value={docName} onChange={(e) => setDocName(e.target.value)} placeholder="Insurance, RC, etc." />
                </div>
                <div className="form-group">
                  <label className="form-label">File (PDF/Image) *</label>
                  <input type="file" className="form-control" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => setFile(e.target.files[0])} required />
                </div>
              </div>
              <button type="submit" className="btn btn-primary" disabled={uploading}>{uploading ? 'Uploading...' : 'Upload Document'}</button>
            </form>
          </div>
        </div>

        {vehicles.map((v) => (
          <div key={v._id} className="card mb-3">
            <div className="card-header">
              <h3>{v.make} {v.model} — {v.registrationNumber}</h3>
              <span className="text-muted" style={{ fontSize: '.875rem' }}>{v.documents?.length || 0} documents</span>
            </div>
            <div className="card-body">
              {(!v.documents || v.documents.length === 0) ? (
                <p className="text-muted">No documents uploaded for this vehicle.</p>
              ) : (
                <div className="grid grid-4">
                  {v.documents.map((doc, i) => (
                    <a key={i} href={doc.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                      <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '1rem', textAlign: 'center', cursor: 'pointer', transition: 'all .15s' }}
                        onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--primary)'}
                        onMouseOut={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
                      >
                        <div style={{ fontSize: '2rem', marginBottom: '.5rem' }}>📄</div>
                        <p style={{ fontSize: '.8rem', fontWeight: 500, color: 'var(--text)' }}>{doc.name}</p>
                        <p style={{ fontSize: '.7rem', color: 'var(--text-muted)' }}>{doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleDateString() : ''}</p>
                      </div>
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

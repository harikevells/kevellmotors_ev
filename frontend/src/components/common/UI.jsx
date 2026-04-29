export function StatusBadge({ status }) {
  const map = {
    onboarded: 'info',
    diagnosis: 'warning',
    in_progress: 'warning',
    waiting_parts: 'warning',
    quality_check: 'info',
    delivered: 'success',
    active: 'success',
    expired: 'secondary',
    cancelled: 'danger',
    pending: 'warning',
    success: 'success',
    failed: 'danger',
    refunded: 'secondary',
    confirmed: 'success',
    shipped: 'info',
    suspended: 'danger',
  };
  const variant = map[status] || 'secondary';
  return <span className={`badge badge-${variant}`}>{status?.replace(/_/g, ' ')}</span>;
}

export function StarRating({ value, onChange, readonly = false }) {
  return (
    <div className="stars">
      {[1, 2, 3, 4, 5].map((s) => (
        <span
          key={s}
          className={`star ${s <= value ? 'filled' : ''}`}
          onClick={() => !readonly && onChange && onChange(s)}
        >
          ★
        </span>
      ))}
    </div>
  );
}

export function ServiceProgressBar({ status }) {
  const steps = [
    { key: 'onboarded', label: 'Onboarded' },
    { key: 'diagnosis', label: 'Diagnosis' },
    { key: 'in_progress', label: 'In Progress' },
    { key: 'waiting_parts', label: 'Parts Wait' },
    { key: 'quality_check', label: 'QC' },
    { key: 'delivered', label: 'Delivered' },
  ];
  const currentIdx = steps.findIndex((s) => s.key === status);

  return (
    <div className="progress-steps">
      {steps.map((step, idx) => (
        <div key={step.key} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
          <div className="progress-step" style={{ flex: 'none' }}>
            <div className={`step-dot ${idx < currentIdx ? 'completed' : idx === currentIdx ? 'active' : ''}`}>
              {idx < currentIdx ? '✓' : idx + 1}
            </div>
            <span className="step-label">{step.label}</span>
          </div>
          {idx < steps.length - 1 && (
            <div className={`step-line ${idx < currentIdx ? 'completed' : ''}`} />
          )}
        </div>
      ))}
    </div>
  );
}

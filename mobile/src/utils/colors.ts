export const Colors = {
  // Backgrounds
  bg: '#06071a',
  bgCard: '#0d0e2b',
  bgInput: 'rgba(255,255,255,0.05)',

  // Text
  textPrimary: '#e2e8f0',
  textSecondary: '#9ca3af',
  textMuted: '#6b7280',

  // Accent
  cyan: '#00e5ff',
  blue: '#1a6ef7',
  purple: '#7c3aed',

  // Status
  green: '#22c55e',
  yellow: '#f59e0b',
  orange: '#ff9100',
  red: '#ef4444',
  violet: '#a855f7',

  // Borders
  border: 'rgba(255,255,255,0.06)',
  borderLight: 'rgba(255,255,255,0.1)',

  // Status colors map
  statusColors: {
    onboarded: '#1a6ef7',
    diagnosis: '#00e5ff',
    in_progress: '#f59e0b',
    waiting_parts: '#ff9100',
    quality_check: '#a855f7',
    delivered: '#22c55e',
    cancelled: '#ef4444',
  } as Record<string, string>,

  // Status labels map
  statusLabels: {
    onboarded: 'New',
    diagnosis: 'Accepted',
    in_progress: 'In Service',
    waiting_parts: 'Waiting Parts',
    quality_check: 'QC Check',
    delivered: 'Completed',
    cancelled: 'Cancelled',
  } as Record<string, string>,
};

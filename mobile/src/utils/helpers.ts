/**
 * Formats a number as Indian rupees: ₹1,23,456
 */
export const formatINR = (amount: number | undefined | null): string => {
  if (amount == null) return '—';
  return `₹${amount.toLocaleString('en-IN')}`;
};

/**
 * Formats an ISO date string to a localised date in India
 */
export const formatDate = (iso: string | undefined | null): string => {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN');
};

/**
 * Returns uppercase last-6 chars of a MongoDB ObjectId for display
 */
export const shortId = (id: string): string => id.slice(-6).toUpperCase();

/**
 * Returns initials (first char) of a name, uppercased
 */
export const initials = (name: string | undefined | null, fallback = '?'): string =>
  name?.[0]?.toUpperCase() ?? fallback;

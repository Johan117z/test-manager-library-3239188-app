// Loan status is computed by the API: open, overdue or closed (CA-08.3).
const LABELS = { open: 'Open', overdue: 'Overdue', closed: 'Closed' };

export default function StatusBadge({ status }) {
  return <span className={`badge status-${status}`}>{LABELS[status] || status}</span>;
}

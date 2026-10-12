import {
  CheckCircle2,
  Clock,
  Lock,
  XCircle,
  Archive,
  AlertCircle,
} from 'lucide-react';

const STATUS_TONE_MAP = {
  active: { tone: 'success', label: 'Active', Icon: CheckCircle2 },
  approved: { tone: 'success', label: 'Approved', Icon: CheckCircle2 },
  completed: { tone: 'success', label: 'Completed', Icon: CheckCircle2 },
  sold: { tone: 'success', label: 'Sold / Completed', Icon: CheckCircle2 },
  resolved: { tone: 'success', label: 'Resolved', Icon: CheckCircle2 },
  accepted: { tone: 'info', label: 'Accepted', Icon: Lock },
  in_review: { tone: 'info', label: 'In Review', Icon: Clock },
  pending: { tone: 'warning', label: 'Pending Review', Icon: Clock },
  pending_review: { tone: 'warning', label: 'Pending Review', Icon: Clock },
  pending_exchange: { tone: 'warning', label: 'Pending Exchange', Icon: Clock },
  pending_email_verification: { tone: 'warning', label: 'Pending Verification', Icon: Clock },
  requested: { tone: 'warning', label: 'Requested', Icon: Clock },
  reserved: { tone: 'warning', label: 'Reserved', Icon: Lock },
  open: { tone: 'warning', label: 'Open', Icon: AlertCircle },
  rejected: { tone: 'danger', label: 'Rejected', Icon: XCircle },
  blocked: { tone: 'danger', label: 'Blocked', Icon: XCircle },
  removed: { tone: 'danger', label: 'Removed', Icon: XCircle },
  taken_down: { tone: 'danger', label: 'Taken Down', Icon: XCircle },
  declined: { tone: 'danger', label: 'Declined', Icon: XCircle },
  disputed: { tone: 'danger', label: 'Disputed', Icon: AlertCircle },
  cancelled: { tone: 'neutral', label: 'Cancelled', Icon: Archive },
  expired: { tone: 'neutral', label: 'Expired', Icon: Archive },
  archived: { tone: 'neutral', label: 'Archived', Icon: Archive },
  draft: { tone: 'neutral', label: 'Draft', Icon: Clock },
  dismissed: { tone: 'neutral', label: 'Dismissed', Icon: Archive },
};

export function StatusBadge({ status, label }) {
  const key = String(status || '').toLowerCase();
  const entry = STATUS_TONE_MAP[key] || {
    tone: 'neutral',
    label: status || 'Unknown',
    Icon: AlertCircle,
  };
  const IconComp = entry.Icon || AlertCircle;
  return (
    <span className={`ce-badge ce-badge-${entry.tone}`}>
      <IconComp size={12} aria-hidden="true" />
      <span>{label || entry.label}</span>
    </span>
  );
}

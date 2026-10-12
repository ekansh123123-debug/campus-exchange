import { useState } from 'react';
import { Flag, X } from 'lucide-react';
import { apiRequest } from '../lib/api-client.js';
import { REPORT_REASON_CODES } from '../lib/constants.js';
import { useToast } from './ToastContext.jsx';

export function ReportModal({ targetType, targetCode, targetTitle, onClose }) {
  const { showToast } = useToast();
  const [reason, setReason] = useState(REPORT_REASON_CODES[0].value);
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (details.trim().length < 5) {
      setError('Please provide brief details explaining the policy issue.');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await apiRequest('/reports', {
        method: 'POST',
        body: {
          targetType: String(targetType || 'listing').toLowerCase(),
          targetCode,
          reason,
          details: details.trim(),
        },
      });
      showToast({
        tone: 'success',
        title: 'Report submitted',
        description: 'Campus moderators have received your report for review.',
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to submit report');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="ce-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="report-modal-title">
      <div className="ce-modal">
        <div className="ce-row-between" style={{ marginBottom: '1rem' }}>
          <div className="ce-row" style={{ gap: '0.5rem' }}>
            <Flag size={18} color="var(--ce-danger)" />
            <h3 id="report-modal-title" className="ce-card-title">
              Report {targetType} ({targetCode})
            </h3>
          </div>
          <button type="button" className="ce-btn ce-btn-ghost ce-btn-sm" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        {targetTitle && (
          <p className="ce-muted" style={{ fontSize: '0.88rem', marginBottom: '1rem' }}>
            Subject: <strong>{targetTitle}</strong>
          </p>
        )}

        {error && (
          <div className="ce-alert ce-alert-danger" style={{ marginBottom: '1rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="ce-stack">
          <div className="ce-field">
            <label className="ce-label" htmlFor="report-reason">
              Reason Category
            </label>
            <select
              id="report-reason"
              className="ce-select"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            >
              {REPORT_REASON_CODES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          <div className="ce-field">
            <label className="ce-label" htmlFor="report-description">
              Evidence & Context
            </label>
            <textarea
              id="report-description"
              className="ce-textarea"
              placeholder="Describe why this item, resource, or user violates campus policy..."
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              required
            />
          </div>

          <div className="ce-row" style={{ justifyContent: 'flex-end', marginTop: '0.5rem' }}>
            <button type="button" className="ce-btn ce-btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="ce-btn ce-btn-danger" disabled={submitting}>
              {submitting ? 'Submitting...' : 'Submit Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

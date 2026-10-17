import { AlertTriangle, Inbox } from 'lucide-react';
import { LoadingSpinner } from './LoadingSpinner.jsx';

export { LoadingSpinner };

export function LoadingState({
  label = 'Loading campus data...',
  rows = 3,
  showColdStartHint = true,
  className = '',
}) {
  return (
    <div className={`ce-stack ${className}`} role="status" aria-live="polite">
      <div
        className="ce-loading-state-header"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.65rem',
          padding: '0.45rem 0.25rem',
        }}
      >
        <LoadingSpinner
          size="sm"
          color="var(--ce-primary, #cc785c)"
          showColdStartHint={showColdStartHint}
        />
        <div className="ce-muted" style={{ fontSize: '0.875rem', fontWeight: 500 }}>
          {label}
        </div>
      </div>
      <div className="ce-grid-cards">
        {Array.from({ length: rows }).map((_, idx) => (
          <div key={idx} className="ce-card ce-stack" style={{ gap: '0.75rem' }}>
            <div className="ce-skeleton" style={{ height: '140px', width: '100%' }} />
            <div className="ce-skeleton" style={{ height: '20px', width: '75%' }} />
            <div className="ce-skeleton" style={{ height: '16px', width: '50%' }} />
          </div>
        ))}
      </div>
    </div>
  );
}

export function EmptyState({ title = 'Nothing found here yet', description, action }) {
  return (
    <div className="ce-empty-state">
      <div
        style={{
          display: 'inline-flex',
          padding: '0.75rem',
          borderRadius: '999px',
          background: 'var(--ce-bg-elevated)',
          marginBottom: '0.75rem',
          color: 'var(--ce-accent)',
        }}
      >
        <Inbox size={24} />
      </div>
      <h3 className="ce-card-title" style={{ marginBottom: '0.35rem' }}>
        {title}
      </h3>
      {description && (
        <p className="ce-muted" style={{ maxWidth: '48ch', margin: '0 auto 1rem', fontSize: '0.92rem' }}>
          {description}
        </p>
      )}
      {action && <div style={{ marginTop: '0.75rem' }}>{action}</div>}
    </div>
  );
}

export function ErrorState({ title = 'Unable to load section', error, onRetry }) {
  return (
    <div className="ce-alert ce-alert-danger" role="alert" style={{ padding: '1.25rem' }}>
      <div className="ce-row-between" style={{ flexWrap: 'wrap', gap: '0.75rem' }}>
        <div className="ce-row" style={{ gap: '0.65rem' }}>
          <AlertTriangle size={20} />
          <div>
            <div style={{ fontWeight: 600 }}>{title}</div>
            <div style={{ fontSize: '0.85rem', opacity: 0.9 }}>
              {error?.message || 'An unexpected error occurred while communicating with the server.'}
            </div>
          </div>
        </div>
        {onRetry && (
          <button type="button" className="ce-btn ce-btn-secondary ce-btn-sm" onClick={onRetry}>
            Try Again
          </button>
        )}
      </div>
    </div>
  );
}

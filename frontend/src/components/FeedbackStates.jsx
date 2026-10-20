import { AlertTriangle, Inbox } from 'lucide-react';
import { LoadingSpinner } from './LoadingSpinner.jsx';

export { LoadingSpinner };

export function Skeleton({
  width = '100%',
  height = '1rem',
  radius = 'var(--radius-sm)',
  className = '',
  style = {},
  ...rest
}) {
  return (
    <div
      className={`ce-skeleton ${className}`}
      style={{
        width,
        height,
        borderRadius: radius,
        ...style,
      }}
      aria-hidden="true"
      {...rest}
    />
  );
}

export function ListingCardSkeleton() {
  return (
    <div
      className="ce-card ce-stack"
      style={{
        justifyContent: 'space-between',
        height: '100%',
        gap: '0.75rem',
      }}
      role="status"
      aria-label="Loading listing..."
    >
      <div className="ce-stack" style={{ gap: '0.65rem' }}>
        <div className="ce-row-between">
          <Skeleton width="64px" height="20px" radius="var(--radius-pill)" />
          <Skeleton width="52px" height="20px" radius="var(--radius-pill)" />
        </div>
        <Skeleton height="150px" width="100%" radius="var(--radius-md)" />
        <Skeleton height="20px" width="85%" />
        <Skeleton height="14px" width="55%" />
      </div>
      <div
        className="ce-row-between"
        style={{
          paddingTop: '0.65rem',
          borderTop: '1px solid var(--ce-border)',
          marginTop: '0.25rem',
        }}
      >
        <Skeleton height="22px" width="70px" />
        <Skeleton height="20px" width="56px" radius="var(--radius-pill)" />
      </div>
    </div>
  );
}

export function ResourceCardSkeleton() {
  return (
    <div
      className="ce-card ce-stack"
      style={{
        justifyContent: 'space-between',
        height: '100%',
        gap: '0.75rem',
      }}
      role="status"
      aria-label="Loading study resource..."
    >
      <div className="ce-stack" style={{ gap: '0.65rem' }}>
        <div className="ce-row-between">
          <Skeleton width="58px" height="20px" radius="var(--radius-pill)" />
          <Skeleton width="68px" height="20px" radius="var(--radius-pill)" />
        </div>
        <Skeleton height="20px" width="80%" />
        <Skeleton height="14px" width="60%" />
      </div>
      <div className="ce-row-between" style={{ marginTop: '0.65rem' }}>
        <Skeleton height="14px" width="72px" />
        <Skeleton height="26px" width="82px" radius="var(--radius-sm)" />
      </div>
    </div>
  );
}

export function ListRowSkeleton({ count = 3 }) {
  return (
    <div className="ce-stack" style={{ gap: '0.65rem' }}>
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className="ce-card ce-row-between"
          style={{
            padding: '0.85rem 1rem',
            gap: '1rem',
            alignItems: 'center',
            flexWrap: 'wrap',
          }}
          role="status"
          aria-label="Loading item..."
        >
          <div className="ce-stack" style={{ gap: '0.4rem', flex: 1, minWidth: '220px' }}>
            <div className="ce-row" style={{ gap: '0.5rem' }}>
              <Skeleton width="80px" height="20px" radius="var(--radius-pill)" />
              <Skeleton width="160px" height="18px" />
            </div>
            <Skeleton width="60%" height="13px" />
          </div>
          <div className="ce-row" style={{ gap: '0.5rem' }}>
            <Skeleton width="70px" height="24px" radius="var(--radius-pill)" />
            <Skeleton width="80px" height="28px" radius="var(--radius-sm)" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ListingDetailSkeleton() {
  return (
    <div className="ce-stack-lg" role="status" aria-label="Loading listing details...">
      <div className="ce-row-between">
        <Skeleton width="120px" height="32px" radius="var(--radius-sm)" />
        <Skeleton width="80px" height="24px" radius="var(--radius-pill)" />
      </div>
      <div className="ce-grid-2" style={{ gap: '2rem' }}>
        <div className="ce-stack" style={{ gap: '0.75rem' }}>
          <Skeleton height="360px" width="100%" radius="var(--radius-lg)" />
          <div className="ce-row" style={{ gap: '0.5rem' }}>
            <Skeleton width="72px" height="72px" radius="var(--radius-md)" />
            <Skeleton width="72px" height="72px" radius="var(--radius-md)" />
            <Skeleton width="72px" height="72px" radius="var(--radius-md)" />
          </div>
        </div>
        <div className="ce-card ce-stack" style={{ gap: '1.25rem' }}>
          <div className="ce-stack" style={{ gap: '0.5rem' }}>
            <div className="ce-row" style={{ gap: '0.5rem' }}>
              <Skeleton width="70px" height="22px" radius="var(--radius-pill)" />
              <Skeleton width="80px" height="22px" radius="var(--radius-pill)" />
            </div>
            <Skeleton height="28px" width="85%" />
            <Skeleton height="16px" width="45%" />
          </div>
          <Skeleton height="36px" width="120px" />
          <div className="ce-stack" style={{ gap: '0.5rem' }}>
            <Skeleton height="14px" width="100%" />
            <Skeleton height="14px" width="95%" />
            <Skeleton height="14px" width="70%" />
          </div>
          <div className="ce-card" style={{ padding: '0.85rem' }}>
            <div className="ce-row" style={{ gap: '0.75rem' }}>
              <Skeleton width="42px" height="42px" radius="50%" />
              <div className="ce-stack" style={{ gap: '0.35rem', flex: 1 }}>
                <Skeleton width="120px" height="16px" />
                <Skeleton width="90px" height="12px" />
              </div>
            </div>
          </div>
          <div className="ce-row" style={{ gap: '0.75rem' }}>
            <Skeleton height="42px" width="140px" radius="var(--radius-md)" />
            <Skeleton height="42px" width="140px" radius="var(--radius-md)" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function MessageBubbleSkeleton() {
  return (
    <div className="ce-stack" style={{ gap: '0.85rem', padding: '0.75rem 0' }}>
      <div style={{ alignSelf: 'flex-start', maxWidth: '75%' }}>
        <Skeleton width="70px" height="12px" style={{ marginBottom: '0.3rem' }} />
        <Skeleton width="220px" height="42px" radius="var(--radius-md)" />
      </div>
      <div style={{ alignSelf: 'flex-end', maxWidth: '75%' }}>
        <Skeleton width="60px" height="12px" style={{ marginBottom: '0.3rem', marginLeft: 'auto' }} />
        <Skeleton width="260px" height="52px" radius="var(--radius-md)" />
      </div>
      <div style={{ alignSelf: 'flex-start', maxWidth: '75%' }}>
        <Skeleton width="75px" height="12px" style={{ marginBottom: '0.3rem' }} />
        <Skeleton width="190px" height="38px" radius="var(--radius-md)" />
      </div>
    </div>
  );
}

export function KpiCardSkeleton() {
  return (
    <div className="ce-kpi-card" role="status" aria-label="Loading metric...">
      <div className="ce-row-between">
        <Skeleton width="75px" height="14px" />
        <Skeleton width="18px" height="18px" radius="4px" />
      </div>
      <div style={{ margin: '0.4rem 0' }}>
        <Skeleton width="60px" height="30px" />
      </div>
      <Skeleton width="110px" height="12px" />
    </div>
  );
}

export function LoadingState({
  label = 'Loading campus data...',
  rows = 3,
  variant = 'cards',
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

      {variant === 'detail' ? (
        <ListingDetailSkeleton />
      ) : variant === 'resources' ? (
        <div className="ce-grid-cards">
          {Array.from({ length: rows }).map((_, idx) => (
            <ResourceCardSkeleton key={idx} />
          ))}
        </div>
      ) : variant === 'rows' ? (
        <ListRowSkeleton count={rows} />
      ) : variant === 'table' ? (
        <div className="ce-table-wrap">
          <div className="ce-stack" style={{ gap: '0.5rem', padding: '0.75rem' }}>
            <div className="ce-row" style={{ gap: '0.75rem' }}>
              <Skeleton width="15%" height="20px" />
              <Skeleton width="25%" height="20px" />
              <Skeleton width="30%" height="20px" />
              <Skeleton width="15%" height="20px" />
              <Skeleton width="15%" height="20px" />
            </div>
            {Array.from({ length: rows }).map((_, idx) => (
              <div
                key={idx}
                className="ce-row"
                style={{
                  gap: '0.75rem',
                  padding: '0.5rem 0',
                  borderTop: '1px solid var(--ce-border)',
                }}
              >
                <Skeleton width="15%" height="16px" />
                <Skeleton width="25%" height="16px" />
                <Skeleton width="30%" height="16px" />
                <Skeleton width="15%" height="16px" />
                <Skeleton width="15%" height="16px" />
              </div>
            ))}
          </div>
        </div>
      ) : variant === 'detailed-cards' ? (
        <div className="ce-grid-cards">
          {Array.from({ length: rows }).map((_, idx) => (
            <ListingCardSkeleton key={idx} />
          ))}
        </div>
      ) : (
        <div className="ce-grid-cards">
          {Array.from({ length: rows }).map((_, idx) => (
            <div key={idx} className="ce-card ce-stack" style={{ gap: '0.75rem' }}>
              <div className="ce-skeleton" style={{ height: '140px', width: '100%' }} />
              <div className="ce-skeleton" style={{ height: '20px', width: '75%' }} />
              <div className="ce-skeleton" style={{ height: '16px', width: '50%' }} />
            </div>
          ))}
        </div>
      )}
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

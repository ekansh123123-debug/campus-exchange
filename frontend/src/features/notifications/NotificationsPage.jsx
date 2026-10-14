import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Bell, CheckCheck, ArrowRight } from 'lucide-react';
import { apiRequest } from '../../lib/api-client.js';
import { extractList, formatDateTime } from '../../lib/formatters.js';
import { CodeBadge } from '../../components/CodeBadge.jsx';
import { LoadingState, EmptyState, ErrorState } from '../../components/FeedbackStates.jsx';
import { useToast } from '../../components/ToastContext.jsx';
import { usePageTitle } from '../../lib/usePageTitle.js';

export function NotificationsPage() {
  usePageTitle(
    'Campus Notifications',
    'Stay updated on item reservations, handover statuses, and moderation outcomes.'
  );
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const {
    data: res,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => apiRequest('/notifications', { params: { limit: 40 } }),
  });

  const items = extractList(res);

  const handleMarkRead = async (notificationCode) => {
    try {
      await apiRequest(`/notifications/${notificationCode}/read`, { method: 'PATCH' });
      refetch();
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
    } catch (err) {
      showToast({ tone: 'danger', title: 'Update failed', description: err.message });
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await apiRequest('/notifications/read-all', { method: 'PATCH' });
      showToast({ tone: 'success', title: 'All notifications marked as read' });
      refetch();
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
    } catch (err) {
      showToast({ tone: 'danger', title: 'Update failed', description: err.message });
    }
  };

  return (
    <div className="ce-stack-lg">
      <div className="ce-row-between" style={{ flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <CodeBadge>IN-APP ACTIVITY STREAM</CodeBadge>
          <h1 className="ce-title-section" style={{ marginTop: '0.35rem' }}>
            Campus Alerts & Moderation Updates
          </h1>
        </div>

        {items.some((n) => !n.isRead && !n.readAt) && (
          <button
            type="button"
            className="ce-btn ce-btn-secondary ce-btn-sm"
            onClick={handleMarkAllRead}
          >
            <CheckCheck size={15} />
            <span>Mark All Read</span>
          </button>
        )}
      </div>

      {isLoading ? (
        <LoadingState rows={3} />
      ) : error ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : items.length === 0 ? (
        <EmptyState
          title="No notifications yet"
          description="Reservation requests, handover confirmations, and moderation decisions will appear here."
        />
      ) : (
        <div className="ce-stack">
          {items.map((item) => {
            const read = Boolean(item.isRead || item.readAt);
            const eventTag = item.eventType || item.type || 'update';
            const navTarget = item.linkPath || item.link;
            return (
              <div
                key={item.notificationCode}
                className="ce-card ce-row-between"
                style={{
                  borderLeft: read
                    ? '1px solid var(--ce-border)'
                    : '4px solid var(--ce-accent)',
                  background: read ? 'var(--ce-bg-surface)' : 'var(--ce-bg-elevated)',
                  flexWrap: 'wrap',
                }}
              >
                <div className="ce-stack" style={{ gap: '0.25rem' }}>
                  <div className="ce-row" style={{ gap: '0.5rem', flexWrap: 'wrap' }}>
                    <Bell size={15} color={read ? 'var(--ce-text-muted)' : 'var(--ce-accent)'} />
                    <strong>{item.title}</strong>
                    <CodeBadge>{eventTag}</CodeBadge>
                  </div>
                  <p className="ce-muted" style={{ margin: 0, fontSize: '0.88rem' }}>
                    {item.body || item.message}
                  </p>
                  <span className="ce-muted" style={{ fontSize: '0.76rem' }}>
                    {formatDateTime(item.createdAt)}
                  </span>
                </div>

                <div className="ce-row" style={{ gap: '0.45rem' }}>
                  {navTarget && (
                    <Link to={navTarget} className="ce-btn ce-btn-secondary ce-btn-sm">
                      <span>Open</span>
                      <ArrowRight size={13} />
                    </Link>
                  )}
                  {!read && (
                    <button
                      type="button"
                      className="ce-btn ce-btn-ghost ce-btn-sm"
                      onClick={() => handleMarkRead(item.notificationCode)}
                    >
                      Mark Read
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

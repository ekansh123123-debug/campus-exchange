import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Trash2, ShoppingBag } from 'lucide-react';
import { apiRequest } from '../../lib/api-client.js';
import { extractList, formatPrice, formatCondition } from '../../lib/formatters.js';
import { StatusBadge } from '../../components/StatusBadge.jsx';
import { CodeBadge } from '../../components/CodeBadge.jsx';
import { LoadingState, EmptyState, ErrorState } from '../../components/FeedbackStates.jsx';
import { useToast } from '../../components/ToastContext.jsx';
import { usePageTitle } from '../../lib/usePageTitle.js';

export function WishlistPage() {
  usePageTitle(
    'Saved Wishlist',
    'View and manage your bookmarked campus items and textbooks.'
  );
  const { showToast } = useToast();

  const {
    data: res,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['wishlist'],
    queryFn: () => apiRequest('/wishlist'),
  });

  const items = extractList(res);

  const handleRemove = async (listingCode) => {
    try {
      await apiRequest(`/wishlist/${listingCode}`, { method: 'DELETE' });
      showToast({ tone: 'info', title: 'Removed from saved items' });
      refetch();
    } catch (err) {
      showToast({ tone: 'danger', title: 'Failed to remove item', description: err.message });
    }
  };

  return (
    <div className="ce-stack-lg ce-animate-enter">
      <div>
        <h1 className="ce-title-section">
          Saved Campus Listings
        </h1>
        <p className="ce-muted" style={{ margin: '0.2rem 0 0', fontSize: '0.9rem' }}>
          Items you've bookmarked to compare and reserve later.
        </p>
      </div>

      {isLoading ? (
        <LoadingState label="Loading saved wishlist items..." rows={3} />
      ) : error ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : items.length === 0 ? (
        <EmptyState
          title="Your wishlist is empty"
          description="Bookmark textbooks or engineering instruments while browsing to compare and reserve later."
          action={
            <Link to="/marketplace" className="ce-btn ce-btn-primary">
              <ShoppingBag size={16} />
              <span>Browse Marketplace</span>
            </Link>
          }
        />
      ) : (
        <div className="ce-grid-cards">
          {items.map((entry) => {
            const listing = entry.listing || entry;
            return (
              <div key={listing.listingCode} className="ce-card ce-card-interactive ce-stack" style={{ justifyContent: 'space-between' }}>
                <div className="ce-stack" style={{ gap: '0.5rem' }}>
                  <div className="ce-row-between">
                    <CodeBadge>{listing.listingCode}</CodeBadge>
                    <StatusBadge status={listing.status} />
                  </div>
                  <Link to={`/listings/${listing.listingCode}`} className="ce-card-title">
                    {listing.title}
                  </Link>
                  <p className="ce-muted" style={{ fontSize: '0.85rem', margin: 0 }}>
                    {listing.branch || listing.department} {listing.semester ? `· Sem ${listing.semester}` : ''}
                  </p>
                </div>

                <div
                  className="ce-row-between"
                  style={{
                    marginTop: '0.75rem',
                    paddingTop: '0.75rem',
                    borderTop: '1px solid var(--ce-border)',
                  }}
                >
                  <span className="ce-price-tag">{formatPrice(listing)}</span>
                  <div className="ce-row" style={{ gap: '0.4rem' }}>
                    <span className="ce-badge ce-badge-neutral">{formatCondition(listing.condition)}</span>
                    <button
                      type="button"
                      className="ce-btn ce-btn-ghost ce-btn-sm"
                      onClick={() => handleRemove(listing.listingCode)}
                      aria-label="Remove from wishlist"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

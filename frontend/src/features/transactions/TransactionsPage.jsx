import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  CheckCircle2,
  XCircle,
  Handshake,
  Star,
  Clock,
  ArrowLeftRight,
} from 'lucide-react';
import { apiRequest } from '../../lib/api-client.js';
import { extractList, formatPrice, formatDateTime } from '../../lib/formatters.js';
import { StatusBadge } from '../../components/StatusBadge.jsx';
import { CodeBadge } from '../../components/CodeBadge.jsx';
import { LoadingState, EmptyState, ErrorState } from '../../components/FeedbackStates.jsx';
import { useToast } from '../../components/ToastContext.jsx';
import { useAuth } from '../auth/AuthContext.jsx';

export function TransactionsPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [reviewTx, setReviewTx] = useState(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  const {
    data: res,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['transactions', roleFilter, statusFilter],
    queryFn: () =>
      apiRequest('/transactions', {
        params: {
          role: roleFilter || undefined,
          status: statusFilter || undefined,
          limit: 30,
        },
      }),
  });

  const transactions = extractList(res);

  const performAction = async (transactionCode, action, body = {}) => {
    try {
      await apiRequest(`/transactions/${transactionCode}/${action}`, {
        method: 'POST',
        body,
      });
      showToast({
        tone: 'success',
        title: `Transaction updated (${action})`,
      });
      refetch();
    } catch (err) {
      showToast({
        tone: 'danger',
        title: 'Action failed',
        description: err.message,
      });
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!reviewTx) return;
    setSubmittingReview(true);
    try {
      await apiRequest(`/transactions/${reviewTx.transactionCode}/reviews`, {
        method: 'POST',
        body: {
          rating: Number(rating),
          comment: comment.trim(),
        },
      });
      showToast({
        tone: 'success',
        title: 'Trust review published',
        description: 'Peer rating has been updated.',
      });
      setReviewTx(null);
      setComment('');
      refetch();
    } catch (err) {
      showToast({
        tone: 'danger',
        title: 'Could not submit review',
        description: err.message,
      });
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
    <div className="ce-stack-lg">
      <div className="ce-row-between" style={{ flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <CodeBadge>RESERVATIONS & HANDOVERS</CodeBadge>
          <h1 className="ce-title-section" style={{ marginTop: '0.35rem' }}>
            Campus Handover Ledger
          </h1>
          <p className="ce-muted" style={{ margin: '0.2rem 0 0', fontSize: '0.9rem' }}>
            Track active reservations, exchange proposals, and completed campus pickups.
          </p>
        </div>

        <div className="ce-row" style={{ gap: '0.6rem' }}>
          <select
            aria-label="Filter by Role"
            className="ce-select"
            style={{ width: 'auto' }}
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="">All Roles (Buyer & Seller)</option>
            <option value="buyer">As Buyer</option>
            <option value="seller">As Seller</option>
          </select>

          <select
            aria-label="Filter by Status"
            className="ce-select"
            style={{ width: 'auto' }}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="reserved">Reserved</option>
            <option value="pending_exchange">Pending Exchange</option>
            <option value="accepted">Accepted</option>
            <option value="completed">Completed</option>
            <option value="declined">Declined</option>
            <option value="cancelled">Cancelled</option>
            <option value="expired">Expired</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <LoadingState rows={3} />
      ) : error ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : transactions.length === 0 ? (
        <EmptyState
          title="No transactions or reservations found"
          description="Reserve an item from the campus marketplace to initiate a tracked handover."
          action={
            <Link to="/marketplace" className="ce-btn ce-btn-primary">
              <ArrowLeftRight size={16} />
              <span>Explore Marketplace</span>
            </Link>
          }
        />
      ) : (
        <div className="ce-stack">
          {transactions.map((tx) => {
            const isSeller =
              tx.viewerRole === 'seller' || tx.seller?.userCode === user?.userCode;
            const isBuyer =
              tx.viewerRole === 'buyer' || tx.buyer?.userCode === user?.userCode;
            const st = String(tx.status || '').toLowerCase();

            return (
              <div key={tx.transactionCode} className="ce-card ce-stack" style={{ gap: '0.85rem' }}>
                <div className="ce-row-between" style={{ flexWrap: 'wrap', gap: '0.75rem' }}>
                  <div className="ce-row" style={{ gap: '0.5rem', flexWrap: 'wrap' }}>
                    <CodeBadge>{tx.transactionCode}</CodeBadge>
                    <span className="ce-badge ce-badge-neutral">{tx.txnType || tx.mode}</span>
                    <span className="ce-badge ce-badge-info">
                      {isSeller ? 'You are Seller' : 'You are Buyer'}
                    </span>
                  </div>
                  <StatusBadge status={tx.status} />
                </div>

                <div className="ce-row-between" style={{ flexWrap: 'wrap', gap: '1rem' }}>
                  <div>
                    <Link
                      to={`/listings/${tx.listing?.listingCode}`}
                      className="ce-card-title"
                      style={{ fontSize: '1.15rem' }}
                    >
                      {tx.listing?.title || 'Campus Listing'}
                    </Link>
                    <div className="ce-muted" style={{ fontSize: '0.86rem', marginTop: '0.2rem' }}>
                      Buyer: <strong>{tx.buyer?.fullName}</strong> · Seller:{' '}
                      <strong>{tx.seller?.fullName}</strong>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div className="ce-price-tag">
                      {tx.offeredListing
                        ? `Exchange: ${tx.offeredListing.title}`
                        : formatPrice(tx.listing)}
                    </div>
                  </div>
                </div>

                {(tx.notes || tx.note) && (
                  <div
                    style={{
                      padding: '0.6rem 0.85rem',
                      borderRadius: 'var(--ce-radius-md)',
                      background: 'var(--ce-bg-elevated)',
                      fontSize: '0.86rem',
                    }}
                  >
                    Note: &ldquo;{tx.notes || tx.note}&rdquo;
                  </div>
                )}

                {tx.reservationExpiresAt && ['reserved', 'accepted'].includes(st) && (
                  <div className="ce-alert ce-alert-info">
                    <Clock size={13} style={{ verticalAlign: 'middle', marginRight: '0.35rem' }} />
                    Reservation hold expires: <strong>{formatDateTime(tx.reservationExpiresAt)}</strong>
                  </div>
                )}

                <div
                  className="ce-row-between"
                  style={{
                    paddingTop: '0.65rem',
                    borderTop: '1px solid var(--ce-border)',
                    flexWrap: 'wrap',
                    gap: '0.5rem',
                  }}
                >
                  <span className="ce-muted" style={{ fontSize: '0.8rem' }}>
                    Initiated {formatDateTime(tx.createdAt)}
                  </span>

                  <div className="ce-row" style={{ gap: '0.5rem', flexWrap: 'wrap' }}>
                    {st === 'pending_exchange' && isSeller && (
                      <>
                        <button
                          type="button"
                          className="ce-btn ce-btn-primary ce-btn-sm"
                          onClick={() => performAction(tx.transactionCode, 'accept')}
                        >
                          <CheckCircle2 size={14} />
                          <span>Accept Exchange</span>
                        </button>
                        <button
                          type="button"
                          className="ce-btn ce-btn-danger ce-btn-sm"
                          onClick={() =>
                            performAction(tx.transactionCode, 'decline', {
                              reason: 'Exchange item not needed right now',
                            })
                          }
                        >
                          <XCircle size={14} />
                          <span>Decline</span>
                        </button>
                      </>
                    )}

                    {['reserved', 'pending_exchange', 'accepted'].includes(st) && (
                      <button
                        type="button"
                        className="ce-btn ce-btn-secondary ce-btn-sm"
                        onClick={() =>
                          performAction(tx.transactionCode, 'cancel', {
                            reason: 'Cancelled by participant',
                          })
                        }
                      >
                        Cancel Reservation
                      </button>
                    )}

                    {['reserved', 'accepted'].includes(st) && isSeller && (
                      <button
                        type="button"
                        className="ce-btn ce-btn-primary ce-btn-sm"
                        onClick={() =>
                          performAction(tx.transactionCode, 'confirm-handover', {
                            notes: 'Handed over on campus',
                          })
                        }
                      >
                        <Handshake size={14} />
                        <span>Confirm Campus Handover</span>
                      </button>
                    )}

                    {st === 'completed' && (tx.canReview || (isBuyer && !tx.myReview)) && (
                      <button
                        type="button"
                        className="ce-btn ce-btn-secondary ce-btn-sm"
                        onClick={() => setReviewTx(tx)}
                      >
                        <Star size={14} color="var(--ce-warning)" />
                        <span>Leave Peer Review</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {reviewTx && (
        <div className="ce-modal-backdrop" role="dialog" aria-modal="true">
          <div className="ce-modal">
            <h3 className="ce-card-title" style={{ marginBottom: '0.5rem' }}>
              Review Handover for {reviewTx.listing?.title}
            </h3>
            <p className="ce-muted" style={{ fontSize: '0.86rem', marginBottom: '1rem' }}>
              Transaction: <code>{reviewTx.transactionCode}</code>
            </p>

            <form onSubmit={handleReviewSubmit} className="ce-stack">
              <div className="ce-field">
                <label className="ce-label" htmlFor="review-rating">
                  Rating (1 to 5 Stars)
                </label>
                <select
                  id="review-rating"
                  className="ce-select"
                  value={rating}
                  onChange={(e) => setRating(Number(e.target.value))}
                >
                  <option value={5}>5 Stars — Smooth, accurate campus handover</option>
                  <option value={4}>4 Stars — Good experience</option>
                  <option value={3}>3 Stars — Acceptable</option>
                  <option value={2}>2 Stars — Below expectations</option>
                  <option value={1}>1 Star — Poor experience</option>
                </select>
              </div>

              <div className="ce-field">
                <label className="ce-label" htmlFor="review-comment">
                  Review Comment
                </label>
                <textarea
                  id="review-comment"
                  className="ce-textarea"
                  placeholder="Share how the item condition and campus gate pickup went..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  required
                />
              </div>

              <div className="ce-row" style={{ justifyContent: 'flex-end', gap: '0.5rem' }}>
                <button
                  type="button"
                  className="ce-btn ce-btn-secondary"
                  onClick={() => setReviewTx(null)}
                >
                  Cancel
                </button>
                <button type="submit" className="ce-btn ce-btn-primary" disabled={submittingReview}>
                  {submittingReview ? 'Submitting...' : 'Publish Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ShoppingBag,
  BookOpen,
  ArrowLeftRight,
  PlusCircle,
  Upload,
  Star,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../auth/AuthContext.jsx';
import { apiRequest } from '../../lib/api-client.js';
import { extractList, extractMeta, formatPrice, formatDateTime } from '../../lib/formatters.js';
import { StatusBadge } from '../../components/StatusBadge.jsx';
import { CodeBadge } from '../../components/CodeBadge.jsx';
import { LoadingState, Skeleton } from '../../components/FeedbackStates.jsx';
import { usePageTitle } from '../../lib/usePageTitle.js';

export function DashboardPage() {
  usePageTitle(
    'Student Hub',
    'Your CampusExchange student dashboard, active listings, and handovers.'
  );
  const { user, isVerifiedStudent } = useAuth();
  const userBranch = user?.branch || user?.department || 'CSE';
  const userEmail = user?.collegeEmail || user?.email || '';

  const { data: myListingsData, isLoading: loadingListings } = useQuery({
    queryKey: ['listings', 'mine', 'hub'],
    queryFn: () => apiRequest('/listings/mine', { params: { limit: 4 } }),
    enabled: isVerifiedStudent,
  });

  const { data: txData, isLoading: loadingTx } = useQuery({
    queryKey: ['transactions', 'hub'],
    queryFn: () => apiRequest('/transactions', { params: { limit: 5 } }),
    enabled: isVerifiedStudent,
  });

  const { data: deptListingsData, isLoading: loadingDeptListings } = useQuery({
    queryKey: ['listings', 'dept-recommended', userBranch],
    queryFn: () =>
      apiRequest('/listings', {
        params: { branch: userBranch, limit: 3 },
      }),
    enabled: isVerifiedStudent && Boolean(userBranch),
  });

  const myListings = extractList(myListingsData);
  const myListingsMeta = extractMeta(myListingsData);
  const transactions = extractList(txData);
  const deptListings = extractList(deptListingsData);

  const avgRating = user?.ratingAverage ?? user?.averageRating ?? 0;
  const ratingCount = user?.ratingCount ?? user?.reviewCount ?? 0;

  return (
    <div className="ce-stack-lg">
      <div className="ce-card" style={{ background: 'var(--ce-bg-elevated)' }}>
        <div className="ce-row-between" style={{ flexWrap: 'wrap', gap: '1rem' }}>
          <div className="ce-stack" style={{ gap: '0.4rem' }}>
            <div className="ce-row" style={{ gap: '0.5rem' }}>
              <CodeBadge>{user?.userCode}</CodeBadge>
              <CodeBadge>
                {userBranch} · YEAR {user?.academicYear || '1'}
              </CodeBadge>
              <StatusBadge status={user?.accountStatus} />
            </div>
            <h1 className="ce-title-section" style={{ fontSize: '1.75rem' }}>
              Welcome, {user?.fullName}
            </h1>
            <p className="ce-muted" style={{ margin: 0, fontSize: '0.92rem' }}>
              {userEmail}
            </p>
          </div>

          <div className="ce-row" style={{ flexWrap: 'wrap', gap: '0.6rem' }}>
            {isVerifiedStudent ? (
              <>
                <Link to="/listings/new" className="ce-btn ce-btn-primary">
                  <PlusCircle size={16} />
                  <span>New Listing</span>
                </Link>
                <Link to="/resources/upload" className="ce-btn ce-btn-secondary">
                  <Upload size={16} />
                  <span>Upload PYQ / Notes</span>
                </Link>
              </>
            ) : (
              <Link
                to={`/verify-email?email=${encodeURIComponent(userEmail)}`}
                className="ce-btn ce-btn-primary"
              >
                Verify Institutional Email
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className="ce-grid-4">
        <div className="ce-kpi-card">
          <div className="ce-row-between">
            <span className="ce-muted" style={{ fontSize: '0.82rem' }}>
              TRUST RATING
            </span>
            <Star size={16} color="var(--ce-warning)" />
          </div>
          <div className="ce-kpi-value">
            {avgRating > 0 ? `${Number(avgRating).toFixed(1)} / 5` : 'New'}
          </div>
          <span className="ce-muted" style={{ fontSize: '0.8rem' }}>
            {ratingCount} verified handover reviews
          </span>
        </div>

        <div className="ce-kpi-card">
          <div className="ce-row-between">
            <span className="ce-muted" style={{ fontSize: '0.82rem' }}>
              MY LISTINGS
            </span>
            <ShoppingBag size={16} color="var(--ce-accent)" />
          </div>
          <div className="ce-kpi-value">
            {loadingListings ? <Skeleton width="48px" height="26px" /> : (myListingsMeta.total || myListings.length)}
          </div>
          <Link to="/my-listings" style={{ fontSize: '0.8rem', color: 'var(--ce-accent)' }}>
            Manage inventory →
          </Link>
        </div>

        <div className="ce-kpi-card">
          <div className="ce-row-between">
            <span className="ce-muted" style={{ fontSize: '0.82rem' }}>
              ACTIVE HANDOVERS
            </span>
            <ArrowLeftRight size={16} color="var(--ce-success)" />
          </div>
          <div className="ce-kpi-value">
            {loadingTx ? (
              <Skeleton width="48px" height="26px" />
            ) : (
              transactions.filter((t) =>
                ['reserved', 'pending_exchange', 'accepted', 'REQUESTED', 'ACCEPTED'].includes(
                  t.status
                )
              ).length
            )}
          </div>
          <Link to="/transactions" style={{ fontSize: '0.8rem', color: 'var(--ce-accent)' }}>
            View reservations →
          </Link>
        </div>

        <div className="ce-kpi-card">
          <div className="ce-row-between">
            <span className="ce-muted" style={{ fontSize: '0.82rem' }}>
              CAMPUS VERIFICATION
            </span>
            <ShieldCheck size={16} color="var(--ce-info)" />
          </div>
          <div className="ce-kpi-value" style={{ fontSize: '1.25rem' }}>
            {isVerifiedStudent ? 'Verified Student' : 'Pending OTP'}
          </div>
          <span className="ce-muted" style={{ fontSize: '0.8rem' }}>
            Institutional access active
          </span>
        </div>
      </div>

      <div className="ce-grid-2">
        <div className="ce-card ce-stack">
          <div className="ce-row-between">
            <h2 className="ce-card-title">Recent Reservations & Handovers</h2>
            <Link to="/transactions" className="ce-btn ce-btn-ghost ce-btn-sm">
              All Handovers
            </Link>
          </div>

          {loadingTx ? (
            <LoadingState label="Loading recent reservations & handovers..." rows={2} variant="rows" />
          ) : transactions.length === 0 ? (
            <p className="ce-muted" style={{ fontSize: '0.9rem' }}>
              No reservations or exchange requests yet. Browse the marketplace to reserve items.
            </p>
          ) : (
            <div className="ce-stack" style={{ gap: '0.65rem' }}>
              {transactions.map((tx) => (
                <div
                  key={tx.transactionCode}
                  style={{
                    padding: '0.75rem',
                    borderRadius: 'var(--ce-radius-md)',
                    border: '1px solid var(--ce-border)',
                    background: 'var(--ce-bg-primary)',
                  }}
                >
                  <div className="ce-row-between">
                    <div className="ce-row" style={{ gap: '0.45rem' }}>
                      <CodeBadge>{tx.transactionCode}</CodeBadge>
                      <strong style={{ fontSize: '0.9rem' }}>{tx.listing?.title || 'Campus Item'}</strong>
                    </div>
                    <StatusBadge status={tx.status} />
                  </div>
                  <div className="ce-row-between" style={{ marginTop: '0.4rem', fontSize: '0.8rem' }}>
                    <span className="ce-muted">
                      Type: {tx.txnType || tx.mode} · Buyer: {tx.buyer?.fullName || 'Student'}
                    </span>
                    <span className="ce-muted">
                      <Clock size={12} style={{ verticalAlign: 'middle', marginRight: '0.25rem' }} />
                      {formatDateTime(tx.createdAt)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="ce-card ce-stack">
          <div className="ce-row-between">
            <h2 className="ce-card-title">Recommended for {userBranch}</h2>
            <Link to={`/marketplace?branch=${userBranch}`} className="ce-btn ce-btn-ghost ce-btn-sm">
              Explore {userBranch}
            </Link>
          </div>

          {loadingDeptListings ? (
            <LoadingState label={`Loading recommended items for ${userBranch}...`} rows={2} variant="rows" />
          ) : deptListings.length === 0 ? (
            <p className="ce-muted" style={{ fontSize: '0.9rem' }}>
              No listings found specifically for {userBranch} yet.
            </p>
          ) : (
            <div className="ce-stack" style={{ gap: '0.65rem' }}>
              {deptListings.map((item) => (
                <Link
                  key={item.listingCode}
                  to={`/listings/${item.listingCode}`}
                  style={{
                    padding: '0.75rem',
                    borderRadius: 'var(--ce-radius-md)',
                    border: '1px solid var(--ce-border)',
                    background: 'var(--ce-bg-primary)',
                    display: 'block',
                  }}
                >
                  <div className="ce-row-between">
                    <strong style={{ fontSize: '0.92rem' }}>{item.title}</strong>
                    <span className="ce-price-tag" style={{ fontSize: '0.95rem' }}>
                      {formatPrice(item)}
                    </span>
                  </div>
                  <div className="ce-row-between" style={{ marginTop: '0.35rem', fontSize: '0.8rem' }}>
                    <span className="ce-muted">
                      {item.subject || item.branch} {item.semester ? `· Sem ${item.semester}` : ''}
                    </span>
                    <CodeBadge>{item.branch}</CodeBadge>
                  </div>
                </Link>
              ))}
            </div>
          )}

          <div
            style={{
              marginTop: 'auto',
              paddingTop: '0.75rem',
              borderTop: '1px solid var(--ce-border)',
            }}
          >
            <Link
              to="/resources"
              className="ce-row"
              style={{ color: 'var(--ce-accent)', fontSize: '0.88rem', fontWeight: 500 }}
            >
              <BookOpen size={16} />
              <span>Browse {userBranch} PYQs & Lab Manuals →</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

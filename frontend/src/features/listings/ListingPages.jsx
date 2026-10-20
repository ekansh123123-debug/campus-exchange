import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Heart,
  MessageSquare,
  ShieldCheck,
  Flag,
  CheckCircle2,
  ArrowLeft,
  Star,
  PlusCircle,
  Send,
  Trash2,
} from 'lucide-react';
import { apiRequest } from '../../lib/api-client.js';
import {
  BRANCHES,
  ACADEMIC_YEARS,
  SEMESTERS,
  LISTING_CONDITIONS,
  LISTING_TYPES,
} from '../../lib/constants.js';
import { extractList, formatPrice, formatCondition, formatDate } from '../../lib/formatters.js';
import { StatusBadge } from '../../components/StatusBadge.jsx';
import { CodeBadge } from '../../components/CodeBadge.jsx';
import { LoadingState, EmptyState, ErrorState } from '../../components/FeedbackStates.jsx';
import { ReportModal } from '../../components/ReportModal.jsx';
import { useToast } from '../../components/ToastContext.jsx';
import { useAuth } from '../auth/AuthContext.jsx';
import { usePageTitle } from '../../lib/usePageTitle.js';

export function ListingDetailPage() {
  const { listingCode } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, isAuthenticated, isVerifiedStudent } = useAuth();
  const { showToast } = useToast();

  const [notes, setNotes] = useState('');
  const [offeredListingCode, setOfferedListingCode] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);

  const {
    data: listingRes,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['listing', listingCode],
    queryFn: () => apiRequest(`/listings/${listingCode}`),
  });

  const listing = listingRes?.data?.listing;

  usePageTitle(
    listing?.title || 'Listing Detail',
    listing?.description ? listing.description.slice(0, 160) : 'Inspect campus textbook or gear listing on CampusExchange.'
  );

  const { data: myListingsRes } = useQuery({
    queryKey: ['listings', 'mine', 'for-exchange'],
    queryFn: () => apiRequest('/listings/mine', { params: { status: 'active' } }),
    enabled: isVerifiedStudent,
  });

  const myActiveListings = extractList(myListingsRes).filter(
    (item) => String(item.status || '').toLowerCase() === 'active'
  );

  if (isLoading) return <LoadingState label="Loading listing details..." rows={2} variant="detail" />;
  if (error || !listing) return <ErrorState error={error} onRetry={refetch} />;

  const isOwner = Boolean(
    listing.isOwner || (user && listing.seller?.userCode === user.userCode)
  );
  const isListingActive = String(listing.status || '').toLowerCase() === 'active';
  const canReserve = isAuthenticated && isVerifiedStudent && !isOwner && isListingActive;
  const isExchange =
    String(listing.listingType || listing.pricingMode || '').toLowerCase() === 'exchange';

  const handleWishlistSave = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    try {
      await apiRequest('/wishlist', {
        method: 'POST',
        body: { listingCode: listing.listingCode },
      });
      showToast({
        tone: 'success',
        title: 'Saved to Wishlist',
        description: `${listing.title} is now in your saved list.`,
      });
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
    } catch (err) {
      showToast({ tone: 'danger', title: 'Could not save item', description: err.message });
    }
  };

  const handleStartChat = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    setActionLoading(true);
    try {
      const res = await apiRequest('/conversations', {
        method: 'POST',
        body: {
          listingCode: listing.listingCode,
          initialMessage: `Hi! Is "${listing.title}" still available for campus pickup?`,
        },
      });
      const convCode = res?.data?.conversation?.conversationCode;
      if (convCode) {
        navigate(`/messages/${convCode}`);
      }
    } catch (err) {
      showToast({ tone: 'danger', title: 'Could not start chat', description: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  const handleReserveOrExchange = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      if (isExchange) {
        const chosenCode = offeredListingCode.trim() || myActiveListings[0]?.listingCode;
        if (!chosenCode) {
          showToast({
            tone: 'warning',
            title: 'Offered listing code required',
            description: 'Enter or select one of your active listing codes to propose an exchange.',
          });
          setActionLoading(false);
          return;
        }
        await apiRequest(`/listings/${listing.listingCode}/exchange-requests`, {
          method: 'POST',
          body: {
            offeredListingCode: chosenCode,
            notes: notes.trim() || 'Interested in swapping items on campus.',
          },
        });
        showToast({
          tone: 'success',
          title: 'Exchange Request Sent',
          description: 'The seller has been notified to review your exchange proposal.',
        });
      } else {
        await apiRequest(`/listings/${listing.listingCode}/reservations`, {
          method: 'POST',
          body: {
            notes: notes.trim() || 'Ready to meet at campus gate for pickup.',
          },
        });
        showToast({
          tone: 'success',
          title: 'Item Reserved!',
          description: 'Single-active reservation lock engaged for campus pickup.',
        });
      }
      queryClient.invalidateQueries({ queryKey: ['listing', listingCode] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      navigate('/transactions');
    } catch (err) {
      showToast({
        tone: 'danger',
        title: 'Reservation failed',
        description: err.message,
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleSubmitForModeration = async () => {
    setActionLoading(true);
    try {
      await apiRequest(`/listings/${listing.listingCode}/submit`, { method: 'POST' });
      showToast({
        tone: 'success',
        title: 'Submitted for moderation',
        description: 'Campus admins will review and publish your listing shortly.',
      });
      refetch();
    } catch (err) {
      showToast({ tone: 'danger', title: 'Submission failed', description: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  const sellerRating = listing.seller?.ratingAverage ?? listing.seller?.averageRating ?? 0;
  const sellerCount = listing.seller?.ratingCount ?? listing.seller?.reviewCount ?? 0;

  return (
    <div className="ce-stack-lg ce-animate-enter">
      <div className="ce-row-between">
        <Link to="/marketplace" className="ce-btn ce-btn-ghost ce-btn-sm">
          <ArrowLeft size={15} />
          <span>Back to Marketplace</span>
        </Link>

        <div className="ce-row" style={{ gap: '0.5rem' }}>
          {!isOwner && isAuthenticated && (
            <>
              <button
                type="button"
                className="ce-btn ce-btn-secondary ce-btn-sm"
                onClick={handleWishlistSave}
              >
                <Heart size={15} />
                <span>Save</span>
              </button>
              <button
                type="button"
                className="ce-btn ce-btn-ghost ce-btn-sm"
                onClick={() => setShowReportModal(true)}
              >
                <Flag size={15} />
                <span>Report</span>
              </button>
            </>
          )}
        </div>
      </div>

      <div className="ce-grid-2" style={{ alignItems: 'start' }}>
        <div className="ce-stack">
          <div className="ce-card ce-stack">
            <div className="ce-row-between">
              <div className="ce-row" style={{ gap: '0.4rem', flexWrap: 'wrap' }}>
                <CodeBadge>{listing.listingCode}</CodeBadge>
                <CodeBadge>{listing.branch || listing.department}</CodeBadge>
                {listing.semester && <CodeBadge>Sem {listing.semester}</CodeBadge>}
                {listing.isDemoSeed && <span className="ce-badge ce-badge-demo">DEMO SEED</span>}
              </div>
              <StatusBadge status={listing.status} />
            </div>

            <h1 className="ce-title-section" style={{ fontSize: '1.75rem' }}>
              {listing.title}
            </h1>

            <div className="ce-row" style={{ gap: '1rem', alignItems: 'baseline', flexWrap: 'wrap' }}>
              <span className="ce-price-tag" style={{ fontSize: '1.75rem' }}>
                {formatPrice(listing)}
              </span>
              <span className="ce-badge ce-badge-neutral">{formatCondition(listing.condition)}</span>
              {listing.subject && (
                <span className="ce-muted" style={{ fontSize: '0.86rem' }}>
                  {listing.subject}
                </span>
              )}
            </div>

            {listing.images?.length > 0 && (
              <div className="ce-grid-2" style={{ marginTop: '0.5rem' }}>
                {listing.images.map((img, i) => (
                  <div
                    key={i}
                    style={{
                      borderRadius: 'var(--ce-radius-md)',
                      overflow: 'hidden',
                      border: '1px solid var(--ce-border)',
                      height: '200px',
                      background: 'var(--ce-bg-elevated)',
                    }}
                  >
                    <img
                      src={img.url}
                      alt={img.altText || `${listing.title} ${i + 1}`}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </div>
                ))}
              </div>
            )}

            <div style={{ paddingTop: '0.5rem' }}>
              <h3 className="ce-label" style={{ marginBottom: '0.35rem' }}>
                Item Description & Notes
              </h3>
              <p style={{ whiteSpace: 'pre-line', margin: 0, color: 'var(--ce-text-secondary)' }}>
                {listing.description}
              </p>
            </div>

            {(listing.author || listing.edition || listing.exchangePreference) && (
              <div
                style={{
                  padding: '0.85rem',
                  borderRadius: 'var(--ce-radius-md)',
                  background: 'var(--ce-bg-elevated)',
                  border: '1px solid var(--ce-border)',
                  fontSize: '0.86rem',
                }}
              >
                {listing.author && (
                  <div>
                    Author: <strong>{listing.author}</strong>
                  </div>
                )}
                {listing.edition && (
                  <div>
                    Edition: <strong>{listing.edition}</strong>
                  </div>
                )}
                {listing.exchangePreference && (
                  <div>
                    Exchange Preference: <strong>{listing.exchangePreference}</strong>
                  </div>
                )}
              </div>
            )}

            <div className="ce-muted" style={{ fontSize: '0.8rem' }}>
              Posted on {formatDate(listing.createdAt)}
            </div>
          </div>

          {listing.seller && (
            <div className="ce-card ce-row-between">
              <div className="ce-stack" style={{ gap: '0.25rem' }}>
                <div className="ce-row" style={{ gap: '0.4rem' }}>
                  <ShieldCheck size={16} color="var(--ce-success)" />
                  <strong>{listing.seller.fullName}</strong>
                  <CodeBadge>{listing.seller.userCode}</CodeBadge>
                </div>
                <span className="ce-muted" style={{ fontSize: '0.84rem' }}>
                  {listing.seller.branch || 'CSE'} · Year {listing.seller.academicYear || '2'}
                </span>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div
                  className="ce-row"
                  style={{ gap: '0.25rem', justifyContent: 'flex-end', fontWeight: 600 }}
                >
                  <Star size={15} color="var(--ce-warning)" />
                  <span>
                    {sellerRating > 0 ? `${Number(sellerRating).toFixed(1)} / 5` : 'Verified Peer'}
                  </span>
                </div>
                <span className="ce-muted" style={{ fontSize: '0.78rem' }}>
                  {sellerCount} reviews
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="ce-stack">
          {isOwner ? (
            <div className="ce-card ce-stack">
              <h2 className="ce-card-title">Seller Controls</h2>
              <p className="ce-muted" style={{ fontSize: '0.88rem', margin: 0 }}>
                Current status: <strong>{listing.status}</strong>
              </p>
              {listing.moderation?.rejectionReason && (
                <div className="ce-alert ce-alert-warning">
                  Moderator feedback: {listing.moderation.rejectionReason}
                </div>
              )}
              <div className="ce-row" style={{ flexWrap: 'wrap', gap: '0.6rem' }}>
                {!['reserved', 'sold', 'removed'].includes(
                  String(listing.status).toLowerCase()
                ) && (
                  <Link
                    to={`/listings/new?edit=${listing.listingCode}`}
                    className="ce-btn ce-btn-secondary"
                  >
                    Edit Listing
                  </Link>
                )}
                {['draft', 'rejected'].includes(String(listing.status).toLowerCase()) && (
                  <button
                    type="button"
                    className="ce-btn ce-btn-primary"
                    onClick={handleSubmitForModeration}
                    disabled={actionLoading}
                  >
                    <Send size={15} />
                    <span>Submit for Moderation</span>
                  </button>
                )}
                <Link to="/my-listings" className="ce-btn ce-btn-secondary">
                  Manage in My Listings
                </Link>
              </div>
            </div>
          ) : canReserve ? (
            <div className="ce-card ce-stack">
              <div className="ce-row" style={{ gap: '0.45rem' }}>
                <CheckCircle2 size={18} color="var(--ce-success)" />
                <h2 className="ce-card-title">
                  {isExchange ? 'Propose Campus Exchange' : 'Reserve for Campus Pickup'}
                </h2>
              </div>

              <p className="ce-muted" style={{ fontSize: '0.86rem', margin: 0 }}>
                Reserving places a concurrency-safe hold so you can meet the seller on campus.
              </p>

              <form onSubmit={handleReserveOrExchange} className="ce-stack">
                {isExchange && (
                  <div className="ce-field">
                    <label className="ce-label" htmlFor="exchange-offer">
                      Your Active Listing Code to Offer
                    </label>
                    {myActiveListings.length > 0 ? (
                      <select
                        id="exchange-offer"
                        className="ce-select"
                        value={offeredListingCode || myActiveListings[0]?.listingCode || ''}
                        onChange={(e) => setOfferedListingCode(e.target.value)}
                      >
                        {myActiveListings.map((m) => (
                          <option key={m.listingCode} value={m.listingCode}>
                            {m.listingCode} — {m.title}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        id="exchange-offer"
                        type="text"
                        className="ce-input"
                        placeholder="e.g. CEL-XXXXXX"
                        value={offeredListingCode}
                        onChange={(e) => setOfferedListingCode(e.target.value)}
                        required
                      />
                    )}
                  </div>
                )}

                <div className="ce-field">
                  <label className="ce-label" htmlFor="reserve-note">
                    Handover Timing & Gate Note
                  </label>
                  <textarea
                    id="reserve-note"
                    className="ce-textarea"
                    style={{ minHeight: '75px' }}
                    placeholder="e.g. Free after 4 PM lab near Central Library gate."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>

                <div className="ce-row" style={{ gap: '0.6rem', flexWrap: 'wrap' }}>
                  <button
                    type="submit"
                    className="ce-btn ce-btn-primary"
                    disabled={actionLoading}
                    style={{ flex: 1 }}
                  >
                    {actionLoading
                      ? 'Submitting...'
                      : isExchange
                        ? 'Send Exchange Proposal'
                        : 'Reserve for Campus Pickup'}
                  </button>

                  <button
                    type="button"
                    className="ce-btn ce-btn-secondary"
                    onClick={handleStartChat}
                    disabled={actionLoading}
                  >
                    <MessageSquare size={16} />
                    <span>Message Seller</span>
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="ce-card ce-stack">
              <h2 className="ce-card-title">Reservation Availability</h2>
              {!isListingActive ? (
                <div className="ce-alert ce-alert-warning">
                  This item is currently <strong>{listing.status}</strong> and cannot accept new
                  reservations.
                </div>
              ) : !isAuthenticated ? (
                <div className="ce-stack" style={{ gap: '0.75rem' }}>
                  <p className="ce-muted" style={{ margin: 0, fontSize: '0.9rem' }}>
                    Sign in with your verified college email to reserve this item or message the
                    seller.
                  </p>
                  <Link to="/login" className="ce-btn ce-btn-primary">
                    Sign In to Reserve
                  </Link>
                </div>
              ) : (
                <div className="ce-alert ce-alert-warning">
                  Verify your institutional email OTP first to activate reservations and messaging.
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {showReportModal && (
        <ReportModal
          targetType="listing"
          targetCode={listing.listingCode}
          targetTitle={listing.title}
          onClose={() => setShowReportModal(false)}
        />
      )}
    </div>
  );
}

export function CreateEditListingPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editCode = searchParams.get('edit');
  const { user } = useAuth();
  const { showToast } = useToast();

  usePageTitle(
    editCode ? `Edit Listing (${editCode})` : 'New Campus Listing',
    'Post or edit an engineering textbook, lab instrument, or campus item on CampusExchange.'
  );

  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => apiRequest('/categories'),
  });

  const { data: existingListingRes } = useQuery({
    queryKey: ['listing', editCode],
    queryFn: () => apiRequest(`/listings/${editCode}`),
    enabled: Boolean(editCode),
  });

  const categories = extractList(categoriesData);
  const existingListing = existingListingRes?.data?.listing || existingListingRes?.data;

  const baseForm = useMemo(
    () => ({
      title: existingListing?.title || '',
      description: existingListing?.description || '',
      categorySlug: existingListing?.category?.slug || 'textbooks',
      branch: existingListing?.branch || user?.branch || 'CSE',
      academicYear: String(existingListing?.academicYear || user?.academicYear || '2'),
      semester: String(existingListing?.semester || '4'),
      subject: existingListing?.subject || '',
      author: existingListing?.author || '',
      edition: existingListing?.edition || '',
      condition: existingListing?.condition || 'good',
      listingType: existingListing?.listingType || 'sell',
      price: existingListing
        ? typeof existingListing.pricePaise === 'number'
          ? Math.round(existingListing.pricePaise / 100)
          : Number(existingListing.priceInr ?? existingListing.priceRupees ?? 0)
        : 250,
      exchangePreference: existingListing?.exchangePreference || '',
    }),
    [existingListing, user?.academicYear, user?.branch]
  );
  const [overrides, setOverrides] = useState({});
  const form = useMemo(() => ({ ...baseForm, ...overrides }), [baseForm, overrides]);
  const [imageFiles, setImageFiles] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const localPreviews = useMemo(
    () =>
      imageFiles.slice(0, 6).map((file) => ({
        name: file.name,
        url: URL.createObjectURL(file),
      })),
    [imageFiles]
  );

  useEffect(() => {
    return () => {
      localPreviews.forEach((p) => URL.revokeObjectURL(p.url));
    };
  }, [localPreviews]);

  const updateField = (key, value) => setOverrides((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (form.listingType === 'sell' && String(form.price).trim() === '') {
      setError('Price is required for sale listings (enter 0 for a free item).');
      return;
    }

    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('title', form.title.trim());
      formData.append('description', form.description.trim());
      formData.append('categorySlug', form.categorySlug || categories[0]?.slug || 'textbooks');
      formData.append('branch', form.branch);
      formData.append('academicYear', String(form.academicYear));
      formData.append('semester', String(form.semester));
      if (form.subject.trim()) formData.append('subject', form.subject.trim());
      if (form.author.trim()) formData.append('author', form.author.trim());
      if (form.edition.trim()) formData.append('edition', form.edition.trim());
      if (form.exchangePreference.trim()) {
        formData.append('exchangePreference', form.exchangePreference.trim());
      }
      formData.append('condition', form.condition);
      formData.append('listingType', form.listingType);
      formData.append(
        'price',
        form.listingType === 'sell' ? String(form.price).trim() : '0'
      );

      imageFiles.slice(0, 6).forEach((file) => {
        formData.append('images', file);
      });

      const res = await apiRequest(editCode ? `/listings/${editCode}` : '/listings', {
        method: editCode ? 'PATCH' : 'POST',
        body: formData,
      });

      const createdCode = res?.data?.listing?.listingCode;
      showToast({
        tone: 'success',
        title: editCode
          ? 'Listing updated and queued for moderation'
          : 'Listing submitted to moderation queue',
        description: `Code: ${createdCode}`,
      });

      navigate(createdCode ? `/listings/${createdCode}` : '/my-listings');
    } catch (err) {
      setError(err.message || 'Failed to save listing');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto' }} className="ce-stack-lg ce-animate-enter">
      <div>
        <CodeBadge>SELLER STUDIO</CodeBadge>
        <h1 className="ce-title-section" style={{ marginTop: '0.35rem' }}>
          {editCode ? `Update Listing (${editCode})` : 'List a Campus Item'}
        </h1>
        <p className="ce-muted" style={{ margin: '0.2rem 0 0', fontSize: '0.9rem' }}>
          Provide accurate condition details so campus peers can inspect and reserve with
          confidence.
        </p>
      </div>

      {error && <div className="ce-alert ce-alert-danger">{error}</div>}

      <form onSubmit={handleSubmit} className="ce-card ce-stack">
        <div className="ce-field">
          <label className="ce-label" htmlFor="listing-title">
            Item Title (3–140 chars)
          </label>
          <input
            id="listing-title"
            type="text"
            className="ce-input"
            placeholder="e.g. Digital Design by Morris Mano (5th Edition)"
            value={form.title}
            onChange={(e) => updateField('title', e.target.value)}
            required
          />
        </div>

        <div className="ce-grid-3">
          <div className="ce-field">
            <label className="ce-label" htmlFor="listing-category">
              Category
            </label>
            <select
              id="listing-category"
              className="ce-select"
              value={form.categorySlug}
              onChange={(e) => updateField('categorySlug', e.target.value)}
            >
              {categories.length > 0 ? (
                categories.map((c) => (
                  <option key={c.slug} value={c.slug}>
                    {c.name}
                  </option>
                ))
              ) : (
                <option value="textbooks">Textbooks & Reference Books</option>
              )}
            </select>
          </div>

          <div className="ce-field">
            <label className="ce-label" htmlFor="listing-dept">
              Branch
            </label>
            <select
              id="listing-dept"
              className="ce-select"
              value={form.branch}
              onChange={(e) => updateField('branch', e.target.value)}
            >
              {BRANCHES.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          <div className="ce-field">
            <label className="ce-label" htmlFor="listing-sem">
              Target Semester
            </label>
            <select
              id="listing-sem"
              className="ce-select"
              value={form.semester}
              onChange={(e) => updateField('semester', e.target.value)}
            >
              {SEMESTERS.map((s) => (
                <option key={s} value={s}>
                  Semester {s}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="ce-grid-3">
          <div className="ce-field">
            <label className="ce-label" htmlFor="listing-subject">
              Subject / Course Name
            </label>
            <input
              id="listing-subject"
              type="text"
              className="ce-input"
              placeholder="Digital Logic Design"
              value={form.subject}
              onChange={(e) => updateField('subject', e.target.value)}
            />
          </div>

          <div className="ce-field">
            <label className="ce-label" htmlFor="listing-condition">
              Condition
            </label>
            <select
              id="listing-condition"
              className="ce-select"
              value={form.condition}
              onChange={(e) => updateField('condition', e.target.value)}
            >
              {LISTING_CONDITIONS.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <div className="ce-field">
            <label className="ce-label" htmlFor="listing-mode">
              Listing Type
            </label>
            <select
              id="listing-mode"
              className="ce-select"
              value={form.listingType}
              onChange={(e) => updateField('listingType', e.target.value)}
            >
              {LISTING_TYPES.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="ce-grid-2">
          {form.listingType === 'sell' ? (
            <div className="ce-field">
              <label className="ce-label" htmlFor="listing-price">
                Price in INR (₹ — enter 0 for Free)
              </label>
              <input
                id="listing-price"
                type="number"
                min="0"
                max="200000"
                className="ce-input"
                value={form.price}
                onChange={(e) => updateField('price', e.target.value)}
                required
              />
            </div>
          ) : (
            <div className="ce-field">
              <label className="ce-label" htmlFor="listing-ex-pref">
                Preferred Item in Exchange
              </label>
              <input
                id="listing-ex-pref"
                type="text"
                className="ce-input"
                placeholder="e.g. Scientific calculator or Arduino Uno kit"
                value={form.exchangePreference}
                onChange={(e) => updateField('exchangePreference', e.target.value)}
              />
            </div>
          )}

          <div className="ce-field">
            <label className="ce-label" htmlFor="listing-year">
              Academic Year
            </label>
            <select
              id="listing-year"
              className="ce-select"
              value={form.academicYear}
              onChange={(e) => updateField('academicYear', e.target.value)}
            >
              {ACADEMIC_YEARS.map((yr) => (
                <option key={yr} value={yr}>
                  Year {yr}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="ce-grid-2">
          <div className="ce-field">
            <label className="ce-label" htmlFor="listing-author">
              Author / Brand (Optional)
            </label>
            <input
              id="listing-author"
              type="text"
              className="ce-input"
              placeholder="e.g. M. Morris Mano / Casio"
              value={form.author}
              onChange={(e) => updateField('author', e.target.value)}
            />
          </div>

          <div className="ce-field">
            <label className="ce-label" htmlFor="listing-edition">
              Edition / Model (Optional)
            </label>
            <input
              id="listing-edition"
              type="text"
              className="ce-input"
              placeholder="e.g. 5th Edition / fx-991CW"
              value={form.edition}
              onChange={(e) => updateField('edition', e.target.value)}
            />
          </div>
        </div>

        <div className="ce-field">
          <label className="ce-label" htmlFor="listing-desc">
            Detailed Description (10–2500 chars)
          </label>
          <textarea
            id="listing-desc"
            className="ce-textarea"
            placeholder="Describe edition, highlights, missing pages, or included accessories..."
            value={form.description}
            onChange={(e) => updateField('description', e.target.value)}
            required
          />
        </div>

        <div className="ce-field">
          <label className="ce-label" htmlFor="listing-images">
            Item Photos (Up to 6 JPEG/PNG/WebP images, max 5MB each)
          </label>
          <input
            id="listing-images"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            className="ce-input"
            onChange={(e) => setImageFiles(Array.from(e.target.files || []))}
          />
          {localPreviews.length > 0 && (
            <div className="ce-row" style={{ flexWrap: 'wrap', gap: '0.6rem', marginTop: '0.4rem' }}>
              {localPreviews.map((preview, idx) => (
                <div
                  key={idx}
                  style={{
                    width: '86px',
                    height: '68px',
                    borderRadius: 'var(--ce-radius-sm)',
                    overflow: 'hidden',
                    border: '1px solid var(--ce-border)',
                    background: 'var(--ce-bg-elevated)',
                  }}
                >
                  <img
                    src={preview.url}
                    alt={preview.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="ce-row" style={{ justifyContent: 'flex-end', gap: '0.75rem' }}>
          <Link to="/my-listings" className="ce-btn ce-btn-secondary">
            Cancel
          </Link>
          <button type="submit" className="ce-btn ce-btn-primary" disabled={submitting}>
            {submitting
              ? 'Submitting...'
              : editCode
                ? 'Save & Submit for Review'
                : 'Submit Listing for Review'}
          </button>
        </div>
      </form>
    </div>
  );
}

export function MyListingsPage() {
  usePageTitle(
    'My Listings',
    'Manage your active, reserved, and sold campus listings on CampusExchange.'
  );
  const { showToast } = useToast();
  const [statusFilter, setStatusFilter] = useState('');

  const {
    data: res,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['listings', 'mine', statusFilter],
    queryFn: () =>
      apiRequest('/listings/mine', {
        params: { status: statusFilter || undefined, limit: 30 },
      }),
  });

  const items = extractList(res);

  const handleSubmitDraft = async (listingCode) => {
    try {
      await apiRequest(`/listings/${listingCode}/submit`, { method: 'POST' });
      showToast({ tone: 'success', title: 'Listing submitted for moderation' });
      refetch();
    } catch (err) {
      showToast({ tone: 'danger', title: 'Could not submit', description: err.message });
    }
  };

  const handleArchive = async (listingCode) => {
    try {
      await apiRequest(`/listings/${listingCode}`, { method: 'DELETE' });
      showToast({ tone: 'info', title: 'Listing removed' });
      refetch();
    } catch (err) {
      showToast({ tone: 'danger', title: 'Could not remove listing', description: err.message });
    }
  };

  return (
    <div className="ce-stack-lg ce-animate-enter">
      <div className="ce-row-between" style={{ flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <CodeBadge>INVENTORY MANAGEMENT</CodeBadge>
          <h1 className="ce-title-section" style={{ marginTop: '0.35rem' }}>
            My Campus Listings
          </h1>
        </div>

        <div className="ce-row" style={{ gap: '0.6rem' }}>
          <select
            aria-label="Filter My Listings Status"
            className="ce-select"
            style={{ width: 'auto' }}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending Review</option>
            <option value="active">Active</option>
            <option value="reserved">Reserved</option>
            <option value="sold">Sold / Completed</option>
            <option value="rejected">Rejected</option>
          </select>

          <Link to="/listings/new" className="ce-btn ce-btn-primary">
            <PlusCircle size={16} />
            <span>New Listing</span>
          </Link>
        </div>
      </div>

      {isLoading ? (
        <LoadingState label="Loading your campus listings..." rows={3} />
      ) : error ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : items.length === 0 ? (
        <EmptyState
          title="You haven't created any listings yet"
          description="Pass down your textbooks, lab coat, calculator, or electronics to fellow students."
          action={
            <Link to="/listings/new" className="ce-btn ce-btn-primary">
              Create Your First Listing
            </Link>
          }
        />
      ) : (
        <div className="ce-table-wrap">
          <table className="ce-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Item</th>
                <th>Price / Type</th>
                <th>Status</th>
                <th>Subject</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const st = String(item.status || '').toLowerCase();
                return (
                  <tr key={item.listingCode}>
                    <td>
                      <CodeBadge>{item.listingCode}</CodeBadge>
                    </td>
                    <td>
                      <Link
                        to={`/listings/${item.listingCode}`}
                        style={{ fontWeight: 600, color: 'var(--ce-text-primary)' }}
                      >
                        {item.title}
                      </Link>
                      <div className="ce-muted" style={{ fontSize: '0.78rem' }}>
                        {item.branch} {item.semester ? `· Sem ${item.semester}` : ''}
                      </div>
                    </td>
                    <td style={{ fontFamily: 'var(--ce-font-mono)', fontWeight: 600 }} /* taste-skill-ignore */>
                      {formatPrice(item)}
                    </td>
                    <td>
                      <StatusBadge status={item.status} />
                    </td>
                    <td className="ce-muted">{item.subject || '—'}</td>
                    <td>
                      <div className="ce-row" style={{ gap: '0.4rem' }}>
                        <Link
                          to={`/listings/${item.listingCode}`}
                          className="ce-btn ce-btn-secondary ce-btn-sm"
                        >
                          View
                        </Link>
                        {!['reserved', 'sold', 'removed'].includes(st) && (
                          <Link
                            to={`/listings/new?edit=${item.listingCode}`}
                            className="ce-btn ce-btn-secondary ce-btn-sm"
                          >
                            Edit
                          </Link>
                        )}
                        {['draft', 'rejected'].includes(st) && (
                          <button
                            type="button"
                            className="ce-btn ce-btn-primary ce-btn-sm"
                            onClick={() => handleSubmitDraft(item.listingCode)}
                          >
                            Submit
                          </button>
                        )}
                        {!['reserved', 'sold', 'removed'].includes(st) && (
                          <button
                            type="button"
                            className="ce-btn ce-btn-ghost ce-btn-sm"
                            onClick={() => handleArchive(item.listingCode)}
                            title="Remove listing"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

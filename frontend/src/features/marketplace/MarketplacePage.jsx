import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { SlidersHorizontal, PlusCircle, Star } from 'lucide-react';
import { apiRequest } from '../../lib/api-client.js';
import {
  BRANCHES,
  ACADEMIC_YEARS,
  SEMESTERS,
  LISTING_TYPES,
  LISTING_CONDITIONS,
} from '../../lib/constants.js';
import { extractList, extractMeta, formatPrice, formatCondition } from '../../lib/formatters.js';
import { StatusBadge } from '../../components/StatusBadge.jsx';
import { CodeBadge } from '../../components/CodeBadge.jsx';
import { LoadingState, EmptyState, ErrorState, LoadingSpinner } from '../../components/FeedbackStates.jsx';
import { useAuth } from '../auth/AuthContext.jsx';
import { usePageTitle } from '../../lib/usePageTitle.js';

export function MarketplacePage() {
  usePageTitle(
    'Campus Marketplace',
    'Browse and discover verified engineering textbooks, scientific calculators, drafting instruments, and lab kits.'
  );
  const { isVerifiedStudent } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const [q, setQ] = useState(searchParams.get('q') || '');
  const [debouncedQ, setDebouncedQ] = useState(searchParams.get('q') || '');
  const [branch, setBranch] = useState(
    searchParams.get('branch') || searchParams.get('department') || ''
  );
  const [academicYear, setAcademicYear] = useState(
    searchParams.get('academicYear') || searchParams.get('year') || ''
  );
  const [semester, setSemester] = useState(searchParams.get('semester') || '');
  const [subject, setSubject] = useState(searchParams.get('subject') || '');
  const [category, setCategory] = useState(searchParams.get('category') || '');
  const [listingType, setListingType] = useState(searchParams.get('listingType') || '');
  const [condition, setCondition] = useState(searchParams.get('condition') || '');
  const [minPrice, setMinPrice] = useState(searchParams.get('minPrice') || '');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') || '');
  const [sort, setSort] = useState(searchParams.get('sort') || 'newest');
  const [page, setPage] = useState(Number(searchParams.get('page')) || 1);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQ(q);
    }, 180);
    return () => clearTimeout(timer);
  }, [q]);

  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => apiRequest('/categories'),
  });

  const categories = extractList(categoriesData);

  const {
    data: listingsData,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useQuery({
    queryKey: [
      'listings',
      'marketplace',
      {
        q: debouncedQ,
        branch,
        academicYear,
        semester,
        subject,
        category,
        listingType,
        condition,
        minPrice,
        maxPrice,
        sort,
        page,
      },
    ],
    queryFn: () =>
      apiRequest('/listings', {
        params: {
          q: debouncedQ.trim() || undefined,
          branch: branch || undefined,
          academicYear: academicYear || undefined,
          semester: semester || undefined,
          subject: subject.trim() || undefined,
          category: category || undefined,
          listingType: listingType || undefined,
          condition: condition || undefined,
          minPrice: minPrice !== '' ? minPrice : undefined,
          maxPrice: maxPrice !== '' ? maxPrice : undefined,
          sort,
          page,
          limit: 12,
        },
      }),
    retry: false,
  });

  const listings = extractList(listingsData);
  const pagination = extractMeta(listingsData);

  const handleClearFilters = () => {
    setQ('');
    setDebouncedQ('');
    setBranch('');
    setAcademicYear('');
    setSemester('');
    setSubject('');
    setCategory('');
    setListingType('');
    setCondition('');
    setMinPrice('');
    setMaxPrice('');
    setSort('newest');
    setPage(1);
    setSearchParams({});
  };

  return (
    <div className="ce-stack-lg">
      <div className="ce-row-between" style={{ flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <CodeBadge>CAMPUS MARKETPLACE</CodeBadge>
          <h1 className="ce-title-section" style={{ fontSize: '1.85rem', marginTop: '0.35rem' }}>
            Student Textbooks, Lab Kits & Engineering Gear
          </h1>
          <p className="ce-muted" style={{ margin: '0.2rem 0 0', fontSize: '0.92rem' }}>
            Every item is listed by a verified college peer for safe on-campus gate pickup.
          </p>
        </div>

        {isVerifiedStudent && (
          <Link to="/listings/new" className="ce-btn ce-btn-primary">
            <PlusCircle size={16} />
            <span>Create Listing</span>
          </Link>
        )}
      </div>

      <div className="ce-card ce-stack">
        <div className="ce-row" style={{ gap: '0.75rem', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 260px', position: 'relative' }}>
            <input
              type="search"
              aria-label="Search marketplace keyword"
              className="ce-input"
              placeholder="Search textbooks, subject (e.g. Digital Logic), drafter, Arduino..."
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setDebouncedQ(e.target.value);
                setPage(1);
              }}
            />
          </div>

          <input
            type="text"
            aria-label="Filter by Subject"
            className="ce-input"
            style={{ width: '175px' }}
            placeholder="Subject (e.g. Algorithms)"
            value={subject}
            onChange={(e) => {
              setSubject(e.target.value);
              setPage(1);
            }}
          />

          <select
            aria-label="Filter by Category"
            className="ce-select"
            style={{ width: 'auto', minWidth: '160px' }}
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.slug} value={cat.slug}>
                {cat.name}
              </option>
            ))}
          </select>

          <select
            aria-label="Filter by Department"
            className="ce-select"
            style={{ width: 'auto', minWidth: '125px' }}
            value={branch}
            onChange={(e) => {
              setBranch(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Branches</option>
            {BRANCHES.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>

          <select
            aria-label="Filter by Academic Year"
            className="ce-select"
            style={{ width: 'auto', minWidth: '115px' }}
            value={academicYear}
            onChange={(e) => {
              setAcademicYear(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Years</option>
            {ACADEMIC_YEARS.map((yr) => (
              <option key={yr} value={yr}>
                Year {yr}
              </option>
            ))}
          </select>

          <select
            aria-label="Filter by Semester"
            className="ce-select"
            style={{ width: 'auto', minWidth: '125px' }}
            value={semester}
            onChange={(e) => {
              setSemester(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Semesters</option>
            {SEMESTERS.map((s) => (
              <option key={s} value={s}>
                Semester {s}
              </option>
            ))}
          </select>
        </div>

        <div
          className="ce-row-between"
          style={{ flexWrap: 'wrap', gap: '0.75rem', paddingTop: '0.25rem' }}
        >
          <div className="ce-row" style={{ flexWrap: 'wrap', gap: '0.6rem' }}>
            <SlidersHorizontal size={15} className="ce-muted" />
            <select
              aria-label="Filter by Pricing Mode"
              className="ce-select"
              style={{ width: 'auto', padding: '0.35rem 0.65rem', fontSize: '0.84rem' }}
              value={listingType}
              onChange={(e) => {
                setListingType(e.target.value);
                setPage(1);
              }}
            >
              <option value="">Any Listing Type</option>
              {LISTING_TYPES.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>

            <select
              aria-label="Filter by Condition"
              className="ce-select"
              style={{ width: 'auto', padding: '0.35rem 0.65rem', fontSize: '0.84rem' }}
              value={condition}
              onChange={(e) => {
                setCondition(e.target.value);
                setPage(1);
              }}
            >
              <option value="">Any Condition</option>
              {LISTING_CONDITIONS.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>

            <input
              type="number"
              min="0"
              aria-label="Minimum Price in INR"
              className="ce-input"
              style={{ width: '115px', padding: '0.35rem 0.65rem', fontSize: '0.84rem' }}
              placeholder="Min ₹"
              value={minPrice}
              onChange={(e) => {
                setMinPrice(e.target.value);
                setPage(1);
              }}
            />

            <input
              type="number"
              min="0"
              aria-label="Maximum Price in INR"
              className="ce-input"
              style={{ width: '115px', padding: '0.35rem 0.65rem', fontSize: '0.84rem' }}
              placeholder="Max ₹"
              value={maxPrice}
              onChange={(e) => {
                setMaxPrice(e.target.value);
                setPage(1);
              }}
            />

            <select
              aria-label="Sort Listings"
              className="ce-select"
              style={{ width: 'auto', padding: '0.35rem 0.65rem', fontSize: '0.84rem' }}
              value={sort}
              onChange={(e) => setSort(e.target.value)}
            >
              <option value="newest">Newest First</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
            </select>
          </div>

          <div className="ce-row" style={{ gap: '0.75rem', alignItems: 'center' }}>
            {isFetching && !isLoading && (
              <span className="ce-loading-pill" role="status" aria-label="Updating feed">
                <LoadingSpinner size="xs" />
                <span>Updating feed...</span>
              </span>
            )}
            <span className="ce-muted" style={{ fontSize: '0.84rem' }}>
              {pagination.totalItems} {pagination.totalItems === 1 ? 'listing' : 'listings'}
            </span>
            <button
              type="button"
              className="ce-btn ce-btn-ghost ce-btn-sm"
              onClick={handleClearFilters}
            >
              Reset Filters
            </button>
          </div>
        </div>
      </div>

      {isLoading ? (
        <LoadingState label="Searching campus marketplace..." rows={6} />
      ) : error && (error.status === 401 || error.status === 403) ? (
        <EmptyState
          title="Verified Campus Access Required"
          description="Sign in with your verified institutional college email to browse and reserve student marketplace listings."
          action={
            <div className="ce-row" style={{ justifyContent: 'center', gap: '0.75rem' }}>
              <Link to="/login" className="ce-btn ce-btn-primary">
                Sign In
              </Link>
              <Link to="/register" className="ce-btn ce-btn-secondary">
                Register College Email
              </Link>
            </div>
          }
        />
      ) : error ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : listings.length === 0 ? (
        <EmptyState
          title="No items found"
          description="Try broadening your branch, semester, price range, or keyword filters, or post your own listing."
          action={
            <button type="button" className="ce-btn ce-btn-secondary" onClick={handleClearFilters}>
              Clear All Filters
            </button>
          }
        />
      ) : (
        <>
          <div className="ce-grid-cards">
            {listings.map((item) => {
              const sellerRating = item.seller?.ratingAverage ?? item.seller?.averageRating ?? 0;
              return (
                <Link
                  key={item.listingCode}
                  to={`/listings/${item.listingCode}`}
                  className="ce-card ce-card-interactive ce-stack"
                  style={{ justifyContent: 'space-between' }}
                >
                  <div className="ce-stack" style={{ gap: '0.65rem' }}>
                    {item.images?.[0]?.url && (
                      <div
                        style={{
                          height: '165px',
                          borderRadius: 'var(--ce-radius-md)',
                          overflow: 'hidden',
                          background: 'var(--ce-bg-elevated)',
                          border: '1px solid var(--ce-border)',
                        }}
                      >
                        <img
                          src={item.images[0].url}
                          alt={item.title}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      </div>
                    )}

                    <div className="ce-row-between">
                      <div className="ce-row" style={{ gap: '0.35rem', flexWrap: 'wrap' }}>
                        <CodeBadge>{item.branch || item.department}</CodeBadge>
                        {item.semester && <CodeBadge>Sem {item.semester}</CodeBadge>}
                        {item.isDemoSeed && <span className="ce-badge ce-badge-demo">DEMO</span>}
                      </div>
                      <StatusBadge status={item.status} />
                    </div>

                    <h3 className="ce-card-title" style={{ lineHeight: 1.35 }}>
                      {item.title}
                    </h3>

                    <div className="ce-muted" style={{ fontSize: '0.82rem' }}>
                      {item.subject || item.category?.name || 'Campus Item'}
                    </div>
                  </div>

                  <div
                    className="ce-stack"
                    style={{
                      gap: '0.5rem',
                      marginTop: '0.75rem',
                      paddingTop: '0.75rem',
                      borderTop: '1px solid var(--ce-border)',
                    }}
                  >
                    <div className="ce-row-between">
                      <span className="ce-price-tag" style={{ fontSize: '1.15rem' }}>
                        {formatPrice(item)}
                      </span>
                      <span className="ce-badge ce-badge-neutral">
                        {formatCondition(item.condition)}
                      </span>
                    </div>

                    {item.seller && (
                      <div
                        className="ce-row-between"
                        style={{ fontSize: '0.78rem', color: 'var(--ce-text-muted)' }}
                      >
                        <span>Seller: {item.seller.fullName}</span>
                        {sellerRating > 0 && (
                          <span className="ce-row" style={{ gap: '0.2rem' }}>
                            <Star size={12} color="var(--ce-warning)" />
                            {Number(sellerRating).toFixed(1)}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>

          {pagination.totalPages > 1 && (
            <div
              className="ce-row"
              style={{ justifyContent: 'center', marginTop: '1rem', gap: '0.75rem' }}
            >
              <button
                type="button"
                className="ce-btn ce-btn-secondary ce-btn-sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </button>
              <span className="ce-muted" style={{ fontSize: '0.88rem' }}>
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <button
                type="button"
                className="ce-btn ce-btn-secondary ce-btn-sm"
                disabled={page >= pagination.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

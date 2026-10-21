import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AppProviders } from '../app/providers.jsx';
import { AppRouter } from '../app/router.jsx';
import { formatPrice, formatBytes, formatCondition } from '../lib/formatters.js';
import { StatusBadge } from '../components/StatusBadge.jsx';
import { CodeBadge } from '../components/CodeBadge.jsx';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '../lib/query-client.js';
import { TopLoadingBar } from '../components/TopLoadingBar.jsx';
import { LoadingState, LoadingSpinner } from '../components/FeedbackStates.jsx';
import { subscribeToActiveRequests, getActiveRequestCount, apiRequest } from '../lib/api-client.js';
import { NotificationsPage } from '../features/notifications/NotificationsPage.jsx';

describe('CampusExchange Frontend Suite', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    globalThis.fetch = vi.fn((url) => {
      const urlStr = String(url);
      if (urlStr.includes('/auth/refresh')) {
        return Promise.resolve({
          ok: false,
          status: 401,
          headers: { get: () => 'application/json' },
          json: () =>
            Promise.resolve({
              success: false,
              error: { code: 'UNAUTHORIZED', message: 'Not authenticated' },
            }),
        });
      }
      if (urlStr.includes('/listings')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          headers: { get: () => 'application/json' },
          json: () =>
            Promise.resolve({
              success: true,
              data: [
                {
                  listingCode: 'CEL-TEST01',
                  title: 'CLRS Introduction to Algorithms 3rd Ed',
                  branch: 'CSE',
                  academicYear: '2',
                  semester: '4',
                  subject: 'Design and Analysis of Algorithms',
                  condition: 'like_new',
                  listingType: 'sell',
                  pricePaise: 45000,
                  priceInr: 450,
                  status: 'active',
                  isDemoSeed: true,
                },
              ],
              meta: { page: 1, limit: 12, total: 1, totalPages: 1 },
            }),
        });
      }
      if (urlStr.includes('/resources')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          headers: { get: () => 'application/json' },
          json: () =>
            Promise.resolve({
              success: true,
              data: [
                {
                  resourceCode: 'CER-TEST01',
                  title: 'CS301 Operating Systems End-Sem PYQ',
                  subject: 'Operating Systems',
                  branch: 'CSE',
                  academicYear: '3',
                  semester: '5',
                  resourceType: 'pyq',
                  examYear: '2025',
                  status: 'active',
                  downloadCount: 42,
                  fileInfo: { byteSize: 512000 },
                },
              ],
              meta: { page: 1, limit: 24, total: 1, totalPages: 1 },
            }),
        });
      }
      if (urlStr.includes('/categories')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          headers: { get: () => 'application/json' },
          json: () =>
            Promise.resolve({
              success: true,
              data: {
                categories: [{ slug: 'textbooks', name: 'Textbooks & Reference' }],
              },
            }),
        });
      }
      return Promise.resolve({
        ok: true,
        status: 200,
        headers: { get: () => 'application/json' },
        json: () => Promise.resolve({ success: true, data: {} }),
      });
    });
  });

  it('formats pricing modes, paise/INR, bytes, and item conditions accurately', () => {
    expect(formatPrice({ listingType: 'sell', pricePaise: 0 })).toBe('Free');
    expect(formatPrice({ listingType: 'exchange', pricePaise: 0 })).toBe('Exchange');
    expect(formatPrice({ listingType: 'sell', pricePaise: 45000, priceInr: 450 })).toContain('450');
    expect(formatBytes(512000)).toBe('500.0 KB');
    expect(formatCondition('like_new')).toBe('Like New');
  });

  it('renders StatusBadge (with icon + label) and CodeBadge with editorial semantics', () => {
    render(
      <div>
        <StatusBadge status="active" />
        <CodeBadge code="CS301" />
      </div>
    );
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText('CS301')).toBeInTheDocument();
  });

  it('renders the LandingPage hero and sample campus listings', async () => {
    render(
      <AppProviders RouterComponent={MemoryRouter} routerProps={{ initialEntries: ['/'] }}>
        <AppRouter />
      </AppProviders>
    );

    expect(
      await screen.findByText(/Pass down textbooks, lab gear, and verified PYQs/i)
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText(/CLRS Introduction to Algorithms/i)).toBeInTheDocument();
    });
  });

  it('renders MarketplacePage with complete FR-05 filters and listing cards', async () => {
    render(
      <AppProviders
        RouterComponent={MemoryRouter}
        routerProps={{ initialEntries: ['/marketplace'] }}
      >
        <AppRouter />
      </AppProviders>
    );

    expect(
      await screen.findByText(/Student Textbooks, Lab Kits & Engineering Gear/i)
    ).toBeInTheDocument();

    expect(screen.getByLabelText(/Filter by Subject/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Filter by Academic Year/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Minimum Price in INR/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Maximum Price in INR/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText(/CLRS Introduction to Algorithms/i)).toBeInTheDocument();
    });
  });

  it('redirects unauthenticated guests from protected /app route to /login', async () => {
    render(
      <AppProviders RouterComponent={MemoryRouter} routerProps={{ initialEntries: ['/app'] }}>
        <AppRouter />
      </AppProviders>
    );

    await waitFor(() => {
      expect(screen.getByText(/Sign in to CampusExchange/i)).toBeInTheDocument();
    });
  });

  it('renders VerifyEmailPage without Dev OTP autofill button and keeps manual verification form fully intact', async () => {
    render(
      <AppProviders
        RouterComponent={MemoryRouter}
        routerProps={{ initialEntries: ['/verify-email?email=student%40nitk.edu.in'] }}
      >
        <AppRouter />
      </AppProviders>
    );

    expect(await screen.findByRole('heading', { name: /Verify Your Campus Email/i })).toBeInTheDocument();

    // Verify institutional email input is present with prefilled param
    const emailInput = screen.getByLabelText(/Institutional Email/i);
    expect(emailInput).toBeInTheDocument();
    expect(emailInput).toHaveValue('student@nitk.edu.in');

    // Verify 6-digit OTP code input is present
    const otpInput = screen.getByLabelText(/6-Digit OTP Code/i);
    expect(otpInput).toBeInTheDocument();

    // Verify submit and resend buttons exist
    expect(screen.getByRole('button', { name: /Complete Verification/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Resend OTP/i })).toBeInTheDocument();

    // Crucially: Dev OTP autofill button MUST NOT exist
    expect(screen.queryByText(/Autofill Dev Outbox OTP/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Local Dev Outbox OTP/i)).not.toBeInTheDocument();
  });

  it('tracks active apiRequest lifecycle and renders TopLoadingBar correctly', async () => {
    expect(getActiveRequestCount()).toBe(0);

    let observedCount = -1;
    const unsubscribe = subscribeToActiveRequests((count) => {
      observedCount = count;
    });

    expect(observedCount).toBe(0);

    // Render TopLoadingBar within AppProviders
    const { unmount } = render(
      <AppProviders RouterComponent={MemoryRouter} routerProps={{ initialEntries: ['/'] }}>
        <TopLoadingBar />
      </AppProviders>
    );

    // Wait for initial AuthProvider mount refresh to settle
    await waitFor(() => {
      expect(getActiveRequestCount()).toBe(0);
    });

    // Trigger an apiRequest and assert active count tracking
    await act(async () => {
      const reqPromise = apiRequest('/listings');
      expect(getActiveRequestCount()).toBe(1);
      expect(observedCount).toBe(1);
      await reqPromise;
    });

    expect(getActiveRequestCount()).toBe(0);
    expect(observedCount).toBe(0);

    unsubscribe();
    unmount();
  });

  it('keeps TopLoadingBar visible during rapid sequential requests without leaked reset timeouts hiding it', async () => {
    vi.useFakeTimers();

    const { unmount } = render(
      <QueryClientProvider client={queryClient}>
        <TopLoadingBar />
      </QueryClientProvider>
    );

    // Initial state: not busy, not visible
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();

    // Trigger request 1
    let finishReq1;
    const p1 = new Promise((resolve) => {
      finishReq1 = resolve;
    });
    globalThis.fetch = vi.fn().mockImplementation(() => p1);

    let req1Promise;
    act(() => {
      req1Promise = apiRequest('/test-seq-1');
    });

    expect(screen.getByRole('progressbar')).toBeInTheDocument();

    // Finish request 1
    await act(async () => {
      finishReq1({
        ok: true,
        headers: { get: () => 'application/json' },
        json: async () => ({ success: true, data: {} }),
      });
      await req1Promise;
    });

    // Advance 230ms (complete timeout has fired, reset timeout is scheduled)
    act(() => {
      vi.advanceTimersByTime(230);
    });

    // Start request 2 during the completion/fade window
    let finishReq2;
    const p2 = new Promise((resolve) => {
      finishReq2 = resolve;
    });
    globalThis.fetch = vi.fn().mockImplementation(() => p2);

    let req2Promise;
    act(() => {
      req2Promise = apiRequest('/test-seq-2');
    });

    // Bar must remain visible for request 2
    expect(screen.getByRole('progressbar')).toBeInTheDocument();

    // Advance 300ms (to 530ms, when old leaked resetTimeout would have fired at 500ms and killed the bar!)
    act(() => {
      vi.advanceTimersByTime(300);
    });

    // Bar MUST still be visible because pending reset timeout was cancelled!
    expect(screen.getByRole('progressbar')).toBeInTheDocument();

    // Finish request 2
    await act(async () => {
      finishReq2({
        ok: true,
        headers: { get: () => 'application/json' },
        json: async () => ({ success: true, data: {} }),
      });
      await req2Promise;
    });

    // Advance past completion and fade
    act(() => {
      vi.advanceTimersByTime(600);
    });

    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();

    unmount();
    vi.useRealTimers();
  });

  it('displays cold-start banner if backend response takes longer than 3.5s', async () => {
    vi.useFakeTimers();

    const { unmount } = render(
      <QueryClientProvider client={queryClient}>
        <TopLoadingBar />
      </QueryClientProvider>
    );

    let finishSlowReq;
    const slowPromise = new Promise((resolve) => {
      finishSlowReq = resolve;
    });
    globalThis.fetch = vi.fn().mockImplementation(() => slowPromise);

    let reqPromise;
    act(() => {
      reqPromise = apiRequest('/slow-backend-spinup');
    });

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    expect(screen.queryByText(/Render cold start/i)).not.toBeInTheDocument();

    // Advance 3600ms (past 3.5s threshold)
    act(() => {
      vi.advanceTimersByTime(3600);
    });

    expect(screen.getByText(/Render cold start/i)).toBeInTheDocument();

    // Finish request
    await act(async () => {
      finishSlowReq({
        ok: true,
        headers: { get: () => 'application/json' },
        json: async () => ({ success: true, data: {} }),
      });
      await reqPromise;
    });

    // Advance past completion and fade
    act(() => {
      vi.advanceTimersByTime(600);
    });

    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    expect(screen.queryByText(/Render cold start/i)).not.toBeInTheDocument();

    unmount();
    vi.useRealTimers();
  });

  it('renders LoadingSpinner with circular SVG, role status, and optional cold-start hint', () => {
    vi.useFakeTimers();

    const { unmount } = render(
      <LoadingSpinner size="md" label="Loading test data..." showColdStartHint coldStartDelay={1000} />
    );

    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByText('Loading test data...')).toBeInTheDocument();
    expect(screen.queryByText(/Waking up Render backend/i)).not.toBeInTheDocument();

    // Advance timers past cold-start delay
    act(() => {
      vi.advanceTimersByTime(1100);
    });

    expect(screen.getByText(/Waking up Render backend/i)).toBeInTheDocument();

    unmount();
    vi.useRealTimers();
  });

  it('renders LoadingState with embedded LoadingSpinner and card skeletons', () => {
    const { unmount } = render(<LoadingState label="Searching campus marketplace..." rows={3} />);

    expect(screen.getByText('Searching campus marketplace...')).toBeInTheDocument();
    const spinner = document.querySelector('.ce-spinner');
    expect(spinner).toBeInTheDocument();
    const skeletons = document.querySelectorAll('.ce-skeleton');
    expect(skeletons.length).toBe(9); // 3 rows * 3 skeletons per card

    unmount();
  });

  it('renders AppShell with responsive mobile toggle and opens navigation drawer on click', async () => {
    const { unmount } = render(
      <AppProviders RouterComponent={MemoryRouter} routerProps={{ initialEntries: ['/'] }}>
        <AppRouter />
      </AppProviders>
    );

    const toggleBtn = screen.getByLabelText(/Open navigation menu/i);
    expect(toggleBtn).toBeInTheDocument();
    expect(document.querySelector('.ce-mobile-drawer')).not.toBeInTheDocument();

    // Open drawer
    await act(async () => {
      toggleBtn.click();
    });

    expect(screen.getByLabelText(/Close navigation menu/i)).toBeInTheDocument();
    const drawer = document.querySelector('.ce-mobile-drawer');
    expect(drawer).toBeInTheDocument();

    // Close drawer
    const closeBtn = screen.getByLabelText(/Close navigation menu/i);
    await act(async () => {
      closeBtn.click();
    });

    expect(document.querySelector('.ce-mobile-drawer')).not.toBeInTheDocument();
    unmount();
  });

  it('renders MessagesPage with ce-chat-layout to prevent horizontal overflow', async () => {
    globalThis.fetch = vi.fn((url) => {
      const urlStr = String(url);
      if (urlStr.includes('/auth/refresh')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          headers: { get: () => 'application/json' },
          json: () =>
            Promise.resolve({
              success: true,
              data: {
                accessToken: 'mock-token',
                user: {
                  userCode: 'CEU-STUDENT1',
                  fullName: 'Test Student',
                  collegeEmail: 'student@nitk.edu.in',
                  role: 'student',
                  accountStatus: 'verified',
                  isEmailVerified: true,
                },
              },
            }),
        });
      }
      if (urlStr.includes('/conversations')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          headers: { get: () => 'application/json' },
          json: () =>
            Promise.resolve({
              success: true,
              data: [
                {
                  conversationCode: 'CEC-TEST01',
                  listing: { title: 'Test Book' },
                  otherParticipant: { fullName: 'Peer Student' },
                  lastMessagePreview: 'Ready for pickup at library',
                },
              ],
            }),
        });
      }
      return Promise.resolve({
        ok: true,
        status: 200,
        headers: { get: () => 'application/json' },
        json: () => Promise.resolve({ success: true, data: {} }),
      });
    });

    const { unmount } = render(
      <AppProviders RouterComponent={MemoryRouter} routerProps={{ initialEntries: ['/messages'] }}>
        <AppRouter />
      </AppProviders>
    );

    await waitFor(() => {
      expect(screen.getByText(/Campus Handover Coordination/i)).toBeInTheDocument();
    });

    const chatContainer = document.querySelector('.ce-chat-layout');
    expect(chatContainer).toBeInTheDocument();
    expect(chatContainer).toHaveClass('ce-chat-layout');
    expect(chatContainer.style.gridTemplateColumns).toBe('');

    unmount();
  });

  it('renders LandingPage with responsive activity feed items containing minWidth: 0', async () => {
    const { unmount } = render(
      <AppProviders RouterComponent={MemoryRouter} routerProps={{ initialEntries: ['/'] }}>
        <AppRouter />
      </AppProviders>
    );

    expect(screen.getByText(/Live Campus Activity Pulse/i)).toBeInTheDocument();
    const feedItems = document.querySelectorAll('.ce-live-feed-item');
    expect(feedItems.length).toBeGreaterThan(0);
    feedItems.forEach((item) => {
      expect(item).toHaveClass('ce-live-feed-item');
      const innerRow = item.querySelector('.ce-row');
      expect(innerRow).toBeInTheDocument();
      expect(innerRow.style.minWidth === '0' || innerRow.style.minWidth === '0px').toBe(true);
    });

    unmount();
  });

  it('toggles collapsible secondary filter tray on MarketplacePage when clicking filter toggle button', async () => {
    const { unmount } = render(
      <AppProviders RouterComponent={MemoryRouter} routerProps={{ initialEntries: ['/marketplace'] }}>
        <AppRouter />
      </AppProviders>
    );

    await waitFor(() => {
      expect(screen.getByText(/Campus Marketplace/i)).toBeInTheDocument();
    });

    const toggleBtn = screen.getByRole('button', { name: /Show filter options/i });
    expect(toggleBtn).toBeInTheDocument();

    const filterTray = document.querySelector('.ce-marketplace-secondary-filters');
    expect(filterTray).toBeInTheDocument();
    expect(filterTray).not.toHaveClass('expanded');

    // Click toggle to expand
    await act(async () => {
      toggleBtn.click();
    });

    expect(toggleBtn).toHaveAttribute('aria-label', 'Hide filter options');
    expect(filterTray).toHaveClass('expanded');

    // Click toggle to collapse
    await act(async () => {
      toggleBtn.click();
    });

    expect(toggleBtn).toHaveAttribute('aria-label', 'Show filter options');
    expect(filterTray).not.toHaveClass('expanded');

    unmount();
  });

  it('hides mobile bottom nav on listing detail page to avoid sticky action collision', async () => {
    // 1. On marketplace page, bottom nav is rendered
    const { unmount: unmountMarket } = render(
      <AppProviders RouterComponent={MemoryRouter} routerProps={{ initialEntries: ['/marketplace'] }}>
        <AppRouter />
      </AppProviders>
    );

    await waitFor(() => {
      expect(screen.getByText(/Campus Marketplace/i)).toBeInTheDocument();
    });
    expect(document.querySelector('.ce-mobile-bottom-nav')).toBeInTheDocument();
    unmountMarket();

    // 2. On listing detail page, bottom nav is hidden to avoid overlapping sticky action bar
    globalThis.fetch = vi.fn((url) => {
      const urlStr = String(url);
      if (urlStr.includes('/listings/CEL-TEST01')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          headers: { get: () => 'application/json' },
          json: () =>
            Promise.resolve({
              success: true,
              data: {
                listing: {
                  listingCode: 'CEL-TEST01',
                  title: 'Engineering Mechanics by Timoshenko',
                  description: 'Original copy with lab notes',
                  branch: 'MECH',
                  semester: '2',
                  condition: 'good',
                  listingType: 'sell',
                  priceInr: 300,
                  pricePaise: 30000,
                  status: 'active',
                  seller: {
                    userCode: 'CEU-SELLER1',
                    fullName: 'Senior Mechanical Student',
                    ratingAverage: 4.8,
                    ratingCount: 5,
                  },
                },
              },
            }),
        });
      }
      return Promise.resolve({
        ok: true,
        status: 200,
        headers: { get: () => 'application/json' },
        json: () => Promise.resolve({ success: true, data: {} }),
      });
    });

    const { unmount: unmountDetail } = render(
      <AppProviders RouterComponent={MemoryRouter} routerProps={{ initialEntries: ['/listings/CEL-TEST01'] }}>
        <AppRouter />
      </AppProviders>
    );

    await waitFor(() => {
      expect(screen.getByText(/Engineering Mechanics by Timoshenko/i)).toBeInTheDocument();
    });

    // Mobile bottom nav should NOT be rendered on detail pages
    expect(document.querySelector('.ce-mobile-bottom-nav')).not.toBeInTheDocument();
    // Sticky mobile listing actions should be rendered
    expect(document.querySelector('.ce-mobile-listing-actions')).toBeInTheDocument();

    unmountDetail();
  });

  it('synchronizes mobileThreadOpen when navigating between thread and conversation list', async () => {
    globalThis.fetch = vi.fn((url) => {
      const urlStr = String(url);
      if (urlStr.includes('/auth/refresh')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          headers: { get: () => 'application/json' },
          json: () =>
            Promise.resolve({
              success: true,
              data: {
                accessToken: 'mock-token',
                user: {
                  userCode: 'CEU-STUDENT1',
                  fullName: 'Test Student',
                  collegeEmail: 'student@nitk.edu.in',
                  role: 'student',
                  accountStatus: 'verified',
                  isEmailVerified: true,
                },
              },
            }),
        });
      }
      if (urlStr.includes('/conversations/CEC-TEST01')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          headers: { get: () => 'application/json' },
          json: () =>
            Promise.resolve({
              success: true,
              data: {
                conversation: {
                  conversationCode: 'CEC-TEST01',
                  listing: { title: 'Test Book', listingCode: 'CEL-001' },
                  messages: [{ id: '1', sender: { userCode: 'CEU-STUDENT1' }, body: 'Hi' }],
                },
              },
            }),
        });
      }
      if (urlStr.includes('/conversations')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          headers: { get: () => 'application/json' },
          json: () =>
            Promise.resolve({
              success: true,
              data: [
                {
                  conversationCode: 'CEC-TEST01',
                  listing: { title: 'Test Book' },
                  otherParticipant: { fullName: 'Peer Student' },
                  lastMessagePreview: 'Ready for pickup',
                },
              ],
            }),
        });
      }
      return Promise.resolve({
        ok: true,
        status: 200,
        headers: { get: () => 'application/json' },
        json: () => Promise.resolve({ success: true, data: {} }),
      });
    });

    // When on thread view, layout has mobile-thread-active
    const { unmount: unmountThread } = render(
      <AppProviders RouterComponent={MemoryRouter} routerProps={{ initialEntries: ['/messages/CEC-TEST01'] }}>
        <AppRouter />
      </AppProviders>
    );

    await waitFor(() => {
      const layout = document.querySelector('.ce-chat-layout');
      expect(layout).toHaveClass('mobile-thread-active');
    });
    // Bottom nav should be hidden on message thread view
    expect(document.querySelector('.ce-mobile-bottom-nav')).not.toBeInTheDocument();
    unmountThread();

    // When on conversation list view, layout has mobile-list-active
    const { unmount: unmountList } = render(
      <AppProviders RouterComponent={MemoryRouter} routerProps={{ initialEntries: ['/messages'] }}>
        <AppRouter />
      </AppProviders>
    );

    await waitFor(() => {
      const layout = document.querySelector('.ce-chat-layout');
      expect(layout).toHaveClass('mobile-list-active');
    });
    // Bottom nav is visible on main messages list view
    expect(document.querySelector('.ce-mobile-bottom-nav')).toBeInTheDocument();
    unmountList();
  });

  it('removes fake campus savings calculator and unnecessary clutter from LandingPage', async () => {
    const { unmount } = render(
      <AppProviders RouterComponent={MemoryRouter} routerProps={{ initialEntries: ['/'] }}>
        <AppRouter />
      </AppProviders>
    );

    // Verify hero and activity pulse remain
    expect(
      await screen.findByText(/Pass down textbooks, lab gear, and verified PYQs/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/Live Campus Activity Pulse/i)).toBeInTheDocument();

    // Verify fake calculator and its mock calculations are completely removed
    expect(screen.queryByLabelText(/Campus Savings Estimator/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Campus Savings & Cohort Explorer/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Estimated semester peer savings/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Direct Student Savings/i)).not.toBeInTheDocument();

    unmount();
  });

  it('renders streamlined navbar without redundant badge clutter or heading collision', async () => {
    const { unmount } = render(
      <AppProviders RouterComponent={MemoryRouter} routerProps={{ initialEntries: ['/'] }}>
        <AppRouter />
      </AppProviders>
    );

    const brandLink = screen.getByRole('link', { name: /CampusExchange Home/i });
    expect(brandLink).toBeInTheDocument();
    // Brand should be clean text, not containing VERIFIED CAMPUS badge inside logo
    expect(brandLink.querySelector('.ce-brand-badge')).toBeNull();

    // Navbar should have separated desktop and mobile containers
    const desktopControls = document.querySelector('.ce-row.ce-desktop-only');
    expect(desktopControls).toBeInTheDocument();
    const mobileControls = document.querySelector('.ce-row.ce-mobile-only');
    expect(mobileControls).toBeInTheDocument();

    unmount();
  });

  it('renders clean page headers across main views without redundant stacked badges', async () => {
    // 1. Marketplace page header is clean
    const { unmount: unmountMarket } = render(
      <AppProviders RouterComponent={MemoryRouter} routerProps={{ initialEntries: ['/marketplace'] }}>
        <AppRouter />
      </AppProviders>
    );

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1, name: /Campus Marketplace/i })).toBeInTheDocument();
    });
    const marketH1 = screen.getByRole('heading', { level: 1, name: /Campus Marketplace/i });
    expect(marketH1.previousElementSibling).toBeNull();
    unmountMarket();

    // 2. Resources page header is clean
    const { unmount: unmountRes } = render(
      <AppProviders RouterComponent={MemoryRouter} routerProps={{ initialEntries: ['/resources'] }}>
        <AppRouter />
      </AppProviders>
    );

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1, name: /PYQ & Study Library/i })).toBeInTheDocument();
    });
    const resH1 = screen.getByRole('heading', { level: 1, name: /PYQ & Study Library/i });
    expect(resH1.previousElementSibling).toBeNull();
    expect(screen.queryByText(/ACADEMIC RESOURCE & PYQ ARCHIVE/i)).not.toBeInTheDocument();
    unmountRes();

    // 3. Login page header is clean
    const { unmount: unmountLogin } = render(
      <AppProviders RouterComponent={MemoryRouter} routerProps={{ initialEntries: ['/login'] }}>
        <AppRouter />
      </AppProviders>
    );

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1, name: /Sign in to CampusExchange/i })).toBeInTheDocument();
    });
    expect(screen.queryByText(/CAMPUS AUTHENTICATION/i)).not.toBeInTheDocument();
    unmountLogin();

    // 4. Notifications page header is clean
    const { unmount: unmountNotif } = render(
      <AppProviders RouterComponent={MemoryRouter}>
        <NotificationsPage />
      </AppProviders>
    );

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1, name: /Campus Alerts & Moderation Updates/i })).toBeInTheDocument();
    });
    expect(screen.queryByText(/IN-APP ACTIVITY STREAM/i)).not.toBeInTheDocument();
    unmountNotif();
  });
});




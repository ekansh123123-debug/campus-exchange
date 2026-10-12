import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AppProviders } from '../app/providers.jsx';
import { AppRouter } from '../app/router.jsx';
import { formatPrice, formatBytes, formatCondition } from '../lib/formatters.js';
import { StatusBadge } from '../components/StatusBadge.jsx';
import { CodeBadge } from '../components/CodeBadge.jsx';

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
});

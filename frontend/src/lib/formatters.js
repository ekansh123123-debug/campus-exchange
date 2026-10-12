export function extractList(response) {
  if (!response) return [];
  if (Array.isArray(response.data)) return response.data;
  if (Array.isArray(response.data?.items)) return response.data.items;
  if (Array.isArray(response.data?.categories)) return response.data.categories;
  return [];
}

export function extractMeta(response) {
  const meta = response?.meta || response?.data?.pagination || {};
  const page = Number(meta.page || 1);
  const limit = Number(meta.limit || 12);
  const total = Number(meta.total ?? meta.totalItems ?? 0);
  const totalPages = Number(meta.totalPages || Math.max(1, Math.ceil(total / limit)));
  return { page, limit, total, totalItems: total, totalPages };
}

export function formatPrice(listing) {
  if (!listing) return '—';
  const type = String(listing.listingType || listing.pricingMode || '').toLowerCase();
  if (type === 'exchange') return 'Exchange';
  if (type === 'free') return 'Free';

  const amount =
    listing.priceInr !== undefined
      ? Number(listing.priceInr)
      : listing.price !== undefined
        ? Number(listing.price)
        : listing.priceAmount !== undefined
          ? Number(listing.priceAmount)
          : listing.pricePaise !== undefined
            ? Number(listing.pricePaise) / 100
            : 0;

  if (amount === 0) return 'Free';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatCurrency(amount) {
  const num = Number(amount || 0);
  if (num === 0) return 'Free';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(num);
}

export function formatDate(dateString) {
  if (!dateString) return '—';
  try {
    return new Intl.DateTimeFormat('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(new Date(dateString));
  } catch {
    return '—';
  }
}

export function formatDateTime(dateString) {
  if (!dateString) return '—';
  try {
    return new Intl.DateTimeFormat('en-IN', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(dateString));
  } catch {
    return '—';
  }
}

export function formatBytes(bytes) {
  const value = Number(bytes || 0);
  if (!value) return '0 KB';
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / (1024 * 1024)).toFixed(2)} MB`;
}

export function formatCondition(condition) {
  const key = String(condition || '').toLowerCase();
  const map = {
    new: 'New',
    like_new: 'Like New',
    good: 'Good',
    fair: 'Fair',
    for_parts: 'For Parts',
    heavily_used: 'Heavily Used',
  };
  return map[key] || condition || 'Good';
}

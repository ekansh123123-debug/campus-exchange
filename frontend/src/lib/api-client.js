const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

let accessToken = null;
let csrfToken = null;
let refreshPromise = null;

export function setAuthTokens({ token, csrf }) {
  if (token !== undefined) accessToken = token;
  if (csrf !== undefined) csrfToken = csrf;
}

export function clearAuthTokens() {
  accessToken = null;
  csrfToken = null;
}

export function getAccessToken() {
  return accessToken;
}

export function getCsrfToken() {
  if (csrfToken) return csrfToken;
  if (typeof document !== 'undefined') {
    const match =
      document.cookie.match(/(?:^|;\s*)ce_csrf=([^;]*)/) ||
      document.cookie.match(/(?:^|;\s*)ce_csrf_token=([^;]*)/);
    if (match) return decodeURIComponent(match[1]);
  }
  return null;
}

export class ApiClientError extends Error {
  constructor(message, { status = 500, code = 'API_ERROR', details = [], requestId = null } = {}) {
    super(message);
    this.name = 'ApiClientError';
    this.status = status;
    this.code = code;
    this.details = details;
    this.requestId = requestId;
  }
}

async function performRefresh() {
  if (refreshPromise) return refreshPromise;
  refreshPromise = (async () => {
    try {
      const headers = { 'Content-Type': 'application/json' };
      const currentCsrf = getCsrfToken();
      if (currentCsrf) {
        headers['x-csrf-token'] = currentCsrf;
      }
      const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
        headers,
      });
      if (!res.ok) {
        clearAuthTokens();
        return null;
      }
      const payload = await res.json();
      if (payload?.data?.accessToken) {
        setAuthTokens({
          token: payload.data.accessToken,
          csrf: payload.data.csrfToken || currentCsrf,
        });
        return payload.data;
      }
      clearAuthTokens();
      return null;
    } catch {
      clearAuthTokens();
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

export async function apiRequest(path, options = {}) {
  const {
    method = 'GET',
    body,
    params,
    headers: customHeaders = {},
    skipRefresh = false,
  } = options;

  let url = path.startsWith('http') ? path : `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
  if (params && typeof params === 'object') {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.set(key, String(value));
      }
    });
    const queryString = searchParams.toString();
    if (queryString) {
      url += `${url.includes('?') ? '&' : '?'}${queryString}`;
    }
  }

  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;
  const headers = { ...customHeaders };

  if (!isFormData && body !== undefined && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  const activeCsrf = getCsrfToken();
  if (activeCsrf) {
    headers['x-csrf-token'] = activeCsrf;
  }

  const fetchConfig = {
    method,
    credentials: 'include',
    headers,
  };

  if (body !== undefined) {
    fetchConfig.body = isFormData ? body : JSON.stringify(body);
  }

  let response = await fetch(url, fetchConfig);

  if (
    response.status === 401 &&
    !skipRefresh &&
    !path.includes('/auth/login') &&
    !path.includes('/auth/register') &&
    !path.includes('/auth/refresh')
  ) {
    const refreshed = await performRefresh();
    if (refreshed?.accessToken) {
      headers.Authorization = `Bearer ${refreshed.accessToken}`;
      if (refreshed.csrfToken) {
        headers['x-csrf-token'] = refreshed.csrfToken;
      }
      response = await fetch(url, { ...fetchConfig, headers });
    }
  }

  let payload;
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    payload = await response.json();
  } else {
    const text = await response.text();
    payload = { success: response.ok, message: text };
  }

  if (!response.ok || payload?.success === false) {
    const errInfo = payload?.error || {};
    throw new ApiClientError(errInfo.message || payload?.message || 'Request failed', {
      status: response.status,
      code: errInfo.code || 'API_ERROR',
      details: errInfo.details || [],
      requestId: payload?.requestId || null,
    });
  }

  return payload;
}

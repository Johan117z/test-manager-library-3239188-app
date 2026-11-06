// HTTP client for the Manager Library API (api-contract.md).
// - Sends `Authorization: Bearer <token>` on every call except login.
// - Turns any non-2xx response into an ApiError that carries the single error body
//   { code, message, details } so pages can show the API message as sent (Spanish).

export const API_URL = (import.meta.env?.VITE_API_URL || 'http://localhost:8000/api/v1').replace(/\/+$/, '');

export class ApiError extends Error {
  constructor(status, body) {
    super(body?.message || 'Unexpected error.');
    this.name = 'ApiError';
    this.status = status;
    this.code = body?.code || 'UNKNOWN_ERROR';
    this.details = Array.isArray(body?.details) ? body.details : [];
  }
}

let tokenProvider = () => null;
let unauthorizedHandler = () => {};

export function configureClient({ getToken, onUnauthorized } = {}) {
  if (getToken) tokenProvider = getToken;
  if (onUnauthorized) unauthorizedHandler = onUnauthorized;
}

export function buildQuery(params = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') query.append(key, String(value));
  });
  const text = query.toString();
  return text ? `?${text}` : '';
}

export async function request(path, { method = 'GET', body, params, auth = true, fetchImpl = globalThis.fetch } = {}) {
  const headers = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const token = auth ? tokenProvider() : null;
  if (token) headers.Authorization = `Bearer ${token}`;

  let response;
  try {
    response = await fetchImpl(`${API_URL}${path}${buildQuery(params)}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(0, { code: 'NETWORK_ERROR', message: 'Could not reach the server. Check your connection.' });
  }

  if (response.status === 204) return null;

  let data = null;
  const text = await response.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = null;
    }
  }

  if (!response.ok) {
    const error = new ApiError(
      response.status,
      data?.message ? data : { code: 'HTTP_ERROR', message: `Request failed (${response.status}).` },
    );
    // An invalid or expired token ends the session; a failed login is just shown to the user.
    if (response.status === 401 && auth) unauthorizedHandler(error);
    throw error;
  }
  return data;
}

export const api = {
  get: (path, params) => request(path, { params }),
  post: (path, body) => request(path, { method: 'POST', body }),
  put: (path, body) => request(path, { method: 'PUT', body }),
  del: (path) => request(path, { method: 'DELETE' }),
};

export function login(username, password) {
  return request('/auth/login', { method: 'POST', body: { username, password }, auth: false });
}

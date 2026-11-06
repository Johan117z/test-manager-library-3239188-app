import { describe, expect, it, vi } from 'vitest';
import { ApiError, buildQuery, configureClient, request } from './client.js';

function fakeResponse(status, body) {
  return {
    status,
    ok: status >= 200 && status < 300,
    text: async () => (body === undefined ? '' : JSON.stringify(body)),
  };
}

describe('api client', () => {
  it('sends the Bearer token on authenticated calls', async () => {
    configureClient({ getToken: () => 'abc123' });
    const fetchImpl = vi.fn().mockResolvedValue(fakeResponse(200, { items: [] }));
    await request('/books', { params: { q: 'cien', page: 1, category_id: '' }, fetchImpl });
    const [url, options] = fetchImpl.mock.calls[0];
    expect(url).toMatch(/\/api\/v1\/books\?q=cien&page=1$/);
    expect(options.headers.Authorization).toBe('Bearer abc123');
  });

  it('does not send the token on login', async () => {
    configureClient({ getToken: () => 'abc123' });
    const fetchImpl = vi.fn().mockResolvedValue(fakeResponse(200, { access_token: 't' }));
    await request('/auth/login', { method: 'POST', body: {}, auth: false, fetchImpl });
    expect(fetchImpl.mock.calls[0][1].headers.Authorization).toBeUndefined();
  });

  it('maps the single error body to ApiError', async () => {
    const body = {
      code: 'BOOK_NOT_AVAILABLE',
      message: 'No quedan ejemplares disponibles de «Cien años de soledad».',
      details: [{ field: 'items[0].book_id', issue: 'sin ejemplares' }],
    };
    const fetchImpl = vi.fn().mockResolvedValue(fakeResponse(409, body));
    const error = await request('/loans', { method: 'POST', body: {}, fetchImpl }).catch((e) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(409);
    expect(error.code).toBe('BOOK_NOT_AVAILABLE');
    expect(error.message).toBe(body.message);
    expect(error.details).toEqual(body.details);
  });

  it('ends the session on 401 for authenticated calls only', async () => {
    const onUnauthorized = vi.fn();
    configureClient({ getToken: () => 'expired', onUnauthorized });
    const fetchImpl = vi.fn().mockResolvedValue(fakeResponse(401, { code: 'INVALID_CREDENTIALS', message: 'x', details: [] }));
    await request('/books', { fetchImpl }).catch(() => {});
    await request('/auth/login', { method: 'POST', body: {}, auth: false, fetchImpl }).catch(() => {});
    expect(onUnauthorized).toHaveBeenCalledTimes(1);
  });

  it('returns null on 204', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(fakeResponse(204));
    expect(await request('/books/1', { method: 'DELETE', fetchImpl })).toBeNull();
  });

  it('skips empty query values', () => {
    expect(buildQuery({ q: '', page: 2, category_id: null })).toBe('?page=2');
  });
});

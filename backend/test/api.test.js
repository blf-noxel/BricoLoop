// @vitest-environment node
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import { BricoLoopService } from '../src/service.js';

let service;
let server;
let baseUrl;

beforeAll(async () => {
  // The app reads `service` lazily through this proxy so each test gets fresh demo data
  // without touching backend/.data.
  const proxy = new Proxy({}, { get: (_, key) => service[key].bind(service) });
  server = createApp(proxy).listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});
afterAll(() => new Promise((resolve) => server.close(resolve)));
beforeEach(() => {
  service = new BricoLoopService();
});

async function call(method, path, { user, body, headers = {} } = {}) {
  const res = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(user ? { 'X-User-Id': user } : {}),
      ...headers,
    },
    body: body === undefined ? undefined : typeof body === 'string' ? body : JSON.stringify(body),
  });
  return { status: res.status, data: await res.json().catch(() => null), headers: res.headers };
}

describe('Express API', () => {
  it('reports health and lists demo users', async () => {
    expect(await call('GET', '/health')).toMatchObject({ status: 200, data: { status: 'ok' } });
    const { data } = await call('GET', '/api/users');
    expect(data.map((u) => u.id)).toEqual(['u1', 'u2', 'u3', 'u4']);
  });

  it('filters the catalogue with query parameters', async () => {
    const all = await call('GET', '/api/tools');
    expect(all.data).toHaveLength(8);
    expect(all.data[0].owner.firstName).toBeTruthy();
    const search = await call('GET', '/api/tools?q=PERCEUSE');
    expect(search.data.map((t) => t.id)).toEqual(['t1']);
    const owner = await call('GET', '/api/tools?ownerId=u2&category=Nettoyage');
    expect(owner.data.map((t) => t.id)).toEqual(['t4']);
  });

  it('returns 404 for unknown tools and routes', async () => {
    expect((await call('GET', '/api/tools/nope')).status).toBe(404);
    expect((await call('GET', '/api/tools/nope/history')).status).toBe(404);
    expect((await call('GET', '/api/nothing')).status).toBe(404);
  });

  it('adds a tool for the current user', async () => {
    expect((await call('POST', '/api/tools', { body: { name: 'Scie', category: 'Autre' } })).status).toBe(401);
    expect((await call('POST', '/api/tools', { user: 'u1', body: { name: 'S', category: 'Autre' } })).status).toBe(400);
    expect((await call('POST', '/api/tools', { user: 'u1', body: { name: 'Scie', category: 'Cuisine' } })).status).toBe(400);
    const created = await call('POST', '/api/tools', { user: 'u1', body: { name: '  Scie sauteuse ', category: 'Autre' } });
    expect(created.status).toBe(201);
    expect(created.data).toMatchObject({ name: 'Scie sauteuse', ownerId: 'u1', description: '', status: 'available' });
    expect((await call('GET', `/api/tools/${created.data.id}`)).status).toBe(200);
  });

  it('rejects malformed JSON with 400', async () => {
    const res = await call('POST', '/api/tools', { user: 'u1', body: '{bad' });
    expect(res.status).toBe(400);
    expect(res.data.error).toMatch(/JSON/);
  });

  it('runs a full loan lifecycle', async () => {
    const body = { toolId: 't3', startDate: '2026-12-01', endDate: '2026-12-03' };
    expect((await call('POST', '/api/loans', { user: 'u2', body })).status).toBe(403);
    expect((await call('POST', '/api/loans', { user: 'u1', body: { ...body, endDate: '2026-11-30' } })).status).toBe(400);
    expect((await call('POST', '/api/loans', { user: 'u1', body: { ...body, startDate: '2026-02-30' } })).status).toBe(400);

    const requested = await call('POST', '/api/loans', { user: 'u1', body });
    expect(requested.status).toBe(201);
    expect(requested.data).toMatchObject({ status: 'pending', borrower: { id: 'u1' }, owner: { id: 'u2' } });
    const loanId = requested.data.id;

    expect((await call('PATCH', `/api/loans/${loanId}`, { user: 'u1', body: { status: 'accepted' } })).status).toBe(403);
    expect((await call('PATCH', `/api/loans/${loanId}`, { user: 'u2', body: { status: 'maybe' } })).status).toBe(400);
    const accepted = await call('PATCH', `/api/loans/${loanId}`, { user: 'u2', body: { status: 'accepted' } });
    expect(accepted.data.status).toBe('accepted');
    expect((await call('GET', '/api/tools/t3')).data.status).toBe('lent');
    expect((await call('PATCH', `/api/loans/${loanId}`, { user: 'u2', body: { status: 'refused' } })).status).toBe(409);

    expect((await call('PATCH', `/api/loans/${loanId}/rating`, { user: 'u2', body: { rating: 4 } })).status).toBe(409);
    expect((await call('PATCH', `/api/loans/${loanId}/return`, { user: 'u2' })).data.status).toBe('returned');
    expect((await call('GET', '/api/tools/t3')).data.status).toBe('available');
    expect((await call('PATCH', `/api/loans/${loanId}/rating`, { user: 'u2', body: { rating: 6 } })).status).toBe(400);
    expect((await call('PATCH', `/api/loans/${loanId}/rating`, { user: 'u2', body: { rating: 4 } })).data.rating).toBe(4);
    expect((await call('PATCH', `/api/loans/${loanId}/rating`, { user: 'u2', body: { rating: 5 } })).status).toBe(409);

    const history = await call('GET', '/api/tools/t3/history');
    expect(history.data.map((l) => l.id)).toEqual([loanId]);
    const loans = await call('GET', '/api/loans', { user: 'u1' });
    expect(loans.data.borrowed.some((l) => l.id === loanId)).toBe(true);
    expect((await call('GET', '/api/loans')).status).toBe(401);
  });

  it('refuses to accept overlapping loans', async () => {
    expect((await call('PATCH', '/api/loans/l2', { user: 'u1', body: { status: 'accepted' } })).status).toBe(200);
    expect((await call('PATCH', '/api/loans/l3', { user: 'u1', body: { status: 'accepted' } })).status).toBe(409);
  });

  it('sends CORS headers only to allowed origins', async () => {
    const allowed = await call('OPTIONS', '/api/tools', { headers: { Origin: 'http://localhost:8080' } });
    expect(allowed.status).toBe(204);
    expect(allowed.headers.get('access-control-allow-origin')).toBe('http://localhost:8080');
    const other = await call('GET', '/api/tools', { headers: { Origin: 'http://evil.example' } });
    expect(other.headers.get('access-control-allow-origin')).toBeNull();
  });
});

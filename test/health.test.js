import request from 'supertest';
import { describe, it, expect } from 'vitest';
import { createApp } from '../src/app.js';

describe('GET /health', () => {
  it('répond 200', async () => {
    const res = await request(createApp()).get('/health');
    expect(res.status).toBe(200);
  });
});
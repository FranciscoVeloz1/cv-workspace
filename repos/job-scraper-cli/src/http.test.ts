import assert from 'node:assert/strict';
import { afterEach, describe, it } from 'node:test';
import { fetchJson } from './http.js';
import { SourceError } from './errors.js';

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe('fetchJson', () => {
  it('parses 200 JSON', async () => {
    globalThis.fetch = async () => {
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    };

    const body = await fetchJson<{ ok: boolean }>('https://example.com/api', 'himalayas');
    assert.deepEqual(body, { ok: true });
  });

  it('throws SourceError on HTTP 500', async () => {
    globalThis.fetch = async () => {
      return new Response('nope', { status: 500 });
    };

    await assert.rejects(
      () => fetchJson('https://example.com/api', 'himalayas'),
      (error: unknown) => {
        assert.ok(error instanceof SourceError);
        assert.equal(error.source, 'himalayas');
        assert.equal(error.status, 500);
        return true;
      }
    );
  });
});

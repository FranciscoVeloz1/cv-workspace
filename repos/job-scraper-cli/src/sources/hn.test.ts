import assert from 'node:assert/strict';
import { afterEach, describe, it } from 'node:test';
import { fetchHn } from './hn.js';

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe('fetchHn', () => {
  it('maps Who is hiring comments to jobs', async () => {
    globalThis.fetch = async (input) => {
      const url = String(input);
      if (url.includes('search_by_date')) {
        return new Response(
          JSON.stringify({
            hits: [{ objectID: '123', title: 'Ask HN: Who is hiring? (August 2026)' }]
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }

      if (url.endsWith('/items/123')) {
        return new Response(
          JSON.stringify({
            id: 123,
            children: [{ id: 9, text: 'React Native remote worldwide', author: 'x' }]
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }

      return new Response('not found', { status: 404 });
    };

    const jobs = await fetchHn();
    assert.equal(jobs.length, 1);
    assert.equal(jobs[0]?.source, 'hn');
    assert.equal(jobs[0]?.url, 'https://news.ycombinator.com/item?id=9');
    assert.equal(jobs[0]?.company, 'x');
    assert.equal(jobs[0]?.title, 'React Native remote worldwide');
  });
});

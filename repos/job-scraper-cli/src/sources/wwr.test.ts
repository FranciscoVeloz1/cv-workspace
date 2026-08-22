import assert from 'node:assert/strict';
import { afterEach, describe, it } from 'node:test';
import { fetchWwr } from './wwr.js';

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

const RSS = `<?xml version="1.0"?>
<rss><channel>
<item>
  <title><![CDATA[Acme: Senior Node Engineer]]></title>
  <link>https://weworkremotely.com/remote-jobs/acme-senior-node</link>
  <description><![CDATA[Node.js remote]]></description>
</item>
<item>
  <title>Beta: Office Manager</title>
  <link>
    https://weworkremotely.com/remote-jobs/beta-office
  </link>
  <description>Admin work</description>
</item>
</channel></rss>`;

describe('fetchWwr', () => {
  it('parses both RSS items including CDATA titles', async () => {
    globalThis.fetch = async () => {
      return new Response(RSS, { status: 200 });
    };

    const jobs = await fetchWwr();
    assert.equal(jobs.length, 2);
    assert.equal(jobs[0]?.source, 'wwr');
    assert.equal(jobs[0]?.title, 'Acme: Senior Node Engineer');
    assert.equal(jobs[0]?.url, 'https://weworkremotely.com/remote-jobs/acme-senior-node');
    assert.equal(jobs[1]?.title, 'Beta: Office Manager');
    assert.equal(jobs[1]?.url, 'https://weworkremotely.com/remote-jobs/beta-office');
    assert.equal(jobs[1]?.location, 'Remote');
    assert.equal(jobs[1]?.employment, 'unknown');
  });
});

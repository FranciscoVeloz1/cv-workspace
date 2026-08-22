import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, it } from 'node:test';
import { run } from './main.js';

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

async function captureStdio(
  fn: () => Promise<number>
): Promise<{ code: number; stdout: string; stderr: string }> {
  const originalOut = process.stdout.write.bind(process.stdout);
  const originalErr = process.stderr.write.bind(process.stderr);
  let stdout = '';
  let stderr = '';
  process.stdout.write = ((chunk: string | Uint8Array) => {
    stdout += String(chunk);
    return true;
  }) as typeof process.stdout.write;
  process.stderr.write = ((chunk: string | Uint8Array) => {
    stderr += String(chunk);
    return true;
  }) as typeof process.stderr.write;

  try {
    const code = await fn();
    return { code, stdout, stderr };
  } finally {
    process.stdout.write = originalOut;
    process.stderr.write = originalErr;
  }
}

describe('run', () => {
  it('prints usage and exits 2 when --help is set', async () => {
    const result = await captureStdio(() => {
      return run(['node', 'job-scraper', '--help']);
    });
    assert.equal(result.code, 2);
    assert.match(result.stderr, /Usage: job-scraper/);
  });

  it('exits 1 with No matching jobs when sources are empty and browser is off', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'job-scraper-resume-'));
    const resume = join(dir, 'index.json');
    writeFileSync(
      resume,
      JSON.stringify({ skills: [{ id: 1, name: 'React' }, { id: 2, name: 'Node.js' }] })
    );

    globalThis.fetch = async (input) => {
      const url = String(input);
      if (url.includes('remoteok.com')) {
        return new Response('[]', { status: 200, headers: { 'Content-Type': 'application/json' } });
      }

      if (url.includes('weworkremotely.com')) {
        return new Response('<rss><channel></channel></rss>', { status: 200 });
      }

      if (url.includes('algolia')) {
        return new Response(JSON.stringify({ hits: [] }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      return new Response(JSON.stringify({ jobs: [] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    };

    const result = await captureStdio(() => {
      return run(['node', 'job-scraper', '--no-browser', '--resume', resume]);
    });

    assert.equal(result.code, 1);
    assert.match(result.stderr, /No matching jobs/);
  });
});

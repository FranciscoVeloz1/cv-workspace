import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { run } from './main.js';

describe('run', () => {
  it('prints usage and exits 2 when --help is set', async () => {
    const originalWrite = process.stderr.write.bind(process.stderr);
    let err = '';
    process.stderr.write = ((chunk: string | Uint8Array) => {
      err += String(chunk);
      return true;
    }) as typeof process.stderr.write;

    try {
      const code = await run(['node', 'job-scraper', '--help']);
      assert.equal(code, 2);
      assert.match(err, /Usage: job-scraper/);
    } finally {
      process.stderr.write = originalWrite;
    }
  });
});

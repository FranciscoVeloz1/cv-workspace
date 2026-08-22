import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { SourceError } from '../errors.js';
import { collectJobs, type SourceFns } from './index.js';
import { sampleJob } from '../test-job.js';
import type { Job } from '../schema.js';

function emptyFns(overrides: Partial<SourceFns> = {}): SourceFns {
  return {
    himalayas: async () => [],
    remotive: async () => [],
    remoteok: async () => [],
    wwr: async () => [],
    hn: async () => [],
    browserFetch: async () => [],
    ...overrides
  };
}

describe('collectJobs', () => {
  it('uses browser fallback for empty JSON sources', async () => {
    const himalayaJob = sampleJob({
      id: 'h1',
      source: 'himalayas',
      title: 'Senior React Engineer',
      url: 'https://himalayas.app/jobs/h1'
    });
    const browserCalls: Job['source'][] = [];

    const result = await collectJobs(
      { useBrowser: true },
      emptyFns({
        browserFetch: async (source) => {
          browserCalls.push(source);
          if (source === 'himalayas') {
            return [himalayaJob];
          }

          return [];
        }
      })
    );

    assert.equal(result.jobs.length, 1);
    assert.equal(result.jobs[0]?.id, 'h1');
    assert.ok(result.emptySources.includes('remotive'));
    assert.ok(result.emptySources.includes('remoteok'));
    assert.ok(result.emptySources.includes('wwr'));
    assert.ok(result.emptySources.includes('hn'));
    assert.equal(browserCalls.length, 5);
  });

  it('does not call browserFetch when useBrowser is false', async () => {
    let browserCalls = 0;
    const result = await collectJobs(
      { useBrowser: false },
      emptyFns({
        browserFetch: async () => {
          browserCalls += 1;
          return [];
        }
      })
    );

    assert.deepEqual(result.jobs, []);
    assert.equal(browserCalls, 0);
  });

  it('records SourceError and still tries browser when enabled', async () => {
    const recovered = sampleJob({
      id: 'r1',
      source: 'remotive',
      title: 'Node Engineer',
      url: 'https://remotive.com/jobs/r1'
    });
    let remotiveBrowser = false;

    const result = await collectJobs(
      { useBrowser: true },
      emptyFns({
        remotive: async () => {
          throw new SourceError('remotive', 'HTTP 500', 500);
        },
        browserFetch: async (source) => {
          if (source === 'remotive') {
            remotiveBrowser = true;
            return [recovered];
          }

          return [];
        }
      })
    );

    assert.equal(remotiveBrowser, true);
    assert.equal(result.jobs.some((job) => job.id === 'r1'), true);
    assert.equal(result.errors.some((error) => error.source === 'remotive'), true);
  });
});

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { formatJobs } from './format.js';
import { sampleJob } from './test-job.js';
import type { ScoredJob } from './score.js';

describe('formatJobs', () => {
  it('prints title, company, url, and score', () => {
    const ranked: ScoredJob[] = [
      {
        job: sampleJob({
          title: 'Senior React Engineer',
          company: 'Acme',
          url: 'https://example.com/jobs/react'
        }),
        score: 3,
        matched: ['React']
      }
    ];

    const text = formatJobs(ranked);
    assert.match(text, /Senior React Engineer/);
    assert.match(text, /Acme/);
    assert.match(text, /https:\/\/example.com\/jobs\/react/);
    assert.match(text, /3/);
  });
});

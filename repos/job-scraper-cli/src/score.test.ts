import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { scoreJob } from './score.js';
import { sampleJob } from './test-job.js';

describe('scoreJob', () => {
  it('counts React and Node.js matches', () => {
    const job = sampleJob({
      title: 'Engineer',
      description: 'We use React and Node.js every day.',
      employment: 'full_time'
    });
    const result = scoreJob(job, ['React', 'Node.js', 'Python']);
    assert.ok(result.score >= 2);
    assert.ok(result.matched.includes('React'));
    assert.ok(result.matched.includes('Node.js'));
  });

  it('adds one for contractor vs full_time', () => {
    const base = {
      title: 'Engineer',
      description: 'React work.',
      tags: [] as string[]
    };
    const fullTime = scoreJob(sampleJob({ ...base, employment: 'full_time' }), ['React']);
    const contractor = scoreJob(sampleJob({ ...base, employment: 'contractor' }), ['React']);
    assert.equal(contractor.score, fullTime.score + 1);
  });

  it('returns 0 with no skill hits and no contractor boost', () => {
    const job = sampleJob({
      title: 'Writer',
      description: 'Write blog posts.',
      employment: 'full_time'
    });
    const result = scoreJob(job, ['React', 'Node.js']);
    assert.equal(result.score, 0);
    assert.deepEqual(result.matched, []);
  });

  it('returns 1 for contractor-only with no skills', () => {
    const job = sampleJob({
      title: 'Writer',
      description: 'Write blog posts.',
      employment: 'contractor'
    });
    const result = scoreJob(job, ['React']);
    assert.equal(result.score, 1);
  });
});

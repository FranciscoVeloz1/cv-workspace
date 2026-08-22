import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { isEligible } from './filter.js';
import { sampleJob } from './test-job.js';

describe('isEligible', () => {
  it('drops USA-only location', () => {
    const job = sampleJob({
      title: 'Senior React Engineer',
      location: 'USA',
      description: 'Build React apps.'
    });
    assert.equal(isEligible(job, ['React']), false);
  });

  it('drops United States-only location', () => {
    const job = sampleJob({
      title: 'Senior React Engineer',
      location: 'United States',
      description: 'Build React apps.'
    });
    assert.equal(isEligible(job, ['React']), false);
  });

  it('drops authorization to work in the United States', () => {
    const job = sampleJob({
      title: 'Senior React Engineer',
      location: 'Worldwide',
      description: 'Must have authorization to work in the United States. React.'
    });
    assert.equal(isEligible(job, ['React']), false);
  });

  it('drops must be authorized to work in the US', () => {
    const job = sampleJob({
      title: 'Senior React Engineer',
      location: 'Worldwide',
      description: 'Candidates must be authorized to work in the US. React.'
    });
    assert.equal(isEligible(job, ['React']), false);
  });

  it('keeps Worldwide, LATAM mix, Americas, Mexico, and Latin America', () => {
    const locations = [
      'Worldwide',
      'LATAM, Europe, USA, Canada, APAC',
      'Americas',
      'Mexico',
      'Latin America'
    ];

    for (const location of locations) {
      const job = sampleJob({
        title: 'Senior React Engineer',
        location,
        description: 'Build React apps.'
      });
      assert.equal(isEligible(job, ['React']), true, location);
    }
  });

  it('drops jobs with no software markers and no skill overlap', () => {
    const job = sampleJob({
      title: 'Office Assistant',
      location: 'Worldwide',
      description: 'Answer phones and schedule meetings.',
      tags: []
    });
    assert.equal(isEligible(job, ['React', 'Node.js']), false);
  });

  it('keeps Senior React Engineer with React skill on Worldwide', () => {
    const job = sampleJob({
      title: 'Senior React Engineer',
      location: 'Worldwide',
      description: 'Own the frontend.'
    });
    assert.equal(isEligible(job, ['React']), true);
  });
});

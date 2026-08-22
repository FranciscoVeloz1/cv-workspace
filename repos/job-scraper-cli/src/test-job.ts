import type { Job } from './schema.js';

function sampleJob(overrides: Partial<Job> = {}): Job {
  return {
    id: '1',
    source: 'himalayas',
    title: 'Office Assistant',
    company: 'Acme',
    url: 'https://example.com/jobs/1',
    location: 'Worldwide',
    employment: 'full_time',
    description: 'Answer phones and schedule meetings.',
    tags: [],
    salary: null,
    ...overrides
  };
}

export { sampleJob };

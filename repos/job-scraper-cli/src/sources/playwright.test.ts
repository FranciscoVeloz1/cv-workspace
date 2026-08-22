import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { browserFetch } from './playwright.js';

describe('browserFetch', () => {
  it('maps Himalayas JSON intercepted from the listing page', async () => {
    const payload = {
      jobs: [
        {
          guid: 'https://himalayas.app/companies/acme/jobs/react',
          applicationLink: 'https://himalayas.app/companies/acme/jobs/react',
          title: 'Senior React Engineer',
          companyName: 'Acme',
          employmentType: 'Contractor',
          locationRestrictions: [],
          timezoneRestrictions: [-6],
          description: 'React.',
          categories: ['software']
        }
      ]
    };

    const fakePlaywright = {
      chromium: {
        launch: async () => {
          return {
            newPage: async () => {
              return {
                goto: async () => {},
                waitForResponse: async () => {
                  return {
                    ok: () => true,
                    url: () => 'https://himalayas.app/jobs/api',
                    json: async () => payload
                  };
                },
                $$eval: async () => []
              };
            },
            close: async () => {}
          };
        }
      }
    };

    const jobs = await browserFetch('himalayas', async () => fakePlaywright as never);
    assert.equal(jobs.length, 1);
    assert.equal(jobs[0]?.source, 'himalayas');
    assert.equal(jobs[0]?.title, 'Senior React Engineer');
  });
});

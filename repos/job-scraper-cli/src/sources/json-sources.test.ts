import assert from 'node:assert/strict';
import { afterEach, describe, it } from 'node:test';
import { fetchHimalayas } from './himalayas.js';
import { fetchRemotive } from './remotive.js';
import { fetchRemoteOk } from './remoteok.js';

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}

describe('fetchHimalayas', () => {
  it('maps a contractor React job and skips Bangladesh-only listings', async () => {
    globalThis.fetch = async () => {
      return jsonResponse({
        jobs: [
          {
            guid: 'https://himalayas.app/companies/acme/jobs/react',
            applicationLink: 'https://himalayas.app/companies/acme/jobs/react',
            title: 'Senior React Engineer',
            companyName: 'Acme',
            employmentType: 'Contractor',
            locationRestrictions: [],
            timezoneRestrictions: [-6],
            description: 'React and TypeScript.',
            categories: ['software'],
            minSalary: 50,
            maxSalary: 80,
            currency: 'USD'
          },
          {
            guid: 'https://himalayas.app/companies/other/jobs/bn',
            applicationLink: 'https://himalayas.app/companies/other/jobs/bn',
            title: 'Bengali Bilingual Expert',
            companyName: 'Other',
            employmentType: 'Contractor',
            locationRestrictions: ['Bangladesh'],
            timezoneRestrictions: [6],
            description: 'Native Bengali.',
            categories: []
          }
        ]
      });
    };

    const jobs = await fetchHimalayas();
    assert.equal(jobs.length, 1);
    const job = jobs[0];
    assert.equal(job?.source, 'himalayas');
    assert.equal(job?.title, 'Senior React Engineer');
    assert.equal(job?.company, 'Acme');
    assert.equal(job?.url, 'https://himalayas.app/companies/acme/jobs/react');
    assert.equal(job?.employment, 'Contractor');
  });
});

describe('fetchRemotive', () => {
  it('maps software-development jobs', async () => {
    globalThis.fetch = async (input) => {
      const url = String(input);
      assert.match(url, /remotive.com\/api\/remote-jobs\?category=software-development/);
      return jsonResponse({
        jobs: [
          {
            id: 42,
            url: 'https://remotive.com/remote-jobs/software-development/senior-42',
            title: 'Senior Node Engineer',
            company_name: 'Lemon',
            job_type: 'contract',
            candidate_required_location: 'LATAM, Europe, USA',
            description: 'Node.js and TypeScript.',
            tags: ['javascript', 'node.js'],
            salary: '$100 /hour'
          }
        ]
      });
    };

    const jobs = await fetchRemotive();
    assert.equal(jobs.length, 1);
    assert.equal(jobs[0]?.source, 'remotive');
    assert.equal(jobs[0]?.id, '42');
    assert.equal(jobs[0]?.company, 'Lemon');
  });
});

describe('fetchRemoteOk', () => {
  it('skips the legal notice row', async () => {
    globalThis.fetch = async () => {
      return jsonResponse([
        { legal: 'Please credit Remote OK.' },
        {
          id: '99',
          position: 'Full Stack Developer',
          company: 'RemoteCo',
          url: 'https://remoteok.com/remote-jobs/99',
          tags: ['dev', 'javascript'],
          description: 'Build products.',
          location: 'Worldwide'
        }
      ]);
    };

    const jobs = await fetchRemoteOk();
    assert.equal(jobs.length, 1);
    assert.equal(jobs[0]?.source, 'remoteok');
    assert.equal(jobs[0]?.title, 'Full Stack Developer');
    assert.equal(jobs[0]?.company, 'RemoteCo');
  });
});

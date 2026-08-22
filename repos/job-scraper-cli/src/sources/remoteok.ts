import { z } from 'zod';
import { fetchJson } from '../http.js';
import { JobSchema, type Job } from '../schema.js';

const RemoteOkRowSchema = z
  .object({
    legal: z.string().optional(),
    id: z.union([z.string(), z.number()]).optional(),
    position: z.string().optional(),
    company: z.string().optional(),
    url: z.string().optional(),
    slug: z.string().optional(),
    tags: z.array(z.string()).optional(),
    description: z.string().optional(),
    location: z.string().optional()
  })
  .passthrough();

export function mapRemoteOkJobs(payload: unknown): Job[] {
  if (!Array.isArray(payload)) {
    return [];
  }

  const jobs: Job[] = [];
  for (const row of payload) {
    const raw = RemoteOkRowSchema.safeParse(row);
    if (!raw.success) {
      continue;
    }

    const item = raw.data;
    if (item.legal !== undefined || item.position === undefined || item.company === undefined) {
      continue;
    }

    const url =
      item.url ??
      (item.slug !== undefined ? `https://remoteok.com/remote-jobs/${item.slug}` : undefined);
    if (url === undefined) {
      continue;
    }

    const job = JobSchema.safeParse({
      id: item.id !== undefined ? String(item.id) : url,
      source: 'remoteok',
      title: item.position,
      company: item.company,
      url,
      location: item.location ?? 'Remote',
      employment: 'unknown',
      description: item.description ?? '',
      tags: item.tags ?? [],
      salary: null
    });

    if (job.success) {
      jobs.push(job.data);
    }
  }

  return jobs;
}

export async function fetchRemoteOk(): Promise<Job[]> {
  const payload = await fetchJson<unknown>('https://remoteok.com/api', 'remoteok');
  return mapRemoteOkJobs(payload);
}

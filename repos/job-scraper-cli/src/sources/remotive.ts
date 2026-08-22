import { z } from 'zod';
import { fetchJson } from '../http.js';
import { JobSchema, type Job } from '../schema.js';

const RemotiveJobSchema = z
  .object({
    id: z.union([z.string(), z.number()]),
    url: z.string().url(),
    title: z.string(),
    company_name: z.string(),
    job_type: z.string().optional(),
    candidate_required_location: z.string().optional(),
    description: z.string().optional(),
    tags: z.array(z.string()).optional(),
    salary: z.string().optional()
  })
  .passthrough();

const RemotiveResponseSchema = z
  .object({
    jobs: z.array(z.unknown())
  })
  .passthrough();

export function mapRemotiveJobs(payload: unknown): Job[] {
  const parsed = RemotiveResponseSchema.safeParse(payload);
  if (!parsed.success) {
    return [];
  }

  const jobs: Job[] = [];
  for (const row of parsed.data.jobs) {
    const raw = RemotiveJobSchema.safeParse(row);
    if (!raw.success) {
      continue;
    }

    const item = raw.data;
    const salary = item.salary === undefined || item.salary === '' ? null : item.salary;
    const job = JobSchema.safeParse({
      id: String(item.id),
      source: 'remotive',
      title: item.title,
      company: item.company_name,
      url: item.url,
      location: item.candidate_required_location ?? 'Remote',
      employment: item.job_type ?? 'unknown',
      description: item.description ?? '',
      tags: item.tags ?? [],
      salary
    });

    if (job.success) {
      jobs.push(job.data);
    }
  }

  return jobs;
}

export async function fetchRemotive(): Promise<Job[]> {
  const payload = await fetchJson<unknown>(
    'https://remotive.com/api/remote-jobs?category=software-development',
    'remotive'
  );
  return mapRemotiveJobs(payload);
}

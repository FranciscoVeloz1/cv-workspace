import { z } from 'zod';
import { fetchJson } from '../http.js';
import { JobSchema, type Job } from '../schema.js';

const SEARCHES = ['react', 'typescript', 'node', 'python'] as const;

const HimalayasJobSchema = z
  .object({
    guid: z.string().optional(),
    applicationLink: z.string().optional(),
    title: z.string(),
    companyName: z.string(),
    employmentType: z.string().optional(),
    locationRestrictions: z.array(z.string()).optional(),
    timezoneRestrictions: z.array(z.number()).optional(),
    description: z.string().optional(),
    categories: z.array(z.string()).optional(),
    minSalary: z.number().nullable().optional(),
    maxSalary: z.number().nullable().optional(),
    currency: z.string().nullable().optional()
  })
  .passthrough();

const HimalayasResponseSchema = z
  .object({
    jobs: z.array(z.unknown())
  })
  .passthrough();

const AMERICASISH = /mexico|latam|latin|america|canada|worldwide|remote|usa|united states/i;

function timezoneOk(timezones: number[] | undefined): boolean {
  if (timezones === undefined || timezones.length === 0) {
    return true;
  }

  return timezones.includes(-6) || timezones.includes(-5);
}

function locationOk(restrictions: string[] | undefined): boolean {
  if (restrictions === undefined || restrictions.length === 0) {
    return true;
  }

  return restrictions.some((value) => {
    return AMERICASISH.test(value);
  });
}

function formatSalary(
  minSalary: number | null | undefined,
  maxSalary: number | null | undefined,
  currency: string | null | undefined
): string | null {
  if (minSalary == null && maxSalary == null) {
    return null;
  }

  const unit = currency ?? 'USD';
  if (minSalary != null && maxSalary != null) {
    return `${minSalary}-${maxSalary} ${unit}`;
  }

  const value = minSalary ?? maxSalary;
  return `${value} ${unit}`;
}

export function mapHimalayasJobs(payload: unknown): Job[] {
  const parsed = HimalayasResponseSchema.safeParse(payload);
  if (!parsed.success) {
    return [];
  }

  const jobs: Job[] = [];
  for (const row of parsed.data.jobs) {
    const raw = HimalayasJobSchema.safeParse(row);
    if (!raw.success) {
      continue;
    }

    const item = raw.data;
    if (!timezoneOk(item.timezoneRestrictions)) {
      continue;
    }

    if (!locationOk(item.locationRestrictions)) {
      continue;
    }

    const url = item.applicationLink ?? item.guid;
    if (url === undefined) {
      continue;
    }

    const job = JobSchema.safeParse({
      id: item.guid ?? url,
      source: 'himalayas',
      title: item.title,
      company: item.companyName,
      url,
      location: (item.locationRestrictions ?? []).join(', ') || 'Remote',
      employment: item.employmentType ?? 'unknown',
      description: item.description ?? '',
      tags: item.categories ?? [],
      salary: formatSalary(item.minSalary, item.maxSalary, item.currency)
    });

    if (job.success) {
      jobs.push(job.data);
    }
  }

  return jobs;
}

export async function fetchHimalayas(): Promise<Job[]> {
  const responses = await Promise.all(
    SEARCHES.map((query) => {
      const url = `https://himalayas.app/jobs/api/search?search=${query}&limit=20`;
      return fetchJson<unknown>(url, 'himalayas');
    })
  );

  const byId = new Map<string, Job>();
  for (const payload of responses) {
    for (const job of mapHimalayasJobs(payload)) {
      byId.set(job.id, job);
    }
  }

  return [...byId.values()];
}

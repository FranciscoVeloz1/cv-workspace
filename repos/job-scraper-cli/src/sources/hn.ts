import { z } from 'zod';
import { fetchJson } from '../http.js';
import { JobSchema, type Job } from '../schema.js';

const SEARCH_URL =
  'https://hn.algolia.com/api/v1/search_by_date?query=Who%20is%20hiring&tags=story,author_whoishiring&hitsPerPage=1';

const SearchSchema = z.object({
  hits: z.array(z.object({ objectID: z.string() }))
});

const CommentSchema: z.ZodType<{ id: number; text?: string; author?: string | null; children?: unknown[] }> =
  z.lazy(() => {
    return z.object({
      id: z.number(),
      text: z.string().optional(),
      author: z.string().nullable().optional(),
      children: z.array(z.unknown()).optional()
    });
  });

const ThreadSchema = z.object({
  id: z.number(),
  children: z.array(z.unknown()).optional()
});

function firstLine(text: string): string {
  const line = text.split(/\n|<p>/i)[0] ?? text;
  const stripped = line.replace(/<[^>]+>/gu, ' ').replace(/\s+/gu, ' ').trim();
  return stripped.slice(0, 120);
}

export function mapHnThread(payload: unknown): Job[] {
  const thread = ThreadSchema.safeParse(payload);
  if (!thread.success) {
    return [];
  }

  const jobs: Job[] = [];
  for (const child of thread.data.children ?? []) {
    const comment = CommentSchema.safeParse(child);
    if (!comment.success) {
      continue;
    }

    const text = comment.data.text?.trim() ?? '';
    if (text === '') {
      continue;
    }

    const author = comment.data.author?.trim() || 'hn';
    const title = firstLine(text) || 'HN hiring post';
    const url = `https://news.ycombinator.com/item?id=${comment.data.id}`;

    const job = JobSchema.safeParse({
      id: String(comment.data.id),
      source: 'hn',
      title,
      company: author,
      url,
      location: 'Remote',
      employment: 'unknown',
      description: text,
      tags: [],
      salary: null
    });

    if (job.success) {
      jobs.push(job.data);
    }
  }

  return jobs;
}

export async function fetchHn(): Promise<Job[]> {
  const search = await fetchJson<unknown>(SEARCH_URL, 'hn');
  const parsed = SearchSchema.safeParse(search);
  const objectId = parsed.success ? parsed.data.hits[0]?.objectID : undefined;
  if (objectId === undefined) {
    return [];
  }

  const thread = await fetchJson<unknown>(`https://hn.algolia.com/api/v1/items/${objectId}`, 'hn');
  return mapHnThread(thread);
}

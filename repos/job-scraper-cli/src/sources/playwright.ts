import { SourceError } from '../errors.js';
import { JobSchema, type Job } from '../schema.js';
import { mapHnThread } from './hn.js';
import { mapHimalayasJobs } from './himalayas.js';
import { mapRemoteOkJobs } from './remoteok.js';
import { mapRemotiveJobs } from './remotive.js';
import { mapWwrRss } from './wwr.js';

export const LISTING_URL: Record<Job['source'], string> = {
  himalayas: 'https://himalayas.app/jobs',
  remotive: 'https://remotive.com/remote-jobs/software-dev',
  remoteok: 'https://remoteok.com/remote-dev-jobs',
  wwr: 'https://weworkremotely.com/categories/remote-programming-jobs',
  hn: 'https://news.ycombinator.com/submitted?id=whoishiring'
};

type JsonResponse = {
  ok: () => boolean;
  url: () => string;
  json: () => Promise<unknown>;
  text?: () => Promise<string>;
};

type PageLike = {
  goto: (url: string, options: { waitUntil: string; timeout: number }) => Promise<unknown>;
  waitForResponse: (
    predicate: (res: JsonResponse) => boolean,
    options?: { timeout?: number }
  ) => Promise<JsonResponse>;
  $$eval: (
    selector: string,
    fn: (elements: Array<{ href: string; textContent: string | null }>) => Array<{
      href: string;
      text: string;
    }>
  ) => Promise<Array<{ href: string; text: string }>>;
};

type PlaywrightLike = {
  chromium: {
    launch: (options: { headless: boolean }) => Promise<{
      newPage: () => Promise<PageLike>;
      close: () => Promise<void>;
    }>;
  };
};

export type PlaywrightLoader = () => Promise<PlaywrightLike>;

const defaultLoader: PlaywrightLoader = async () => {
  return (await import('playwright')) as unknown as PlaywrightLike;
};

function matchesSource(source: Job['source'], url: string): boolean {
  if (source === 'himalayas') {
    return url.includes('/jobs/api');
  }

  if (source === 'remotive') {
    return url.includes('/api/remote-jobs');
  }

  if (source === 'remoteok') {
    return url.includes('remoteok.com') && url.includes('/api');
  }

  if (source === 'wwr') {
    return url.includes('.rss') || url.includes('weworkremotely.com');
  }

  return url.includes('algolia.com') || url.includes('hn.algolia.com');
}

function mapIntercepted(source: Job['source'], payload: unknown, text: string): Job[] {
  if (source === 'himalayas') {
    return mapHimalayasJobs(payload);
  }

  if (source === 'remotive') {
    return mapRemotiveJobs(payload);
  }

  if (source === 'remoteok') {
    return mapRemoteOkJobs(payload);
  }

  if (source === 'wwr') {
    return mapWwrRss(text);
  }

  return mapHnThread(payload);
}

async function fromDom(source: Job['source'], page: PageLike): Promise<Job[]> {
  const links = await page.$$eval('article li a, .jobs-container li a, .athing', (elements) => {
    return elements.map((el) => {
      return { href: el.href, text: (el.textContent ?? '').trim() };
    });
  });

  const jobs: Job[] = [];
  for (const [index, link] of links.entries()) {
    if (link.href === '' || link.text === '') {
      continue;
    }

    const parsed = JobSchema.safeParse({
      id: `${source}-dom-${index}`,
      source,
      title: link.text.slice(0, 120),
      company: source,
      url: link.href,
      location: 'Remote',
      employment: 'unknown',
      description: link.text,
      tags: [],
      salary: null
    });

    if (parsed.success) {
      jobs.push(parsed.data);
    }
  }

  return jobs;
}

export async function browserFetch(
  source: Job['source'],
  loadPlaywright: PlaywrightLoader = defaultLoader
): Promise<Job[]> {
  let playwright: PlaywrightLike;
  try {
    playwright = await loadPlaywright();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Playwright import failed';
    throw new SourceError(
      source,
      `Playwright unavailable. Run: npx playwright install chromium (${message})`
    );
  }

  const browser = await playwright.chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    const pending = page.waitForResponse(
      (res) => {
        return res.ok() && matchesSource(source, res.url());
      },
      { timeout: 12_000 }
    );

    await page.goto(LISTING_URL[source], { waitUntil: 'domcontentloaded', timeout: 20_000 });

    try {
      const response = await pending;
      const payload = await response.json().catch(() => {
        return null;
      });
      const text = response.text !== undefined ? await response.text() : '';
      const mapped = mapIntercepted(source, payload, text);
      if (mapped.length > 0) {
        return mapped;
      }
    } catch {
      // Fall through to DOM extract.
    }

    return await fromDom(source, page);
  } finally {
    await browser.close();
  }
}

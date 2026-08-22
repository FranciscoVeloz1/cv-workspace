import { SourceError } from '../errors.js';
import type { Job } from '../schema.js';
import { fetchHn } from './hn.js';
import { fetchHimalayas } from './himalayas.js';
import { browserFetch as defaultBrowserFetch } from './playwright.js';
import { fetchRemoteOk } from './remoteok.js';
import { fetchRemotive } from './remotive.js';
import { fetchWwr } from './wwr.js';

export type SourceFns = {
  himalayas: () => Promise<Job[]>;
  remotive: () => Promise<Job[]>;
  remoteok: () => Promise<Job[]>;
  wwr: () => Promise<Job[]>;
  hn: () => Promise<Job[]>;
  browserFetch: (source: Job['source']) => Promise<Job[]>;
};

export type CollectResult = {
  jobs: Job[];
  emptySources: string[];
  errors: Array<{ source: string; message: string }>;
};

const SOURCE_KEYS = ['himalayas', 'remotive', 'remoteok', 'wwr', 'hn'] as const;

const defaultFns: SourceFns = {
  himalayas: fetchHimalayas,
  remotive: fetchRemotive,
  remoteok: fetchRemoteOk,
  wwr: fetchWwr,
  hn: fetchHn,
  browserFetch: defaultBrowserFetch
};

export async function collectJobs(
  options: { useBrowser: boolean },
  deps: SourceFns = defaultFns
): Promise<CollectResult> {
  const settled = await Promise.allSettled(SOURCE_KEYS.map((key) => deps[key]()));
  const jobs: Job[] = [];
  const emptySources: string[] = [];
  const errors: Array<{ source: string; message: string }> = [];
  const seen = new Set<string>();

  function addJobs(batch: Job[]): number {
    let added = 0;
    for (const job of batch) {
      if (seen.has(job.url)) {
        continue;
      }

      seen.add(job.url);
      jobs.push(job);
      added += 1;
    }

    return added;
  }

  for (const [index, key] of SOURCE_KEYS.entries()) {
    const outcome = settled[index];
    if (outcome === undefined) {
      continue;
    }

    let fetched: Job[] = [];
    if (outcome.status === 'fulfilled') {
      fetched = outcome.value;
    } else {
      const reason = outcome.reason;
      const message =
        reason instanceof SourceError
          ? reason.message
          : reason instanceof Error
            ? reason.message
            : 'Unknown source failure';
      errors.push({ source: key, message });
    }

    if (addJobs(fetched) > 0) {
      continue;
    }

    if (options.useBrowser) {
      try {
        const recovered = await deps.browserFetch(key);
        if (addJobs(recovered) > 0) {
          continue;
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Browser fallback failed';
        errors.push({ source: key, message });
      }
    }

    emptySources.push(key);
  }

  return { jobs, emptySources, errors };
}

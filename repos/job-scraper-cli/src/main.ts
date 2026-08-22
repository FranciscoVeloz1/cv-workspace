#!/usr/bin/env node
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';
import { CliError } from './errors.js';
import { isEligible } from './filter.js';
import { formatJobs } from './format.js';
import { defaultResumePath, loadSkillNames } from './resume.js';
import { scoreJob, type ScoredJob } from './score.js';
import { collectJobs } from './sources/index.js';

export const USAGE =
  'Usage: job-scraper [--resume <path>] [--limit <n>] [--json] [--no-browser] [--min-score <n>]\n';

function parseLimit(value: string | undefined, fallback: number): number {
  if (value === undefined) {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new CliError('INVALID_ARGS', `--limit must be a non-negative integer`, 2);
  }

  return parsed;
}

function parseMinScore(value: string | undefined, fallback: number): number {
  if (value === undefined) {
    return fallback;
  }

  const parsed = Number.parseFloat(value);
  if (!Number.isFinite(parsed)) {
    throw new CliError('INVALID_ARGS', `--min-score must be a number`, 2);
  }

  return parsed;
}

export async function run(argv: string[]): Promise<number> {
  let values: {
    resume?: string;
    limit?: string;
    json?: boolean;
    'no-browser'?: boolean;
    'min-score'?: string;
    help?: boolean;
  };

  try {
    const parsed = parseArgs({
      args: argv.slice(2),
      allowPositionals: false,
      strict: true,
      options: {
        resume: { type: 'string' },
        limit: { type: 'string' },
        json: { type: 'boolean' },
        'no-browser': { type: 'boolean' },
        'min-score': { type: 'string' },
        help: { type: 'boolean', short: 'h' }
      }
    });
    values = parsed.values;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid arguments';
    process.stderr.write(`${message}\n${USAGE}`);
    return 2;
  }

  if (values.help === true) {
    process.stderr.write(USAGE);
    return 2;
  }

  try {
    const resumePath = values.resume ?? process.env.JOB_SCRAPER_RESUME_PATH ?? defaultResumePath();
    const limit = parseLimit(values.limit, 20);
    const minScore = parseMinScore(values['min-score'], 1);
    const useBrowser = values['no-browser'] !== true;
    const asJson = values.json === true;

    const skillNames = await loadSkillNames(resumePath);
    const collected = await collectJobs({ useBrowser });

    for (const error of collected.errors) {
      process.stderr.write(`${error.source}: ${error.message}\n`);
    }

    for (const source of collected.emptySources) {
      process.stderr.write(`${source}: no jobs returned\n`);
    }

    const ranked: ScoredJob[] = collected.jobs
      .filter((job) => {
        return isEligible(job, skillNames);
      })
      .map((job) => {
        return scoreJob(job, skillNames);
      })
      .filter((item) => {
        return item.score >= minScore;
      })
      .toSorted((a, b) => {
        if (b.score !== a.score) {
          return b.score - a.score;
        }

        return a.job.title.localeCompare(b.job.title);
      })
      .slice(0, limit);

    if (ranked.length === 0) {
      process.stderr.write('No matching jobs\n');
      return 1;
    }

    if (asJson) {
      process.stdout.write(`${JSON.stringify(ranked, null, 2)}\n`);
      return 0;
    }

    process.stdout.write(formatJobs(ranked));
    return 0;
  } catch (error) {
    if (error instanceof CliError) {
      process.stderr.write(`${error.message}\n`);
      return error.exitCode;
    }

    const message = error instanceof Error ? error.message : 'Unknown error';
    process.stderr.write(`${message}\n`);
    return 1;
  }
}

function isCliEntry(argv1: string | undefined): boolean {
  if (argv1 === undefined) {
    return false;
  }

  return import.meta.url === pathToFileURL(resolve(argv1)).href;
}

if (isCliEntry(process.argv[1])) {
  run(process.argv).then((code) => {
    process.exit(code);
  });
}

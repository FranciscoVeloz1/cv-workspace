#!/usr/bin/env node
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

export const USAGE =
  'Usage: job-scraper [--resume <path>] [--limit <n>] [--json] [--no-browser] [--min-score <n>]\n';

export async function run(argv: string[]): Promise<number> {
  const args = argv.slice(2);
  if (args.includes('--help') || args.includes('-h')) {
    process.stderr.write(USAGE);
    return 2;
  }

  process.stderr.write('not implemented\n');
  return 1;
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

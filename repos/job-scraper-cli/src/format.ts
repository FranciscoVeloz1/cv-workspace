import type { ScoredJob } from './score.js';

export function formatJobs(ranked: ScoredJob[]): string {
  const lines: string[] = [];
  for (const item of ranked) {
    lines.push(`[${item.score}] ${item.job.title} @ ${item.job.company} (${item.job.source})`);
    lines.push(`    ${item.job.url}`);
    if (item.matched.length > 0) {
      lines.push(`    matched: ${item.matched.join(', ')}`);
    }

    if (item.job.location !== '') {
      lines.push(`    location: ${item.job.location}`);
    }

    if (item.job.salary !== null) {
      lines.push(`    salary: ${item.job.salary}`);
    }
  }

  return `${lines.join('\n')}\n`;
}

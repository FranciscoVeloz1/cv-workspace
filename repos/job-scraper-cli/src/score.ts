import type { Job } from './schema.js';

const CONTRACTOR = /\b(contractor|contract|freelance|1099|b2b)\b/i;

export type ScoredJob = {
  job: Job;
  score: number;
  matched: string[];
};

function skillNeedles(skillName: string): string[] {
  const lower = skillName.toLowerCase();
  const needles = new Set<string>([lower]);
  needles.add(lower.replace(/\.js$/u, ''));
  return [...needles];
}

export function scoreJob(job: Job, skillNames: string[]): ScoredJob {
  const haystack = `${job.title} ${job.description} ${job.tags.join(' ')}`.toLowerCase();
  const matched = skillNames.filter((name) => {
    return skillNeedles(name).some((needle) => {
      return needle.length > 0 && haystack.includes(needle);
    });
  });

  let score = matched.length;
  if (CONTRACTOR.test(`${job.employment} ${job.description}`)) {
    score += 1;
  }

  return { job, score, matched };
}

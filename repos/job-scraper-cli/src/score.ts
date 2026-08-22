import type { Job } from './schema.js';
import { haystackHasSkill } from './skills.js';

const CONTRACTOR = /\b(contractor|contract|freelance|1099|b2b)\b/i;

export type ScoredJob = {
  job: Job;
  score: number;
  matched: string[];
};

export function scoreJob(job: Job, skillNames: string[]): ScoredJob {
  const haystack = `${job.title} ${job.description} ${job.tags.join(' ')}`.toLowerCase();
  const matched = skillNames.filter((name) => {
    return haystackHasSkill(haystack, name);
  });

  let score = matched.length;
  if (CONTRACTOR.test(`${job.employment} ${job.description}`)) {
    score += 1;
  }

  return { job, score, matched };
}

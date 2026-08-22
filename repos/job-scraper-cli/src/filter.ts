import type { Job } from './schema.js';

const WORK_AUTH =
  /\bauthori[sz](?:ed?|ation) to work in the (united states|u\.?s\.?a?)\b/i;
const WORK_AUTH_CITIZEN =
  /\b(us|u\.s\.|united states) (citizens?|work authorization) (only|required)\b/i;
const US_ONLY_LOCATION = /^(usa|u\.s\.a?\.?|united states)( only)?$/i;
const US_TIMEZONE_LOCATION = /^usa timezones?$/i;

const CORE_REGIONS = [
  'worldwide',
  'anywhere',
  'remote',
  'americas',
  'latam',
  'latin america',
  'mexico',
  'north america',
  'canada',
  'usa',
  'united states'
];

const SOFTWARE_MARKERS =
  /software|developer|engineer|full[- ]stack|front[- ]end|back[- ]end|typescript|react|node\.js/i;

function hasWorkAuthBlock(text: string): boolean {
  return WORK_AUTH.test(text) || WORK_AUTH_CITIZEN.test(text);
}

function isUsOnlyLocation(location: string): boolean {
  const trimmed = location.trim();
  return US_ONLY_LOCATION.test(trimmed) || US_TIMEZONE_LOCATION.test(trimmed);
}

function isAmericasOrRemote(location: string): boolean {
  const trimmed = location.trim();
  if (trimmed === '') {
    return true;
  }

  if (isUsOnlyLocation(trimmed)) {
    return false;
  }

  const lower = trimmed.toLowerCase();
  return CORE_REGIONS.some((region) => {
    return lower.includes(region);
  });
}

function skillNeedles(skillName: string): string[] {
  const lower = skillName.toLowerCase();
  const needles = new Set<string>([lower]);
  needles.add(lower.replace(/\.js$/u, ''));
  needles.add(lower.replace(/\s+/gu, ''));
  return [...needles];
}

function isSoftwareJob(job: Job, skillNames: string[], haystack: string): boolean {
  if (SOFTWARE_MARKERS.test(haystack)) {
    return true;
  }

  return skillNames.some((name) => {
    return skillNeedles(name).some((needle) => {
      return needle.length > 0 && haystack.includes(needle);
    });
  });
}

export function isEligible(job: Job, skillNames: string[]): boolean {
  const haystack =
    `${job.location} ${job.employment} ${job.title} ${job.description} ${job.tags.join(' ')}`.toLowerCase();

  if (hasWorkAuthBlock(haystack)) {
    return false;
  }

  if (isUsOnlyLocation(job.location)) {
    return false;
  }

  if (!isAmericasOrRemote(job.location)) {
    return false;
  }

  if (!isSoftwareJob(job, skillNames, haystack)) {
    return false;
  }

  return true;
}

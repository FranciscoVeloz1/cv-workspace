import type { RawJob } from "../domain/schemas.js";

const JOB_VIEW_ID_RE = /\/jobs\/view\/(?:.*?-)?(\d+)(?:[/?#]|$)/;
const CURRENT_JOB_ID_RE = /[?&]currentJobId=(\d+)/;
const ENTITY_URN_RE = /urn:li:jobPosting:(\d+)/;

export function cleanText(value: string | null | undefined): string {
  if (!value) return "";
  return value.replace(/\s+/g, " ").trim();
}

export function normalizeCompensation(
  value: string | null | undefined,
): string {
  const cleaned = cleanText(value);
  return cleaned.length > 0 ? cleaned : "Not listed";
}

export function extractJobId(urlOrUrn: string): string | null {
  const urnMatch = urlOrUrn.match(ENTITY_URN_RE);
  if (urnMatch?.[1]) return urnMatch[1];

  const viewMatch = urlOrUrn.match(JOB_VIEW_ID_RE);
  if (viewMatch?.[1]) return viewMatch[1];

  const queryMatch = urlOrUrn.match(CURRENT_JOB_ID_RE);
  if (queryMatch?.[1]) return queryMatch[1];

  return null;
}

export function canonicalizeJobUrl(url: string): string | null {
  const jobId = extractJobId(url);
  if (!jobId) return null;
  return `https://www.linkedin.com/jobs/view/${jobId}/`;
}

export function dedupeJobs(jobs: RawJob[]): RawJob[] {
  const seenIds = new Set<string>();
  const seenUrls = new Set<string>();
  const unique: RawJob[] = [];

  for (const job of jobs) {
    if (seenIds.has(job.jobId) || seenUrls.has(job.canonicalUrl)) {
      continue;
    }
    seenIds.add(job.jobId);
    seenUrls.add(job.canonicalUrl);
    unique.push(job);
  }

  return unique;
}

import type { SearchSpec, WorkMode } from "../domain/schemas.js";

export const LINKEDIN_JOBS_SEARCH_BASE =
  "https://www.linkedin.com/jobs/search/";

const WORK_MODE_TO_F_WT: Partial<Record<WorkMode, string>> = {
  onsite: "1",
  remote: "2",
  hybrid: "3",
};

/** LinkedIn f_TPR uses seconds as r{seconds}. */
export function recencyToFTpr(recencyDays: number): string {
  return `r${recencyDays * 24 * 60 * 60}`;
}

export function buildLinkedInSearchUrl(spec: SearchSpec): string {
  const url = new URL(LINKEDIN_JOBS_SEARCH_BASE);
  url.searchParams.set("keywords", spec.keywords.join(" ").trim());

  const location = spec.locations[0];
  if (location) {
    url.searchParams.set("location", location);
  }

  const workTypeValues = [
    ...new Set(
      spec.workModes
        .map((mode) => WORK_MODE_TO_F_WT[mode])
        .filter((value): value is string => Boolean(value)),
    ),
  ];
  if (workTypeValues.length > 0) {
    url.searchParams.set("f_WT", workTypeValues.join(","));
  }

  url.searchParams.set("f_TPR", recencyToFTpr(spec.recencyDays));
  // Exclusions stay in the search spec for agent-side filtering only.
  return url.toString();
}

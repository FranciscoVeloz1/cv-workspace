import { describe, expect, it } from "vitest";
import {
  canonicalizeJobUrl,
  cleanText,
  dedupeJobs,
  extractJobId,
  normalizeCompensation,
} from "../../src/linkedin/normalize.js";
import type { RawJob } from "../../src/domain/schemas.js";

function job(overrides: Partial<RawJob> & Pick<RawJob, "jobId" | "canonicalUrl">): RawJob {
  return {
    title: "Engineer",
    company: "Acme",
    location: "Remote",
    workMode: "remote",
    postedAt: "2026-07-20",
    compensation: "Not listed",
    description: "Build things",
    extractionStatus: "ok",
    warnings: [],
    source: {
      searchUrl: "https://www.linkedin.com/jobs/search/?keywords=AI",
      collectedAt: "2026-07-23T18:00:00.000Z",
    },
    ...overrides,
  };
}

describe("normalize utilities", () => {
  it("extracts job id from slug-style guest view URLs", () => {
    expect(
      extractJobId(
        "https://sg.linkedin.com/jobs/view/ai-software-engineer-at-nas-4442533330?position=1",
      ),
    ).toBe("4442533330");
  });

  it("extracts job id from entity urns", () => {
    expect(extractJobId("urn:li:jobPosting:4442533330")).toBe("4442533330");
  });

  it("extracts job id from currentJobId query", () => {
    expect(
      extractJobId(
        "https://www.linkedin.com/jobs/search/?currentJobId=9988776655&keywords=AI",
      ),
    ).toBe("9988776655");
  });

  it("returns null when no job id is present", () => {
    expect(extractJobId("https://www.linkedin.com/jobs/search/?keywords=AI")).toBeNull();
  });

  it("canonicalizes to /jobs/view/{id}/", () => {
    expect(
      canonicalizeJobUrl(
        "https://www.linkedin.com/jobs/view/1234567890/?refId=abc&trk=public",
      ),
    ).toBe("https://www.linkedin.com/jobs/view/1234567890/");
  });

  it("collapses whitespace in text", () => {
    expect(cleanText("  Senior\n\tFullstack   AI  ")).toBe("Senior Fullstack AI");
  });

  it("preserves explicit compensation and uses Not listed otherwise", () => {
    expect(normalizeCompensation("$80 - $120/hr")).toBe("$80 - $120/hr");
    expect(normalizeCompensation("  ")).toBe("Not listed");
    expect(normalizeCompensation(null)).toBe("Not listed");
    expect(normalizeCompensation(undefined)).toBe("Not listed");
  });

  it("dedupes by jobId first, then canonical URL", () => {
    const jobs = [
      job({
        jobId: "1",
        canonicalUrl: "https://www.linkedin.com/jobs/view/1/",
        title: "First",
      }),
      job({
        jobId: "1",
        canonicalUrl: "https://www.linkedin.com/jobs/view/1/",
        title: "Duplicate id",
      }),
      job({
        jobId: "2",
        canonicalUrl: "https://www.linkedin.com/jobs/view/2/",
        title: "Second",
      }),
      job({
        jobId: "3",
        canonicalUrl: "https://www.linkedin.com/jobs/view/2/",
        title: "Duplicate url",
      }),
    ];

    const unique = dedupeJobs(jobs);
    expect(unique).toHaveLength(2);
    expect(unique.map((j) => j.jobId)).toEqual(["1", "2"]);
  });
});

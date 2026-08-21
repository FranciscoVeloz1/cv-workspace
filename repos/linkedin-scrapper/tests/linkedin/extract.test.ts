import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { extractSearchCards } from "../../src/linkedin/extract-search-page.js";
import { extractJobDetail } from "../../src/linkedin/extract-job-detail.js";

const fixturesDir = join(
  dirname(fileURLToPath(import.meta.url)),
  "../fixtures/linkedin",
);

function loadFixture(name: string): string {
  return readFileSync(join(fixturesDir, name), "utf8");
}

describe("extractSearchCards", () => {
  it("extracts multiple search cards with ids and urls", () => {
    const cards = extractSearchCards(loadFixture("search-results.html"));
    expect(cards).toHaveLength(3);
    expect(cards[0]).toMatchObject({
      jobId: "1111111111",
      title: "Senior Fullstack AI Developer",
      company: "Devsu",
      location: "Guadalajara, Jalisco, Mexico",
      canonicalUrl: "https://www.linkedin.com/jobs/view/1111111111/",
      postedAt: "2026-07-20",
    });
    expect(cards[1]?.jobId).toBe("2222222222");
    expect(cards[2]?.jobId).toBe("3333333333");
  });

  it("allows missing posted date on cards", () => {
    const cards = extractSearchCards(loadFixture("search-results.html"));
    expect(cards[2]?.postedAt).toBeNull();
  });

  it("returns empty array and does not throw on empty html", () => {
    expect(extractSearchCards("<html><body></body></html>")).toEqual([]);
  });

  it("extracts authenticated LinkedIn job cards", () => {
    const cards = extractSearchCards(
      loadFixture("search-results-authenticated.html"),
    );
    expect(cards).toHaveLength(2);
    expect(cards[0]).toMatchObject({
      jobId: "4410407134",
      title: "Sr. Software Engineer - Full Stack",
      company: "Lyra Health",
      location: "United States (Remote)",
      canonicalUrl: "https://www.linkedin.com/jobs/view/4410407134/",
    });
  });
});

describe("extractJobDetail", () => {
  it("extracts explicit salary and remote work mode", () => {
    const detail = extractJobDetail(
      loadFixture("job-detail-with-salary.html"),
      "https://www.linkedin.com/jobs/view/1111111111/",
    );
    expect(detail.ok).toBe(true);
    if (!detail.ok) return;
    expect(detail.job).toMatchObject({
      jobId: "1111111111",
      title: "Senior Fullstack AI Developer",
      company: "Devsu",
      compensation: "$80 - $120/hr",
      workMode: "remote",
      extractionStatus: "ok",
    });
    expect(detail.job.description).toContain("RAG");
  });

  it("uses Not listed when salary is absent", () => {
    const detail = extractJobDetail(
      loadFixture("job-detail-no-salary.html"),
      "https://www.linkedin.com/jobs/view/2222222222/",
    );
    expect(detail.ok).toBe(true);
    if (!detail.ok) return;
    expect(detail.job.compensation).toBe("Not listed");
    expect(detail.job.workMode).toBe("hybrid");
  });

  it("extracts guest LinkedIn detail layouts", () => {
    const detail = extractJobDetail(
      loadFixture("job-detail-guest.html"),
      "https://www.linkedin.com/jobs/view/4442533330/",
    );
    expect(detail.ok).toBe(true);
    if (!detail.ok) return;
    expect(detail.job).toMatchObject({
      jobId: "4442533330",
      title: "AI Software Engineer - Nas.com",
      company: "Nas Company",
      location: "Singapore, Singapore",
      workMode: "remote",
      compensation: "Not listed",
    });
    expect(detail.job.description).toContain("AI-powered");
  });
});

import { describe, expect, it } from "vitest";
import {
  escapeMarkdownCell,
  renderMarkdownReport,
  sortQualifiedRows,
} from "../../src/report/render-markdown.js";
import type { Assessment, RawJob } from "../../src/domain/schemas.js";

function job(overrides: Partial<RawJob> & Pick<RawJob, "jobId">): RawJob {
  return {
    canonicalUrl: `https://www.linkedin.com/jobs/view/${overrides.jobId}/`,
    title: `Role ${overrides.jobId}`,
    company: "Acme",
    location: "Remote",
    workMode: "remote",
    postedAt: "2026-07-20",
    compensation: "Not listed",
    description: "Build AI products",
    extractionStatus: "ok",
    warnings: [],
    source: {
      searchUrl: "https://www.linkedin.com/jobs/search/?keywords=AI",
      collectedAt: "2026-07-23T18:00:00.000Z",
    },
    ...overrides,
  };
}

const assessments: Assessment[] = [
  {
    jobId: "1",
    decision: "qualified",
    fitScore: 8,
    fitReason: "Good AI match",
    applyAdvice: "Mention RAG | LangChain",
  },
  {
    jobId: "2",
    decision: "rejected",
    fitScore: 2,
    fitReason: "Junior role",
    applyAdvice: "",
  },
  {
    jobId: "3",
    decision: "qualified",
    fitScore: 9,
    fitReason: "Excellent fit",
    applyAdvice: "Lead with PwC delivery",
  },
  {
    jobId: "4",
    decision: "qualified",
    fitScore: 8,
    fitReason: "Same score newer",
    applyAdvice: "Highlight React",
  },
];

const jobs: RawJob[] = [
  job({ jobId: "1", title: "Engineer A", postedAt: "2026-07-10" }),
  job({ jobId: "2", title: "Junior B" }),
  job({
    jobId: "3",
    title: "Senior C",
    postedAt: "2026-07-18",
    compensation: "$100/hr",
  }),
  job({ jobId: "4", title: "Engineer D", postedAt: "2026-07-21" }),
];

describe("escapeMarkdownCell", () => {
  it("escapes pipes and collapses newlines", () => {
    expect(escapeMarkdownCell("A | B\nC")).toBe("A \\| B C");
  });
});

describe("sortQualifiedRows", () => {
  it("keeps only qualified and sorts by fit then recency", () => {
    const rows = sortQualifiedRows(jobs, assessments);
    expect(rows.map((r) => r.job.jobId)).toEqual(["3", "4", "1"]);
  });
});

describe("renderMarkdownReport", () => {
  it("renders metadata and expanded table columns", () => {
    const md = renderMarkdownReport({
      prompt: "Senior AI fullstack remote LATAM",
      limit: 20,
      jobs,
      assessments,
      warnings: [
        {
          stage: "job-detail",
          message: "One detail failed",
          url: "https://www.linkedin.com/jobs/view/9/",
        },
      ],
      generatedAt: "2026-07-23T18:00:00.000Z",
    });

    expect(md).toContain("# Job Search Targets");
    expect(md).toContain("Senior AI fullstack remote LATAM");
    expect(md).toContain(
      "| # | Role | Company | Location | Work Mode | Posted | Est. Comp | Fit | Apply Advice | URL |",
    );
    expect(md).toContain("| 1 | Senior C |");
    expect(md).toContain("$100/hr");
    expect(md).toContain("Not listed");
    expect(md).toContain("Mention RAG \\| LangChain");
    expect(md).toContain("https://www.linkedin.com/jobs/view/3/");
    expect(md).not.toContain("Junior B");
    expect(md).toContain("One detail failed");
  });

  it("respects max rows from limit", () => {
    const md = renderMarkdownReport({
      prompt: "AI",
      limit: 1,
      jobs,
      assessments,
      warnings: [],
      generatedAt: "2026-07-23T18:00:00.000Z",
    });
    expect(md).toContain("| 1 | Senior C |");
    expect(md).not.toContain("| 2 |");
  });

  it("renders empty-result message when nothing qualifies", () => {
    const md = renderMarkdownReport({
      prompt: "AI",
      limit: 10,
      jobs: [job({ jobId: "2" })],
      assessments: [assessments[1]!],
      warnings: [],
      generatedAt: "2026-07-23T18:00:00.000Z",
    });
    expect(md).toContain("No qualified jobs");
  });
});

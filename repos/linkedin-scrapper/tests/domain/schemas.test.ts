import { describe, expect, it } from "vitest";
import {
  AssessmentSchema,
  AssessmentsFileSchema,
  RawJobSchema,
  RunManifestSchema,
  SearchSpecSchema,
} from "../../src/domain/schemas.js";

describe("SearchSpecSchema", () => {
  const valid = {
    prompt: "Senior fullstack AI roles in LATAM remote",
    keywords: ["senior fullstack", "AI", "Python", "React"],
    locations: ["LATAM", "Mexico", "Remote"],
    workModes: ["remote"],
    recencyDays: 14,
    exclusions: ["junior", "intern"],
    limit: 20,
  };

  it("accepts a valid search spec", () => {
    expect(SearchSpecSchema.parse(valid)).toEqual(valid);
  });

  it("rejects limit below 1", () => {
    expect(() => SearchSpecSchema.parse({ ...valid, limit: 0 })).toThrow();
  });

  it("rejects limit above 50", () => {
    expect(() => SearchSpecSchema.parse({ ...valid, limit: 51 })).toThrow();
  });

  it("rejects non-integer limit", () => {
    expect(() => SearchSpecSchema.parse({ ...valid, limit: 10.5 })).toThrow();
  });

  it("requires keywords and locations arrays", () => {
    expect(() =>
      SearchSpecSchema.parse({ ...valid, keywords: undefined }),
    ).toThrow();
    expect(() =>
      SearchSpecSchema.parse({ ...valid, locations: "Remote" }),
    ).toThrow();
  });

  it("rejects empty prompt", () => {
    expect(() => SearchSpecSchema.parse({ ...valid, prompt: "" })).toThrow();
  });
});

describe("RawJobSchema", () => {
  const valid = {
    jobId: "1234567890",
    canonicalUrl: "https://www.linkedin.com/jobs/view/1234567890/",
    title: "Senior Fullstack AI Developer",
    company: "Example Corp",
    location: "Mexico (Remote)",
    workMode: "remote",
    postedAt: "2026-07-20",
    compensation: "Not listed",
    description: "Build AI products with Python and React.",
    extractionStatus: "ok",
    warnings: [],
    source: {
      searchUrl: "https://www.linkedin.com/jobs/search/?keywords=AI",
      collectedAt: "2026-07-23T18:00:00.000Z",
    },
  };

  it("accepts a complete raw job", () => {
    expect(RawJobSchema.parse(valid)).toEqual(valid);
  });

  it("allows listed compensation strings", () => {
    expect(
      RawJobSchema.parse({ ...valid, compensation: "$80 - $120/hr" })
        .compensation,
    ).toBe("$80 - $120/hr");
  });

  it("accepts partial extraction with warnings", () => {
    const partial = {
      ...valid,
      description: null,
      extractionStatus: "partial",
      warnings: [
        {
          stage: "job-detail",
          message: "Description selector missed",
          url: valid.canonicalUrl,
        },
      ],
    };
    expect(RawJobSchema.parse(partial).extractionStatus).toBe("partial");
  });

  it("rejects missing jobId", () => {
    expect(() =>
      RawJobSchema.parse({ ...valid, jobId: "" }),
    ).toThrow();
  });
});

describe("AssessmentSchema", () => {
  const valid = {
    jobId: "1234567890",
    decision: "qualified",
    fitScore: 9,
    fitReason: "Strong Python + React + AI match",
    applyAdvice: "Lead with RAG and bilingual client delivery.",
  };

  it("accepts a qualified assessment", () => {
    expect(AssessmentSchema.parse(valid)).toEqual(valid);
  });

  it("accepts a rejected assessment", () => {
    expect(
      AssessmentSchema.parse({
        ...valid,
        decision: "rejected",
        fitScore: 2,
        applyAdvice: "",
      }).decision,
    ).toBe("rejected");
  });

  it("rejects fitScore outside 0-10", () => {
    expect(() => AssessmentSchema.parse({ ...valid, fitScore: -1 })).toThrow();
    expect(() => AssessmentSchema.parse({ ...valid, fitScore: 11 })).toThrow();
  });

  it("rejects non-integer fitScore", () => {
    expect(() =>
      AssessmentSchema.parse({ ...valid, fitScore: 8.5 }),
    ).toThrow();
  });
});

describe("AssessmentsFileSchema and RunManifestSchema", () => {
  it("accepts an assessments file", () => {
    const file = {
      assessments: [
        {
          jobId: "1",
          decision: "qualified",
          fitScore: 8,
          fitReason: "Good match",
          applyAdvice: "Mention React.",
        },
      ],
    };
    expect(AssessmentsFileSchema.parse(file)).toEqual(file);
  });

  it("accepts a run manifest", () => {
    const manifest = {
      runId: "2026-07-23T180000Z",
      createdAt: "2026-07-23T18:00:00.000Z",
      updatedAt: "2026-07-23T18:05:00.000Z",
      prompt: "Find senior AI fullstack roles",
      searchSpec: {
        prompt: "Find senior AI fullstack roles",
        keywords: ["AI", "fullstack"],
        locations: ["Remote"],
        workModes: ["remote"],
        recencyDays: 7,
        exclusions: [],
        limit: 10,
      },
      counts: {
        collected: 8,
        unique: 7,
        failed: 1,
      },
      warnings: [],
      artifacts: {
        rawJobs: "raw-jobs.json",
        manifest: "manifest.json",
      },
    };
    expect(RunManifestSchema.parse(manifest)).toEqual(manifest);
  });
});

import { mkdtemp, readFile, rm, writeFile, mkdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { parseRenderArgs, runRenderCli } from "../../src/cli/render.js";

const tempDirs: string[] = [];

afterEach(async () => {
  await Promise.all(
    tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })),
  );
});

describe("parseRenderArgs", () => {
  it("requires --run and --assessments", () => {
    expect(() => parseRenderArgs([])).toThrow(/--run/);
    expect(() => parseRenderArgs(["--run", "x"])).toThrow(/--assessments/);
  });
});

describe("runRenderCli", () => {
  it("writes a markdown report under results/", async () => {
    const dir = await mkdtemp(join(tmpdir(), "li-render-"));
    tempDirs.push(dir);
    const runDir = join(dir, ".runs", "run1");
    await mkdir(runDir, { recursive: true });
    await mkdir(join(dir, "results"), { recursive: true });

    await writeFile(
      join(runDir, "raw-jobs.json"),
      JSON.stringify({
        jobs: [
          {
            jobId: "1",
            canonicalUrl: "https://www.linkedin.com/jobs/view/1/",
            title: "Senior AI Engineer",
            company: "Devsu",
            location: "LATAM Remote",
            workMode: "remote",
            postedAt: "2026-07-20",
            compensation: "Not listed",
            description: "Python React AI",
            extractionStatus: "ok",
            warnings: [],
            source: {
              searchUrl: "https://www.linkedin.com/jobs/search/?keywords=AI",
              collectedAt: "2026-07-23T18:00:00.000Z",
            },
          },
        ],
      }),
      "utf8",
    );

    await writeFile(
      join(runDir, "manifest.json"),
      JSON.stringify({
        runId: "run1",
        createdAt: "2026-07-23T18:00:00.000Z",
        updatedAt: "2026-07-23T18:05:00.000Z",
        prompt: "Senior AI fullstack",
        searchSpec: {
          prompt: "Senior AI fullstack",
          keywords: ["AI"],
          locations: ["Remote"],
          workModes: ["remote"],
          recencyDays: 7,
          exclusions: [],
          limit: 10,
        },
        counts: { collected: 1, unique: 1, failed: 0 },
        warnings: [],
        artifacts: { rawJobs: "raw-jobs.json", manifest: "manifest.json" },
      }),
      "utf8",
    );

    const assessmentsPath = join(dir, "assessments.json");
    await writeFile(
      assessmentsPath,
      JSON.stringify({
        assessments: [
          {
            jobId: "1",
            decision: "qualified",
            fitScore: 9,
            fitReason: "Strong match",
            applyAdvice: "Mention Python + React AI work",
          },
        ],
      }),
      "utf8",
    );

    const result = await runRenderCli({
      argv: ["--run", runDir, "--assessments", assessmentsPath],
      cwd: dir,
      now: () => new Date("2026-07-23T18:30:00.000Z"),
    });

    expect(result.exitCode).toBe(0);
    expect(result.reportPath).toContain("results/");
    const md = await readFile(result.reportPath, "utf8");
    expect(md).toContain("Senior AI Engineer");
    expect(md).toContain("9/10");
  });
});

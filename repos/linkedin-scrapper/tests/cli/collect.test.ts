import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  parseCollectArgs,
  runCollectCli,
} from "../../src/cli/collect.js";
import type { SearchSpec } from "../../src/domain/schemas.js";

const tempDirs: string[] = [];

afterEach(async () => {
  await Promise.all(
    tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })),
  );
});

const spec: SearchSpec = {
  prompt: "AI roles",
  keywords: ["AI"],
  locations: ["Remote"],
  workModes: ["remote"],
  recencyDays: 7,
  exclusions: [],
  limit: 5,
};

describe("parseCollectArgs", () => {
  it("requires --spec", () => {
    expect(() => parseCollectArgs([])).toThrow(/--spec/);
  });

  it("parses --spec and optional --run-dir", () => {
    expect(
      parseCollectArgs(["--spec", "spec.json", "--run-dir", ".runs/foo"]),
    ).toEqual({
      specPath: "spec.json",
      runDir: ".runs/foo",
    });
  });
});

describe("runCollectCli", () => {
  it("writes raw-jobs.json and manifest.json", async () => {
    const dir = await mkdtemp(join(tmpdir(), "li-cli-"));
    tempDirs.push(dir);
    const specPath = join(dir, "spec.json");
    await writeFile(specPath, JSON.stringify(spec), "utf8");

    const collectJobs = vi.fn(async () => ({
      jobs: [
        {
          jobId: "1",
          canonicalUrl: "https://www.linkedin.com/jobs/view/1/",
          title: "Engineer",
          company: "Acme",
          location: "Remote",
          workMode: "remote" as const,
          postedAt: "2026-07-20",
          compensation: "Not listed",
          description: "Build",
          extractionStatus: "ok" as const,
          warnings: [],
          source: {
            searchUrl: "https://www.linkedin.com/jobs/search/?keywords=AI",
            collectedAt: "2026-07-23T18:00:00.000Z",
          },
        },
      ],
      warnings: [],
      failed: 0,
      searchUrl: "https://www.linkedin.com/jobs/search/?keywords=AI",
    }));

    const result = await runCollectCli({
      argv: ["--spec", specPath],
      cwd: dir,
      collectJobs,
      now: () => new Date("2026-07-23T18:00:00.000Z"),
    });

    expect(result.exitCode).toBe(0);
    expect(result.runDir).toContain(".runs/");

    const rawJobs = JSON.parse(
      await readFile(join(result.runDir, "raw-jobs.json"), "utf8"),
    );
    expect(rawJobs.jobs).toHaveLength(1);

    const manifest = JSON.parse(
      await readFile(join(result.runDir, "manifest.json"), "utf8"),
    );
    expect(manifest.prompt).toBe("AI roles");
    expect(manifest.counts).toEqual({
      collected: 1,
      unique: 1,
      failed: 0,
    });
    expect(manifest.artifacts.rawJobs).toBe("raw-jobs.json");
  });

  it("returns exit code 1 for invalid spec", async () => {
    const dir = await mkdtemp(join(tmpdir(), "li-cli-"));
    tempDirs.push(dir);
    const specPath = join(dir, "bad-spec.json");
    await writeFile(specPath, JSON.stringify({ prompt: "" }), "utf8");

    const result = await runCollectCli({
      argv: ["--spec", specPath],
      cwd: dir,
      collectJobs: vi.fn(),
      now: () => new Date("2026-07-23T18:00:00.000Z"),
    });

    expect(result.exitCode).toBe(1);
    expect(result.error).toMatch(/invalid|search spec|validation/i);
  });
});

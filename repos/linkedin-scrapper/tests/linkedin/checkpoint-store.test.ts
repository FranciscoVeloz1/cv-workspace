import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  createCheckpointStore,
  type CheckpointState,
} from "../../src/linkedin/checkpoint-store.js";
import type { RawJob } from "../../src/domain/schemas.js";

const tempDirs: string[] = [];

afterEach(async () => {
  await Promise.all(
    tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })),
  );
});

function sampleJob(id: string): RawJob {
  return {
    jobId: id,
    canonicalUrl: `https://www.linkedin.com/jobs/view/${id}/`,
    title: `Role ${id}`,
    company: "Acme",
    location: "Remote",
    workMode: "remote",
    postedAt: "2026-07-20",
    compensation: "Not listed",
    description: "Desc",
    extractionStatus: "ok",
    warnings: [],
    source: {
      searchUrl: "https://www.linkedin.com/jobs/search/?keywords=AI",
      collectedAt: "2026-07-23T18:00:00.000Z",
    },
  };
}

describe("checkpoint store", () => {
  it("writes and recovers checkpoint state atomically", async () => {
    const dir = await mkdtemp(join(tmpdir(), "li-cp-"));
    tempDirs.push(dir);
    const store = createCheckpointStore(dir);

    const state: CheckpointState = {
      searchUrl: "https://www.linkedin.com/jobs/search/?keywords=AI",
      pageIndex: 1,
      jobs: [sampleJob("1")],
      warnings: [],
    };

    await store.save(state);
    const raw = await readFile(join(dir, "checkpoint.json"), "utf8");
    expect(JSON.parse(raw).pageIndex).toBe(1);

    const loaded = await store.load();
    expect(loaded).toEqual(state);
  });

  it("returns null when no checkpoint exists", async () => {
    const dir = await mkdtemp(join(tmpdir(), "li-cp-"));
    tempDirs.push(dir);
    const store = createCheckpointStore(dir);
    expect(await store.load()).toBeNull();
  });
});

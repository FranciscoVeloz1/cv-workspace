import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { ExtractionWarning, RawJob } from "../domain/schemas.js";

export interface CheckpointState {
  searchUrl: string;
  pageIndex: number;
  jobs: RawJob[];
  warnings: ExtractionWarning[];
}

export interface CheckpointStore {
  save: (state: CheckpointState) => Promise<void>;
  load: () => Promise<CheckpointState | null>;
}

export function createCheckpointStore(runDir: string): CheckpointStore {
  const filePath = join(runDir, "checkpoint.json");
  const tempPath = join(runDir, "checkpoint.json.tmp");

  return {
    async save(state) {
      await mkdir(runDir, { recursive: true });
      await writeFile(tempPath, `${JSON.stringify(state, null, 2)}\n`, "utf8");
      await rename(tempPath, filePath);
    },
    async load() {
      try {
        const raw = await readFile(filePath, "utf8");
        return JSON.parse(raw) as CheckpointState;
      } catch (error) {
        if (
          error &&
          typeof error === "object" &&
          "code" in error &&
          error.code === "ENOENT"
        ) {
          return null;
        }
        throw error;
      }
    },
  };
}

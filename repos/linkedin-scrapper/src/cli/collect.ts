import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import {
  RunManifestSchema,
  SearchSpecSchema,
  type RawJob,
  type RunManifest,
  type SearchSpec,
} from "../domain/schemas.js";
import {
  collectJobs as defaultCollectJobs,
  createPlaywrightSession,
  type CollectJobsResult,
} from "../linkedin/collector.js";

export interface CollectCliArgs {
  specPath: string;
  runDir?: string;
}

export interface CollectCliResult {
  exitCode: number;
  runDir: string;
  error?: string;
}

export interface CollectCliDeps {
  argv: string[];
  cwd?: string;
  collectJobs?: (options: {
    spec: SearchSpec;
    runDir: string;
  }) => Promise<CollectJobsResult>;
  now?: () => Date;
  log?: (message: string) => void;
  errorLog?: (message: string) => void;
}

export function parseCollectArgs(argv: string[]): CollectCliArgs {
  let specPath: string | undefined;
  let runDir: string | undefined;

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    const next = argv[i + 1];
    if (arg === "--spec" && next) {
      specPath = next;
      i += 1;
    } else if (arg === "--run-dir" && next) {
      runDir = next;
      i += 1;
    }
  }

  if (!specPath) {
    throw new Error("Missing required --spec <path-to-search-spec.json>");
  }

  return runDir ? { specPath, runDir } : { specPath };
}

function formatRunId(date: Date): string {
  const iso = date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
  return iso;
}

async function loadSearchSpec(specPath: string): Promise<SearchSpec> {
  const raw = JSON.parse(await readFile(specPath, "utf8"));
  return SearchSpecSchema.parse(raw);
}

export async function runCollectCli(
  deps: CollectCliDeps,
): Promise<CollectCliResult> {
  const cwd = deps.cwd ?? process.cwd();
  const log = deps.log ?? console.log;
  const errorLog = deps.errorLog ?? console.error;
  const now = deps.now ?? (() => new Date());
  const collect =
    deps.collectJobs ??
    ((options) =>
      defaultCollectJobs({
        ...options,
        session: createPlaywrightSession(cwd),
      }));

  try {
    const args = parseCollectArgs(deps.argv);
    const spec = await loadSearchSpec(
      args.specPath.startsWith("/") ? args.specPath : join(cwd, args.specPath),
    );
    const createdAt = now();
    const runId = formatRunId(createdAt);
    const runDir =
      args.runDir && args.runDir.length > 0
        ? args.runDir.startsWith("/")
          ? args.runDir
          : join(cwd, args.runDir)
        : join(cwd, ".runs", runId);

    await mkdir(runDir, { recursive: true });

    const collection = await collect({ spec, runDir });
    const updatedAt = now().toISOString();

    const rawJobsPayload = {
      jobs: collection.jobs as RawJob[],
    };
    await writeFile(
      join(runDir, "raw-jobs.json"),
      `${JSON.stringify(rawJobsPayload, null, 2)}\n`,
      "utf8",
    );

    const manifest: RunManifest = RunManifestSchema.parse({
      runId,
      createdAt: createdAt.toISOString(),
      updatedAt,
      prompt: spec.prompt,
      searchSpec: spec,
      counts: {
        collected: collection.jobs.length + collection.failed,
        unique: collection.jobs.length,
        failed: collection.failed,
      },
      warnings: collection.warnings,
      artifacts: {
        rawJobs: "raw-jobs.json",
        manifest: "manifest.json",
      },
    });

    await writeFile(
      join(runDir, "manifest.json"),
      `${JSON.stringify(manifest, null, 2)}\n`,
      "utf8",
    );

    log(`Collected ${collection.jobs.length} unique jobs → ${runDir}`);
    return { exitCode: 0, runDir };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    errorLog(message);
    return {
      exitCode: 1,
      runDir: "",
      error: message.includes("invalid") || message.includes("Validation")
        ? `Invalid search spec: ${message}`
        : message.startsWith("Invalid")
          ? message
          : `Invalid search spec / collection failed: ${message}`,
    };
  }
}

async function main(): Promise<void> {
  const result = await runCollectCli({
    argv: process.argv.slice(2),
  });
  process.exitCode = result.exitCode;
}

const isDirect =
  process.argv[1] &&
  (process.argv[1].endsWith("collect.ts") ||
    process.argv[1].endsWith("collect.js"));

if (isDirect) {
  void main();
}

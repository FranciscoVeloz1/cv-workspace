import { mkdir, readFile, writeFile } from "node:fs/promises";
import { basename, join } from "node:path";
import {
  AssessmentsFileSchema,
  RunManifestSchema,
  type Assessment,
  type RawJob,
  type RunManifest,
} from "../domain/schemas.js";
import { renderMarkdownReport } from "../report/render-markdown.js";

export interface RenderCliArgs {
  runDir: string;
  assessmentsPath: string;
}

export interface RenderCliResult {
  exitCode: number;
  reportPath: string;
  error?: string;
}

export interface RenderCliDeps {
  argv: string[];
  cwd?: string;
  now?: () => Date;
  log?: (message: string) => void;
  errorLog?: (message: string) => void;
}

export function parseRenderArgs(argv: string[]): RenderCliArgs {
  let runDir: string | undefined;
  let assessmentsPath: string | undefined;

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    const next = argv[i + 1];
    if (arg === "--run" && next) {
      runDir = next;
      i += 1;
    } else if (arg === "--assessments" && next) {
      assessmentsPath = next;
      i += 1;
    }
  }

  if (!runDir) {
    throw new Error("Missing required --run <run-directory>");
  }
  if (!assessmentsPath) {
    throw new Error("Missing required --assessments <assessments.json>");
  }

  return { runDir, assessmentsPath };
}

function resolvePath(cwd: string, pathValue: string): string {
  return pathValue.startsWith("/") ? pathValue : join(cwd, pathValue);
}

function slugify(value: string): string {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 48) || "jobs"
  );
}

function formatStamp(date: Date): string {
  const iso = date.toISOString();
  return `${iso.slice(0, 10)}-${iso.slice(11, 13)}${iso.slice(14, 16)}`;
}

export async function runRenderCli(
  deps: RenderCliDeps,
): Promise<RenderCliResult> {
  const cwd = deps.cwd ?? process.cwd();
  const log = deps.log ?? console.log;
  const errorLog = deps.errorLog ?? console.error;
  const now = deps.now ?? (() => new Date());

  try {
    const args = parseRenderArgs(deps.argv);
    const runDir = resolvePath(cwd, args.runDir);
    const assessmentsPath = resolvePath(cwd, args.assessmentsPath);

    const manifestRaw = JSON.parse(
      await readFile(join(runDir, "manifest.json"), "utf8"),
    );
    const manifest: RunManifest = RunManifestSchema.parse(manifestRaw);

    const rawJobsRaw = JSON.parse(
      await readFile(join(runDir, "raw-jobs.json"), "utf8"),
    );
    const jobs = (rawJobsRaw.jobs ?? []) as RawJob[];

    const assessmentsFile = AssessmentsFileSchema.parse(
      JSON.parse(await readFile(assessmentsPath, "utf8")),
    );
    const assessments: Assessment[] = assessmentsFile.assessments;

    const generatedAt = now();
    const markdown = renderMarkdownReport({
      prompt: manifest.prompt,
      limit: manifest.searchSpec.limit,
      jobs,
      assessments,
      warnings: manifest.warnings,
      generatedAt: generatedAt.toISOString(),
    });

    const resultsDir = join(cwd, "results");
    await mkdir(resultsDir, { recursive: true });
    const reportName = `${formatStamp(generatedAt)}-${slugify(manifest.prompt)}.md`;
    const reportPath = join(resultsDir, reportName);
    await writeFile(reportPath, markdown, "utf8");

    const updatedManifest: RunManifest = {
      ...manifest,
      updatedAt: generatedAt.toISOString(),
      artifacts: {
        ...manifest.artifacts,
        report: join("results", basename(reportPath)),
      },
    };
    await writeFile(
      join(runDir, "manifest.json"),
      `${JSON.stringify(updatedManifest, null, 2)}\n`,
      "utf8",
    );

    log(`Wrote report → ${reportPath}`);
    return { exitCode: 0, reportPath };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    errorLog(message);
    return { exitCode: 1, reportPath: "", error: message };
  }
}

async function main(): Promise<void> {
  const result = await runRenderCli({
    argv: process.argv.slice(2),
  });
  process.exitCode = result.exitCode;
}

const isDirect =
  process.argv[1] &&
  (process.argv[1].endsWith("render.ts") ||
    process.argv[1].endsWith("render.js"));

if (isDirect) {
  void main();
}

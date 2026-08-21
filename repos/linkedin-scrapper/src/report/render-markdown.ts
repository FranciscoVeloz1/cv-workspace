import type {
  Assessment,
  ExtractionWarning,
  RawJob,
} from "../domain/schemas.js";

export interface QualifiedRow {
  job: RawJob;
  assessment: Assessment;
}

export interface RenderMarkdownInput {
  prompt: string;
  limit: number;
  jobs: RawJob[];
  assessments: Assessment[];
  warnings: ExtractionWarning[];
  generatedAt: string;
}

export function escapeMarkdownCell(value: string): string {
  return value.replace(/\r?\n/g, " ").replace(/\|/g, "\\|").trim();
}

function postedSortKey(postedAt: string | null): number {
  if (!postedAt) return 0;
  const asDate = Date.parse(postedAt);
  if (!Number.isNaN(asDate)) return asDate;
  return 0;
}

export function sortQualifiedRows(
  jobs: RawJob[],
  assessments: Assessment[],
): QualifiedRow[] {
  const jobById = new Map(jobs.map((job) => [job.jobId, job]));
  const rows: QualifiedRow[] = [];

  for (const assessment of assessments) {
    if (assessment.decision !== "qualified") continue;
    const job = jobById.get(assessment.jobId);
    if (!job) continue;
    rows.push({ job, assessment });
  }

  return rows.toSorted((a, b) => {
    if (b.assessment.fitScore !== a.assessment.fitScore) {
      return b.assessment.fitScore - a.assessment.fitScore;
    }
    return postedSortKey(b.job.postedAt) - postedSortKey(a.job.postedAt);
  });
}

export function renderMarkdownReport(input: RenderMarkdownInput): string {
  const rows = sortQualifiedRows(input.jobs, input.assessments).slice(
    0,
    input.limit,
  );

  const lines: string[] = [
    "# Job Search Targets",
    "",
    input.prompt,
    "",
    `Generated: ${input.generatedAt}`,
    `Qualified shown: ${rows.length} (limit ${input.limit})`,
    "",
  ];

  if (input.warnings.length > 0) {
    lines.push("## Collection Warnings", "");
    for (const warning of input.warnings) {
      const urlPart = warning.url ? ` (${warning.url})` : "";
      lines.push(`- [${warning.stage}] ${warning.message}${urlPart}`);
    }
    lines.push("");
  }

  lines.push(`## Top ${rows.length} Priority Targets`, "");

  if (rows.length === 0) {
    lines.push("No qualified jobs matched the prompt after assessment.");
    lines.push("");
    return lines.join("\n");
  }

  lines.push(
    "| # | Role | Company | Location | Work Mode | Posted | Est. Comp | Fit | Apply Advice | URL |",
  );
  lines.push(
    "| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |",
  );

  rows.forEach((row, index) => {
    lines.push(
      `| ${index + 1} | ${escapeMarkdownCell(row.job.title)} | ${escapeMarkdownCell(row.job.company)} | ${escapeMarkdownCell(row.job.location)} | ${escapeMarkdownCell(row.job.workMode)} | ${escapeMarkdownCell(row.job.postedAt ?? "Unknown")} | ${escapeMarkdownCell(row.job.compensation)} | ${row.assessment.fitScore}/10 | ${escapeMarkdownCell(row.assessment.applyAdvice)} | ${row.job.canonicalUrl} |`,
    );
  });

  lines.push("");
  return lines.join("\n");
}

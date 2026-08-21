import { z } from "zod";

export const WorkModeSchema = z.enum(["remote", "hybrid", "onsite", "unknown"]);

export const SearchSpecSchema = z.object({
  prompt: z.string().min(1),
  keywords: z.array(z.string().min(1)),
  locations: z.array(z.string().min(1)),
  workModes: z.array(WorkModeSchema),
  recencyDays: z.number().int().positive(),
  exclusions: z.array(z.string()),
  limit: z.number().int().min(1).max(50),
});

export type SearchSpec = z.infer<typeof SearchSpecSchema>;
export type WorkMode = z.infer<typeof WorkModeSchema>;

export const ExtractionWarningSchema = z.object({
  stage: z.string().min(1),
  message: z.string().min(1),
  url: z.string().url().optional(),
  screenshotPath: z.string().optional(),
  snapshotPath: z.string().optional(),
});

export type ExtractionWarning = z.infer<typeof ExtractionWarningSchema>;

export const RawJobSchema = z.object({
  jobId: z.string().min(1),
  canonicalUrl: z.string().url(),
  title: z.string().min(1),
  company: z.string().min(1),
  location: z.string().min(1),
  workMode: WorkModeSchema,
  postedAt: z.string().nullable(),
  compensation: z.string().min(1),
  description: z.string().nullable(),
  extractionStatus: z.enum(["ok", "partial", "failed"]),
  warnings: z.array(ExtractionWarningSchema),
  source: z.object({
    searchUrl: z.string().url(),
    collectedAt: z.string().min(1),
  }),
});

export type RawJob = z.infer<typeof RawJobSchema>;

export const AssessmentSchema = z.object({
  jobId: z.string().min(1),
  decision: z.enum(["qualified", "rejected"]),
  fitScore: z.number().int().min(0).max(10),
  fitReason: z.string().min(1),
  applyAdvice: z.string(),
});

export type Assessment = z.infer<typeof AssessmentSchema>;

export const AssessmentsFileSchema = z.object({
  assessments: z.array(AssessmentSchema),
});

export type AssessmentsFile = z.infer<typeof AssessmentsFileSchema>;

export const RunManifestSchema = z.object({
  runId: z.string().min(1),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
  prompt: z.string().min(1),
  searchSpec: SearchSpecSchema,
  counts: z.object({
    collected: z.number().int().nonnegative(),
    unique: z.number().int().nonnegative(),
    failed: z.number().int().nonnegative(),
  }),
  warnings: z.array(ExtractionWarningSchema),
  artifacts: z.object({
    rawJobs: z.string().min(1),
    manifest: z.string().min(1),
    report: z.string().optional(),
  }),
});

export type RunManifest = z.infer<typeof RunManifestSchema>;

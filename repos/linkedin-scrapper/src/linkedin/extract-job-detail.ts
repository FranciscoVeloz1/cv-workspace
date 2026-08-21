import { parse } from "node-html-parser";
import type { ExtractionWarning, RawJob, WorkMode } from "../domain/schemas.js";
import {
  canonicalizeJobUrl,
  cleanText,
  extractJobId,
  normalizeCompensation,
} from "./normalize.js";

export type JobDetailResult =
  | { ok: true; job: Omit<RawJob, "source"> }
  | { ok: false; warning: ExtractionWarning };

function detectWorkMode(text: string): WorkMode {
  const lower = text.toLowerCase();
  if (/\bremote\b|\ben remoto\b|\bremoto\b/.test(lower)) return "remote";
  if (/\bhybrid\b|\bhíbrido\b|\bhibrido\b/.test(lower)) return "hybrid";
  if (/\bon[- ]?site\b|\bin[- ]?office\b|\bpresencial\b/.test(lower))
    return "onsite";
  return "unknown";
}

function extractPostedAt(primaryText: string): string | null {
  const iso = primaryText.match(/\b(\d{4}-\d{2}-\d{2})\b/);
  if (iso?.[1]) return iso[1];

  const relative = primaryText.match(
    /(\d+)\s+(day|days|hour|hours|week|weeks)\s+ago/i,
  );
  if (relative) {
    return cleanText(relative[0]) || null;
  }
  return null;
}

export function extractJobDetail(
  html: string,
  pageUrl: string,
): JobDetailResult {
  const root = parse(html);
  const jobId = extractJobId(pageUrl);
  const canonicalUrl = canonicalizeJobUrl(pageUrl);

  const title = cleanText(
    root.querySelector(".job-details-jobs-unified-top-card__job-title")?.text ??
      root.querySelector(".jobs-unified-top-card__job-title")?.text ??
      root.querySelector(".top-card-layout__title")?.text ??
      root.querySelector(".topcard__title")?.text ??
      root.querySelector("h1")?.text ??
      "",
  );

  const flavors = root
    .querySelectorAll(".topcard__flavor")
    .map((el) => cleanText(el.text))
    .filter(Boolean);

  const company = cleanText(
    root.querySelector(".job-details-jobs-unified-top-card__company-name")
      ?.text ??
      root.querySelector(".jobs-unified-top-card__company-name")?.text ??
      flavors[0] ??
      root.querySelector(".topcard__org-name-link")?.text ??
      "",
  );

  const primaryText = cleanText(
    root.querySelector(
      ".job-details-jobs-unified-top-card__primary-description-container",
    )?.text ??
      root.querySelector(".jobs-unified-top-card__primary-description")?.text ??
      root.querySelector(".top-card-layout__second-subline")?.text ??
      flavors.slice(1).join(" · "),
  );

  const salaryText = cleanText(
    root.querySelector(".salary-main-rail__data-amount")?.text ??
      root.querySelector(".compensation__salary")?.text ??
      root.querySelector(
        ".job-details-jobs-unified-top-card__job-insight--highlight",
      )?.text ??
      root.querySelector(".salary")?.text ??
      "",
  );

  const description = cleanText(
    root.querySelector(".jobs-box__html-content")?.text ??
      root.querySelector(".jobs-description__content")?.text ??
      root.querySelector("#job-details")?.text ??
      root.querySelector(".show-more-less-html__markup")?.text ??
      root.querySelector(".description__text")?.text ??
      "",
  );

  if (!jobId || !canonicalUrl || !title || !company) {
    return {
      ok: false,
      warning: {
        stage: "job-detail",
        message:
          "Job detail layout selectors missed required title/company/job id fields",
        url: pageUrl,
      },
    };
  }

  const locationCandidate = cleanText(primaryText.split("·")[0] ?? "");
  const locationLooksRelative = /\b(ago|hour|day|week|month|minute)\b/i.test(
    locationCandidate,
  );
  const location =
    (!locationLooksRelative && locationCandidate) ||
    flavors[1] ||
    locationCandidate ||
    "Unknown";
  const workMode = detectWorkMode(`${primaryText} ${flavors.join(" ")}`);
  const compensation = normalizeCompensation(salaryText);
  const postedAt =
    extractPostedAt(primaryText) ??
    (locationLooksRelative ? locationCandidate : null);
  const warnings: ExtractionWarning[] = [];

  let extractionStatus: RawJob["extractionStatus"] = "ok";
  if (!description) {
    extractionStatus = "partial";
    warnings.push({
      stage: "job-detail",
      message: "Description selector missed",
      url: pageUrl,
    });
  }

  return {
    ok: true,
    job: {
      jobId,
      canonicalUrl,
      title,
      company,
      location,
      workMode,
      postedAt,
      compensation,
      description: description || null,
      extractionStatus,
      warnings,
    },
  };
}

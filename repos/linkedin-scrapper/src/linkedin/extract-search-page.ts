import { parse } from "node-html-parser";
import {
  canonicalizeJobUrl,
  cleanText,
  extractJobId,
} from "./normalize.js";

export interface SearchCard {
  jobId: string;
  canonicalUrl: string;
  title: string;
  company: string;
  location: string;
  postedAt: string | null;
}

function dedupeRepeatedTitle(title: string): string {
  const cleaned = cleanText(title);
  if (!cleaned) return "";
  const mid = Math.floor(cleaned.length / 2);
  const left = cleaned.slice(0, mid).trim();
  const right = cleaned.slice(mid).trim();
  if (left && right.startsWith(left.slice(0, Math.min(20, left.length)))) {
    return left;
  }
  // e.g. "Title Title" exact doubles
  const parts = cleaned.split(/\s{2,}|\n/);
  if (parts.length >= 2 && cleanText(parts[0]!) === cleanText(parts[1]!)) {
    return cleanText(parts[0]!);
  }
  return cleaned;
}

export function extractSearchCards(html: string): SearchCard[] {
  const root = parse(html);
  const items = root.querySelectorAll(
    "li[data-occludable-job-id], li.jobs-search-results__list-item, li.jobs-search-results-list__list-item, li.scaffold-layout__list-item, .base-card, .job-card-container",
  );

  const cards: SearchCard[] = [];
  const seen = new Set<string>();

  for (const item of items) {
    const link =
      item.querySelector("a.job-card-list__title--link") ??
      item.querySelector("a.job-card-container__link") ??
      item.querySelector("a.base-card__full-link") ??
      item.querySelector('a[href*="/jobs/view/"]');
    const href = link?.getAttribute("href") ?? "";
    const jobId =
      item.getAttribute("data-occludable-job-id") ??
      item.getAttribute("data-job-id") ??
      extractJobId(item.getAttribute("data-entity-urn") ?? "") ??
      extractJobId(href) ??
      null;
    const canonicalUrl = jobId
      ? `https://www.linkedin.com/jobs/view/${jobId}/`
      : canonicalizeJobUrl(href.startsWith("http") ? href : `https://www.linkedin.com${href}`);

    if (!jobId || !canonicalUrl || seen.has(jobId)) {
      continue;
    }

    const title = dedupeRepeatedTitle(
      item.querySelector(
        "a.job-card-list__title--link strong, a.job-card-container__link strong",
      )?.text ??
        item.querySelector(".base-search-card__title")?.text ??
        item.querySelector("h3")?.text ??
        link?.text ??
        "",
    );
    const company = cleanText(
      item.querySelector(".artdeco-entity-lockup__subtitle")?.text ??
        item.querySelector(".base-search-card__subtitle")?.text ??
        item.querySelector("h4")?.text ??
        "",
    );
    const location = cleanText(
      item.querySelector(".artdeco-entity-lockup__caption")?.text ??
        item.querySelector(".job-search-card__location")?.text ??
        item.querySelector(".job-card-container__metadata-item")?.text ??
        "",
    );
    const timeEl =
      item.querySelector("time.job-search-card__listdate") ??
      item.querySelector("time.job-search-card__listdate--new") ??
      item.querySelector("time");
    const postedAt =
      timeEl?.getAttribute("datetime")?.trim() ||
      cleanText(timeEl?.text) ||
      null;

    if (!title || !company) {
      continue;
    }

    seen.add(jobId);
    cards.push({
      jobId,
      canonicalUrl,
      title,
      company,
      location: location || "Unknown",
      postedAt,
    });
  }

  return cards;
}

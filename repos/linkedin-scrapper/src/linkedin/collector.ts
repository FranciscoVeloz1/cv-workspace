import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type {
  ExtractionWarning,
  RawJob,
  SearchSpec,
} from "../domain/schemas.js";
import {
  detectChallengePage,
  detectLoginPage,
  launchPersistentContext,
} from "./browser.js";
import { createCheckpointStore } from "./checkpoint-store.js";
import { extractJobDetail } from "./extract-job-detail.js";
import { extractSearchCards } from "./extract-search-page.js";
import { dedupeJobs } from "./normalize.js";
import { createPacer, type Pacer } from "./pacing.js";
import { buildLinkedInSearchUrl } from "./search-url.js";
import type { BrowserContext, Page } from "playwright";

export interface CollectorPage {
  url: () => string;
  content: () => Promise<string>;
  goto: (url: string) => Promise<unknown>;
  waitForTimeout: (ms: number) => Promise<void>;
  screenshot: (options: {
    path: string;
    fullPage?: boolean;
  }) => Promise<unknown>;
  isLoginPage: () => Promise<boolean>;
  isChallengePage: () => Promise<boolean>;
  evaluate?: <T>(
    fn: (...args: never[]) => T | Promise<T>,
    arg?: unknown,
  ) => Promise<T>;
}

export interface BrowserSession {
  openPage: () => Promise<CollectorPage>;
  close: () => Promise<void>;
}

export interface CollectJobsOptions {
  spec: SearchSpec;
  runDir: string;
  session?: BrowserSession;
  pacer?: Pacer;
  now?: () => string;
  loginTimeoutMs?: number;
}

export interface CollectJobsResult {
  jobs: RawJob[];
  warnings: ExtractionWarning[];
  failed: number;
  searchUrl: string;
}

function wrapPlaywrightPage(page: Page): CollectorPage {
  return {
    url: () => page.url(),
    content: () => page.content(),
    goto: (url) => page.goto(url, { waitUntil: "domcontentloaded" }),
    waitForTimeout: (ms) => page.waitForTimeout(ms),
    screenshot: (options) => page.screenshot(options),
    isLoginPage: () => detectLoginPage(page),
    isChallengePage: () => detectChallengePage(page),
    evaluate: (fn, arg) => page.evaluate(fn as never, arg as never),
  };
}

async function loadJobDetailHtml(
  page: CollectorPage,
  card: { jobId: string; canonicalUrl: string },
): Promise<string> {
  const looksHydrated = (html: string) =>
    html.includes("jobs-description") ||
    html.includes("job-details-jobs-unified-top-card") ||
    html.includes("jobs-box__html-content") ||
    html.includes("jobs-unified-top-card") ||
    html.includes("top-card-layout__title");

  const shouldPollForHydration = (html: string) =>
    /linkedin\.com/i.test(html) &&
    html.length > 20_000 &&
    !looksHydrated(html);

  // Prefer two-pane click on the search results page (authenticated UI).
  if (page.evaluate) {
    const clicked = await page.evaluate((jobId) => {
      const id = String(jobId);
      const item = document.querySelector(
        `li[data-occludable-job-id="${id}"]`,
      ) as HTMLElement | null;
      const link =
        item?.querySelector(
          "a.job-card-list__title--link, a.job-card-container__link, a[href*='/jobs/view/']",
        ) ?? null;
      if (link instanceof HTMLElement) {
        link.click();
        return true;
      }
      return false;
    }, card.jobId);

    if (clicked) {
      let html = await page.content();
      if (looksHydrated(html) || !shouldPollForHydration(html)) {
        return html;
      }
      const deadline = Date.now() + 12_000;
      while (Date.now() < deadline) {
        await page.waitForTimeout(500);
        html = await page.content();
        if (looksHydrated(html)) return html;
      }
      return html;
    }
  }

  await page.goto(card.canonicalUrl);
  let html = await page.content();
  if (looksHydrated(html) || !shouldPollForHydration(html)) {
    return html;
  }
  const deadline = Date.now() + 12_000;
  while (Date.now() < deadline) {
    await page.waitForTimeout(500);
    html = await page.content();
    if (looksHydrated(html)) return html;
  }
  return html;
}

export function createPlaywrightSession(cwd = process.cwd()): BrowserSession {
  let context: BrowserContext | null = null;

  return {
    async openPage() {
      context = await launchPersistentContext({ cwd });
      const page = context.pages()[0] ?? (await context.newPage());
      return wrapPlaywrightPage(page);
    },
    async close() {
      await context?.close();
      context = null;
    },
  };
}

async function saveDiagnostics(
  page: CollectorPage,
  runDir: string,
  stage: string,
): Promise<Pick<ExtractionWarning, "screenshotPath" | "snapshotPath">> {
  const diagnosticsDir = join(runDir, "diagnostics");
  await mkdir(diagnosticsDir, { recursive: true });
  const stamp = Date.now();
  const screenshotPath = join(diagnosticsDir, `${stage}-${stamp}.png`);
  const snapshotPath = join(diagnosticsDir, `${stage}-${stamp}.html`);

  try {
    await page.screenshot({ path: screenshotPath, fullPage: true });
  } catch {
    // Screenshot is best-effort.
  }

  try {
    const html = await page.content();
    const sanitized = html
      .replace(/cookie[^;<>]*/gi, "cookie=[redacted]")
      .replace(/authorization:\s*[^\n<]+/gi, "authorization: [redacted]");
    await writeFile(snapshotPath, sanitized, "utf8");
  } catch {
    // Snapshot is best-effort.
  }

  return { screenshotPath, snapshotPath };
}

async function ensureAuthenticated(
  page: CollectorPage,
  loginTimeoutMs: number,
  resumeUrl?: string,
): Promise<void> {
  if (await page.isChallengePage()) {
    throw new Error(
      "LinkedIn challenge/CAPTCHA detected. Complete it manually in the browser, then re-run. No automated bypass is supported.",
    );
  }

  if (!(await page.isLoginPage())) {
    return;
  }

  const deadline = Date.now() + loginTimeoutMs;
  console.error(
    "LinkedIn login / auth wall detected. Sign in manually in the opened browser window…",
  );

  while (Date.now() < deadline) {
    if (await page.isChallengePage()) {
      throw new Error(
        "LinkedIn challenge/CAPTCHA detected during login. Complete it manually, then re-run.",
      );
    }
    if (!(await page.isLoginPage())) {
      if (resumeUrl) {
        await page.goto(resumeUrl);
        await page.waitForTimeout(1500);
      }
      return;
    }
    await page.waitForTimeout(1000);
  }

  throw new Error(
    `Manual LinkedIn login timed out after ${loginTimeoutMs}ms. Re-run after signing in.`,
  );
}

export async function collectJobs(
  options: CollectJobsOptions,
): Promise<CollectJobsResult> {
  const {
    spec,
    runDir,
    loginTimeoutMs = 5 * 60 * 1000,
    now = () => new Date().toISOString(),
  } = options;
  const pacer =
    options.pacer ?? createPacer({ minMs: 1500, maxMs: 3500 });
  const session = options.session ?? createPlaywrightSession();
  const checkpoint = createCheckpointStore(runDir);
  const searchUrl = buildLinkedInSearchUrl(spec);

  const existing = await checkpoint.load();
  let jobs: RawJob[] = existing?.jobs ? [...existing.jobs] : [];
  let warnings: ExtractionWarning[] = existing?.warnings
    ? [...existing.warnings]
    : [];
  let failed = 0;

  const page = await session.openPage();

  try {
    await page.goto(searchUrl);
    await ensureAuthenticated(page, loginTimeoutMs, searchUrl);

    if (await page.isChallengePage()) {
      const paths = await saveDiagnostics(page, runDir, "challenge");
      throw new Error(
        `LinkedIn challenge/CAPTCHA page detected at ${page.url()}. Diagnostics: ${paths.screenshotPath ?? "n/a"}`,
      );
    }

    await pacer.wait();
    if (page.evaluate) {
      // LinkedIn virtualizes the results list; scroll to load enough cards.
      const targetCards = Math.min(Math.max(spec.limit * 2, 15), 40);
      for (let i = 0; i < 12; i += 1) {
        const count = await page.evaluate(() =>
          document.querySelectorAll(
            "li[data-occludable-job-id], .job-card-container",
          ).length,
        );
        if (count >= targetCards) break;
        await page.evaluate(() => {
          const list =
            document.querySelector(".scaffold-layout__list") ??
            document.querySelector(".jobs-search-results-list") ??
            document.scrollingElement;
          if (list) {
            list.scrollTop = list.scrollHeight;
          }
        });
        await page.waitForTimeout(800);
      }
    }

    const searchHtml = await page.content();
    const cards = extractSearchCards(searchHtml);

    if (cards.length === 0) {
      const paths = await saveDiagnostics(page, runDir, "search-page");
      warnings.push({
        stage: "search-page",
        message: "No job cards found on search results page",
        url: page.url(),
        ...paths,
      });
    }

    await checkpoint.save({
      searchUrl,
      pageIndex: 0,
      jobs,
      warnings,
    });

    const seenIds = new Set(jobs.map((job) => job.jobId));
    const seenUrls = new Set(jobs.map((job) => job.canonicalUrl));
    const maxAttempts = Math.max(spec.limit * 3, spec.limit + 5);
    let attempts = 0;

    for (const card of cards) {
      if (jobs.length >= spec.limit) {
        break;
      }
      if (attempts >= maxAttempts) {
        warnings.push({
          stage: "collector",
          message: `Stopped after ${attempts} detail attempts with ${jobs.length}/${spec.limit} jobs collected`,
          url: searchUrl,
        });
        break;
      }

      if (seenIds.has(card.jobId) || seenUrls.has(card.canonicalUrl)) {
        continue;
      }

      attempts += 1;
      await pacer.wait();

      try {
        if (await page.isChallengePage()) {
          throw new Error(
            "LinkedIn challenge/CAPTCHA detected while opening a job detail page.",
          );
        }

        const detailHtml = await loadJobDetailHtml(page, card);
        await ensureAuthenticated(page, loginTimeoutMs, searchUrl);
        const detail = extractJobDetail(detailHtml, card.canonicalUrl);

        let rawJob: RawJob;
        if (!detail.ok) {
          const paths = await saveDiagnostics(page, runDir, "job-detail");
          warnings.push({ ...detail.warning, ...paths });
          // Fall back to search-card fields so guest/auth layout drift still yields rows.
          rawJob = {
            jobId: card.jobId,
            canonicalUrl: card.canonicalUrl,
            title: card.title,
            company: card.company,
            location: card.location,
            workMode: "unknown",
            postedAt: card.postedAt,
            compensation: "Not listed",
            description: null,
            extractionStatus: "partial",
            warnings: [
              {
                stage: "job-detail",
                message:
                  "Detail extraction failed; used search-card fields as fallback",
                url: card.canonicalUrl,
              },
            ],
            source: {
              searchUrl,
              collectedAt: now(),
            },
          };
        } else {
          rawJob = {
            ...detail.job,
            postedAt: detail.job.postedAt ?? card.postedAt,
            location:
              detail.job.location !== "Unknown"
                ? detail.job.location
                : card.location,
            source: {
              searchUrl,
              collectedAt: now(),
            },
          };
        }

        jobs = dedupeJobs([...jobs, rawJob]);
        seenIds.add(rawJob.jobId);
        seenUrls.add(rawJob.canonicalUrl);
        await checkpoint.save({
          searchUrl,
          pageIndex: 0,
          jobs,
          warnings,
        });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : String(error);
        if (/challenge|captcha/i.test(message)) {
          throw error;
        }
        failed += 1;
        const paths = await saveDiagnostics(page, runDir, "job-detail");
        warnings.push({
          stage: "job-detail",
          message,
          url: card.canonicalUrl,
          ...paths,
        });
        await checkpoint.save({
          searchUrl,
          pageIndex: 0,
          jobs,
          warnings,
        });
      }
    }

    jobs = dedupeJobs(jobs).slice(0, spec.limit);

    await checkpoint.save({
      searchUrl,
      pageIndex: 0,
      jobs,
      warnings,
    });

    return { jobs, warnings, failed, searchUrl };
  } finally {
    await session.close();
  }
}

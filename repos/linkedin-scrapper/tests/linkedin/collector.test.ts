import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { collectJobs } from "../../src/linkedin/collector.js";
import type { SearchSpec } from "../../src/domain/schemas.js";
import type {
  BrowserSession,
  CollectorPage,
} from "../../src/linkedin/collector.js";

const tempDirs: string[] = [];

afterEach(async () => {
  await Promise.all(
    tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })),
  );
});

const spec: SearchSpec = {
  prompt: "AI fullstack remote",
  keywords: ["AI", "fullstack"],
  locations: ["Remote"],
  workModes: ["remote"],
  recencyDays: 7,
  exclusions: ["junior"],
  limit: 2,
};

function makePage(opts: {
  url: string;
  html: string;
  isLogin?: boolean;
  isChallenge?: boolean;
}): CollectorPage {
  return {
    url: () => opts.url,
    content: async () => opts.html,
    goto: vi.fn(async () => undefined),
    waitForTimeout: vi.fn(async () => undefined),
    screenshot: vi.fn(async () => Buffer.from("")),
    isLoginPage: async () => opts.isLogin ?? false,
    isChallengePage: async () => opts.isChallenge ?? false,
  };
}

describe("collectJobs", () => {
  it("collects unique jobs up to the requested limit", async () => {
    const dir = await mkdtemp(join(tmpdir(), "li-collect-"));
    tempDirs.push(dir);

    const searchHtml = `
      <ul class="jobs-search__results-list">
        <li class="jobs-search-results__list-item" data-occludable-job-id="1">
          <a class="base-card__full-link" href="https://www.linkedin.com/jobs/view/1/"></a>
          <h3 class="base-search-card__title">Role One</h3>
          <h4 class="base-search-card__subtitle">Acme</h4>
          <span class="job-search-card__location">Remote</span>
        </li>
        <li class="jobs-search-results__list-item" data-occludable-job-id="2">
          <a class="base-card__full-link" href="https://www.linkedin.com/jobs/view/2/"></a>
          <h3 class="base-search-card__title">Role Two</h3>
          <h4 class="base-search-card__subtitle">Beta</h4>
          <span class="job-search-card__location">Remote</span>
        </li>
        <li class="jobs-search-results__list-item" data-occludable-job-id="3">
          <a class="base-card__full-link" href="https://www.linkedin.com/jobs/view/3/"></a>
          <h3 class="base-search-card__title">Role Three</h3>
          <h4 class="base-search-card__subtitle">Gamma</h4>
          <span class="job-search-card__location">Remote</span>
        </li>
      </ul>`;

    const detailHtml = (id: string, title: string, company: string) => `
      <main class="jobs-details">
        <h1 class="job-details-jobs-unified-top-card__job-title">${title}</h1>
        <div class="job-details-jobs-unified-top-card__company-name">${company}</div>
        <div class="job-details-jobs-unified-top-card__primary-description-container">
          <span class="tvm__text">Remote · Remote · 1 day ago</span>
        </div>
        <div class="jobs-description__content"><div class="jobs-box__html-content">Desc ${id}</div></div>
      </main>`;

    let detailCalls = 0;
    const session: BrowserSession = {
      openPage: async () => {
        const page = makePage({
          url: "https://www.linkedin.com/jobs/search/?keywords=AI",
          html: searchHtml,
        });
        page.goto = vi.fn(async (url: string) => {
          page.url = () => url;
          if (url.includes("/jobs/view/")) {
            detailCalls += 1;
            const id = url.match(/view\/(\d+)/)?.[1] ?? "0";
            const html = detailHtml(id, `Role ${id}`, "Acme");
            page.content = async () => html;
          } else {
            page.content = async () => searchHtml;
          }
        });
        return page;
      },
      close: async () => undefined,
    };

    const result = await collectJobs({
      spec,
      runDir: dir,
      session,
      pacer: { wait: async () => undefined },
      now: () => "2026-07-23T18:00:00.000Z",
      loginTimeoutMs: 1000,
    });

    expect(result.jobs).toHaveLength(2);
    expect(result.jobs.map((j) => j.jobId)).toEqual(["1", "2"]);
    expect(detailCalls).toBe(2);
  });

  it("continues after a single job detail failure", async () => {
    const dir = await mkdtemp(join(tmpdir(), "li-collect-"));
    tempDirs.push(dir);

    const searchHtml = `
      <ul class="jobs-search__results-list">
        <li class="jobs-search-results__list-item" data-occludable-job-id="10">
          <a class="base-card__full-link" href="https://www.linkedin.com/jobs/view/10/"></a>
          <h3 class="base-search-card__title">Broken</h3>
          <h4 class="base-search-card__subtitle">Acme</h4>
          <span class="job-search-card__location">Remote</span>
        </li>
        <li class="jobs-search-results__list-item" data-occludable-job-id="11">
          <a class="base-card__full-link" href="https://www.linkedin.com/jobs/view/11/"></a>
          <h3 class="base-search-card__title">Good</h3>
          <h4 class="base-search-card__subtitle">Beta</h4>
          <span class="job-search-card__location">Remote</span>
        </li>
      </ul>`;

    const session: BrowserSession = {
      openPage: async () => {
        const page = makePage({
          url: "https://www.linkedin.com/jobs/search/?keywords=AI",
          html: searchHtml,
        });
        page.goto = vi.fn(async (url: string) => {
          page.url = () => url;
          if (url.includes("/jobs/view/10/")) {
            page.content = async () => "<html><body>broken</body></html>";
          } else if (url.includes("/jobs/view/11/")) {
            page.content = async () => `
              <main class="jobs-details">
                <h1 class="job-details-jobs-unified-top-card__job-title">Good</h1>
                <div class="job-details-jobs-unified-top-card__company-name">Beta</div>
                <div class="job-details-jobs-unified-top-card__primary-description-container">
                  <span class="tvm__text">Remote · Remote · 1 day ago</span>
                </div>
                <div class="jobs-description__content"><div class="jobs-box__html-content">OK</div></div>
              </main>`;
          } else {
            page.content = async () => searchHtml;
          }
        });
        return page;
      },
      close: async () => undefined,
    };

    const result = await collectJobs({
      spec: { ...spec, limit: 2 },
      runDir: dir,
      session,
      pacer: { wait: async () => undefined },
      now: () => "2026-07-23T18:00:00.000Z",
      loginTimeoutMs: 1000,
    });

    expect(result.jobs).toHaveLength(2);
    expect(result.jobs[0]?.jobId).toBe("10");
    expect(result.jobs[0]?.extractionStatus).toBe("partial");
    expect(result.jobs[1]?.jobId).toBe("11");
    expect(result.warnings.some((w) => w.stage === "job-detail")).toBe(true);
  });

  it("stops cleanly on challenge pages", async () => {
    const dir = await mkdtemp(join(tmpdir(), "li-collect-"));
    tempDirs.push(dir);

    const session: BrowserSession = {
      openPage: async () =>
        makePage({
          url: "https://www.linkedin.com/checkpoint/challenge/",
          html: "<html><body>challenge</body></html>",
          isChallenge: true,
        }),
      close: async () => undefined,
    };

    await expect(
      collectJobs({
        spec,
        runDir: dir,
        session,
        pacer: { wait: async () => undefined },
        now: () => "2026-07-23T18:00:00.000Z",
        loginTimeoutMs: 100,
      }),
    ).rejects.toThrow(/challenge|captcha/i);
  });
});

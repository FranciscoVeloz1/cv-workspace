import { existsSync } from "node:fs";
import { join } from "node:path";
import { chromium, type BrowserContext, type Page } from "playwright";

export const DEFAULT_BROWSER_PROFILE_DIR = ".browser-profile";

export type BrowserChannel = "chrome" | "chromium" | "msedge";

export interface BrowserLaunchOptions {
  userDataDir?: string;
  headless?: boolean;
  cwd?: string;
  channel?: BrowserChannel;
  executablePath?: string;
}

export interface ResolvedBrowserOptions {
  userDataDir: string;
  headless: boolean;
  channel?: BrowserChannel;
  executablePath?: string;
}

const CANDIDATE_EXECUTABLES = [
  process.env.LINKEDIN_BROWSER_EXECUTABLE,
  "/usr/bin/brave-browser-stable",
  "/usr/bin/brave-browser",
  "/usr/bin/google-chrome-stable",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium-browser",
  "/usr/bin/chromium",
].filter((value): value is string => Boolean(value));

export function detectBrowserExecutable(): string | undefined {
  return CANDIDATE_EXECUTABLES.find((path) => existsSync(path));
}

export function resolveBrowserOptions(
  options: BrowserLaunchOptions,
): ResolvedBrowserOptions {
  const cwd = options.cwd ?? process.cwd();
  const envChannel = process.env.LINKEDIN_BROWSER_CHANNEL as
    | BrowserChannel
    | undefined;
  const executablePath =
    options.executablePath ?? detectBrowserExecutable();

  // Prefer a real installed browser (Brave/Chrome) over Chrome-for-Testing so
  // Google OAuth is less likely to reject the session as "not secure".
  if (executablePath && !options.channel && !envChannel) {
    return {
      userDataDir:
        options.userDataDir ?? join(cwd, DEFAULT_BROWSER_PROFILE_DIR),
      headless: options.headless ?? false,
      executablePath,
    };
  }

  return {
    userDataDir:
      options.userDataDir ?? join(cwd, DEFAULT_BROWSER_PROFILE_DIR),
    headless: options.headless ?? false,
    channel: options.channel ?? envChannel ?? "chrome",
    ...(executablePath ? { executablePath } : {}),
  };
}

export async function launchPersistentContext(
  options: BrowserLaunchOptions = {},
): Promise<BrowserContext> {
  const resolved = resolveBrowserOptions(options);
  const launchOptions: Parameters<typeof chromium.launchPersistentContext>[1] =
    {
      headless: resolved.headless,
      viewport: { width: 1280, height: 900 },
      args: ["--disable-blink-features=AutomationControlled"],
      ignoreDefaultArgs: ["--enable-automation"],
    };

  if (resolved.executablePath) {
    launchOptions.executablePath = resolved.executablePath;
  } else if (resolved.channel) {
    launchOptions.channel = resolved.channel;
  }

  return chromium.launchPersistentContext(
    resolved.userDataDir,
    launchOptions,
  );
}

export function isLinkedInLoginUrl(url: string): boolean {
  return (
    /linkedin\.com\/(uas\/)?login/i.test(url) ||
    /linkedin\.com\/checkpoint\/lg\//i.test(url) ||
    /linkedin\.com\/authwall/i.test(url) ||
    /linkedin\.com\/signup/i.test(url)
  );
}

export function isLinkedInChallengeUrl(url: string): boolean {
  return (
    /linkedin\.com\/checkpoint\/challenge/i.test(url) ||
    /\/checkpoint\/challengesV2\//i.test(url) ||
    /captcha/i.test(url)
  );
}

export async function detectLoginPage(page: Page): Promise<boolean> {
  if (isLinkedInLoginUrl(page.url())) return true;
  const password = page.locator('input[type="password"]');
  return (await password.count()) > 0 && /linkedin\.com/i.test(page.url());
}

export async function detectChallengePage(page: Page): Promise<boolean> {
  if (isLinkedInChallengeUrl(page.url())) return true;
  const challenge = page.locator(
    'text=/verify|security check|captcha|unusual activity/i',
  );
  return (await challenge.count()) > 0 && /checkpoint/i.test(page.url());
}

import { describe, expect, it } from "vitest";
import {
  DEFAULT_BROWSER_PROFILE_DIR,
  detectBrowserExecutable,
  isLinkedInLoginUrl,
  resolveBrowserOptions,
} from "../../src/linkedin/browser.js";

describe("resolveBrowserOptions", () => {
  it("uses a persistent profile directory by default", () => {
    const options = resolveBrowserOptions({});
    expect(options.userDataDir).toContain(DEFAULT_BROWSER_PROFILE_DIR);
    expect(options.headless).toBe(false);
  });

  it("prefers an installed browser executable when available", () => {
    const detected = detectBrowserExecutable();
    const options = resolveBrowserOptions({});
    if (detected) {
      expect(options.executablePath).toBe(detected);
    } else {
      expect(options.channel).toBe("chrome");
    }
  });

  it("allows overriding profile dir, headless, and channel", () => {
    const options = resolveBrowserOptions({
      userDataDir: "/tmp/custom-profile",
      headless: true,
      channel: "chromium",
    });
    expect(options.userDataDir).toBe("/tmp/custom-profile");
    expect(options.headless).toBe(true);
    expect(options.channel).toBe("chromium");
  });
});

describe("isLinkedInLoginUrl", () => {
  it("treats authwall as a login gate", () => {
    expect(
      isLinkedInLoginUrl(
        "https://www.linkedin.com/authwall?sessionRedirect=https%3A%2F%2Fwww.linkedin.com%2Fjobs%2Fsearch%2F",
      ),
    ).toBe(true);
  });
});

import { describe, expect, it } from "vitest";
import {
  buildLinkedInSearchUrl,
  LINKEDIN_JOBS_SEARCH_BASE,
} from "../../src/linkedin/search-url.js";
import type { SearchSpec } from "../../src/domain/schemas.js";

const baseSpec: SearchSpec = {
  prompt: "Senior AI fullstack remote LATAM",
  keywords: ["senior fullstack", "AI", "Python"],
  locations: ["Latin America", "Mexico"],
  workModes: ["remote"],
  recencyDays: 14,
  exclusions: ["junior", "must speak Mandarin"],
  limit: 20,
};

describe("buildLinkedInSearchUrl", () => {
  it("builds a LinkedIn jobs search URL with keywords", () => {
    const url = buildLinkedInSearchUrl(baseSpec);
    expect(url.startsWith(LINKEDIN_JOBS_SEARCH_BASE)).toBe(true);
    const parsed = new URL(url);
    expect(parsed.searchParams.get("keywords")).toBe(
      "senior fullstack AI Python",
    );
  });

  it("maps remote work mode to LinkedIn f_WT=2", () => {
    const url = new URL(buildLinkedInSearchUrl(baseSpec));
    expect(url.searchParams.get("f_WT")).toBe("2");
  });

  it("maps recency days to LinkedIn f_TPR", () => {
    const url = new URL(buildLinkedInSearchUrl(baseSpec));
    expect(url.searchParams.get("f_TPR")).toBe("r1209600");
  });

  it("uses the first location as location param", () => {
    const url = new URL(buildLinkedInSearchUrl(baseSpec));
    expect(url.searchParams.get("location")).toBe("Latin America");
  });

  it("does not invent unsupported query params for exclusions", () => {
    const url = new URL(buildLinkedInSearchUrl(baseSpec));
    expect(url.searchParams.has("exclusions")).toBe(false);
    expect(url.searchParams.get("keywords")).not.toContain("junior");
  });

  it("omits work type when unknown-only", () => {
    const url = new URL(
      buildLinkedInSearchUrl({
        ...baseSpec,
        workModes: ["unknown"],
      }),
    );
    expect(url.searchParams.has("f_WT")).toBe(false);
  });
});

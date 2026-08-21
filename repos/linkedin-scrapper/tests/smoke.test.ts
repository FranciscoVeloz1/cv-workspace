import { describe, expect, it } from "vitest";
import { PROJECT_NAME } from "../src/domain/index.js";

describe("project smoke", () => {
  it("exports the project name", () => {
    expect(PROJECT_NAME).toBe("linkedin-scrapper");
  });
});

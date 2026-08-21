import { describe, expect, it } from "vitest";
import { createPacer } from "../../src/linkedin/pacing.js";

describe("createPacer", () => {
  it("delays within configured bounds", async () => {
    const delays: number[] = [];
    const pacer = createPacer({
      minMs: 100,
      maxMs: 200,
      sleep: async (ms) => {
        delays.push(ms);
      },
      random: () => 0.5,
    });

    await pacer.wait();
    expect(delays).toEqual([150]);
  });

  it("rejects inverted bounds", () => {
    expect(() => createPacer({ minMs: 300, maxMs: 100 })).toThrow(/minMs/i);
  });
});

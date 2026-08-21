export interface PacerOptions {
  minMs: number;
  maxMs: number;
  sleep?: (ms: number) => Promise<void>;
  random?: () => number;
}

export interface Pacer {
  wait: () => Promise<void>;
}

const defaultSleep = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

export function createPacer(options: PacerOptions): Pacer {
  const { minMs, maxMs } = options;
  if (minMs < 0 || maxMs < minMs) {
    throw new Error("minMs must be >= 0 and <= maxMs");
  }

  const sleep = options.sleep ?? defaultSleep;
  const random = options.random ?? Math.random;

  return {
    async wait() {
      const span = maxMs - minMs;
      const delay = minMs + Math.floor(random() * (span + 1));
      await sleep(delay);
    },
  };
}

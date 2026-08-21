import { runCollectCli } from "../cli/collect.js";
import { collectJobs, createPlaywrightSession } from "../linkedin/collector.js";

async function main(): Promise<void> {
  const timeoutMs = Number(process.env.LINKEDIN_LOGIN_TIMEOUT_MS ?? 600_000);
  const result = await runCollectCli({
    argv: process.argv.slice(2),
    collectJobs: (options) =>
      collectJobs({
        ...options,
        session: createPlaywrightSession(process.cwd()),
        loginTimeoutMs: timeoutMs,
      }),
  });
  console.log(JSON.stringify({ exitCode: result.exitCode, runDir: result.runDir }));
  process.exitCode = result.exitCode;
}

void main();

import type { Route } from "@macalinao/stricli-utils";
import { spawn } from "node:child_process";
import {
  createOutput,
  defineHandler,
  defineParameters,
  defineRoute,
} from "@macalinao/stricli-utils";

const params = defineParameters({
  flags: {
    watch: {
      kind: "boolean",
      brief: "Watch mode",
      default: false,
    },
    filter: {
      kind: "parsed",
      parse: String,
      brief: "Filter tests by pattern",
      optional: true,
    },
  },
});

const testHandler = defineHandler<typeof params>(async function testHandler(
  ctx,
  { flags: { watch } },
) {
  const output = createOutput(ctx);
  const args = ["test"];

  if (watch) {
    args.push("--watch");
  }

  output.info(`Running: bun ${args.join(" ")}`);

  const child = spawn("bun", args, {
    stdio: "inherit",
    cwd: process.cwd(),
  });

  await new Promise<void>((resolve, reject) => {
    child.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(
          new Error(`Tests failed with code ${(code ?? "unknown").toString()}`),
        );
      }
    });
  });
});

export const route: Route = defineRoute({
  handler: testHandler,
  params,
  docs: {
    brief: "Run tests via bun test",
  },
});

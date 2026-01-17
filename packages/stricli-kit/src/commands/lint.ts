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
    fix: {
      kind: "boolean",
      brief: "Auto-fix issues",
      default: false,
    },
  },
});

const lintHandler = defineHandler<typeof params>(async function lintHandler(
  ctx,
  { flags: { fix } },
) {
  const output = createOutput(ctx);

  // Run biome check
  output.info("Running biome check...");
  const biomeArgs = ["check"];
  if (fix) {
    biomeArgs.push("--write", "--unsafe");
  }

  const biome = spawn("biome", biomeArgs, {
    stdio: "inherit",
    cwd: process.cwd(),
  });

  await new Promise<void>((resolve, reject) => {
    biome.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(
          new Error(`Biome failed with code ${(code ?? "unknown").toString()}`),
        );
      }
    });
  });

  // Run turbo lint
  output.info("Running turbo lint...");
  const turboArgs = ["run", "lint"];
  if (fix) {
    turboArgs.push("--", "--fix");
  }

  const turbo = spawn("turbo", turboArgs, {
    stdio: "inherit",
    cwd: process.cwd(),
  });

  await new Promise<void>((resolve, reject) => {
    turbo.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(
          new Error(
            `ESLint failed with code ${(code ?? "unknown").toString()}`,
          ),
        );
      }
    });
  });

  output.success("Lint passed!");
});

export const route: Route = defineRoute({
  handler: lintHandler,
  params,
  docs: {
    brief: "Run biome + eslint linting",
  },
});

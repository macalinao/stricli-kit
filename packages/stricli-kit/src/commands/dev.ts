import type { Route } from "@macalinao/stricli-utils";
import { resolve } from "node:path";
import { createRouteWatcher } from "@macalinao/stricli-codegen";
import { readStricliKitConfig } from "@macalinao/stricli-config";
import {
  createOutput,
  defineHandler,
  defineParameters,
  defineRoute,
} from "@macalinao/stricli-utils";

const params = defineParameters({
  flags: {
    commandsDir: {
      kind: "parsed",
      parse: String,
      brief: "Commands directory (overrides config)",
      optional: true,
    },
    output: {
      kind: "parsed",
      parse: String,
      brief: "Output file path (overrides config)",
      optional: true,
    },
    config: {
      kind: "parsed",
      parse: String,
      brief: "Path to stricli-kit.jsonc config file",
      default: "stricli-kit.jsonc",
    },
  },
});

const devHandler = defineHandler<typeof params>(async function devHandler(
  ctx,
  { flags: { commandsDir, output, config } },
): Promise<never> {
  const outputHelper = createOutput(ctx);
  const cwd = process.cwd();

  // Read config file
  const configFile = readStricliKitConfig(resolve(cwd, config));

  // Flags override config values
  const resolvedCommandsDir = resolve(
    cwd,
    commandsDir ?? configFile.commandsDir,
  );
  const outputPath = resolve(cwd, output ?? configFile.output);

  outputHelper.info(
    `Watching ${commandsDir ?? configFile.commandsDir} for changes...`,
  );

  const watcher = createRouteWatcher({
    commandsDir: resolvedCommandsDir,
    outputPath,
    onRegenerate: (changedFiles) => {
      outputHelper.info(
        `Regenerated route map (${changedFiles.length.toString()} files changed)`,
      );
    },
  });

  await watcher.start();
  outputHelper.success("Route map generated. Watching for changes...");

  // Keep process running - intentionally never resolves
  return new Promise<never>(() => {
    // This promise never resolves to keep the process running
  });
});

export const route: Route = defineRoute({
  handler: devHandler,
  params,
  docs: {
    brief: "Watch mode - regenerate route map on file changes",
  },
});

#!/usr/bin/env bun
import { resolve } from "node:path";
import { createRouteWatcher } from "@macalinao/stricli-codegen";

const packageDir = resolve(import.meta.dirname, "../..");

const watcher = createRouteWatcher({
  commandsDir: resolve(packageDir, "src/commands"),
  outputPath: resolve(packageDir, "src/generated/route-map.ts"),
  onRegenerate: (changedFiles) => {
    console.log(
      `Regenerated route map (${changedFiles.length.toString()} files changed)`,
    );
  },
});

await watcher.start();
console.log("Watching for changes...");

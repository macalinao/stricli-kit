#!/usr/bin/env bun
import { resolve } from "node:path";
import { generateRouteMap } from "@macalinao/stricli-codegen";

const packageDir = resolve(import.meta.dirname, "../..");

await generateRouteMap({
  commandsDir: resolve(packageDir, "src/commands"),
  outputPath: resolve(packageDir, "src/generated/route-map.ts"),
});

console.log("Route map generated!");

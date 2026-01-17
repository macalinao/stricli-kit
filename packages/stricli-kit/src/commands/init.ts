import type { Route } from "@macalinao/stricli-utils";
import { existsSync, readFileSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { basename, join, relative } from "node:path";
import {
  generateRootTemplate,
  generateRouteMap,
  generateRouteTemplate,
  readConfig,
  SPECIAL_FILES,
} from "@macalinao/stricli-codegen";
import {
  createOutput,
  defineHandler,
  defineParameters,
  defineRoute,
} from "@macalinao/stricli-utils";

interface PackageJson {
  name?: string;
  bin?: Record<string, string> | string;
}

function readPackageJson(cwd: string): PackageJson {
  const packageJsonPath = join(cwd, "package.json");
  if (!existsSync(packageJsonPath)) {
    return {};
  }
  const content = readFileSync(packageJsonPath, "utf-8");
  return JSON.parse(content) as PackageJson;
}

function getCliName(pkg: PackageJson, cwd: string): string {
  // Try to get name from bin field
  if (pkg.bin) {
    if (typeof pkg.bin === "string") {
      return basename(cwd);
    }
    const binNames = Object.keys(pkg.bin);
    const firstName = binNames[0];
    if (firstName) {
      return firstName;
    }
  }
  // Fall back to package name
  if (pkg.name) {
    return pkg.name.replace(/^@[^/]+\//, ""); // Remove scope
  }
  return basename(cwd);
}

const params = defineParameters({
  flags: {
    force: {
      kind: "boolean",
      brief: "Overwrite existing files",
      default: false,
    },
  },
});

const initHandler = defineHandler<typeof params>(async function initHandler(
  ctx,
  { flags: { force } },
) {
  const output = createOutput(ctx);
  const cwd = process.cwd();
  const config = readConfig(cwd);
  const commandsDir = join(cwd, config.commandsDir);
  const outputDir = join(cwd, config.outputDir);
  const pkg = readPackageJson(cwd);
  const cliName = getCliName(pkg, cwd);

  // Check if already initialized
  if (existsSync(commandsDir) && !force) {
    output.error(`Commands directory already exists: ${commandsDir}`);
    output.info("Use --force to reinitialize");
    return;
  }

  output.info(`Initializing stricli-kit CLI structure for "${cliName}"...`);

  // Create commands directory
  await mkdir(commandsDir, { recursive: true });
  output.success(`Created commands directory: ${commandsDir}`);

  // Create __root.ts
  const rootPath = join(commandsDir, SPECIAL_FILES.ROOT_CONFIG);
  if (!existsSync(rootPath) || force) {
    const rootTemplate = generateRootTemplate(cliName, {
      utilsPackage: config.utilsPackage,
    });
    await writeFile(rootPath, rootTemplate);
    output.success(`Created root config: ${rootPath}`);
  }

  // Create an example command (index.ts)
  const indexPath = join(commandsDir, "index.ts");
  if (!existsSync(indexPath) || force) {
    const indexTemplate = generateRouteTemplate("index.ts", {
      utilsPackage: config.utilsPackage,
    });
    await writeFile(indexPath, indexTemplate);
    output.success(`Created example command: ${indexPath}`);
  }

  // Create generated directory and generate route map
  await mkdir(outputDir, { recursive: true });
  const outputPath = join(outputDir, "route-map.ts");

  await generateRouteMap({
    commandsDir,
    outputPath,
    importPrefix: "../commands",
  });
  output.success(`Generated route map: ${outputPath}`);

  // Print next steps
  output.info("");
  output.info("Next steps:");
  output.info(
    `  1. Update your ${relative(cwd, rootPath)} with your AppContext`,
  );
  output.info(
    "  2. Create a bin entry point that imports from generated/app.ts:",
  );
  output.info("");
  output.info(`     // src/bin/${cliName}.ts`);
  output.info("     #!/usr/bin/env bun");
  output.info('     import { run } from "@stricli/core";');
  output.info('     import { app, context } from "../generated/app.js";');
  output.info("");
  output.info("     await run(app, process.argv.slice(2), context);");
  output.info("");
  output.info("  3. Add stricli-kit as a dependency:");
  output.info("     bun add @macalinao/stricli-kit @stricli/core");
  output.info("");
  output.info("  4. Add generate script to package.json:");
  output.info('     "generate": "stricli-kit generate"');
  output.info("");
  output.info("  5. Run `stricli-kit route <name>` to add new commands");
  output.info("");
});

export const route: Route = defineRoute({
  handler: initHandler,
  params,
  docs: {
    brief: "Initialize a new stricli-kit CLI project",
  },
});

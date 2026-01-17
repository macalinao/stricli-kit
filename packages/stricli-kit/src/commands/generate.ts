import type { Route } from "@macalinao/stricli-utils";
import { resolve } from "node:path";
import {
  generateRepoRouteMaps,
  generateRouteMap,
} from "@macalinao/stricli-codegen";
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
    repo: {
      kind: "boolean",
      brief: "Generate for all CLI packages in the repository",
      default: false,
    },
    stub: {
      kind: "boolean",
      brief: "Stub empty files with placeholder commands",
      default: true,
    },
  },
});

const generateHandler = defineHandler<typeof params>(
  async function generateHandler(
    ctx,
    { flags: { commandsDir, output, config, repo, stub } },
  ) {
    const outputHelper = createOutput(ctx);
    const cwd = process.cwd();

    if (repo) {
      // Repo-wide generation
      outputHelper.info("Scanning repository for CLI packages...");

      const results = await generateRepoRouteMaps(cwd, {
        stubEmptyFiles: stub,
        onPackage: (pkg) => {
          outputHelper.info(`Processing ${pkg.name}...`);
        },
        onStubFile: (filePath) => {
          const relativePath = filePath.replace(`${cwd}/`, "");
          outputHelper.warn(`Stubbing empty file: ${relativePath}`);
        },
      });

      outputHelper.success(
        `Generated route maps for ${results.size.toString()} packages`,
      );

      for (const [name, result] of results) {
        outputHelper.info(
          `  ${name}: ${result.imports.length.toString()} commands`,
        );
      }
    } else {
      // Single package generation (existing behavior)
      const configFile = readStricliKitConfig(resolve(cwd, config));

      const resolvedCommandsDir = resolve(
        cwd,
        commandsDir ?? configFile.commandsDir,
      );
      const outputPath = resolve(cwd, output ?? configFile.output);

      outputHelper.info(
        `Generating route map from ${commandsDir ?? configFile.commandsDir}...`,
      );

      // Handle stub option for single package too
      if (stub) {
        const { findEmptyFiles, populateStubFile } = await import(
          "@macalinao/stricli-codegen"
        );
        const emptyFiles = findEmptyFiles(resolvedCommandsDir);
        for (const filePath of emptyFiles) {
          const relativePath = filePath.replace(`${cwd}/`, "");
          outputHelper.warn(`Stubbing empty file: ${relativePath}`);
          await populateStubFile(filePath, resolvedCommandsDir);
        }
      }

      const result = await generateRouteMap({
        commandsDir: resolvedCommandsDir,
        outputPath,
        importPrefix: configFile.importPrefix,
      });

      outputHelper.success(
        `Generated route map at ${output ?? configFile.output}`,
      );
      outputHelper.info(
        `Found ${result.imports.length.toString()} command files`,
      );
    }
  },
);

export const route: Route = defineRoute({
  handler: generateHandler,
  params,
  docs: {
    brief: "Generate route map from commands directory",
  },
});

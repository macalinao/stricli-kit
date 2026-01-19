import type { Route } from "@macalinao/stricli-utils";
import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import {
  generateRouteGroupTemplate,
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

/**
 * Parse a route path like "config set" or "config/set" into segments
 */
function parseRoutePath(routePath: string): string[] {
  // Support both "config set" and "config/set" formats
  return routePath.split(/[\s/]+/).filter(Boolean);
}

const params = defineParameters({
  flags: {
    lazy: {
      kind: "boolean",
      brief: "Create a lazy-loaded route (.lazy.ts)",
      default: false,
    },
    noGenerate: {
      kind: "boolean",
      brief: "Skip route map regeneration",
      default: false,
    },
  },
  positional: {
    kind: "tuple",
    parameters: [
      {
        brief: "Route path (e.g., 'config set' or 'config/set')",
        parse: String,
        placeholder: "path",
      },
    ],
  },
});

const routeCommandHandler = defineHandler<typeof params>(
  async function routeCommandHandler(
    ctx,
    { flags: { lazy, noGenerate }, args: [routePath] },
  ) {
    const output = createOutput(ctx);
    const cwd = process.cwd();
    const config = readConfig(cwd);
    const commandsDir = join(cwd, config.commandsDir);

    // Parse the route path
    const segments = parseRoutePath(routePath);
    if (segments.length === 0) {
      output.error("Route path cannot be empty");
      return;
    }

    // Build the file path (routeName is guaranteed to exist since segments.length > 0)
    const routeName = segments.at(-1) ?? "";
    const dirSegments = segments.slice(0, -1);
    const fileExtension = lazy ? ".lazy.ts" : ".ts";
    const fileName = `${routeName}${fileExtension}`;

    const routeDir = join(commandsDir, ...dirSegments);
    const routeFilePath = join(routeDir, fileName);

    // Check if commands directory exists
    if (!existsSync(commandsDir)) {
      output.error(`Commands directory not found: ${commandsDir}`);
      output.info(
        "Run `stricli-kit init` to initialize the commands directory",
      );
      return;
    }

    // Check if file already exists
    if (existsSync(routeFilePath)) {
      output.error(`Route file already exists: ${routeFilePath}`);
      return;
    }

    // Create parent directories if needed
    if (!existsSync(routeDir)) {
      await mkdir(routeDir, { recursive: true });
      output.info(`Created directory: ${routeDir}`);

      // Create __route.ts for each new directory
      for (const [i, groupName] of dirSegments.entries()) {
        const segmentPath = join(commandsDir, ...dirSegments.slice(0, i + 1));
        const routeConfigPath = join(segmentPath, SPECIAL_FILES.ROUTE_CONFIG);
        if (!existsSync(routeConfigPath)) {
          const template = generateRouteGroupTemplate(groupName, {
            utilsPackage: config.utilsPackage,
          });
          await writeFile(routeConfigPath, template);
          output.info(`Created route config: ${routeConfigPath}`);
        }
      }
    }

    // Generate the route file
    const template = generateRouteTemplate(routeFilePath, {
      utilsPackage: config.utilsPackage,
    });
    await writeFile(routeFilePath, template);
    output.success(`Created route: ${routeFilePath}`);

    // Regenerate route map unless --no-generate
    if (!noGenerate) {
      output.info("Regenerating route map...");
      const outputDir = join(cwd, config.outputDir);
      const outputPath = join(outputDir, "route-map.ts");

      await generateRouteMap({
        commandsDir,
        outputPath,
        importPrefix: "../commands",
      });
      output.success("Route map updated");
    }
  },
);

export const route: Route = defineRoute({
  handler: routeCommandHandler,
  params,
  docs: {
    brief: "Create a new route/command file",
  },
  aliases: ["r", "add"],
});

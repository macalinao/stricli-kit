import type { Route } from "@macalinao/stricli-kit";
import type { AppContext } from "../../generated/create-file-route.js";
import { existsSync, readFileSync } from "node:fs";
import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { createOutput } from "@macalinao/stricli-kit";
import { buildCommand } from "@stricli/core";
import { createFileRoute } from "../../generated/create-file-route.js";

interface Flags {
  dir: string | undefined;
  dryRun: boolean;
}

/**
 * Standard package scripts configuration
 */
const STANDARD_SCRIPTS: Record<string, string> = {
  build: "tsc",
  clean: "rm -rf dist .eslintcache",
  lint: "eslint .",
  test: "bun test",
};

/**
 * CLI package scripts (additional scripts for CLI packages)
 */
const CLI_SCRIPTS: Record<string, string> = {
  generate: "bun run src/scripts/generate.ts",
  dev: "bun run src/scripts/dev.ts",
};

async function setupScriptsHandler(
  this: AppContext,
  flags: Flags,
  packageName?: string,
): Promise<void> {
  const output = createOutput(this);

  // Determine the package directory
  let packageDir: string;
  if (flags.dir) {
    packageDir = flags.dir;
  } else if (packageName) {
    packageDir = `packages/${packageName}`;
  } else {
    // Use current directory
    packageDir = this.cwd;
  }

  const packageJsonPath = join(packageDir, "package.json");

  if (!existsSync(packageJsonPath)) {
    output.error(`package.json not found at ${packageJsonPath}`);
    return;
  }

  // Read existing package.json
  const packageJsonContent = readFileSync(packageJsonPath, "utf-8");
  const packageJson = JSON.parse(packageJsonContent) as {
    name?: string;
    bin?: Record<string, string>;
    scripts?: Record<string, string>;
  };

  const pkgName = packageJson.name ?? packageName ?? "package";
  output.info(`Setting up scripts for ${pkgName}...`);

  // Determine if this is a CLI package (has bin field)
  const isCli = Boolean(packageJson.bin);

  // Build the scripts object
  const existingScripts = packageJson.scripts ?? {};
  const newScripts: Record<string, string> = { ...existingScripts };
  const addedScripts: string[] = [];

  // Add standard scripts
  for (const [name, script] of Object.entries(STANDARD_SCRIPTS)) {
    if (!(name in existingScripts)) {
      newScripts[name] = script;
      addedScripts.push(name);
    } else if (existingScripts[name] !== script) {
      // Don't override existing scripts, but note the difference
      const existingScript = existingScripts[name];
      output.warn(
        `Script "${name}" already exists: "${existingScript ?? ""}" (keeping existing)`,
      );
    }
  }

  // Add CLI-specific scripts if applicable
  if (isCli) {
    // Check for commands directory
    const commandsDir = join(packageDir, "src/commands");
    if (existsSync(commandsDir)) {
      for (const [name, script] of Object.entries(CLI_SCRIPTS)) {
        if (!(name in existingScripts)) {
          newScripts[name] = script;
          addedScripts.push(name);
        }
      }
    }
  }

  if (addedScripts.length === 0) {
    output.success("All standard scripts are already configured");
    return;
  }

  if (flags.dryRun) {
    output.info("Dry run - would add the following scripts:");
    for (const name of addedScripts) {
      const scriptValue = newScripts[name] ?? "";
      output.info(`  "${name}": "${scriptValue}"`);
    }
    return;
  }

  // Update package.json
  packageJson.scripts = newScripts;

  // Sort scripts alphabetically for consistency
  const sortedScripts = Object.fromEntries(
    Object.entries(newScripts).sort(([a], [b]) => a.localeCompare(b)),
  );
  packageJson.scripts = sortedScripts;

  await writeFile(packageJsonPath, `${JSON.stringify(packageJson, null, 2)}\n`);

  output.success(
    `Added ${addedScripts.length.toString()} scripts to ${pkgName}`,
  );
  for (const name of addedScripts) {
    const scriptValue = newScripts[name] ?? "";
    output.info(`  + "${name}": "${scriptValue}"`);
  }
}

export const route: Route<AppContext> = createFileRoute({
  command: buildCommand({
    func: setupScriptsHandler,
    parameters: {
      flags: {
        dir: {
          kind: "parsed",
          parse: String,
          brief: "Package directory",
          optional: true,
        },
        dryRun: {
          kind: "boolean",
          brief: "Show what would be changed without writing",
          default: false,
        },
      },
      positional: {
        kind: "tuple",
        parameters: [
          {
            brief: "Package name (or use --dir)",
            parse: String,
            placeholder: "name",
            optional: true,
          },
        ],
      },
    },
    docs: {
      brief: "Set up standard build, lint, test scripts for a package",
    },
  }),
});

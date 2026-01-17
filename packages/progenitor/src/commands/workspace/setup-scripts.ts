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
 * Standard workspace scripts configuration
 */
const WORKSPACE_SCRIPTS: Record<string, string> = {
  build: "turbo run build",
  clean: "turbo run clean",
  lint: "biome check && turbo run lint",
  "lint:fix": "biome check --write --unsafe && turbo run lint -- --fix",
  format: "biome format --write",
  test: "turbo run test",
};

/**
 * Scripts that require husky to be set up
 */
const HUSKY_SCRIPTS: Record<string, string> = {
  prepare: "husky",
};

/**
 * Scripts for changesets workflow
 */
const CHANGESET_SCRIPTS: Record<string, string> = {
  "ci:version": "changeset version && bun update",
  "ci:publish":
    'for dir in packages/*; do (cd "$dir" && bun publish || true); done && changeset tag',
};

async function setupScriptsHandler(
  this: AppContext,
  flags: Flags,
): Promise<void> {
  const output = createOutput(this);

  // Determine the workspace directory
  const workspaceDir = flags.dir ?? this.cwd;
  const packageJsonPath = join(workspaceDir, "package.json");

  if (!existsSync(packageJsonPath)) {
    output.error(`package.json not found at ${packageJsonPath}`);
    return;
  }

  // Read existing package.json
  const packageJsonContent = readFileSync(packageJsonPath, "utf-8");
  const packageJson = JSON.parse(packageJsonContent) as {
    name?: string;
    private?: boolean;
    scripts?: Record<string, string>;
    devDependencies?: Record<string, string>;
  };

  const wsName = packageJson.name ?? "workspace";

  // Check if this is a workspace root (should be private)
  if (!packageJson.private) {
    output.warn(
      "This package.json is not marked as private. Are you sure this is a workspace root?",
    );
  }

  output.info(`Setting up workspace scripts for ${wsName}...`);

  // Build the scripts object
  const existingScripts = packageJson.scripts ?? {};
  const newScripts: Record<string, string> = { ...existingScripts };
  const addedScripts: string[] = [];

  // Add standard workspace scripts
  for (const [name, script] of Object.entries(WORKSPACE_SCRIPTS)) {
    if (!(name in existingScripts)) {
      newScripts[name] = script;
      addedScripts.push(name);
    } else if (existingScripts[name] !== script) {
      const existingScript = existingScripts[name];
      output.warn(
        `Script "${name}" already exists: "${existingScript ?? ""}" (keeping existing)`,
      );
    }
  }

  // Check for husky in devDependencies
  const devDeps = packageJson.devDependencies ?? {};
  if ("husky" in devDeps) {
    for (const [name, script] of Object.entries(HUSKY_SCRIPTS)) {
      if (!(name in existingScripts)) {
        newScripts[name] = script;
        addedScripts.push(name);
      }
    }
  }

  // Check for changesets in devDependencies
  if ("@changesets/cli" in devDeps) {
    for (const [name, script] of Object.entries(CHANGESET_SCRIPTS)) {
      if (!(name in existingScripts)) {
        newScripts[name] = script;
        addedScripts.push(name);
      }
    }
  }

  if (addedScripts.length === 0) {
    output.success("All standard workspace scripts are already configured");
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
    `Added ${addedScripts.length.toString()} scripts to ${wsName}`,
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
          brief: "Workspace root directory",
          optional: true,
        },
        dryRun: {
          kind: "boolean",
          brief: "Show what would be changed without writing",
          default: false,
        },
      },
    },
    docs: {
      brief: "Set up standard workspace scripts (build, lint, test, etc.)",
    },
  }),
});

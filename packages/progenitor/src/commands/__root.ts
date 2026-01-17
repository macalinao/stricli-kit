import type { CommandContext } from "@stricli/core";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { defineAppConfig, defineRouteGroup } from "@macalinao/stricli-kit";

/**
 * Workspace configuration from root package.json
 */
export interface WorkspaceConfig {
  /** Workspace name */
  name: string;
  /** Package paths (e.g., ["packages/*", "apps/*"]) */
  packages: string[];
  /** Catalog of shared dependencies with versions */
  catalog: Record<string, string>;
}

/**
 * Custom application context for progenitor with workspace info.
 */
export interface AppContext extends CommandContext {
  /** Root workspace configuration */
  workspace: WorkspaceConfig;
  /** Current working directory */
  cwd: string;
}

interface PackageJson {
  name?: string;
  workspaces?: {
    packages?: string[];
    catalog?: Record<string, string>;
  };
}

/**
 * Load workspace configuration from root package.json
 */
function loadWorkspaceConfig(cwd: string): WorkspaceConfig {
  const packageJsonPath = resolve(cwd, "package.json");

  if (!existsSync(packageJsonPath)) {
    throw new Error(
      `No package.json found at ${packageJsonPath}. Run from a workspace root.`,
    );
  }

  const content = readFileSync(packageJsonPath, "utf-8");
  const pkg: PackageJson = JSON.parse(content) as PackageJson;

  return {
    name: pkg.name ?? "workspace",
    packages: pkg.workspaces?.packages ?? ["packages/*", "apps/*"],
    catalog: pkg.workspaces?.catalog ?? {},
  };
}

/**
 * Application configuration for progenitor CLI.
 * Context builder and optional name/version overrides.
 */
export const appConfig = defineAppConfig<AppContext>({
  // name and version default to package.json values from codegen
  context: () => {
    const cwd = process.cwd();
    return {
      workspace: loadWorkspaceConfig(cwd),
      cwd,
    };
  },
});

/**
 * Route group configuration for the root.
 */
export const config = defineRouteGroup({
  aliases: {
    pkg: "package",
    ws: "workspace",
  },
  docs: {
    brief: "Progenitor - scaffold packages and workspaces",
  },
});

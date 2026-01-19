import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { defineRoot } from "@macalinao/stricli-kit";

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
 * Create context for progenitor commands.
 * Loads workspace configuration from the current working directory.
 */
const createContext = () => {
  const cwd = process.cwd();
  return {
    workspace: loadWorkspaceConfig(cwd),
    cwd,
  };
};

export const root = defineRoot({
  brief: "Progenitor - scaffold packages and workspaces",
  createContext,
  aliases: {
    pkg: "package",
    ws: "workspace",
  },
});

export type AppContext = typeof root.Context;

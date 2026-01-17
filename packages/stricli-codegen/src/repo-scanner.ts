import type { GeneratedRouteMap } from "./types.js";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import {
  isCommandFile,
  isLazyFile,
  isSpecialFile,
  SPECIAL_FILES,
} from "./conventions.js";
import { generateRouteMap } from "./generator.js";
import {
  generateHandlerTemplate,
  generateLazyRouteTemplate,
  generateRootTemplate,
  generateRouteGroupTemplate,
  generateRouteTemplate,
} from "./template.js";

// ============================================================================
// Types
// ============================================================================

/**
 * Result of scanning a CLI package
 */
export interface CliPackageInfo {
  /** Package name from package.json */
  name: string;
  /** Absolute path to the package directory */
  packageDir: string;
  /** Path to commands directory */
  commandsDir: string;
  /** Output path for generated route map */
  outputPath: string;
  /** Import prefix for commands */
  importPrefix: string;
}

/**
 * Result of populating a stub file
 */
export interface StubResult {
  filePath: string;
  isNew: boolean;
}

/**
 * Stricli-kit configuration file format
 */
interface StricliKitConfig {
  commandsDir?: string;
  output?: string;
  importPrefix?: string;
}

/**
 * File system operations for dependency injection
 */
export interface RepoFileSystemOps {
  existsSync: (path: string) => boolean;
  readdirSync: (path: string) => string[];
  readFileSync: (path: string, encoding: BufferEncoding) => string;
  isDirectory: (path: string) => boolean;
}

/**
 * Default file system operations
 */
export const defaultRepoFileSystemOps: RepoFileSystemOps = {
  existsSync,
  readdirSync: (path: string) => readdirSync(path),
  readFileSync: (path: string, encoding: BufferEncoding) =>
    readFileSync(path, encoding),
  isDirectory: (path: string) => statSync(path).isDirectory(),
};

// ============================================================================
// JSON/JSONC parsing utilities (pure functions)
// ============================================================================

/**
 * Strip comments from JSONC content (pure function)
 */
export function stripJsonComments(content: string): string {
  return content.replace(/\/\/.*$/gm, "").replace(/\/\*[\s\S]*?\*\//g, "");
}

/**
 * Parse JSONC content (pure function)
 */
export function parseJsonc(content: string): unknown {
  return JSON.parse(stripJsonComments(content));
}

// ============================================================================
// Package detection (pure-ish, depends on fs ops)
// ============================================================================

/**
 * Try to create package info from a stricli-kit.jsonc config file
 */
function tryCreatePackageFromConfig(
  packageDir: string,
  entry: string,
  fs: RepoFileSystemOps,
): CliPackageInfo | null {
  const configPath = join(packageDir, "stricli-kit.jsonc");

  if (!fs.existsSync(configPath)) {
    return null;
  }

  const configContent = fs.readFileSync(configPath, "utf-8");
  const config = parseJsonc(configContent) as StricliKitConfig;

  const commandsDir = join(packageDir, config.commandsDir ?? "src/commands");

  if (!fs.existsSync(commandsDir)) {
    return null;
  }

  return {
    name: entry,
    packageDir,
    commandsDir,
    outputPath: join(packageDir, config.output ?? "src/generated/route-map.ts"),
    importPrefix: config.importPrefix ?? "../commands",
  };
}

/**
 * Try to create package info from default conventions (src/commands with __root.ts)
 */
function tryCreatePackageFromConvention(
  packageDir: string,
  entry: string,
  fs: RepoFileSystemOps,
): CliPackageInfo | null {
  const commandsDir = join(packageDir, "src/commands");

  if (!fs.existsSync(commandsDir)) {
    return null;
  }

  const rootConfigPath = join(commandsDir, SPECIAL_FILES.ROOT_CONFIG);
  if (!fs.existsSync(rootConfigPath)) {
    return null;
  }

  return {
    name: entry,
    packageDir,
    commandsDir,
    outputPath: join(packageDir, "src/generated/route-map.ts"),
    importPrefix: "../commands",
  };
}

/**
 * Try to detect a CLI package in a directory
 */
function tryDetectCliPackage(
  packageDir: string,
  entry: string,
  fs: RepoFileSystemOps,
): CliPackageInfo | null {
  const configPackage = tryCreatePackageFromConfig(packageDir, entry, fs);
  if (configPackage) {
    return configPackage;
  }

  return tryCreatePackageFromConvention(packageDir, entry, fs);
}

/**
 * Find all CLI packages in a monorepo
 */
export function findCliPackages(
  rootDir: string,
  workspaceDirs: string[] = ["packages/*", "apps/*"],
  fs: RepoFileSystemOps = defaultRepoFileSystemOps,
): CliPackageInfo[] {
  const packages: CliPackageInfo[] = [];

  for (const pattern of workspaceDirs) {
    const patternDir = dirname(pattern);
    const searchDir = join(rootDir, patternDir);

    if (!fs.existsSync(searchDir)) {
      continue;
    }

    const entries = fs.readdirSync(searchDir);
    for (const entry of entries) {
      const packageDir = join(searchDir, entry);

      if (!fs.isDirectory(packageDir)) {
        continue;
      }

      const pkg = tryDetectCliPackage(packageDir, entry, fs);
      if (pkg) {
        packages.push(pkg);
      }
    }
  }

  return packages;
}

// ============================================================================
// File content analysis (pure functions)
// ============================================================================

/**
 * Check if content is empty (only whitespace/comments)
 */
export function isContentEmpty(content: string): boolean {
  return stripJsonComments(content).trim() === "";
}

/**
 * Check if a file is empty or contains only whitespace/comments
 */
export function isEmptyFile(
  filePath: string,
  fs: RepoFileSystemOps = defaultRepoFileSystemOps,
): boolean {
  if (!fs.existsSync(filePath)) {
    return true;
  }

  const content = fs.readFileSync(filePath, "utf-8");
  return isContentEmpty(content);
}

/**
 * Check if a file should be scanned for emptiness
 */
function shouldCheckForEmpty(filename: string): boolean {
  return isCommandFile(filename) || isSpecialFile(filename);
}

/**
 * Find all empty command files in a commands directory
 */
export function findEmptyFiles(
  commandsDir: string,
  fs: RepoFileSystemOps = defaultRepoFileSystemOps,
): string[] {
  const emptyFiles: string[] = [];

  function scanDir(dir: string): void {
    if (!fs.existsSync(dir)) {
      return;
    }

    const entries = fs.readdirSync(dir);
    for (const entry of entries) {
      const fullPath = join(dir, entry);

      if (fs.isDirectory(fullPath)) {
        scanDir(fullPath);
      } else if (shouldCheckForEmpty(entry) && isEmptyFile(fullPath, fs)) {
        emptyFiles.push(fullPath);
      }
    }
  }

  scanDir(commandsDir);
  return emptyFiles;
}

// ============================================================================
// Stub file generation
// ============================================================================

/**
 * Get the last segment of a path (filename or directory name)
 */
function getPathSegment(path: string): string {
  return path.split("/").pop() ?? "";
}

/**
 * Determine the appropriate template content for a stub file (pure function)
 */
export function getStubTemplateContent(
  filePath: string,
  commandsDir: string,
): string {
  const fileName = getPathSegment(filePath);
  const dirName = getPathSegment(dirname(filePath));

  if (fileName === SPECIAL_FILES.ROOT_CONFIG) {
    const appName = getPathSegment(dirname(commandsDir)) || "app";
    return generateRootTemplate(appName);
  }

  if (fileName === SPECIAL_FILES.ROUTE_CONFIG) {
    return generateRouteGroupTemplate(dirName);
  }

  if (isLazyFile(fileName)) {
    return generateLazyRouteTemplate(filePath);
  }

  return generateRouteTemplate(filePath);
}

/**
 * Get the handler file path for a lazy route
 */
export function getHandlerPath(lazyFilePath: string): string {
  return lazyFilePath.replace(".lazy.ts", ".handler.ts");
}

/**
 * Populate an empty file with appropriate stub template
 */
export async function populateStubFile(
  filePath: string,
  commandsDir: string,
  fs: RepoFileSystemOps = defaultRepoFileSystemOps,
): Promise<void> {
  const content = getStubTemplateContent(filePath, commandsDir);
  await writeFile(filePath, content, "utf-8");

  const fileName = getPathSegment(filePath);
  if (isLazyFile(fileName)) {
    const handlerPath = getHandlerPath(filePath);
    if (isEmptyFile(handlerPath, fs)) {
      const handlerContent = generateHandlerTemplate(filePath);
      await writeFile(handlerPath, handlerContent, "utf-8");
    }
  }
}

// ============================================================================
// Repo-wide generation
// ============================================================================

/**
 * Options for repo-wide route map generation
 */
export interface GenerateRepoOptions {
  workspaceDirs?: string[];
  stubEmptyFiles?: boolean;
  onPackage?: (pkg: CliPackageInfo) => void;
  onStubFile?: (filePath: string) => void;
}

/**
 * Process stub files for a package
 */
async function processPackageStubs(
  pkg: CliPackageInfo,
  onStubFile?: (filePath: string) => void,
): Promise<void> {
  const emptyFiles = findEmptyFiles(pkg.commandsDir);
  for (const filePath of emptyFiles) {
    onStubFile?.(filePath);
    await populateStubFile(filePath, pkg.commandsDir);
  }
}

/**
 * Generate route map for a single package
 */
async function generatePackageRouteMap(
  pkg: CliPackageInfo,
): Promise<GeneratedRouteMap> {
  return generateRouteMap({
    commandsDir: pkg.commandsDir,
    outputPath: pkg.outputPath,
    importPrefix: pkg.importPrefix,
  });
}

/**
 * Generate route maps for all CLI packages in a repo
 */
export async function generateRepoRouteMaps(
  rootDir: string,
  options: GenerateRepoOptions = {},
): Promise<Map<string, GeneratedRouteMap>> {
  const {
    workspaceDirs = ["packages/*", "apps/*"],
    stubEmptyFiles = true,
    onPackage,
    onStubFile,
  } = options;

  const packages = findCliPackages(rootDir, workspaceDirs);
  const results = new Map<string, GeneratedRouteMap>();

  for (const pkg of packages) {
    onPackage?.(pkg);

    if (stubEmptyFiles) {
      await processPackageStubs(pkg, onStubFile);
    }

    const result = await generatePackageRouteMap(pkg);
    results.set(pkg.name, result);
  }

  return results;
}

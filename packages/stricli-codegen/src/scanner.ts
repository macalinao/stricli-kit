import type { ScannedRoute } from "./types.js";
import { existsSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import {
  fileToRouteName,
  isCommandFile,
  SPECIAL_FILES,
} from "./conventions.js";

// ============================================================================
// Types for dependency injection (testability)
// ============================================================================

/**
 * File system operations interface for dependency injection
 */
export interface FileSystemOps {
  existsSync: (path: string) => boolean;
  readdirSync: (path: string) => string[];
  isDirectory: (path: string) => boolean;
}

/**
 * Default file system implementation using Node.js fs
 */
export const defaultFileSystemOps: FileSystemOps = {
  existsSync,
  readdirSync: (path: string) => readdirSync(path),
  isDirectory: (path: string) => statSync(path).isDirectory(),
};

// ============================================================================
// Directory entry processing (pure-ish, depends on fs ops)
// ============================================================================

/**
 * Process a single directory entry into a ScannedRoute
 */
function processDirectoryEntry(
  entry: string,
  dirPath: string,
  basePath: string,
  fs: FileSystemOps,
): ScannedRoute | null {
  const fullPath = join(dirPath, entry);
  const relativePath = relative(basePath, fullPath);

  if (fs.isDirectory(fullPath)) {
    const children = scanDirectoryWithFs(fullPath, basePath, fs);
    return {
      name: entry,
      relativePath,
      filePath: fullPath,
      isDirectory: true,
      children,
    };
  }

  if (isCommandFile(entry)) {
    return {
      name: fileToRouteName(entry),
      relativePath,
      filePath: fullPath,
      isDirectory: false,
    };
  }

  return null;
}

/**
 * Scan a directory for command files and subdirectories (injectable fs)
 */
function scanDirectoryWithFs(
  dirPath: string,
  basePath: string,
  fs: FileSystemOps,
): ScannedRoute[] {
  if (!fs.existsSync(dirPath)) {
    return [];
  }

  const entries = fs.readdirSync(dirPath);
  const routes: ScannedRoute[] = [];

  for (const entry of entries) {
    const route = processDirectoryEntry(entry, dirPath, basePath, fs);
    if (route !== null) {
      routes.push(route);
    }
  }

  return routes;
}

// ============================================================================
// Public API
// ============================================================================

/**
 * Scan the commands directory for routes
 */
export function scanCommandsDirectory(
  commandsDir: string,
  fs: FileSystemOps = defaultFileSystemOps,
): ScannedRoute[] {
  return scanDirectoryWithFs(commandsDir, commandsDir, fs);
}

/**
 * Check if a __root.ts config exists
 */
export function hasRootConfig(
  commandsDir: string,
  checkExists: (path: string) => boolean = existsSync,
): boolean {
  return checkExists(join(commandsDir, SPECIAL_FILES.ROOT_CONFIG));
}

/**
 * Check if a __route.ts config exists in a directory
 */
export function hasRouteConfig(
  dirPath: string,
  checkExists: (path: string) => boolean = existsSync,
): boolean {
  return checkExists(join(dirPath, SPECIAL_FILES.ROUTE_CONFIG));
}

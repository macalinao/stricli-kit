// ============================================================================
// File naming constants
// ============================================================================

/**
 * Special file names that don't create routes
 */
export const SPECIAL_FILES = {
  /** Root route map configuration */
  ROOT_CONFIG: "__root.ts",
  /** Nested route map configuration */
  ROUTE_CONFIG: "__route.ts",
  /** Index/default command */
  INDEX: "index.ts",
  /** Index lazy command */
  INDEX_LAZY: "index.lazy.ts",
} as const;

/**
 * File extension patterns
 */
const FILE_EXTENSIONS = {
  TS: ".ts",
  LAZY_TS: ".lazy.ts",
  HANDLER_TS: ".handler.ts",
} as const;

// ============================================================================
// File type detection (pure functions)
// ============================================================================

/**
 * Check if a file is a special config file
 */
export function isSpecialFile(filename: string): boolean {
  return (
    filename === SPECIAL_FILES.ROOT_CONFIG ||
    filename === SPECIAL_FILES.ROUTE_CONFIG
  );
}

/**
 * Check if a file is a lazy route file
 */
export function isLazyFile(filename: string): boolean {
  return filename.endsWith(FILE_EXTENSIONS.LAZY_TS);
}

/**
 * Check if a file is a handler file (companion to lazy route)
 */
export function isHandlerFile(filename: string): boolean {
  return filename.endsWith(FILE_EXTENSIONS.HANDLER_TS);
}

/**
 * Check if a file is a TypeScript file
 */
export function isTypeScriptFile(filename: string): boolean {
  return filename.endsWith(FILE_EXTENSIONS.TS);
}

/**
 * Check if a file is a command/route file (not a special file, handler, or directory)
 */
export function isCommandFile(filename: string): boolean {
  return (
    isTypeScriptFile(filename) &&
    !isSpecialFile(filename) &&
    !isHandlerFile(filename)
  );
}

// ============================================================================
// Extension manipulation (pure functions)
// ============================================================================

/**
 * Remove TypeScript extension from a filename
 * Handles both .lazy.ts and .ts extensions
 */
export function removeExtension(filename: string): string {
  if (filename.endsWith(FILE_EXTENSIONS.LAZY_TS)) {
    return filename.slice(0, -FILE_EXTENSIONS.LAZY_TS.length);
  }
  if (filename.endsWith(FILE_EXTENSIONS.TS)) {
    return filename.slice(0, -FILE_EXTENSIONS.TS.length);
  }
  return filename;
}

// ============================================================================
// Name conversion (pure functions)
// ============================================================================

/**
 * Convert a filename to a route name
 * - Removes .ts and .lazy.ts extensions
 * - Returns empty string for index files (default route)
 */
export function fileToRouteName(filename: string): string {
  const name = removeExtension(filename);
  return name === "index" ? "" : name;
}

/**
 * Convert kebab-case to camelCase
 */
export function kebabToCamelCase(str: string): string {
  return str.replace(/-([a-z])/g, (_, letter: string) => letter.toUpperCase());
}

/**
 * Convert a route name to a valid JavaScript identifier for imports
 */
export function routeToImportName(routeName: string): string {
  if (routeName === "") {
    return "index";
  }
  return kebabToCamelCase(routeName);
}

/**
 * Convert a file path to a valid JavaScript identifier
 * Removes extensions and replaces path separators and hyphens with underscores
 */
export function pathToIdentifier(filePath: string): string {
  return removeExtension(filePath)
    .replace(/\//g, "_")
    .replace(/-/g, "_")
    .replace(/^_+/, "");
}

/**
 * Metadata for a route (matches @macalinao/stricli-utils RouteMeta)
 */
export interface RouteMeta {
  /** Route aliases (e.g., ["n", "create"]) */
  aliases?: readonly string[];
  /** Hide from help text */
  hidden?: boolean;
  /** Deprecated message */
  deprecated?: string;
}

/**
 * Exports from a route file (route.ts pattern)
 */
export interface RouteFileExports {
  /** The route object containing meta and command */
  route: {
    meta?: RouteMeta;
    command: unknown;
  };
}

/**
 * Documentation for a route group (matches Stricli's RouteMapDocumentation)
 */
export interface RouteGroupDocs {
  /** Brief description for the route group (required) */
  brief: string;
  /** Full description shown in help */
  fullDescription?: string;
  /** Routes to hide from help text */
  hideRoute?: Record<string, boolean>;
}

/**
 * Route group configuration from __route.ts or __root.ts
 * Based on Stricli's RouteMapBuilderArguments (without routes)
 */
export interface RouteGroupConfig {
  /** Route aliases mapping (e.g., { "n": "new" }) */
  aliases?: Record<string, string>;
  /** Default command route when group is accessed directly */
  defaultCommand?: string;
  /** Documentation for the route group */
  docs?: RouteGroupDocs;
}

/**
 * A scanned route from the commands directory
 */
export interface ScannedRoute {
  /** File path relative to commands directory */
  relativePath: string;
  /** Route name (derived from file/folder name) */
  name: string;
  /** Full file path */
  filePath: string;
  /** Whether this is a directory (nested route map) */
  isDirectory: boolean;
  /** Child routes if directory */
  children?: ScannedRoute[];
  /** Route group config if __route.ts exists */
  groupConfig?: RouteGroupConfig;
  /** Route metadata from the route file */
  meta?: RouteMeta;
}

/**
 * Options for the route map generator
 */
export interface GeneratorOptions {
  /** Source directory containing commands */
  commandsDir: string;
  /** Output file path for generated route map */
  outputPath: string;
  /** Import path prefix for commands (default: "../commands") */
  importPrefix?: string;
}

/**
 * Options for the route watcher
 */
export interface WatcherOptions extends GeneratorOptions {
  /** Callback when regeneration occurs */
  onRegenerate?: (changedFiles: string[]) => void;
  /** Callback when a new file is created - return false to skip template population */
  onNewFile?: (filePath: string) => boolean | undefined;
  /** Whether to auto-populate new route files with template (default: true) */
  autoPopulateNewFiles?: boolean;
  /** Debounce delay in ms (default: 100) */
  debounceMs?: number;
}

/**
 * Result of route map generation
 */
export interface GeneratedRouteMap {
  /** Generated TypeScript code */
  code: string;
  /** List of imported command files */
  imports: string[];
  /** Route structure for debugging */
  routeTree: ScannedRoute[];
}

/**
 * Route watcher interface
 */
export interface RouteWatcher {
  /** Start watching for changes */
  start(): Promise<void>;
  /** Stop watching */
  stop(): Promise<void>;
  /** Manually trigger regeneration */
  regenerate(): Promise<void>;
}

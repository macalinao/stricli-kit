import type {
  ApplicationContext,
  CommandContext,
  StricliCommandContextBuilder,
} from "@stricli/core";
import type { ExtendedContext } from "./types.js";
import { createOutput } from "./output.js";

/**
 * Extend a Stricli command context with additional utilities
 * @param ctx - Stricli command context
 * @returns Extended context with output helpers and environment access
 */
export function extendContext(ctx: CommandContext): ExtendedContext {
  return {
    output: createOutput(ctx),
    cwd: process.cwd(),
    env: process.env,
  };
}

/**
 * Dynamic context type for Stricli with forCommand builder
 */
export interface AppDynamicContext<T extends CommandContext>
  extends ApplicationContext {
  readonly forCommand: StricliCommandContextBuilder<T>;
}

/**
 * Create a dynamic application context for Stricli.
 * Simplifies the boilerplate of creating a context with the forCommand builder.
 *
 * @example
 * ```typescript
 * export const context = createAppContext<AppContext>(() => ({
 *   workspace: loadWorkspaceConfig(process.cwd()),
 *   cwd: process.cwd(),
 * }));
 *
 * // In cli.ts:
 * await run(app, process.argv.slice(2), context);
 * ```
 */
export function createAppContext<T extends CommandContext>(
  builder: () => Omit<T, "process">,
): AppDynamicContext<T> {
  const stricliProcess = {
    stdout: process.stdout,
    stderr: process.stderr,
  };

  return {
    process: stricliProcess,
    forCommand: () =>
      ({ process: stricliProcess, ...builder() }) as unknown as T,
  };
}

/**
 * Application configuration for the root of a CLI app.
 * Used by __root.ts to define app metadata and context builder.
 */
export interface AppConfig<T extends CommandContext> {
  /** Application name (defaults to package.json name) */
  name?: string;
  /** Current version (defaults to package.json version) */
  version?: string;
  /** Context builder - creates the custom context for each command */
  context: () => Omit<T, "process">;
}

/**
 * Define application configuration for the root of a CLI app.
 * Used in __root.ts to configure the app name, version, and context.
 *
 * @example
 * ```typescript
 * export const appConfig = defineAppConfig<AppContext>({
 *   // name and version default to package.json values
 *   context: () => ({
 *     workspace: loadWorkspaceConfig(process.cwd()),
 *     cwd: process.cwd(),
 *   }),
 * });
 * ```
 */
export function defineAppConfig<T extends CommandContext>(
  config: AppConfig<T>,
): AppConfig<T> {
  return config;
}

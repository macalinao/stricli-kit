import type { RouteGroupMeta } from "@macalinao/stricli-define";
import type { CommandContext } from "@stricli/core";
import type { AppConfig } from "./context.js";

/**
 * Options for defining a root configuration.
 * Combines app configuration and route group configuration into a single call.
 */
export interface DefineRootOptions<
  T extends Record<string, unknown> = Record<string, never>,
> {
  /** Application description (required) */
  brief: string;
  /** Application name (defaults to package.json name) */
  name?: string;
  /** Current version (defaults to package.json version) */
  version?: string;
  /**
   * Context factory - creates custom context for each command.
   * Can be sync or async. If omitted, commands get base CommandContext only.
   */
  createContext?: () => T | Promise<T>;
  /** Route aliases (e.g., { pkg: "package" }) */
  aliases?: Record<string, string>;
  /** Default command name when none specified */
  defaultCommand?: string;
  /** Hide specific routes from help */
  hideRoute?: Record<string, boolean>;
}

/**
 * Root route configuration with required docs.
 * Used by the root of the CLI app where docs.brief is always provided.
 */
export type RootRouteConfig = RouteGroupMeta & {
  docs: { brief: string };
};

/**
 * Root configuration result.
 * Contains both appConfig and routeConfig for codegen to consume.
 */
export interface RootConfig<T extends Record<string, unknown>> {
  /** Application configuration for the CLI */
  appConfig: AppConfig<CommandContext & T>;
  /** Route group configuration for the root route map (docs is always present) */
  routeConfig: RootRouteConfig;
  /**
   * Phantom type for context inference.
   * Use `typeof root.Context` to get the full context type.
   */
  Context: CommandContext & T;
}

/**
 * Define root configuration for a CLI application.
 * Combines app metadata, context creation, and route configuration into a single call.
 *
 * @example
 * ```typescript
 * // Simple usage (no custom context)
 * export const root = defineRoot({
 *   brief: "My CLI tool",
 * });
 *
 * export type AppContext = typeof root.Context;
 * ```
 *
 * @example
 * ```typescript
 * // With sync context
 * export const root = defineRoot({
 *   brief: "My CLI tool",
 *   createContext: () => ({
 *     cwd: process.cwd(),
 *   }),
 *   aliases: { pkg: "package" },
 * });
 *
 * export type AppContext = typeof root.Context;
 * ```
 *
 * @example
 * ```typescript
 * // With async context
 * const loadConfig = async () => {
 *   const config = await readConfigFile();
 *   return { config, cwd: process.cwd() };
 * };
 *
 * export const root = defineRoot({
 *   brief: "My CLI tool",
 *   createContext: loadConfig,
 * });
 *
 * export type AppContext = typeof root.Context;
 * ```
 */
export function defineRoot<
  T extends Record<string, unknown> = Record<string, never>,
>(options: DefineRootOptions<T>): RootConfig<T> {
  const { brief, name, version, createContext, aliases, defaultCommand } =
    options;

  // Build the context builder that returns Omit<CommandContext & T, "process">
  // The process property is added by createAppContext/createAppContextAsync
  type ContextResult =
    | Omit<CommandContext & T, "process">
    | Promise<Omit<CommandContext & T, "process">>;
  const contextBuilder: () => ContextResult = createContext
    ? () => createContext() as unknown as ContextResult
    : () => ({}) as ContextResult;

  // Build the app config
  const appConfig: AppConfig<CommandContext & T> = {
    name,
    version,
    context: contextBuilder,
  };

  // Build the route config with required docs and optional aliases/defaultCommand
  const routeConfig: RootRouteConfig = Object.assign(
    { docs: { brief } },
    aliases ? { aliases } : {},
    defaultCommand ? { defaultCommand } : {},
  );

  // Return both configs with a phantom Context type for inference
  return {
    appConfig,
    routeConfig,
    Context: undefined as unknown as CommandContext & T,
  };
}

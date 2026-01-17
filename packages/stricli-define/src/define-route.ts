import type {
  BaseArgs,
  BaseFlags,
  Command,
  CommandBuilderArguments,
  CommandContext,
  CommandFunction,
} from "@stricli/core";
import type { CommandParams } from "./types.js";
import { buildCommand } from "@stricli/core";

// ============================================================================
// Handler types for defineRoute
// ============================================================================

/**
 * Handler function type for defineRoute.
 * Uses our nicer { flags, args } signature instead of Stricli's this-based approach.
 * Generic order matches Stricli: <TFlags, TArgs, TContext>
 */
export type RouteHandler<
  TFlags extends BaseFlags,
  TArgs extends BaseArgs,
  TContext extends CommandContext = CommandContext,
> = (
  ctx: TContext,
  params: CommandParams<TFlags, TArgs>,
) => void | Promise<void>;

/**
 * Module containing a route handler as default export.
 * Used for lazy loading with dynamic imports.
 */
export interface RouteHandlerModule<
  TFlags extends BaseFlags,
  TArgs extends BaseArgs,
  TContext extends CommandContext = CommandContext,
> {
  readonly default: RouteHandler<TFlags, TArgs, TContext>;
}

/**
 * Loader function for lazy loading route handlers.
 * Returns a Promise of either the handler directly or a module with default export.
 */
export type RouteHandlerLoader<
  TFlags extends BaseFlags,
  TArgs extends BaseArgs,
  TContext extends CommandContext = CommandContext,
> = () => Promise<
  | RouteHandlerModule<TFlags, TArgs, TContext>
  | RouteHandler<TFlags, TArgs, TContext>
>;

// ============================================================================
// Route types
// ============================================================================

/**
 * A route definition - the main export from command files.
 * Contains both the command and optional routing metadata.
 */
export interface Route<TContext extends CommandContext = CommandContext> {
  /** The stricli command */
  command: Command<TContext>;
  /** Route aliases (e.g., ["n", "create"]) */
  aliases?: readonly string[];
  /** Hide from help text */
  hidden?: boolean;
  /** Deprecated message - if set, shows deprecation warning */
  deprecated?: string;
}

/**
 * Base arguments shared by both local and lazy route definitions.
 * Uses `params` for the parameter definitions and `docs` for documentation.
 */
interface BaseDefineRouteArgs<
  TFlags extends BaseFlags,
  TArgs extends BaseArgs,
  TContext extends CommandContext = CommandContext,
> {
  /** Command parameters definition */
  params: CommandBuilderArguments<TFlags, TArgs, TContext>["parameters"];
  /** Command documentation */
  docs: CommandBuilderArguments<TFlags, TArgs, TContext>["docs"];
  /** Route aliases (e.g., ["n", "create"]) */
  aliases?: readonly string[];
  /** Hide from help text */
  hidden?: boolean;
  /** Deprecated message - if set, shows deprecation warning */
  deprecated?: string;
}

/**
 * Arguments for defineRoute with a local handler function.
 */
export interface DefineRouteLocalArgs<
  TFlags extends BaseFlags,
  TArgs extends BaseArgs,
  TContext extends CommandContext = CommandContext,
> extends BaseDefineRouteArgs<TFlags, TArgs, TContext> {
  /** Command handler function with typed flags and args */
  handler: RouteHandler<TFlags, TArgs, TContext>;
  loader?: never;
}

/**
 * Arguments for defineRoute with a lazy-loaded handler.
 * Use this for code splitting in large CLIs.
 */
export interface DefineRouteLazyArgs<
  TFlags extends BaseFlags,
  TArgs extends BaseArgs,
  TContext extends CommandContext = CommandContext,
> extends BaseDefineRouteArgs<TFlags, TArgs, TContext> {
  handler?: never;
  /** Loader function that returns the handler (for lazy loading/code splitting) */
  loader: RouteHandlerLoader<TFlags, TArgs, TContext>;
}

/**
 * Arguments for defineRoute - either local handler or lazy loader.
 */
export type DefineRouteArgs<
  TFlags extends BaseFlags,
  TArgs extends BaseArgs,
  TContext extends CommandContext = CommandContext,
> =
  | DefineRouteLocalArgs<TFlags, TArgs, TContext>
  | DefineRouteLazyArgs<TFlags, TArgs, TContext>;

// ============================================================================
// defineRoute function
// ============================================================================

/**
 * Define a route with handler and parameters.
 * Returns a Route object containing the command and routing metadata.
 * Uses Stricli's generic approach (TFlags, TArgs, TContext) for full type safety
 * with no type assertions.
 *
 * @example Local handler
 * ```typescript
 * export const route = defineRoute({
 *   handler: async (ctx, { flags: { verbose }, args: [name] }) => {
 *     if (verbose) console.log(`Greeting ${name}...`);
 *     console.log(`Hello, ${name}!`);
 *   },
 *   params: {
 *     flags: {
 *       verbose: { kind: "boolean", brief: "Enable verbose output" },
 *     },
 *     positional: {
 *       kind: "tuple",
 *       parameters: [{ brief: "Name", parse: String, placeholder: "name" }],
 *     },
 *   },
 *   docs: { brief: "Greet someone" },
 * });
 * ```
 *
 * @example Lazy-loaded handler (for code splitting)
 * ```typescript
 * export const route = defineRoute({
 *   loader: () => import("./greet-handler.js"),
 *   params: {
 *     flags: {
 *       verbose: { kind: "boolean", brief: "Enable verbose output" },
 *     },
 *     positional: {
 *       kind: "tuple",
 *       parameters: [{ brief: "Name", parse: String, placeholder: "name" }],
 *     },
 *   },
 *   docs: { brief: "Greet someone" },
 * });
 * ```
 */
export function defineRoute<
  TFlags extends BaseFlags = Record<string, never>,
  TArgs extends BaseArgs = [],
  TContext extends CommandContext = CommandContext,
>(args: DefineRouteArgs<TFlags, TArgs, TContext>): Route<TContext> {
  const { params: parameters, docs, aliases, hidden, deprecated } = args;

  // Helper to wrap our handler signature to Stricli's this-based signature
  const wrapHandler = (
    handler: RouteHandler<TFlags, TArgs, TContext>,
  ): CommandFunction<TFlags, TArgs, TContext> => {
    return function (this: TContext, flags: TFlags, ...positionalArgs: TArgs) {
      return handler(this, { flags, args: positionalArgs });
    };
  };

  const buildRouteCommand = (): Command<TContext> => {
    if ("handler" in args && args.handler) {
      // Local handler - wrap and build directly
      const wrappedFunc = wrapHandler(args.handler);
      return buildCommand<TFlags, TArgs, TContext>({
        func: wrappedFunc,
        parameters,
        docs,
      });
    }

    if ("loader" in args) {
      // Lazy loader - wrap the loader to convert handler signature
      const originalLoader = args.loader;
      const wrappedLoader = async () => {
        const result = await originalLoader();
        // Check if result is a module with default export or a direct handler
        const handler = typeof result === "function" ? result : result.default;
        return wrapHandler(handler);
      };
      return buildCommand<TFlags, TArgs, TContext>({
        loader: wrappedLoader,
        parameters,
        docs,
      });
    }

    throw new Error("defineRoute requires either 'handler' or 'loader'");
  };

  const command = buildRouteCommand();

  return {
    command,
    ...(aliases && { aliases }),
    ...(hidden !== undefined && { hidden }),
    ...(deprecated && { deprecated }),
  };
}

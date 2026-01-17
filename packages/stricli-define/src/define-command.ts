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
// Handler types for defineCommand
// ============================================================================

/**
 * Handler function type for defineCommand.
 * Uses our nicer { flags, args } signature instead of Stricli's this-based approach.
 * Generic order matches Stricli: <TFlags, TArgs, TContext>
 */
export type StricliHandler<
  TFlags extends BaseFlags,
  TArgs extends BaseArgs,
  TContext extends CommandContext = CommandContext,
> = (
  ctx: TContext,
  params: CommandParams<TFlags, TArgs>,
) => void | Promise<void>;

/**
 * Module containing a handler as default export.
 * Used for lazy loading with dynamic imports.
 */
export interface StricliHandlerModule<
  TFlags extends BaseFlags,
  TArgs extends BaseArgs,
  TContext extends CommandContext = CommandContext,
> {
  readonly default: StricliHandler<TFlags, TArgs, TContext>;
}

/**
 * Loader function for lazy loading handlers.
 * Returns a Promise of either the handler directly or a module with default export.
 */
export type StricliHandlerLoader<
  TFlags extends BaseFlags,
  TArgs extends BaseArgs,
  TContext extends CommandContext = CommandContext,
> = () => Promise<
  | StricliHandlerModule<TFlags, TArgs, TContext>
  | StricliHandler<TFlags, TArgs, TContext>
>;

// ============================================================================
// DefineCommand argument types
// ============================================================================

/**
 * Arguments for defineCommand with a local handler function.
 */
export interface DefineCommandLocalArgs<
  TFlags extends BaseFlags,
  TArgs extends BaseArgs,
  TContext extends CommandContext = CommandContext,
> extends Pick<
    CommandBuilderArguments<TFlags, TArgs, TContext>,
    "parameters" | "docs"
  > {
  /** Command handler function with typed flags and args */
  handler: StricliHandler<TFlags, TArgs, TContext>;
  loader?: never;
}

/**
 * Arguments for defineCommand with a lazy-loaded handler.
 * Use this for code splitting in large CLIs.
 */
export interface DefineCommandLazyArgs<
  TFlags extends BaseFlags,
  TArgs extends BaseArgs,
  TContext extends CommandContext = CommandContext,
> extends Pick<
    CommandBuilderArguments<TFlags, TArgs, TContext>,
    "parameters" | "docs"
  > {
  handler?: never;
  /** Loader function that returns the handler (for lazy loading/code splitting) */
  loader: StricliHandlerLoader<TFlags, TArgs, TContext>;
}

/**
 * Arguments for defineCommand - either local handler or lazy loader.
 */
export type DefineCommandArgs<
  TFlags extends BaseFlags,
  TArgs extends BaseArgs,
  TContext extends CommandContext = CommandContext,
> =
  | DefineCommandLocalArgs<TFlags, TArgs, TContext>
  | DefineCommandLazyArgs<TFlags, TArgs, TContext>;

// ============================================================================
// defineCommand function
// ============================================================================

/**
 * Define a Stricli command with our nicer handler signature.
 * Returns a Command directly for use with Stricli's buildRouteMap or buildApplication.
 *
 * @example Local handler
 * ```typescript
 * const greetCommand = defineCommand({
 *   handler: async (ctx, { flags: { verbose }, args: [name] }) => {
 *     if (verbose) console.log(`Greeting ${name}...`);
 *     console.log(`Hello, ${name}!`);
 *   },
 *   parameters: {
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
 *
 * // Use with Stricli directly
 * const routeMap = buildRouteMap({
 *   routes: { greet: greetCommand },
 *   docs: { brief: "My CLI" },
 * });
 * ```
 *
 * @example Lazy-loaded handler (for code splitting)
 * ```typescript
 * const greetCommand = defineCommand({
 *   loader: () => import("./greet-handler.js"),
 *   parameters: { ... },
 *   docs: { brief: "Greet someone" },
 * });
 * ```
 */
export function defineCommand<
  TFlags extends BaseFlags = Record<string, never>,
  TArgs extends BaseArgs = [],
  TContext extends CommandContext = CommandContext,
>(args: DefineCommandArgs<TFlags, TArgs, TContext>): Command<TContext> {
  const { parameters, docs } = args;

  // Helper to wrap our handler signature to Stricli's this-based signature
  const wrapHandler = (
    handler: StricliHandler<TFlags, TArgs, TContext>,
  ): CommandFunction<TFlags, TArgs, TContext> => {
    return function (this: TContext, flags: TFlags, ...positionalArgs: TArgs) {
      return handler(this, { flags, args: positionalArgs });
    };
  };

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

  throw new Error("defineCommand requires either 'handler' or 'loader'");
}

import type {
  BaseArgs,
  BaseFlags,
  CommandBuilderArguments,
  CommandContext,
} from "@stricli/core";

// ============================================================================
// Type utilities for extracting flag and positional types from parameters
// ============================================================================

/**
 * Helper to extract parse function type.
 */
type ParseFunction = (value: string) => unknown;

/**
 * Extract the flags type from a parameters definition.
 * Maps each flag definition to its runtime type.
 */
export type ExtractFlags<TParams> = TParams extends {
  flags: infer F;
}
  ? { [K in keyof F]: ExtractFlagType<F[K]> }
  : Record<string, never>;

/**
 * Extract the TypeScript type for a single flag definition.
 * Handles all Stricli flag types including variadic flags.
 *
 * Type mapping:
 * - Boolean: always boolean (defaults to false)
 * - Counter: always number (defaults to 0)
 * - Enum: union of values, or array for variadic
 * - Parsed: Awaited<ReturnType> of parse function, or array for variadic
 *
 * For variadic flags:
 * - optional: true -> T[] (empty array when flag not provided)
 * - optional: false with default -> T[] (uses default when not provided)
 * - optional: false without default -> requires at least one value
 *
 * Note: We use Awaited<ReturnType<>> because Stricli parsers can be async
 * (returning T | Promise<T>), but Stricli awaits the result before passing
 * to the handler. So handlers always receive the resolved value T.
 */
export type ExtractFlagType<F> =
  // Boolean flags - always boolean (never optional at type level, defaults to false)
  F extends { kind: "boolean" }
    ? boolean
    : // Counter flags - always number (never optional at type level, defaults to 0)
      F extends { kind: "counter" }
      ? number
      : // Variadic enum flags - return array of enum values
        F extends {
            kind: "enum";
            values: readonly (infer V)[];
            variadic: true | string;
          }
        ? V[]
        : // Non-variadic enum flags
          F extends { kind: "enum"; values: readonly (infer V)[] }
          ? F extends { optional: true }
            ? V | undefined
            : V
          : // Variadic parsed flags - return array of parsed values
            F extends {
                kind: "parsed";
                parse: infer P extends ParseFunction;
                variadic: true | string;
              }
            ? Awaited<ReturnType<P>>[]
            : // Non-variadic parsed flags
              F extends { kind: "parsed"; parse: infer P extends ParseFunction }
              ? F extends { optional: true }
                ? Awaited<ReturnType<P>> | undefined
                : Awaited<ReturnType<P>>
              : // Fallback for parsed flags without explicit parse function
                F extends { kind: "parsed"; optional: true }
                ? string | undefined
                : string;

/**
 * Extract positional argument types from parameters as a tuple.
 */
export type ExtractArgs<TParams> = TParams extends {
  positional: infer P;
}
  ? P extends { kind: "tuple"; parameters: infer Params }
    ? ExtractTupleArgs<Params>
    : P extends { kind: "array"; parameter: infer Param }
      ? ExtractArrayArg<Param>[]
      : []
  : [];

type ExtractTupleArgs<Params> = Params extends readonly [
  infer First,
  ...infer Rest,
]
  ? [ExtractPositionalType<First>, ...ExtractTupleArgs<Rest>]
  : [];

type ExtractPositionalType<P> = P extends {
  parse: infer Fn extends ParseFunction;
}
  ? // If has default value, never undefined (default provides the value)
    P extends { default: string }
    ? Awaited<ReturnType<Fn>>
    : // If optional without default, can be undefined
      P extends { optional: true }
      ? Awaited<ReturnType<Fn>> | undefined
      : Awaited<ReturnType<Fn>>
  : // No parse function - string type
    P extends { default: string }
    ? string
    : P extends { optional: true }
      ? string | undefined
      : string;

type ExtractArrayArg<P> = P extends { parse: infer Fn extends ParseFunction }
  ? Awaited<ReturnType<Fn>>
  : string;

// ============================================================================
// Command handler types
// ============================================================================

/**
 * The params object passed to command handlers.
 * Contains both flags and positional args in a single destructurable object.
 */
export interface CommandParams<TFlags, TArgs extends readonly unknown[]> {
  flags: TFlags;
  args: TArgs;
}

/**
 * Type for a command handler function.
 * Receives ctx (context) and a params object containing flags and args.
 * Generic order matches Stricli: <TFlags, TArgs, TContext>
 */
export type CommandHandler<
  TFlags,
  TArgs extends readonly unknown[] = [],
  TContext extends CommandContext = CommandContext,
> = (
  ctx: TContext,
  params: CommandParams<TFlags, TArgs>,
) => void | Promise<void>;

// ============================================================================
// Documentation types - aliases from @stricli/core
// ============================================================================

/**
 * Documentation for a command.
 * Alias for the docs field type from Stricli's CommandBuilderArguments.
 */
export type CommandDocs = CommandBuilderArguments<
  BaseFlags,
  BaseArgs,
  CommandContext
>["docs"];

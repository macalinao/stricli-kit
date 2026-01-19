/**
 * Shorthand helpers for defining CLI positional arguments with less boilerplate.
 *
 * @example
 * ```typescript
 * import { positional } from "@macalinao/stricli-define";
 *
 * const params = {
 *   flags: {},
 *   positional: positional.tuple([
 *     positional.string({ brief: "Name", placeholder: "name" }),
 *     positional.number({ brief: "Count", placeholder: "count", optional: true }),
 *   ]),
 * };
 *
 * // Or for array positional:
 * const arrayParams = {
 *   flags: {},
 *   positional: positional.array(
 *     positional.string({ brief: "File", placeholder: "file" })
 *   ),
 * };
 * ```
 */

// ============================================================================
// Common positional options
// ============================================================================

/** Common options for all positional types */
interface BasePositionalOptions {
  /** Short description shown in help */
  brief: string;
  /** Placeholder shown in usage (e.g., "<name>") */
  placeholder: string;
}

/** Options for positional that can be optional */
interface OptionalPositionalOptions extends BasePositionalOptions {
  /** Whether the argument is optional */
  optional?: boolean;
  /** Default value if argument is not provided */
  default?: string;
}

// ============================================================================
// String positional
// ============================================================================

/** Options for string positional */
type StringPositionalOptions = OptionalPositionalOptions;

/**
 * Creates a string positional argument definition.
 *
 * @example
 * ```typescript
 * positional: positional.tuple([
 *   positional.string({ brief: "User name", placeholder: "name" }),
 *   positional.string({ brief: "Output file", placeholder: "output", optional: true }),
 * ])
 * ```
 */
function string(options: StringPositionalOptions): {
  brief: string;
  placeholder: string;
  parse: (value: string) => string;
  optional?: boolean;
  default?: string;
} {
  return {
    brief: options.brief,
    placeholder: options.placeholder,
    parse: String,
    ...(options.optional !== undefined && { optional: options.optional }),
    ...(options.default !== undefined && { default: options.default }),
  };
}

// ============================================================================
// Number positional
// ============================================================================

/** Options for number positional */
interface NumberPositionalOptions extends BasePositionalOptions {
  /** Whether the argument is optional */
  optional?: boolean;
  /** Default value (as string, will be parsed) */
  default?: string;
}

/**
 * Creates a number positional argument definition.
 *
 * @example
 * ```typescript
 * positional: positional.tuple([
 *   positional.number({ brief: "Port number", placeholder: "port" }),
 *   positional.number({ brief: "Timeout", placeholder: "ms", default: "5000" }),
 * ])
 * ```
 */
function number(options: NumberPositionalOptions): {
  brief: string;
  placeholder: string;
  parse: (value: string) => number;
  optional?: boolean;
  default?: string;
} {
  return {
    brief: options.brief,
    placeholder: options.placeholder,
    parse: Number,
    ...(options.optional !== undefined && { optional: options.optional }),
    ...(options.default !== undefined && { default: options.default }),
  };
}

// ============================================================================
// Parsed positional (custom parser)
// ============================================================================

/** Options for custom parsed positional */
interface ParsedPositionalOptions<T> extends BasePositionalOptions {
  /** Parser function to convert string to target type */
  parse: (value: string) => T | Promise<T>;
  /** Whether the argument is optional */
  optional?: boolean;
  /** Default value (as string, will be parsed) */
  default?: string;
}

/**
 * Creates a positional argument with a custom parser function.
 *
 * @example
 * ```typescript
 * positional: positional.tuple([
 *   positional.parsed({
 *     parse: (s) => new Date(s),
 *     brief: "Start date",
 *     placeholder: "YYYY-MM-DD",
 *   }),
 * ])
 * ```
 */
function parsed<T>(options: ParsedPositionalOptions<T>): {
  brief: string;
  placeholder: string;
  parse: (value: string) => T | Promise<T>;
  optional?: boolean;
  default?: string;
} {
  return {
    brief: options.brief,
    placeholder: options.placeholder,
    parse: options.parse,
    ...(options.optional !== undefined && { optional: options.optional }),
    ...(options.default !== undefined && { default: options.default }),
  };
}

// ============================================================================
// Tuple positional (multiple typed arguments)
// ============================================================================

/** A single positional parameter definition */
interface PositionalParameter<T = unknown> {
  brief: string;
  placeholder: string;
  parse: (value: string) => T | Promise<T>;
  optional?: boolean;
  default?: string;
}

/**
 * Creates a tuple positional definition from an array of parameters.
 *
 * @example
 * ```typescript
 * positional: positional.tuple([
 *   positional.string({ brief: "Source", placeholder: "src" }),
 *   positional.string({ brief: "Destination", placeholder: "dest" }),
 * ])
 * ```
 */
function tuple<T extends readonly PositionalParameter[]>(
  parameters: T,
): {
  kind: "tuple";
  parameters: T;
} {
  return {
    kind: "tuple",
    parameters,
  };
}

// ============================================================================
// Array positional (variable number of same-type arguments)
// ============================================================================

/**
 * Creates an array positional definition (variable number of same-type arguments).
 *
 * @example
 * ```typescript
 * // Accept multiple file paths
 * positional: positional.array(
 *   positional.string({ brief: "File", placeholder: "file" })
 * )
 *
 * // cli command file1.txt file2.txt file3.txt
 * ```
 */
function array<T>(parameter: PositionalParameter<T>): {
  kind: "array";
  parameter: PositionalParameter<T>;
} {
  return {
    kind: "array",
    parameter,
  };
}

// ============================================================================
// Empty positional (no arguments)
// ============================================================================

/**
 * Creates an empty tuple positional definition (command takes no positional arguments).
 *
 * @example
 * ```typescript
 * const params = {
 *   flags: { verbose: flag.boolean({ brief: "Verbose" }) },
 *   positional: positional.none(),
 * };
 * ```
 */
function none(): {
  kind: "tuple";
  parameters: [];
} {
  return {
    kind: "tuple",
    parameters: [],
  };
}

// ============================================================================
// Export the positional namespace
// ============================================================================

/**
 * Shorthand helpers for defining CLI positional arguments.
 *
 * @example
 * ```typescript
 * import { positional } from "@macalinao/stricli-define";
 *
 * // Tuple positional (multiple typed args)
 * positional: positional.tuple([
 *   positional.string({ brief: "Source", placeholder: "src" }),
 *   positional.string({ brief: "Destination", placeholder: "dest" }),
 * ])
 *
 * // Array positional (variable number of same type)
 * positional: positional.array(
 *   positional.string({ brief: "File", placeholder: "file" })
 * )
 *
 * // No positional arguments
 * positional: positional.none()
 * ```
 */
export const positional: {
  /** String positional argument */
  string: typeof string;
  /** Number positional argument */
  number: typeof number;
  /** Custom parsed positional argument */
  parsed: typeof parsed;
  /** Tuple of positional arguments (multiple typed args) */
  tuple: typeof tuple;
  /** Array of positional arguments (variable number of same type) */
  array: typeof array;
  /** No positional arguments */
  none: typeof none;
} = {
  string,
  number,
  parsed,
  tuple,
  array,
  none,
};

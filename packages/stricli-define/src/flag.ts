/**
 * Shorthand helpers for defining CLI flags with less boilerplate.
 *
 * @example
 * ```typescript
 * import { flag } from "@macalinao/stricli-define";
 *
 * const params = {
 *   flags: {
 *     verbose: flag.boolean({ brief: "Enable verbose output" }),
 *     count: flag.number({ brief: "Number of items" }),
 *     name: flag.string({ brief: "Name to use" }),
 *     template: flag.enum(["base", "library"] as const, { brief: "Template type" }),
 *     files: flag.stringArray({ brief: "Files to process" }),
 *   },
 *   positional: { kind: "tuple" as const, parameters: [] },
 * };
 * ```
 */

// ============================================================================
// Common flag options
// ============================================================================

/** Common options for all flag types */
interface BaseFlagOptions {
  /** Short description shown in help */
  brief: string;
  /** Alternative flag names (e.g., ["-v"] for --verbose) */
  aliases?: readonly string[];
  /** Hide from help output */
  hidden?: boolean;
}

/** Options for flags that can be optional */
interface OptionalFlagOptions extends BaseFlagOptions {
  /** Whether the flag is optional (has no default) */
  optional?: boolean;
}

/** Options for parsed flags (string, number, path, etc.) */
interface ParsedFlagOptions<T> extends OptionalFlagOptions {
  /** Default value if flag is not provided */
  default?: T;
}

/** Options for variadic flags */
interface VariadicFlagOptions<T> extends BaseFlagOptions {
  /** Default values if flag is not provided */
  default?: readonly T[];
  /** Separator for variadic values (true = repeated flag, string = delimiter) */
  variadic?: true | string;
}

// ============================================================================
// Boolean flag
// ============================================================================

/**
 * Creates a boolean flag definition.
 * Boolean flags default to false when not provided.
 *
 * @example
 * ```typescript
 * flags: {
 *   verbose: flag.boolean({ brief: "Enable verbose output" }),
 *   quiet: flag.boolean({ brief: "Suppress output", aliases: ["-q"] }),
 * }
 * ```
 */
function boolean(options: BaseFlagOptions): {
  kind: "boolean";
  brief: string;
  aliases?: readonly string[];
  hidden?: boolean;
} {
  return {
    kind: "boolean",
    brief: options.brief,
    ...(options.aliases && { aliases: options.aliases }),
    ...(options.hidden !== undefined && { hidden: options.hidden }),
  };
}

// ============================================================================
// Counter flag
// ============================================================================

/**
 * Creates a counter flag definition.
 * Counter flags increment each time the flag is provided.
 * Defaults to 0 when not provided.
 *
 * @example
 * ```typescript
 * flags: {
 *   verbosity: flag.counter({ brief: "Increase verbosity (-v, -vv, -vvv)" }),
 * }
 * // cli --verbosity --verbosity -> 2
 * // cli -vvv -> 3 (if aliases: ["-v"])
 * ```
 */
function counter(options: BaseFlagOptions): {
  kind: "counter";
  brief: string;
  aliases?: readonly string[];
  hidden?: boolean;
} {
  return {
    kind: "counter",
    brief: options.brief,
    ...(options.aliases && { aliases: options.aliases }),
    ...(options.hidden !== undefined && { hidden: options.hidden }),
  };
}

// ============================================================================
// String flags
// ============================================================================

/** Options for string flags */
interface StringFlagOptions extends ParsedFlagOptions<string> {
  /** Placeholder shown in help (e.g., "<name>") */
  placeholder?: string;
}

/**
 * Creates a string flag definition.
 *
 * @example
 * ```typescript
 * flags: {
 *   name: flag.string({ brief: "User name", placeholder: "name" }),
 *   output: flag.string({ brief: "Output file", default: "output.txt" }),
 *   format: flag.string({ brief: "Format", optional: true }),
 * }
 * ```
 */
function string(options: StringFlagOptions): {
  kind: "parsed";
  brief: string;
  parse: (value: string) => string;
  placeholder: string;
  optional?: boolean;
  default?: string;
  aliases?: readonly string[];
  hidden?: boolean;
} {
  return {
    kind: "parsed",
    brief: options.brief,
    parse: String,
    placeholder: options.placeholder ?? "value",
    ...(options.optional !== undefined && { optional: options.optional }),
    ...(options.default !== undefined && { default: options.default }),
    ...(options.aliases && { aliases: options.aliases }),
    ...(options.hidden !== undefined && { hidden: options.hidden }),
  };
}

/** Options for variadic string flags */
interface StringArrayFlagOptions extends VariadicFlagOptions<string> {
  /** Placeholder shown in help (e.g., "<file>") */
  placeholder?: string;
}

/**
 * Creates a variadic string flag definition (accepts multiple values).
 *
 * @example
 * ```typescript
 * flags: {
 *   // Repeated flag: --file a.txt --file b.txt
 *   files: flag.stringArray({ brief: "Files to process", variadic: true }),
 *   // Comma-separated: --tags foo,bar,baz
 *   tags: flag.stringArray({ brief: "Tags", variadic: "," }),
 * }
 * ```
 */
function stringArray(options: StringArrayFlagOptions): {
  kind: "parsed";
  brief: string;
  parse: (value: string) => string;
  placeholder: string;
  variadic: true | string;
  default?: readonly string[];
  aliases?: readonly string[];
  hidden?: boolean;
} {
  return {
    kind: "parsed",
    brief: options.brief,
    parse: String,
    placeholder: options.placeholder ?? "value",
    variadic: options.variadic ?? true,
    ...(options.default !== undefined && { default: options.default }),
    ...(options.aliases && { aliases: options.aliases }),
    ...(options.hidden !== undefined && { hidden: options.hidden }),
  };
}

// ============================================================================
// Number flags
// ============================================================================

/** Options for number flags */
interface NumberFlagOptions extends ParsedFlagOptions<number> {
  /** Placeholder shown in help (e.g., "<count>") */
  placeholder?: string;
}

/**
 * Creates a number flag definition.
 *
 * @example
 * ```typescript
 * flags: {
 *   count: flag.number({ brief: "Number of items" }),
 *   port: flag.number({ brief: "Port number", default: 3000 }),
 *   timeout: flag.number({ brief: "Timeout in ms", optional: true }),
 * }
 * ```
 */
function number(options: NumberFlagOptions): {
  kind: "parsed";
  brief: string;
  parse: (value: string) => number;
  placeholder: string;
  optional?: boolean;
  default?: number;
  aliases?: readonly string[];
  hidden?: boolean;
} {
  return {
    kind: "parsed",
    brief: options.brief,
    parse: Number,
    placeholder: options.placeholder ?? "number",
    ...(options.optional !== undefined && { optional: options.optional }),
    ...(options.default !== undefined && { default: options.default }),
    ...(options.aliases && { aliases: options.aliases }),
    ...(options.hidden !== undefined && { hidden: options.hidden }),
  };
}

/** Options for variadic number flags */
interface NumberArrayFlagOptions extends VariadicFlagOptions<number> {
  /** Placeholder shown in help (e.g., "<number>") */
  placeholder?: string;
}

/**
 * Creates a variadic number flag definition (accepts multiple values).
 *
 * @example
 * ```typescript
 * flags: {
 *   // Repeated flag: --port 3000 --port 3001
 *   ports: flag.numberArray({ brief: "Ports to listen on" }),
 *   // Comma-separated: --ids 1,2,3
 *   ids: flag.numberArray({ brief: "IDs to process", variadic: "," }),
 * }
 * ```
 */
function numberArray(options: NumberArrayFlagOptions): {
  kind: "parsed";
  brief: string;
  parse: (value: string) => number;
  placeholder: string;
  variadic: true | string;
  default?: readonly number[];
  aliases?: readonly string[];
  hidden?: boolean;
} {
  return {
    kind: "parsed",
    brief: options.brief,
    parse: Number,
    placeholder: options.placeholder ?? "number",
    variadic: options.variadic ?? true,
    ...(options.default !== undefined && { default: options.default }),
    ...(options.aliases && { aliases: options.aliases }),
    ...(options.hidden !== undefined && { hidden: options.hidden }),
  };
}

// ============================================================================
// Enum flags
// ============================================================================

/** Options for enum flags */
interface EnumFlagOptions<T extends string> extends BaseFlagOptions {
  /** Default value if flag is not provided */
  default?: T;
  /** Whether the flag is optional (has no default) */
  optional?: boolean;
}

/**
 * Creates an enum flag definition (fixed set of allowed values).
 *
 * @example
 * ```typescript
 * flags: {
 *   format: flag.enum(["json", "yaml", "toml"] as const, {
 *     brief: "Output format",
 *     default: "json",
 *   }),
 *   level: flag.enum(["debug", "info", "warn", "error"] as const, {
 *     brief: "Log level",
 *     optional: true,
 *   }),
 * }
 * ```
 */
function enumFlag<const T extends string>(
  values: readonly T[],
  options: EnumFlagOptions<T>,
): {
  kind: "enum";
  values: readonly T[];
  brief: string;
  optional?: boolean;
  default?: T;
  aliases?: readonly string[];
  hidden?: boolean;
} {
  return {
    kind: "enum",
    values,
    brief: options.brief,
    ...(options.optional !== undefined && { optional: options.optional }),
    ...(options.default !== undefined && { default: options.default }),
    ...(options.aliases && { aliases: options.aliases }),
    ...(options.hidden !== undefined && { hidden: options.hidden }),
  };
}

/** Options for variadic enum flags */
type EnumArrayFlagOptions<T extends string> = VariadicFlagOptions<T>;

/**
 * Creates a variadic enum flag definition (multiple selections from fixed values).
 *
 * @example
 * ```typescript
 * flags: {
 *   // Repeated flag: --format json --format yaml
 *   formats: flag.enumArray(["json", "yaml", "toml"] as const, {
 *     brief: "Output formats",
 *   }),
 *   // Comma-separated: --levels debug,info
 *   levels: flag.enumArray(["debug", "info", "warn", "error"] as const, {
 *     brief: "Log levels",
 *     variadic: ",",
 *   }),
 * }
 * ```
 */
function enumArray<const T extends string>(
  values: readonly T[],
  options: EnumArrayFlagOptions<T>,
): {
  kind: "enum";
  values: readonly T[];
  brief: string;
  variadic: true | string;
  default?: readonly T[];
  aliases?: readonly string[];
  hidden?: boolean;
} {
  return {
    kind: "enum",
    values,
    brief: options.brief,
    variadic: options.variadic ?? true,
    ...(options.default !== undefined && { default: options.default }),
    ...(options.aliases && { aliases: options.aliases }),
    ...(options.hidden !== undefined && { hidden: options.hidden }),
  };
}

// ============================================================================
// Parsed flags (custom parser)
// ============================================================================

/** Options for custom parsed flags */
interface ParsedOptions<T> extends OptionalFlagOptions {
  /** Parser function to convert string to target type */
  parse: (value: string) => T | Promise<T>;
  /** Placeholder shown in help */
  placeholder?: string;
  /** Default value if flag is not provided */
  default?: T;
}

/**
 * Creates a flag with a custom parser function.
 *
 * @example
 * ```typescript
 * flags: {
 *   date: flag.parsed({
 *     parse: (s) => new Date(s),
 *     brief: "Date to use",
 *     placeholder: "YYYY-MM-DD",
 *   }),
 *   config: flag.parsed({
 *     parse: (s) => JSON.parse(s),
 *     brief: "JSON configuration",
 *     optional: true,
 *   }),
 * }
 * ```
 */
function parsed<T>(options: ParsedOptions<T>): {
  kind: "parsed";
  brief: string;
  parse: (value: string) => T | Promise<T>;
  placeholder: string;
  optional?: boolean;
  default?: T;
  aliases?: readonly string[];
  hidden?: boolean;
} {
  return {
    kind: "parsed",
    brief: options.brief,
    parse: options.parse,
    placeholder: options.placeholder ?? "value",
    ...(options.optional !== undefined && { optional: options.optional }),
    ...(options.default !== undefined && { default: options.default }),
    ...(options.aliases && { aliases: options.aliases }),
    ...(options.hidden !== undefined && { hidden: options.hidden }),
  };
}

/** Options for variadic custom parsed flags */
interface ParsedArrayOptions<T> extends BaseFlagOptions {
  /** Parser function to convert string to target type */
  parse: (value: string) => T | Promise<T>;
  /** Placeholder shown in help */
  placeholder?: string;
  /** Default values if flag is not provided */
  default?: readonly T[];
  /** Separator for variadic values (true = repeated flag, string = delimiter) */
  variadic?: true | string;
}

/**
 * Creates a variadic flag with a custom parser function.
 *
 * @example
 * ```typescript
 * flags: {
 *   dates: flag.parsedArray({
 *     parse: (s) => new Date(s),
 *     brief: "Dates to process",
 *     placeholder: "YYYY-MM-DD",
 *   }),
 * }
 * ```
 */
function parsedArray<T>(options: ParsedArrayOptions<T>): {
  kind: "parsed";
  brief: string;
  parse: (value: string) => T | Promise<T>;
  placeholder: string;
  variadic: true | string;
  default?: readonly T[];
  aliases?: readonly string[];
  hidden?: boolean;
} {
  return {
    kind: "parsed",
    brief: options.brief,
    parse: options.parse,
    placeholder: options.placeholder ?? "value",
    variadic: options.variadic ?? true,
    ...(options.default !== undefined && { default: options.default }),
    ...(options.aliases && { aliases: options.aliases }),
    ...(options.hidden !== undefined && { hidden: options.hidden }),
  };
}

// ============================================================================
// Export the flag namespace
// ============================================================================

/**
 * Shorthand helpers for defining CLI flags.
 *
 * @example
 * ```typescript
 * import { flag } from "@macalinao/stricli-define";
 *
 * const params = {
 *   flags: {
 *     verbose: flag.boolean({ brief: "Enable verbose output" }),
 *     count: flag.number({ brief: "Number of items", default: 10 }),
 *     name: flag.string({ brief: "Name", optional: true }),
 *     format: flag.enum(["json", "yaml"] as const, { brief: "Format" }),
 *   },
 * };
 * ```
 */
export const flag: {
  /** Boolean flag (defaults to false) */
  boolean: typeof boolean;
  /** Counter flag (increments each time flag is provided) */
  counter: typeof counter;
  /** String flag */
  string: typeof string;
  /** Variadic string flag (multiple values) */
  stringArray: typeof stringArray;
  /** Number flag */
  number: typeof number;
  /** Variadic number flag (multiple values) */
  numberArray: typeof numberArray;
  /** Enum flag (fixed set of values) */
  enum: typeof enumFlag;
  /** Variadic enum flag (multiple selections from fixed values) */
  enumArray: typeof enumArray;
  /** Custom parsed flag */
  parsed: typeof parsed;
  /** Variadic custom parsed flag (multiple values) */
  parsedArray: typeof parsedArray;
} = {
  boolean,
  counter,
  string,
  stringArray,
  number,
  numberArray,
  enum: enumFlag,
  enumArray,
  parsed,
  parsedArray,
};

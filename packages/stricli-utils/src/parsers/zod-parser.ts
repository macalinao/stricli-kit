import type { z } from "zod";

/**
 * Create a parser from a Zod schema.
 *
 * @example
 * ```typescript
 * import { z } from "zod";
 * import { zodParser } from "@macalinao/stricli-utils";
 *
 * // Parse JSON with Zod validation
 * const configSchema = z.object({
 *   host: z.string(),
 *   port: z.number().int().min(0).max(65535),
 *   ssl: z.boolean().default(false),
 * });
 *
 * export const route = defineRoute({
 *   params: {
 *     flags: {
 *       config: flag.parsed({
 *         parse: zodParser(configSchema),
 *         brief: "Config JSON",
 *         placeholder: "json",
 *       }),
 *     },
 *     positional: { kind: "tuple", parameters: [] },
 *   },
 *   // ...
 * });
 * ```
 *
 * @param schema - Zod schema to validate against
 * @returns A parser function that parses JSON and validates with Zod
 */
export function zodParser<T>(schema: z.ZodType<T>): (value: string) => T {
  return (value: string): T => {
    let parsed: unknown;
    try {
      parsed = JSON.parse(value);
    } catch {
      throw new Error(`Invalid JSON: ${value}`);
    }

    const result = schema.safeParse(parsed);
    if (!result.success) {
      const errors = result.error.errors
        .map((e: z.ZodIssue) => `${e.path.join(".")}: ${e.message}`)
        .join("; ");
      throw new Error(`Validation failed: ${errors}`);
    }
    return result.data;
  };
}

/**
 * Create a parser that validates a raw string value (not JSON) against a Zod schema.
 *
 * @example
 * ```typescript
 * import { z } from "zod";
 * import { zodStringParser } from "@macalinao/stricli-utils";
 *
 * // Email validation
 * export const route = defineRoute({
 *   params: {
 *     flags: {
 *       email: flag.parsed({
 *         parse: zodStringParser(z.string().email()),
 *         brief: "Email address",
 *         placeholder: "email",
 *       }),
 *     },
 *     positional: { kind: "tuple", parameters: [] },
 *   },
 *   // ...
 * });
 *
 * // Number with constraints
 * export const route = defineRoute({
 *   params: {
 *     flags: {
 *       port: flag.parsed({
 *         parse: zodStringParser(z.coerce.number().int().min(0).max(65535)),
 *         brief: "Port number",
 *         placeholder: "port",
 *       }),
 *     },
 *     positional: { kind: "tuple", parameters: [] },
 *   },
 *   // ...
 * });
 * ```
 *
 * @param schema - Zod schema to validate against (input is raw string)
 * @returns A parser function that validates the string with Zod
 */
export function zodStringParser<T>(schema: z.ZodType<T>): (value: string) => T {
  return (value: string): T => {
    const result = schema.safeParse(value);
    if (!result.success) {
      const errors = result.error.errors
        .map((e: z.ZodIssue) =>
          e.path.length > 0 ? `${e.path.join(".")}: ${e.message}` : e.message,
        )
        .join("; ");
      throw new Error(`Validation failed: ${errors}`);
    }
    return result.data;
  };
}

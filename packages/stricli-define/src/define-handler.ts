import type { CommandContext } from "@stricli/core";
import type { CommandHandler, ExtractArgs, ExtractFlags } from "./types.js";

/**
 * Create a command handler with types inferred from parameters.
 * The handler receives ctx and a params object with flags and args.
 *
 * @example
 * ```typescript
 * const params = defineParameters({
 *   flags: {
 *     force: { kind: "boolean", brief: "Force" },
 *     output: { kind: "parsed", parse: String, brief: "Output", optional: true },
 *   },
 *   positional: {
 *     kind: "tuple",
 *     parameters: [
 *       { brief: "Source", parse: String, placeholder: "source" },
 *       { brief: "Dest", parse: String, placeholder: "dest", optional: true },
 *     ],
 *   },
 * });
 *
 * const handler = defineHandler<typeof params>(
 *   (ctx, { flags: { force, output }, args: [source, dest] }) => {
 *     // force: boolean, output: string | undefined
 *     // source: string, dest: string | undefined
 *   },
 * );
 * ```
 */
export function defineHandler<
  TParams,
  TContext extends CommandContext = CommandContext,
>(
  handler: CommandHandler<
    ExtractFlags<TParams>,
    ExtractArgs<TParams>,
    TContext
  >,
): CommandHandler<ExtractFlags<TParams>, ExtractArgs<TParams>, TContext> {
  return handler;
}

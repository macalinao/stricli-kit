/**
 * Define command parameters with full type preservation.
 * Use this to define parameters separately, then pass to defineHandler.
 *
 * @example
 * ```typescript
 * const parameters = defineParameters({
 *   flags: {
 *     force: { kind: "boolean", brief: "Force operation" },
 *     name: { kind: "parsed", parse: String, brief: "Name" },
 *   },
 *   positional: {
 *     kind: "tuple",
 *     parameters: [{ brief: "Path", parse: String, placeholder: "path" }],
 *   },
 * });
 * ```
 */
export function defineParameters<const TParams>(params: TParams): TParams {
  return params;
}

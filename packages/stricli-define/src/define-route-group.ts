import type { CommandContext, RouteMapBuilderArguments } from "@stricli/core";

// ============================================================================
// Route group types (for __route.ts files)
// ============================================================================

/**
 * Documentation for a route group.
 * Extracted from Stricli's RouteMapBuilderArguments type.
 */
export type RouteGroupDocs<R extends string = string> =
  RouteMapBuilderArguments<R, CommandContext>["docs"];

/**
 * Route group configuration for nested route maps (__route.ts).
 * Uses Stricli's RouteMapBuilderArguments with 'routes' omitted (determined by file system)
 * and all fields made optional (not required for route groups).
 */
export type RouteGroupMeta<R extends string = string> = Partial<
  Omit<RouteMapBuilderArguments<R, CommandContext>, "routes">
>;

/**
 * Helper to define route group configuration.
 * Uses const type parameter to preserve literal types for aliases,
 * which is important for proper type inference with Stricli's strict typing.
 *
 * @example
 * ```typescript
 * // In __route.ts
 * export default defineRouteGroup({
 *   docs: { brief: "User management commands" },
 *   aliases: { u: "users" },
 * });
 * ```
 */
export function defineRouteGroup<const T extends RouteGroupMeta>(config: T): T {
  return config;
}

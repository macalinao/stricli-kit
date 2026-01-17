// Re-export commonly used types from @stricli/core for convenience
export type {
  BaseArgs,
  BaseFlags,
  CommandContext,
  TypedCommandParameters,
} from "@stricli/core";
// Shared types
export type {
  CommandDocs,
  CommandHandler,
  CommandParams,
  ExtractArgs,
  ExtractFlags,
  ExtractFlagType,
} from "./types.js";
// defineCommand
export {
  type DefineCommandArgs,
  type DefineCommandLazyArgs,
  type DefineCommandLocalArgs,
  defineCommand,
  type StricliHandler,
  type StricliHandlerLoader,
  type StricliHandlerModule,
} from "./define-command.js";
// defineHandler
export { defineHandler } from "./define-handler.js";
// defineParameters
export { defineParameters } from "./define-parameters.js";
// defineRoute
export {
  type DefineRouteArgs,
  type DefineRouteLazyArgs,
  type DefineRouteLocalArgs,
  defineRoute,
  type Route,
  type RouteHandler,
  type RouteHandlerLoader,
  type RouteHandlerModule,
} from "./define-route.js";
// defineRouteGroup
export {
  defineRouteGroup,
  type RouteGroupDocs,
  type RouteGroupMeta,
} from "./define-route-group.js";

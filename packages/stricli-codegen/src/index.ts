export type {
  GeneratedRouteMap,
  GeneratorOptions,
  RouteFileExports,
  RouteGroupConfig,
  RouteMeta,
  RouteWatcher,
  ScannedRoute,
  WatcherOptions,
} from "./types.js";
export {
  getDefaultConfig,
  readConfig,
  type StricliKitConfig,
} from "./config.js";
export {
  fileToRouteName,
  isCommandFile,
  isHandlerFile,
  isLazyFile,
  isSpecialFile,
  pathToIdentifier,
  routeToImportName,
  SPECIAL_FILES,
} from "./conventions.js";
export { generateRouteMap } from "./generator.js";
export {
  type CliPackageInfo,
  findCliPackages,
  findEmptyFiles,
  generateRepoRouteMaps,
  isEmptyFile,
  populateStubFile,
  type StubResult,
} from "./repo-scanner.js";
export {
  hasRootConfig,
  hasRouteConfig,
  scanCommandsDirectory,
} from "./scanner.js";
export {
  generateHandlerTemplate,
  generateLazyRouteTemplate,
  generateRootTemplate,
  generateRouteGroupTemplate,
  generateRouteTemplate,
  isLazyRoute,
  type TemplateOptions,
} from "./template.js";
export { createRouteWatcher } from "./watcher.js";

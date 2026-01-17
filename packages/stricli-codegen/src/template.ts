import { readFileSync } from "node:fs";
import { basename, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import Handlebars from "handlebars";

// Get the directory where templates are stored
const __dirname = dirname(fileURLToPath(import.meta.url));
const TEMPLATES_DIR = join(__dirname, "templates");

// Default utils package - can be overridden via config
const DEFAULT_UTILS_PACKAGE = "@macalinao/stricli-kit";

/**
 * Options for template generation
 */
export interface TemplateOptions {
  /** Package to import utilities from (default: @macalinao/stricli-kit) */
  utilsPackage?: string;
}

// Load and compile templates
function loadTemplate(name: string): Handlebars.TemplateDelegate {
  const templatePath = join(TEMPLATES_DIR, `${name}.hbs`);
  const templateSource = readFileSync(templatePath, "utf-8");
  return Handlebars.compile(templateSource);
}

// Lazily load templates
const templates = {
  route: loadTemplate("route"),
  lazyRoute: loadTemplate("lazy-route"),
  handler: loadTemplate("handler"),
  routeGroup: loadTemplate("route-group"),
  root: loadTemplate("root"),
};

/**
 * Check if a file path is for a lazy route
 */
export function isLazyRoute(filePath: string): boolean {
  return filePath.endsWith(".lazy.ts");
}

/**
 * Get the base route name from a file path (handles regular, lazy, and handler files)
 */
function getRouteName(filePath: string): string {
  const fileName = basename(filePath, ".ts");
  // Handle .lazy.ts -> remove .lazy suffix
  // Handle .handler.ts -> remove .handler suffix
  let baseName = fileName;
  if (baseName.endsWith(".lazy")) {
    baseName = baseName.slice(0, -5);
  } else if (baseName.endsWith(".handler")) {
    baseName = baseName.slice(0, -8);
  }
  return baseName === "index" ? "index" : baseName;
}

/**
 * Convert kebab-case or snake_case to Title Case
 */
function toTitleCase(str: string): string {
  return str
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

/**
 * Convert kebab-case or snake_case to camelCase
 */
function toCamelCase(str: string): string {
  return str
    .replace(/[-_](.)/g, (_, char: string) => char.toUpperCase())
    .replace(/^./, (char) => char.toLowerCase());
}

/**
 * Generate the template for a new route file (non-lazy, uses func)
 */
export function generateRouteTemplate(
  filePath: string,
  options: TemplateOptions = {},
): string {
  const utilsPackage = options.utilsPackage ?? DEFAULT_UTILS_PACKAGE;
  const routeName = getRouteName(filePath);
  const handlerName = `${toCamelCase(routeName)}Handler`;
  const description =
    routeName === "index"
      ? "Default command"
      : `${toTitleCase(routeName)} command`;

  return templates.route({
    utilsPackage,
    routeName,
    handlerName,
    description,
  });
}

/**
 * Generate the template for a lazy route file (uses loader)
 */
export function generateLazyRouteTemplate(
  filePath: string,
  options: TemplateOptions = {},
): string {
  const utilsPackage = options.utilsPackage ?? DEFAULT_UTILS_PACKAGE;
  const routeName = getRouteName(filePath);
  const description =
    routeName === "index"
      ? "Default command"
      : `${toTitleCase(routeName)} command`;
  const handlerFileName = `${routeName}.handler.ts`;

  return templates.lazyRoute({
    utilsPackage,
    routeName,
    description,
    handlerFileName,
  });
}

/**
 * Generate the handler template for a lazy route
 */
export function generateHandlerTemplate(filePath: string): string {
  const routeName = getRouteName(filePath);

  return templates.handler({
    routeName,
  });
}

/**
 * Generate the template for a route group config (__route.ts)
 */
export function generateRouteGroupTemplate(
  groupName: string,
  options: TemplateOptions = {},
): string {
  const utilsPackage = options.utilsPackage ?? DEFAULT_UTILS_PACKAGE;
  const description = `${toTitleCase(groupName)} commands`;

  return templates.routeGroup({
    utilsPackage,
    description,
  });
}

/**
 * Generate the template for a root config (__root.ts)
 */
export function generateRootTemplate(
  appName: string,
  options: TemplateOptions = {},
): string {
  const utilsPackage = options.utilsPackage ?? DEFAULT_UTILS_PACKAGE;
  const description = `${toTitleCase(appName)} - CLI application`;

  return templates.root({
    utilsPackage,
    description,
  });
}

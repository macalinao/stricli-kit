import type { Application, CommandContext } from "@stricli/core";
import { buildApplication, buildRouteMap } from "@stricli/core";
import { route as devRoute } from "./commands/dev.js";
import { route as generateRoute } from "./commands/generate.js";
import { route as initRoute } from "./commands/init.js";
import { route as lintRoute } from "./commands/lint.js";
import { route as newRoute } from "./commands/new.js";
import { route as routeRoute } from "./commands/route.js";
import { route as testRoute } from "./commands/test.js";

// Build aliases from routes that have them
const routeAliases = Object.fromEntries(
  (routeRoute.aliases ?? []).map((alias) => [alias, "route"] as const),
);
const newAliases = Object.fromEntries(
  (newRoute.aliases ?? []).map((alias) => [alias, "new"] as const),
);

const routes = buildRouteMap({
  routes: {
    init: initRoute.command,
    new: newRoute.command,
    route: routeRoute.command,
    test: testRoute.command,
    lint: lintRoute.command,
    generate: generateRoute.command,
    dev: devRoute.command,
  },
  aliases: {
    ...newAliases,
    ...routeAliases,
  },
  docs: {
    brief: "Stricli-Kit CLI - toolkit for building file-based CLIs",
  },
});

export const app: Application<CommandContext> = buildApplication(routes, {
  name: "stricli-kit",
  versionInfo: {
    currentVersion: "0.1.0",
  },
});

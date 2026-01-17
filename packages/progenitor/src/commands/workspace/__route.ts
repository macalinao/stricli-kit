import { defineRouteGroup } from "@macalinao/stricli-kit";

export const config = defineRouteGroup({
  aliases: {
    i: "init",
    ss: "setup-scripts",
  },
  docs: {
    brief: "Workspace management commands",
  },
});

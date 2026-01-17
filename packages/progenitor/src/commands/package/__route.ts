import { defineRouteGroup } from "@macalinao/stricli-kit";

export const config = defineRouteGroup({
  aliases: {
    n: "new",
    ss: "setup-scripts",
  },
  docs: {
    brief: "Package management commands",
  },
});

import { describe, expect, test } from "bun:test";
import {
  generateHandlerTemplate,
  generateLazyRouteTemplate,
  generateRootTemplate,
  generateRouteGroupTemplate,
  generateRouteTemplate,
  isLazyRoute,
} from "./template.js";

describe("isLazyRoute", () => {
  test("identifies lazy routes", () => {
    expect(isLazyRoute("new.lazy.ts")).toBe(true);
    expect(isLazyRoute("/path/to/test.lazy.ts")).toBe(true);
  });

  test("rejects non-lazy routes", () => {
    expect(isLazyRoute("new.ts")).toBe(false);
    expect(isLazyRoute("lazy.ts")).toBe(false);
  });
});

describe("generateRouteTemplate", () => {
  test("generates route template with defineParameters, defineHandler, defineRoute", () => {
    const template = generateRouteTemplate("new.ts");

    expect(template).toContain(
      'import type { CommandContext } from "@stricli/core"',
    );
    expect(template).toContain(
      'import { defineHandler, defineParameters, defineRoute, type Route } from "@macalinao/stricli-kit"',
    );
    expect(template).toContain("const parameters = defineParameters({");
    expect(template).toContain(
      "const newHandler = defineHandler(parameters, async function newHandler(context, flags)",
    );
    expect(template).toContain("context.process.stdout.write");
    expect(template).toContain("Hello from new!");
    expect(template).toContain("export const route");
    expect(template).toContain("defineRoute({");
    expect(template).toContain("handler: newHandler,");
    expect(template).toContain('brief: "New command"');
  });

  test("generates index route template", () => {
    const template = generateRouteTemplate("index.ts");

    expect(template).toContain(
      "const indexHandler = defineHandler(parameters, async function indexHandler(context, flags)",
    );
    expect(template).toContain("Hello from index!");
    expect(template).toContain('brief: "Default command"');
  });

  test("uses custom utilsPackage", () => {
    const template = generateRouteTemplate("new.ts", {
      utilsPackage: "@macalinao/stricli-utils",
    });

    expect(template).toContain('from "@macalinao/stricli-utils"');
    expect(template).not.toContain('from "@macalinao/stricli-kit"');
  });

  test("handles kebab-case names", () => {
    const template = generateRouteTemplate("setup-scripts.ts");

    expect(template).toContain(
      "const setupScriptsHandler = defineHandler(parameters, async function setupScriptsHandler(context, flags)",
    );
    expect(template).toContain("Hello from setup-scripts!");
    expect(template).toContain('brief: "Setup Scripts command"');
  });
});

describe("generateLazyRouteTemplate", () => {
  test("generates lazy route template", () => {
    const template = generateLazyRouteTemplate("new.lazy.ts");

    expect(template).toContain(
      'import { buildCommand, type CommandContext } from "@stricli/core"',
    );
    expect(template).toContain("export const route");
    expect(template).toContain('loader: () => import("./new.handler.js")');
    expect(template).toContain("Handler file: new.handler.ts");
  });

  test("uses custom utilsPackage", () => {
    const template = generateLazyRouteTemplate("new.lazy.ts", {
      utilsPackage: "@macalinao/stricli-utils",
    });

    expect(template).toContain('from "@macalinao/stricli-utils"');
  });
});

describe("generateHandlerTemplate", () => {
  test("generates handler template", () => {
    const template = generateHandlerTemplate("new.handler.ts");

    expect(template).toContain(
      'import type { CommandContext } from "@stricli/core"',
    );
    expect(template).toContain("export default async function");
    expect(template).toContain("Hello from new!");
  });
});

describe("generateRouteGroupTemplate", () => {
  test("generates route group template", () => {
    const template = generateRouteGroupTemplate("package");

    expect(template).toContain("defineRouteGroup");
    expect(template).toContain('from "@macalinao/stricli-kit"');
    expect(template).toContain("export const config");
    expect(template).toContain('brief: "Package commands"');
  });

  test("uses custom utilsPackage", () => {
    const template = generateRouteGroupTemplate("package", {
      utilsPackage: "@macalinao/stricli-utils",
    });

    expect(template).toContain('from "@macalinao/stricli-utils"');
  });

  test("handles kebab-case group names", () => {
    const template = generateRouteGroupTemplate("my-group");

    expect(template).toContain('brief: "My Group commands"');
  });
});

describe("generateRootTemplate", () => {
  test("generates root template", () => {
    const template = generateRootTemplate("my-cli");

    expect(template).toContain("defineRoot");
    expect(template).toContain('from "@macalinao/stricli-kit"');
    expect(template).toContain("export const root = defineRoot({");
    expect(template).toContain('brief: "My Cli - CLI application"');
    expect(template).toContain("export type AppContext = typeof root.Context");
  });

  test("uses custom utilsPackage", () => {
    const template = generateRootTemplate("my-cli", {
      utilsPackage: "@macalinao/stricli-utils",
    });

    expect(template).toContain('from "@macalinao/stricli-utils"');
  });
});

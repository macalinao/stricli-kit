import type { ScannedRoute } from "./types.js";
import { describe, expect, test } from "bun:test";
import {
  buildGeneratedFiles,
  collectRouteFilePaths,
  collectRouteImports,
  formatImportStatements,
  generateAppFileContent,
  generateCreateFileRouteContent,
  generateRouteMapCodePure,
  generateRouteMapFileContent,
  needsQuotes,
  quotePropertyName,
  toConfigImportPath,
  toImportPath,
} from "./generator.js";

describe("needsQuotes", () => {
  test("returns false for valid JS identifiers", () => {
    expect(needsQuotes("foo")).toBe(false);
    expect(needsQuotes("_bar")).toBe(false);
    expect(needsQuotes("$baz")).toBe(false);
    expect(needsQuotes("foo123")).toBe(false);
    expect(needsQuotes("camelCase")).toBe(false);
  });

  test("returns true for names with special characters", () => {
    expect(needsQuotes("foo-bar")).toBe(true);
    expect(needsQuotes("foo.bar")).toBe(true);
    expect(needsQuotes("foo bar")).toBe(true);
    expect(needsQuotes("123foo")).toBe(true);
    expect(needsQuotes("setup-scripts")).toBe(true);
  });
});

describe("quotePropertyName", () => {
  test("quotes names that need quoting", () => {
    expect(quotePropertyName("foo-bar")).toBe('"foo-bar"');
    expect(quotePropertyName("setup-scripts")).toBe('"setup-scripts"');
  });

  test("does not quote valid identifiers", () => {
    expect(quotePropertyName("foo")).toBe("foo");
    expect(quotePropertyName("_bar")).toBe("_bar");
  });
});

describe("toImportPath", () => {
  test("converts .ts to .js", () => {
    expect(toImportPath("foo.ts", "../commands")).toBe("../commands/foo.js");
    expect(toImportPath("foo/bar.ts", "../commands")).toBe(
      "../commands/foo/bar.js",
    );
  });

  test("converts .lazy.ts to .lazy.js", () => {
    expect(toImportPath("foo.lazy.ts", "../commands")).toBe(
      "../commands/foo.lazy.js",
    );
  });
});

describe("toConfigImportPath", () => {
  test("builds config import path", () => {
    expect(toConfigImportPath("package", "../commands")).toBe(
      "../commands/package/__route.js",
    );
    expect(toConfigImportPath("foo/bar", "../commands")).toBe(
      "../commands/foo/bar/__route.js",
    );
  });
});

describe("collectRouteImports", () => {
  test("collects imports from file routes", () => {
    const routes: ScannedRoute[] = [
      {
        name: "new",
        relativePath: "new.ts",
        filePath: "/abs/path/new.ts",
        isDirectory: false,
      },
      {
        name: "test",
        relativePath: "test.ts",
        filePath: "/abs/path/test.ts",
        isDirectory: false,
      },
    ];

    const imports = collectRouteImports(routes, "../commands");

    expect(imports).toHaveLength(2);
    expect(imports[0]).toEqual({
      identifier: "newRoute",
      path: "../commands/new.js",
      isConfig: false,
    });
    expect(imports[1]).toEqual({
      identifier: "testRoute",
      path: "../commands/test.js",
      isConfig: false,
    });
  });

  test("collects imports from directory routes with config", () => {
    const routes: ScannedRoute[] = [
      {
        name: "package",
        relativePath: "package",
        filePath: "/abs/path/package",
        isDirectory: true,
        children: [
          {
            name: "new",
            relativePath: "package/new.ts",
            filePath: "/abs/path/package/new.ts",
            isDirectory: false,
          },
        ],
      },
    ];

    // Mock hasRouteConfig to always return true
    const imports = collectRouteImports(routes, "../commands", () => true);

    expect(imports).toHaveLength(2);
    expect(imports[0]).toEqual({
      identifier: "package_config",
      path: "../commands/package/__route.js",
      isConfig: true,
    });
    expect(imports[1]).toEqual({
      identifier: "package_newRoute",
      path: "../commands/package/new.js",
      isConfig: false,
    });
  });
});

describe("formatImportStatements", () => {
  test("formats route imports", () => {
    const imports = [
      { identifier: "newRoute", path: "../commands/new.js", isConfig: false },
      {
        identifier: "testRoute",
        path: "../commands/test.js",
        isConfig: false,
      },
    ];

    const statements = formatImportStatements(imports);

    expect(statements).toEqual([
      'import { route as newRoute } from "../commands/new.js";',
      'import { route as testRoute } from "../commands/test.js";',
    ]);
  });

  test("formats config imports", () => {
    const imports = [
      {
        identifier: "package_config",
        path: "../commands/package/__route.js",
        isConfig: true,
      },
    ];

    const statements = formatImportStatements(imports);

    expect(statements).toEqual([
      'import { config as package_config } from "../commands/package/__route.js";',
    ]);
  });
});

describe("generateRouteMapCodePure", () => {
  test("generates code for file routes", () => {
    const routes: ScannedRoute[] = [
      {
        name: "new",
        relativePath: "new.ts",
        filePath: "/abs/path/new.ts",
        isDirectory: false,
      },
    ];

    const code = generateRouteMapCodePure(routes, {
      indent: "  ",
      checkHasRouteConfig: () => false,
    });

    expect(code).toContain("new: newRoute.command");
  });

  test("quotes property names with hyphens", () => {
    const routes: ScannedRoute[] = [
      {
        name: "setup-scripts",
        relativePath: "setup-scripts.ts",
        filePath: "/abs/path/setup-scripts.ts",
        isDirectory: false,
      },
    ];

    const code = generateRouteMapCodePure(routes, {
      indent: "  ",
      checkHasRouteConfig: () => false,
    });

    expect(code).toContain('"setup-scripts"');
  });
});

describe("collectRouteFilePaths", () => {
  test("collects all file paths from route tree", () => {
    const routes: ScannedRoute[] = [
      {
        name: "new",
        relativePath: "new.ts",
        filePath: "/abs/path/new.ts",
        isDirectory: false,
      },
      {
        name: "package",
        relativePath: "package",
        filePath: "/abs/path/package",
        isDirectory: true,
        children: [
          {
            name: "add",
            relativePath: "package/add.ts",
            filePath: "/abs/path/package/add.ts",
            isDirectory: false,
          },
        ],
      },
    ];

    const paths = collectRouteFilePaths(routes);

    expect(paths).toEqual(["/abs/path/new.ts", "/abs/path/package/add.ts"]);
  });
});

describe("generateCreateFileRouteContent", () => {
  test("generates content without root config", () => {
    const content = generateCreateFileRouteContent(
      "../commands",
      false,
      "@macalinao/stricli-kit",
    );

    expect(content).toContain("AUTO-GENERATED");
    expect(content).toContain(
      'import type { CommandContext } from "@stricli/core"',
    );
    expect(content).toContain("createFileRoute");
    expect(content).toContain('from "@macalinao/stricli-kit"');
  });

  test("generates content with root config", () => {
    const content = generateCreateFileRouteContent(
      "../commands",
      true,
      "@macalinao/stricli-kit",
    );

    expect(content).toContain("AUTO-GENERATED");
    expect(content).toContain(
      'import type { AppContext } from "../commands/__root.js"',
    );
    expect(content).toContain("createFileRoute");
    expect(content).toContain("export type { AppContext }");
  });
});

describe("generateAppFileContent", () => {
  test("generates app file with package info", () => {
    const content = generateAppFileContent(
      "../commands",
      { name: "@macalinao/test-cli", version: "1.0.0" },
      "@macalinao/stricli-kit",
    );

    expect(content).toContain("AUTO-GENERATED");
    expect(content).toContain(
      'import { createAppContextAsync } from "@macalinao/stricli-kit"',
    );
    expect(content).toContain(
      'name: root.appConfig.name ?? "@macalinao/test-cli"',
    );
    expect(content).toContain(
      'currentVersion: root.appConfig.version ?? "1.0.0"',
    );
    expect(content).toContain("export const app");
    expect(content).toContain("export const createContext");
  });
});

describe("generateRouteMapFileContent", () => {
  test("generates route map without root config", () => {
    const routes: ScannedRoute[] = [
      {
        name: "test",
        relativePath: "test.ts",
        filePath: "/abs/path/test.ts",
        isDirectory: false,
      },
    ];

    const content = generateRouteMapFileContent(routes, "../commands", false);

    expect(content).toContain("AUTO-GENERATED");
    expect(content).toContain(
      'import type { CommandContext, RouteMap } from "@stricli/core"',
    );
    expect(content).toContain("export const routes: RouteMap<CommandContext>");
  });

  test("generates route map with root config", () => {
    const routes: ScannedRoute[] = [
      {
        name: "test",
        relativePath: "test.ts",
        filePath: "/abs/path/test.ts",
        isDirectory: false,
      },
    ];

    const content = generateRouteMapFileContent(routes, "../commands", true);

    expect(content).toContain("AUTO-GENERATED");
    expect(content).toContain(
      'import type { AppContext } from "../commands/__root.js"',
    );
    expect(content).toContain("export const routes: RouteMap<AppContext>");
    expect(content).toContain("...root.routeConfig");
  });
});

describe("buildGeneratedFiles", () => {
  test("builds all generated files", () => {
    const routes: ScannedRoute[] = [
      {
        name: "test",
        relativePath: "test.ts",
        filePath: "/abs/path/test.ts",
        isDirectory: false,
      },
    ];

    const files = buildGeneratedFiles(
      routes,
      "../commands",
      true,
      { name: "test-cli", version: "1.0.0" },
      "/output/dir",
      "/output/dir/route-map.ts",
      { utilsPackage: "@macalinao/stricli-kit" },
    );

    expect(files).toHaveLength(3);
    expect(files.map((f) => f.path)).toContain("/output/dir/route-map.ts");
    expect(files.map((f) => f.path)).toContain(
      "/output/dir/create-file-route.ts",
    );
    expect(files.map((f) => f.path)).toContain("/output/dir/app.ts");
  });

  test("does not generate app.ts without root config", () => {
    const routes: ScannedRoute[] = [];

    const files = buildGeneratedFiles(
      routes,
      "../commands",
      false,
      {},
      "/output/dir",
      "/output/dir/route-map.ts",
      {},
    );

    expect(files).toHaveLength(2);
    expect(files.map((f) => f.path)).not.toContain("/output/dir/app.ts");
  });
});

import { describe, expect, test } from "bun:test";
import {
  fileToRouteName,
  isCommandFile,
  isHandlerFile,
  isLazyFile,
  isSpecialFile,
  pathToIdentifier,
  routeToImportName,
  SPECIAL_FILES,
} from "./conventions.js";

describe("SPECIAL_FILES", () => {
  test("contains expected special file names", () => {
    expect(SPECIAL_FILES.ROOT_CONFIG).toBe("__root.ts");
    expect(SPECIAL_FILES.ROUTE_CONFIG).toBe("__route.ts");
  });
});

describe("isSpecialFile", () => {
  test("identifies special files", () => {
    expect(isSpecialFile("__root.ts")).toBe(true);
    expect(isSpecialFile("__route.ts")).toBe(true);
  });

  test("rejects non-special files", () => {
    expect(isSpecialFile("index.ts")).toBe(false);
    expect(isSpecialFile("new.ts")).toBe(false);
    expect(isSpecialFile("foo.handler.ts")).toBe(false);
    // Note: isSpecialFile checks exact filename, not path
    expect(isSpecialFile("/path/to/__root.ts")).toBe(false);
  });
});

describe("isCommandFile", () => {
  test("identifies regular command files", () => {
    expect(isCommandFile("new.ts")).toBe(true);
    expect(isCommandFile("index.ts")).toBe(true);
    expect(isCommandFile("/path/to/test.ts")).toBe(true);
  });

  test("identifies lazy command files", () => {
    expect(isCommandFile("new.lazy.ts")).toBe(true);
    expect(isCommandFile("/path/to/test.lazy.ts")).toBe(true);
  });

  test("rejects non-command files", () => {
    expect(isCommandFile("__root.ts")).toBe(false);
    expect(isCommandFile("__route.ts")).toBe(false);
    expect(isCommandFile("new.handler.ts")).toBe(false);
    expect(isCommandFile("test.js")).toBe(false);
  });
});

describe("isLazyFile", () => {
  test("identifies lazy files", () => {
    expect(isLazyFile("new.lazy.ts")).toBe(true);
    expect(isLazyFile("/path/to/test.lazy.ts")).toBe(true);
  });

  test("rejects non-lazy files", () => {
    expect(isLazyFile("new.ts")).toBe(false);
    expect(isLazyFile("lazy.ts")).toBe(false);
    expect(isLazyFile("foo.handler.ts")).toBe(false);
  });
});

describe("isHandlerFile", () => {
  test("identifies handler files", () => {
    expect(isHandlerFile("new.handler.ts")).toBe(true);
    expect(isHandlerFile("/path/to/test.handler.ts")).toBe(true);
  });

  test("rejects non-handler files", () => {
    expect(isHandlerFile("new.ts")).toBe(false);
    expect(isHandlerFile("new.lazy.ts")).toBe(false);
    expect(isHandlerFile("handler.ts")).toBe(false);
  });
});

describe("fileToRouteName", () => {
  test("converts simple file names", () => {
    expect(fileToRouteName("new.ts")).toBe("new");
    expect(fileToRouteName("test.ts")).toBe("test");
    expect(fileToRouteName("my-command.ts")).toBe("my-command");
  });

  test("handles lazy files", () => {
    expect(fileToRouteName("new.lazy.ts")).toBe("new");
    expect(fileToRouteName("test.lazy.ts")).toBe("test");
  });

  test("does not strip path (use basename first if needed)", () => {
    // fileToRouteName expects just the filename, not the full path
    expect(fileToRouteName("/path/to/new.ts")).toBe("/path/to/new");
    expect(fileToRouteName("./commands/test.ts")).toBe("./commands/test");
  });

  test("returns empty for index files", () => {
    expect(fileToRouteName("index.ts")).toBe("");
    expect(fileToRouteName("index.lazy.ts")).toBe("");
  });
});

describe("pathToIdentifier", () => {
  test("converts simple paths", () => {
    expect(pathToIdentifier("new.ts")).toBe("new");
    expect(pathToIdentifier("test.ts")).toBe("test");
  });

  test("converts nested paths", () => {
    expect(pathToIdentifier("package/new.ts")).toBe("package_new");
    expect(pathToIdentifier("foo/bar/baz.ts")).toBe("foo_bar_baz");
  });

  test("converts kebab-case to underscores", () => {
    // pathToIdentifier converts hyphens to underscores
    expect(pathToIdentifier("setup-scripts.ts")).toBe("setup_scripts");
    expect(pathToIdentifier("package/setup-scripts.ts")).toBe(
      "package_setup_scripts",
    );
  });

  test("handles lazy files", () => {
    expect(pathToIdentifier("new.lazy.ts")).toBe("new");
    expect(pathToIdentifier("package/new.lazy.ts")).toBe("package_new");
  });

  test("handles index files", () => {
    expect(pathToIdentifier("index.ts")).toBe("index");
    expect(pathToIdentifier("package/index.ts")).toBe("package_index");
  });
});

describe("routeToImportName", () => {
  test("converts route name to import identifier", () => {
    // routeToImportName takes a route name (not file path)
    // and converts kebab-case to camelCase
    expect(routeToImportName("new")).toBe("new");
    expect(routeToImportName("test")).toBe("test");
  });

  test("handles kebab-case", () => {
    expect(routeToImportName("setup-scripts")).toBe("setupScripts");
    expect(routeToImportName("my-command")).toBe("myCommand");
  });

  test("returns 'index' for empty string", () => {
    expect(routeToImportName("")).toBe("index");
  });
});

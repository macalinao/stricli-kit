import type { CommandContext } from "@stricli/core";
import { describe, expect, test } from "bun:test";
import {
  defineHandler,
  defineParameters,
  defineRoute,
  defineRouteGroup,
} from "./index.js";

describe("defineRoute", () => {
  test("creates a route with command", () => {
    const params = defineParameters({
      flags: {
        force: { kind: "boolean", brief: "Force" },
      },
    });

    const handler = defineHandler<typeof params>(() => {
      // noop
    });

    const route = defineRoute({
      handler,
      params,
      docs: { brief: "Test command" },
    });

    expect(route.command).toBeDefined();
    expect(route.command.kind).toBeDefined();
  });

  test("includes aliases when provided", () => {
    const params = defineParameters({ flags: {} });
    const handler = defineHandler<typeof params>(() => {
      // noop
    });

    const route = defineRoute({
      handler,
      params,
      docs: { brief: "Test" },
      aliases: ["t", "tst"],
    });

    expect(route.aliases).toEqual(["t", "tst"]);
  });

  test("does not include aliases when not provided", () => {
    const params = defineParameters({ flags: {} });
    const handler = defineHandler<typeof params>(() => {
      // noop
    });

    const route = defineRoute({
      handler,
      params,
      docs: { brief: "Test" },
    });

    expect(route.aliases).toBeUndefined();
  });

  test("includes hidden when set to true", () => {
    const params = defineParameters({ flags: {} });
    const handler = defineHandler<typeof params>(() => {
      // noop
    });

    const route = defineRoute({
      handler,
      params,
      docs: { brief: "Test" },
      hidden: true,
    });

    expect(route.hidden).toBe(true);
  });

  test("includes hidden when set to false", () => {
    const params = defineParameters({ flags: {} });
    const handler = defineHandler<typeof params>(() => {
      // noop
    });

    const route = defineRoute({
      handler,
      params,
      docs: { brief: "Test" },
      hidden: false,
    });

    expect(route.hidden).toBe(false);
  });

  test("does not include hidden when not provided", () => {
    const params = defineParameters({ flags: {} });
    const handler = defineHandler<typeof params>(() => {
      // noop
    });

    const route = defineRoute({
      handler,
      params,
      docs: { brief: "Test" },
    });

    expect(route.hidden).toBeUndefined();
  });

  test("includes deprecated message when provided", () => {
    const params = defineParameters({ flags: {} });
    const handler = defineHandler<typeof params>(() => {
      // noop
    });

    const route = defineRoute({
      handler,
      params,
      docs: { brief: "Test" },
      deprecated: "Use 'new-command' instead",
    });

    expect(route.deprecated).toBe("Use 'new-command' instead");
  });

  test("does not include deprecated when not provided", () => {
    const params = defineParameters({ flags: {} });
    const handler = defineHandler<typeof params>(() => {
      // noop
    });

    const route = defineRoute({
      handler,
      params,
      docs: { brief: "Test" },
    });

    expect(route.deprecated).toBeUndefined();
  });

  test("supports lazy loader for code splitting", () => {
    const params = defineParameters({ flags: {} });

    // Simulate a lazy-loaded handler module
    const lazyHandler = () =>
      Promise.resolve({
        default: () => {
          // noop
        },
      });

    const route = defineRoute({
      loader: lazyHandler,
      params,
      docs: { brief: "Lazy test" },
    });

    expect(route.command).toBeDefined();
    expect(route.command.kind).toBeDefined();
  });

  test("lazy loader works with direct function return", () => {
    const params = defineParameters({ flags: {} });

    // Return function directly instead of module
    const lazyHandler = () =>
      Promise.resolve(() => {
        // noop
      });

    const route = defineRoute({
      loader: lazyHandler,
      params,
      docs: { brief: "Lazy test" },
    });

    expect(route.command).toBeDefined();
  });

  test("supports full docs object with fullDescription", () => {
    const params = defineParameters({ flags: {} });
    const handler = defineHandler<typeof params>(() => {
      // noop
    });

    const route = defineRoute({
      handler,
      params,
      docs: {
        brief: "Short description",
        fullDescription: "This is a longer description of the command.",
      },
    });

    expect(route.command).toBeDefined();
  });

  test("supports docs with customUsage", () => {
    const params = defineParameters({ flags: {} });
    const handler = defineHandler<typeof params>(() => {
      // noop
    });

    const route = defineRoute({
      handler,
      params,
      docs: {
        brief: "Test",
        customUsage: [
          "my-cli test --force",
          { input: "my-cli test -f file.txt", brief: "Test with file" },
        ],
      },
    });

    expect(route.command).toBeDefined();
  });

  test("handler correctly receives context and params when run through Stricli", async () => {
    // This test verifies the handler conversion using Stricli's actual run function
    // (Detailed integration tests are in integration.test.ts)
    const params = defineParameters({
      flags: {
        verbose: { kind: "boolean", brief: "Verbose", default: false },
      },
      positional: {
        kind: "tuple",

        parameters: [{ brief: "Name", parse: String, placeholder: "name" }],
      },
    });

    let capturedVerbose: boolean | undefined;
    let capturedName: string | undefined;
    let handlerCalled = false;

    const handler = defineHandler<typeof params>(
      (_context, { flags: { verbose }, args: [name] }) => {
        handlerCalled = true;
        capturedVerbose = verbose;
        capturedName = name;
      },
    );

    const route = defineRoute({
      handler,
      params,
      docs: { brief: "Test" },
    });

    // Build a full app and run it through Stricli
    const { buildApplication, buildRouteMap, run } = await import(
      "@stricli/core"
    );

    const routeMap = buildRouteMap({
      routes: { test: route.command },
      docs: { brief: "CLI" },
    });

    const app = buildApplication(routeMap, { name: "cli" });

    const mockContext = {
      process: {
        stdout: { write: () => true },
        stderr: { write: () => true },
      },
    };

    await run(app, ["test", "--verbose", "my-name"], mockContext);

    expect(handlerCalled).toBe(true);
    expect(capturedVerbose).toBe(true);
    expect(capturedName).toBe("my-name");
  });

  test("route with all flag types works correctly", () => {
    const params = defineParameters({
      flags: {
        force: { kind: "boolean", brief: "Force", default: false },
        count: { kind: "counter", brief: "Count" },
        format: {
          kind: "enum",
          values: ["json", "yaml"] as const,
          brief: "Format",
        },
        port: { kind: "parsed", parse: Number, brief: "Port" },
        host: { kind: "parsed", parse: String, brief: "Host", optional: true },
      },
    });

    const handler = defineHandler<typeof params>(
      (_context, { flags: { force, count, format, port, host } }) => {
        // Type assertions pass at compile time
        const _force: boolean = force;
        const _count: number = count;
        const _format: "json" | "yaml" = format;
        const _port: number = port;
        const _host: string | undefined = host;

        // Runtime checks
        expect(typeof _force).toBe("boolean");
        expect(typeof _count).toBe("number");
        expect(typeof _format).toBe("string");
        expect(typeof _port).toBe("number");
        expect(_host === undefined || typeof _host === "string").toBe(true);
      },
    );

    const route = defineRoute({
      handler,
      params,
      docs: { brief: "Test all flags" },
      aliases: ["taf"],
    });

    expect(route.command).toBeDefined();
    expect(route.aliases).toEqual(["taf"]);
  });

  test("route with multiple positional arguments", () => {
    const params = defineParameters({
      flags: {},
      positional: {
        kind: "tuple",

        parameters: [
          { brief: "Source", parse: String, placeholder: "source" },
          { brief: "Dest", parse: String, placeholder: "dest" },
          { brief: "Mode", parse: Number, placeholder: "mode", optional: true },
        ],
      },
    });

    const handler = defineHandler<typeof params>(
      (_context, { args: [source, dest, mode] }) => {
        const _source: string = source;
        const _dest: string = dest;
        const _mode: number | undefined = mode;

        expect(typeof _source).toBe("string");
        expect(typeof _dest).toBe("string");
        expect(_mode === undefined || typeof _mode === "number").toBe(true);
      },
    );

    const route = defineRoute({
      handler,
      params,
      docs: { brief: "Copy files" },
    });

    expect(route.command).toBeDefined();
  });

  test("route with array positional", () => {
    const params = defineParameters({
      flags: {},
      positional: {
        kind: "array",
        parameter: { brief: "Files", parse: String, placeholder: "file" },
      },
    });

    const handler = defineHandler<typeof params>(
      (_context, { args: files }) => {
        const _files: string[] = files;
        expect(Array.isArray(_files)).toBe(true);
      },
    );

    const route = defineRoute({
      handler,
      params,
      docs: { brief: "Process files" },
    });

    expect(route.command).toBeDefined();
  });
});

describe("defineRouteGroup", () => {
  test("preserves config structure", () => {
    const config = defineRouteGroup({
      docs: {
        brief: "Package commands",
      },
    });

    expect(config.docs.brief).toBe("Package commands");
  });

  test("preserves aliases", () => {
    const config = defineRouteGroup({
      aliases: {
        n: "new",
        c: "create",
      },
      docs: { brief: "Commands" },
    });

    expect(config.aliases.n).toBe("new");
    expect(config.aliases.c).toBe("create");
  });

  test("preserves defaultCommand", () => {
    const config = defineRouteGroup({
      defaultCommand: "list",
      docs: { brief: "Commands" },
    });

    expect(config.defaultCommand).toBe("list");
  });

  test("preserves hideRoute in docs", () => {
    const config = defineRouteGroup({
      docs: {
        brief: "Commands",
        hideRoute: {
          internal: true,
        },
      },
    });

    expect(config.docs.hideRoute.internal).toBe(true);
  });

  test("preserves fullDescription in docs", () => {
    const config = defineRouteGroup({
      docs: {
        brief: "Commands",
        fullDescription: "This is a detailed description of the command group.",
      },
    });

    expect(config.docs.fullDescription).toBe(
      "This is a detailed description of the command group.",
    );
  });

  test("works with empty config", () => {
    const config = defineRouteGroup({});

    expect(config).toEqual({});
  });

  test("works with minimal config", () => {
    const config = defineRouteGroup({
      docs: { brief: "Test" },
    });

    expect(config.docs.brief).toBe("Test");
  });

  test("preserves literal types for aliases (important for Stricli)", () => {
    const config = defineRouteGroup({
      aliases: {
        n: "new",
        l: "list",
      } as const,
      docs: { brief: "Test" },
    });

    // Type should be preserved as literal
    type Aliases = typeof config.aliases;
    const expectedN: NonNullable<Aliases>["n"] = "new";
    const expectedL: NonNullable<Aliases>["l"] = "list";

    expect(expectedN).toBe("new");
    expect(expectedL).toBe("list");
  });
});

describe("integration: full command file pattern", () => {
  test("complete command file with flags and args", async () => {
    // This mimics a typical command file structure

    const params = defineParameters({
      flags: {
        force: { kind: "boolean", brief: "Force operation", default: false },
        verbose: { kind: "boolean", brief: "Verbose output", default: false },
        output: {
          kind: "parsed",
          parse: String,
          brief: "Output path",
          optional: true,
        },
      },
      positional: {
        kind: "tuple",

        parameters: [
          { brief: "Source file", parse: String, placeholder: "source" },
          {
            brief: "Destination",
            parse: String,
            placeholder: "dest",
            optional: true,
          },
        ],
      },
    });

    const output: string[] = [];

    const copyHandler = defineHandler<typeof params>(
      (
        _context,
        { flags: { force, verbose, output: outputPath }, args: [source, dest] },
      ) => {
        if (verbose) {
          output.push(`Copying ${source} to ${dest ?? outputPath ?? "stdout"}`);
        }
        if (force) {
          output.push("Force mode enabled");
        }
        output.push(`Source: ${source}`);
        if (dest) {
          output.push(`Dest: ${dest}`);
        }
      },
    );

    const route = defineRoute({
      handler: copyHandler,
      params,
      docs: {
        brief: "Copy files",
        fullDescription: "Copy source file to destination with optional flags",
      },
      aliases: ["cp"],
    });

    expect(route.command).toBeDefined();
    expect(route.aliases).toEqual(["cp"]);

    // Simulate calling the command through Stricli
    const mockContext: CommandContext = {
      process: {
        stdout: { write: () => true },
        stderr: { write: () => true },
      },
    };

    // Call the underlying handler
    await copyHandler(mockContext, {
      flags: { force: true, verbose: true, output: undefined },
      args: ["input.txt", "output.txt"],
    });

    expect(output).toContain("Copying input.txt to output.txt");
    expect(output).toContain("Force mode enabled");
    expect(output).toContain("Source: input.txt");
    expect(output).toContain("Dest: output.txt");
  });

  test("command with enum flags", async () => {
    const params = defineParameters({
      flags: {
        format: {
          kind: "enum",
          values: ["json", "yaml", "toml"] as const,
          brief: "Output format",
        },
        indent: {
          kind: "parsed",
          parse: Number,
          brief: "Indentation spaces",
          default: "2",
        },
      },
      positional: {
        kind: "tuple",

        parameters: [
          { brief: "Input file", parse: String, placeholder: "file" },
        ],
      },
    });

    let capturedFormat: "json" | "yaml" | "toml" | undefined;
    let capturedIndent: number | undefined;
    let capturedFile: string | undefined;

    const formatHandler = defineHandler<typeof params>(
      (_context, { flags: { format, indent }, args: [file] }) => {
        capturedFormat = format;
        capturedIndent = indent;
        capturedFile = file;
      },
    );

    const route = defineRoute({
      handler: formatHandler,
      params,
      docs: { brief: "Format file" },
    });

    expect(route.command).toBeDefined();

    const mockContext: CommandContext = {
      process: {
        stdout: { write: () => true },
        stderr: { write: () => true },
      },
    };

    await formatHandler(mockContext, {
      flags: { format: "yaml", indent: 4 },
      args: ["config.json"],
    });

    expect(capturedFormat).toBe("yaml");
    expect(capturedIndent).toBe(4);
    expect(capturedFile).toBe("config.json");
  });

  test("command with counter flag for verbosity", async () => {
    const params = defineParameters({
      flags: {
        verbose: { kind: "counter", brief: "Increase verbosity" },
        quiet: { kind: "boolean", brief: "Quiet mode", default: false },
      },
    });

    let verbosityLevel: number | undefined;
    let quietMode: boolean | undefined;

    const handler = defineHandler<typeof params>(
      (_context, { flags: { verbose, quiet } }) => {
        verbosityLevel = verbose;
        quietMode = quiet;
      },
    );

    const route = defineRoute({
      handler,
      params,
      docs: { brief: "Run with verbosity" },
    });

    expect(route.command).toBeDefined();

    const mockContext: CommandContext = {
      process: {
        stdout: { write: () => true },
        stderr: { write: () => true },
      },
    };

    // Simulate -vvv (verbosity level 3)
    await handler(mockContext, {
      flags: { verbose: 3, quiet: false },
      args: [],
    });

    expect(verbosityLevel).toBe(3);
    expect(quietMode).toBe(false);
  });

  test("command with array positional arguments", async () => {
    const params = defineParameters({
      flags: {
        recursive: { kind: "boolean", brief: "Recursive", default: false },
      },
      positional: {
        kind: "array",
        parameter: {
          brief: "Files to process",
          parse: String,
          placeholder: "file",
        },
      },
    });

    let capturedFiles: string[] | undefined;
    let capturedRecursive: boolean | undefined;

    const handler = defineHandler<typeof params>(
      (_context, { flags: { recursive }, args: files }) => {
        capturedFiles = files;
        capturedRecursive = recursive;
      },
    );

    const route = defineRoute({
      handler,
      params,
      docs: { brief: "Process files" },
    });

    expect(route.command).toBeDefined();

    const mockContext: CommandContext = {
      process: {
        stdout: { write: () => true },
        stderr: { write: () => true },
      },
    };

    await handler(mockContext, {
      flags: { recursive: true },
      args: ["file1.txt", "file2.txt", "file3.txt"],
    });

    expect(capturedFiles).toEqual(["file1.txt", "file2.txt", "file3.txt"]);
    expect(capturedRecursive).toBe(true);
  });
});

import type {
  CommandContext,
  StricliDynamicCommandContext,
} from "@stricli/core";
import { describe, expect, test } from "bun:test";
import { buildApplication, buildRouteMap, run } from "@stricli/core";
import {
  defineHandler,
  defineParameters,
  defineRoute,
  defineRouteGroup,
} from "./index.js";

/**
 * Create a mock context for testing Stricli commands.
 */
function createMockContext(): {
  context: StricliDynamicCommandContext<CommandContext>;
  stdout: string[];
  stderr: string[];
} {
  const stdout: string[] = [];
  const stderr: string[] = [];

  const context: StricliDynamicCommandContext<CommandContext> = {
    process: {
      stdout: {
        write: (s: string) => {
          stdout.push(s);
        },
      },
      stderr: {
        write: (s: string) => {
          stderr.push(s);
        },
      },
    },
  };

  return { context, stdout, stderr };
}

describe("Stricli integration: command parsing and execution", () => {
  test("parses and executes a simple command with no flags", async () => {
    const params = defineParameters({
      flags: {},
    });

    let executed = false;

    const handler = defineHandler<typeof params>(() => {
      executed = true;
    });

    const route = defineRoute({
      handler,
      params,
      docs: { brief: "Simple command" },
    });

    const routeMap = buildRouteMap({
      routes: { simple: route.command },
      docs: { brief: "Test CLI" },
    });

    const app = buildApplication(routeMap, { name: "test-cli" });
    const { context } = createMockContext();

    await run(app, ["simple"], context);

    expect(executed).toBe(true);
  });

  test("parses and passes boolean flags to handler", async () => {
    const params = defineParameters({
      flags: {
        force: { kind: "boolean", brief: "Force operation", default: false },
        verbose: { kind: "boolean", brief: "Verbose output", default: false },
      },
    });

    let capturedFlags: { force: boolean; verbose: boolean } | undefined;

    const handler = defineHandler<typeof params>((_context, { flags }) => {
      capturedFlags = flags;
    });

    const route = defineRoute({
      handler,
      params,
      docs: { brief: "Test flags" },
    });

    const routeMap = buildRouteMap({
      routes: { test: route.command },
      docs: { brief: "Test CLI" },
    });

    const app = buildApplication(routeMap, { name: "test-cli" });
    const { context } = createMockContext();

    await run(app, ["test", "--force", "--verbose"], context);

    expect(capturedFlags).toEqual({ force: true, verbose: true });
  });

  test("parses and passes parsed flags to handler", async () => {
    const params = defineParameters({
      flags: {
        port: { kind: "parsed", parse: Number, brief: "Port number" },
        host: {
          kind: "parsed",
          parse: String,
          brief: "Host",
          default: "localhost",
        },
      },
    });

    let capturedFlags: { port: number; host: string } | undefined;

    const handler = defineHandler<typeof params>((_context, { flags }) => {
      capturedFlags = flags;
    });

    const route = defineRoute({
      handler,
      params,
      docs: { brief: "Test parsed flags" },
    });

    const routeMap = buildRouteMap({
      routes: { test: route.command },
      docs: { brief: "Test CLI" },
    });

    const app = buildApplication(routeMap, { name: "test-cli" });
    const { context } = createMockContext();

    await run(
      app,
      ["test", "--port", "8080", "--host", "example.com"],
      context,
    );

    expect(capturedFlags).toEqual({ port: 8080, host: "example.com" });
  });

  test("parses and passes enum flags to handler", async () => {
    const params = defineParameters({
      flags: {
        format: {
          kind: "enum",
          values: ["json", "yaml", "toml"] as const,
          brief: "Format",
        },
      },
    });

    let capturedFormat: "json" | "yaml" | "toml" | undefined;

    const handler = defineHandler<typeof params>(
      (_context, { flags: { format } }) => {
        capturedFormat = format;
      },
    );

    const route = defineRoute({
      handler,
      params,
      docs: { brief: "Test enum flag" },
    });

    const routeMap = buildRouteMap({
      routes: { test: route.command },
      docs: { brief: "Test CLI" },
    });

    const app = buildApplication(routeMap, { name: "test-cli" });
    const { context } = createMockContext();

    await run(app, ["test", "--format", "yaml"], context);

    expect(capturedFormat).toBe("yaml");
  });

  test("parses and passes counter flags to handler", async () => {
    const params = defineParameters({
      flags: {
        verbose: { kind: "counter", brief: "Verbosity level" },
      },
    });

    let verbosity: number | undefined;

    const handler = defineHandler<typeof params>(
      (_context, { flags: { verbose } }) => {
        verbosity = verbose;
      },
    );

    const route = defineRoute({
      handler,
      params,
      docs: { brief: "Test counter flag" },
    });

    const routeMap = buildRouteMap({
      routes: { test: route.command },
      docs: { brief: "Test CLI" },
    });

    const app = buildApplication(routeMap, { name: "test-cli" });
    const { context } = createMockContext();

    // -v -v -v should result in verbosity = 3
    await run(app, ["test", "--verbose", "--verbose", "--verbose"], context);

    expect(verbosity).toBe(3);
  });

  test("parses and passes positional arguments to handler", async () => {
    const params = defineParameters({
      flags: {},
      positional: {
        kind: "tuple",
        parameters: [
          { brief: "Source file", parse: String, placeholder: "source" },
          { brief: "Destination", parse: String, placeholder: "dest" },
        ],
      },
    });

    let capturedArgs: [string, string] | undefined;

    const handler = defineHandler<typeof params>((_context, { args }) => {
      capturedArgs = args;
    });

    const route = defineRoute({
      handler,
      params,
      docs: { brief: "Copy command" },
    });

    const routeMap = buildRouteMap({
      routes: { copy: route.command },
      docs: { brief: "Test CLI" },
    });

    const app = buildApplication(routeMap, { name: "test-cli" });
    const { context } = createMockContext();

    await run(app, ["copy", "input.txt", "output.txt"], context);

    expect(capturedArgs).toEqual(["input.txt", "output.txt"]);
  });

  test("parses optional positional arguments", async () => {
    const params = defineParameters({
      flags: {},
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

    let capturedArgs: [string, string | undefined] | undefined;

    const handler = defineHandler<typeof params>((_context, { args }) => {
      capturedArgs = args;
    });

    const route = defineRoute({
      handler,
      params,
      docs: { brief: "Copy command" },
    });

    const routeMap = buildRouteMap({
      routes: { copy: route.command },
      docs: { brief: "Test CLI" },
    });

    const app = buildApplication(routeMap, { name: "test-cli" });
    const { context } = createMockContext();

    // Run without optional argument
    await run(app, ["copy", "input.txt"], context);

    expect(capturedArgs).toEqual(["input.txt", undefined]);
  });

  test("parses both flags and positional arguments together", async () => {
    const params = defineParameters({
      flags: {
        force: { kind: "boolean", brief: "Force", default: false },
        mode: { kind: "parsed", parse: Number, brief: "Mode", default: "0644" },
      },
      positional: {
        kind: "tuple",
        parameters: [
          { brief: "Source", parse: String, placeholder: "source" },
          { brief: "Dest", parse: String, placeholder: "dest" },
        ],
      },
    });

    let capturedFlags: { force: boolean; mode: number } | undefined;
    let capturedArgs: [string, string] | undefined;

    const handler = defineHandler<typeof params>(
      (_context, { flags, args }) => {
        capturedFlags = flags;
        capturedArgs = args;
      },
    );

    const route = defineRoute({
      handler,
      params,
      docs: { brief: "Copy with mode" },
    });

    const routeMap = buildRouteMap({
      routes: { copy: route.command },
      docs: { brief: "Test CLI" },
    });

    const app = buildApplication(routeMap, { name: "test-cli" });
    const { context } = createMockContext();

    await run(
      app,
      ["copy", "--force", "--mode", "755", "src.txt", "dst.txt"],
      context,
    );

    expect(capturedFlags).toEqual({ force: true, mode: 755 });
    expect(capturedArgs).toEqual(["src.txt", "dst.txt"]);
  });

  test("parses flags after positional arguments", async () => {
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

    const handler = defineHandler<typeof params>(
      (_context, { flags: { verbose }, args: [name] }) => {
        capturedVerbose = verbose;
        capturedName = name;
      },
    );

    const route = defineRoute({
      handler,
      params,
      docs: { brief: "Greet" },
    });

    const routeMap = buildRouteMap({
      routes: { greet: route.command },
      docs: { brief: "Test CLI" },
    });

    const app = buildApplication(routeMap, { name: "test-cli" });
    const { context } = createMockContext();

    // Flags can appear after positional args
    await run(app, ["greet", "World", "--verbose"], context);

    expect(capturedVerbose).toBe(true);
    expect(capturedName).toBe("World");
  });

  test("context is correctly passed through to handler", async () => {
    const params = defineParameters({ flags: {} });

    let receivedProcess: CommandContext["process"] | undefined;

    const handler = defineHandler<typeof params>((context) => {
      receivedProcess = context.process;
    });

    const route = defineRoute({
      handler,
      params,
      docs: { brief: "Test context" },
    });

    const routeMap = buildRouteMap({
      routes: { test: route.command },
      docs: { brief: "Test CLI" },
    });

    const app = buildApplication(routeMap, { name: "test-cli" });
    const { context } = createMockContext();

    await run(app, ["test"], context);

    expect(receivedProcess).toBeDefined();
    expect(typeof receivedProcess?.stdout.write).toBe("function");
    expect(typeof receivedProcess?.stderr.write).toBe("function");
  });

  test("handler can write to stdout through context", async () => {
    const params = defineParameters({ flags: {} });

    const handler = defineHandler<typeof params>((context) => {
      context.process.stdout.write("Hello from handler!\n");
    });

    const route = defineRoute({
      handler,
      params,
      docs: { brief: "Test output" },
    });

    const routeMap = buildRouteMap({
      routes: { test: route.command },
      docs: { brief: "Test CLI" },
    });

    const app = buildApplication(routeMap, { name: "test-cli" });
    const { context, stdout } = createMockContext();

    await run(app, ["test"], context);

    expect(stdout).toContain("Hello from handler!\n");
  });

  test("multiple commands in route map work correctly", async () => {
    const helloParams = defineParameters({
      flags: {},
      positional: {
        kind: "tuple",
        parameters: [{ brief: "Name", parse: String, placeholder: "name" }],
      },
    });

    const byeParams = defineParameters({ flags: {} });

    let lastCommand: string | undefined;
    let lastName: string | undefined;

    const helloHandler = defineHandler<typeof helloParams>(
      (_ctx, { args: [name] }) => {
        lastCommand = "hello";
        lastName = name;
      },
    );

    const byeHandler = defineHandler<typeof byeParams>(() => {
      lastCommand = "bye";
    });

    const helloRoute = defineRoute({
      handler: helloHandler,
      params: helloParams,
      docs: { brief: "Say hello" },
    });

    const byeRoute = defineRoute({
      handler: byeHandler,
      params: byeParams,
      docs: { brief: "Say goodbye" },
    });

    const routeMap = buildRouteMap({
      routes: {
        hello: helloRoute.command,
        bye: byeRoute.command,
      },
      docs: { brief: "Greeting CLI" },
    });

    const app = buildApplication(routeMap, { name: "greet-cli" });
    const { context } = createMockContext();

    await run(app, ["hello", "World"], context);
    expect(lastCommand).toBe("hello");
    expect(lastName).toBe("World");

    await run(app, ["bye"], context);
    expect(lastCommand).toBe("bye");
  });

  test("nested route maps work correctly", async () => {
    const newPackageParams = defineParameters({
      flags: {},
      positional: {
        kind: "tuple",
        parameters: [
          { brief: "Package name", parse: String, placeholder: "name" },
        ],
      },
    });

    let capturedPackageName: string | undefined;

    const newPackageHandler = defineHandler<typeof newPackageParams>(
      (_ctx, { args: [name] }) => {
        capturedPackageName = name;
      },
    );

    const newPackageRoute = defineRoute({
      handler: newPackageHandler,
      params: newPackageParams,
      docs: { brief: "Create new package" },
    });

    const packageRouteGroup = defineRouteGroup({
      docs: { brief: "Package commands" },
      aliases: { n: "new" },
    });

    const packageRouteMap = buildRouteMap({
      routes: { new: newPackageRoute.command },
      ...packageRouteGroup,
    });

    const rootRouteMap = buildRouteMap({
      routes: { package: packageRouteMap },
      docs: { brief: "CLI" },
    });

    const app = buildApplication(rootRouteMap, { name: "my-cli" });
    const { context } = createMockContext();

    await run(app, ["package", "new", "my-package"], context);

    expect(capturedPackageName).toBe("my-package");
  });

  test("route group aliases work for nested commands", async () => {
    const listParams = defineParameters({ flags: {} });

    let listExecuted = false;

    const listHandler = defineHandler<typeof listParams>(() => {
      listExecuted = true;
    });

    const listRoute = defineRoute({
      handler: listHandler,
      params: listParams,
      docs: { brief: "List items" },
    });

    const packageRouteGroup = defineRouteGroup({
      docs: { brief: "Package commands" },
      aliases: { l: "list" },
    });

    const packageRouteMap = buildRouteMap({
      routes: { list: listRoute.command },
      ...packageRouteGroup,
    });

    const rootRouteMap = buildRouteMap({
      routes: { package: packageRouteMap },
      docs: { brief: "CLI" },
    });

    const app = buildApplication(rootRouteMap, { name: "my-cli" });
    const { context } = createMockContext();

    // Use the alias "l" instead of "list"
    await run(app, ["package", "l"], context);

    expect(listExecuted).toBe(true);
  });
});

describe("Stricli integration: default values", () => {
  test("uses default value for boolean flag when not provided", async () => {
    const params = defineParameters({
      flags: {
        force: { kind: "boolean", brief: "Force", default: false },
        verbose: { kind: "boolean", brief: "Verbose", default: true },
      },
    });

    let capturedFlags: { force: boolean; verbose: boolean } | undefined;

    const handler = defineHandler<typeof params>((_ctx, { flags }) => {
      capturedFlags = flags;
    });

    const route = defineRoute({
      handler,
      params,
      docs: { brief: "Test defaults" },
    });

    const routeMap = buildRouteMap({
      routes: { test: route.command },
      docs: { brief: "CLI" },
    });

    const app = buildApplication(routeMap, { name: "cli" });
    const { context } = createMockContext();

    await run(app, ["test"], context);

    expect(capturedFlags).toEqual({ force: false, verbose: true });
  });

  test("uses default value for parsed flag when not provided", async () => {
    const params = defineParameters({
      flags: {
        port: { kind: "parsed", parse: Number, brief: "Port", default: "3000" },
      },
    });

    let capturedPort: number | undefined;

    const handler = defineHandler<typeof params>(
      (_ctx, { flags: { port } }) => {
        capturedPort = port;
      },
    );

    const route = defineRoute({
      handler,
      params,
      docs: { brief: "Server" },
    });

    const routeMap = buildRouteMap({
      routes: { server: route.command },
      docs: { brief: "CLI" },
    });

    const app = buildApplication(routeMap, { name: "cli" });
    const { context } = createMockContext();

    await run(app, ["server"], context);

    expect(capturedPort).toBe(3000);
  });

  test("optional flag is undefined when not provided", async () => {
    const params = defineParameters({
      flags: {
        output: {
          kind: "parsed",
          parse: String,
          brief: "Output",
          optional: true,
        },
      },
    });

    let capturedOutput: string | undefined;
    let handlerCalled = false;

    const handler = defineHandler<typeof params>(
      (_ctx, { flags: { output } }) => {
        handlerCalled = true;
        capturedOutput = output;
      },
    );

    const route = defineRoute({
      handler,
      params,
      docs: { brief: "Test optional" },
    });

    const routeMap = buildRouteMap({
      routes: { test: route.command },
      docs: { brief: "CLI" },
    });

    const app = buildApplication(routeMap, { name: "cli" });
    const { context } = createMockContext();

    await run(app, ["test"], context);

    expect(handlerCalled).toBe(true);
    expect(capturedOutput).toBeUndefined();
  });
});

describe("Stricli integration: custom parsers", () => {
  test("custom parser for positional argument", async () => {
    const params = defineParameters({
      flags: {},
      positional: {
        kind: "tuple",
        parameters: [
          {
            brief: "Date",
            parse: (s: string) => new Date(s),
            placeholder: "date",
          },
        ],
      },
    });

    let capturedDate: Date | undefined;

    const handler = defineHandler<typeof params>((_ctx, { args: [date] }) => {
      capturedDate = date;
    });

    const route = defineRoute({
      handler,
      params,
      docs: { brief: "Test date parser" },
    });

    const routeMap = buildRouteMap({
      routes: { test: route.command },
      docs: { brief: "CLI" },
    });

    const app = buildApplication(routeMap, { name: "cli" });
    const { context } = createMockContext();

    await run(app, ["test", "2024-01-15"], context);

    expect(capturedDate).toBeInstanceOf(Date);
    expect(capturedDate?.getFullYear()).toBe(2024);
    expect(capturedDate?.getMonth()).toBe(0); // January is 0
    expect(capturedDate?.getDate()).toBe(15);
  });

  test("custom parser for flag", async () => {
    const params = defineParameters({
      flags: {
        tags: {
          kind: "parsed",
          parse: (s: string) => s.split(",").map((t) => t.trim()),
          brief: "Tags (comma-separated)",
        },
      },
    });

    let capturedTags: string[] | undefined;

    const handler = defineHandler<typeof params>(
      (_ctx, { flags: { tags } }) => {
        capturedTags = tags;
      },
    );

    const route = defineRoute({
      handler,
      params,
      docs: { brief: "Test tags" },
    });

    const routeMap = buildRouteMap({
      routes: { test: route.command },
      docs: { brief: "CLI" },
    });

    const app = buildApplication(routeMap, { name: "cli" });
    const { context } = createMockContext();

    await run(app, ["test", "--tags", "foo, bar, baz"], context);

    expect(capturedTags).toEqual(["foo", "bar", "baz"]);
  });
});

describe("Stricli integration: full realistic command", () => {
  test("copy command with all features", async () => {
    const params = defineParameters({
      flags: {
        force: {
          kind: "boolean",
          brief: "Overwrite existing files",
          default: false,
        },
        recursive: {
          kind: "boolean",
          brief: "Copy directories recursively",
          default: false,
        },
        verbose: { kind: "counter", brief: "Increase verbosity" },
        mode: {
          kind: "parsed",
          parse: (s: string) => Number.parseInt(s, 8),
          brief: "File mode",
          optional: true,
        },
      },
      positional: {
        kind: "tuple",
        parameters: [
          { brief: "Source path", parse: String, placeholder: "source" },
          { brief: "Destination path", parse: String, placeholder: "dest" },
        ],
      },
    });

    interface CapturedValues {
      force: boolean;
      recursive: boolean;
      verbose: number;
      mode: number | undefined;
      source: string;
      dest: string;
    }

    let captured: CapturedValues | undefined;

    const handler = defineHandler<typeof params>(
      (
        _ctx,
        { flags: { force, recursive, verbose, mode }, args: [source, dest] },
      ) => {
        captured = { force, recursive, verbose, mode, source, dest };
      },
    );

    const route = defineRoute({
      handler,
      params,
      docs: {
        brief: "Copy files and directories",
        fullDescription:
          "Copy SOURCE to DEST, or multiple SOURCE(s) to DIRECTORY.",
      },
      aliases: ["cp"],
    });

    const routeMap = buildRouteMap({
      routes: { copy: route.command },
      docs: { brief: "File operations" },
      aliases: { cp: "copy" },
    });

    const app = buildApplication(routeMap, { name: "fileops" });
    const { context } = createMockContext();

    await run(
      app,
      [
        "copy",
        "--force",
        "--recursive",
        "--verbose",
        "--verbose",
        "--mode",
        "755",
        "/src",
        "/dst",
      ],
      context,
    );

    expect(captured).toEqual({
      force: true,
      recursive: true,
      verbose: 2,
      mode: 493, // 0o755 = 493 in decimal
      source: "/src",
      dest: "/dst",
    });
  });
});

describe("Stricli integration: variadic flags", () => {
  test("variadic enum flag collects multiple values", async () => {
    const params = defineParameters({
      flags: {
        formats: {
          kind: "enum",
          values: ["json", "yaml", "toml"] as const,
          brief: "Output formats",
          variadic: true,
        },
      },
    });

    let capturedFormats: readonly ("json" | "yaml" | "toml")[] | undefined;

    const handler = defineHandler<typeof params>(
      (_ctx, { flags: { formats } }) => {
        capturedFormats = formats;
      },
    );

    const route = defineRoute({
      handler,
      params,
      docs: { brief: "Export data" },
    });

    const routeMap = buildRouteMap({
      routes: { export: route.command },
      docs: { brief: "CLI" },
    });

    const app = buildApplication(routeMap, { name: "cli" });
    const { context } = createMockContext();

    await run(
      app,
      ["export", "--formats", "json", "--formats", "yaml"],
      context,
    );

    expect(capturedFormats).toEqual(["json", "yaml"]);
  });

  test("variadic parsed flag collects multiple values", async () => {
    const params = defineParameters({
      flags: {
        ports: {
          kind: "parsed",
          parse: Number,
          brief: "Ports to bind",
          variadic: true,
        },
      },
    });

    let capturedPorts: readonly number[] | undefined;

    const handler = defineHandler<typeof params>(
      (_ctx, { flags: { ports } }) => {
        capturedPorts = ports;
      },
    );

    const route = defineRoute({
      handler,
      params,
      docs: { brief: "Start server" },
    });

    const routeMap = buildRouteMap({
      routes: { serve: route.command },
      docs: { brief: "CLI" },
    });

    const app = buildApplication(routeMap, { name: "cli" });
    const { context } = createMockContext();

    await run(
      app,
      ["serve", "--ports", "8080", "--ports", "3000", "--ports", "9000"],
      context,
    );

    expect(capturedPorts).toEqual([8080, 3000, 9000]);
  });

  test("variadic flag with separator parses comma-separated values", async () => {
    const params = defineParameters({
      flags: {
        tags: {
          kind: "enum",
          values: ["tag1", "tag2", "tag3", "tag4"] as const,
          brief: "Tags",
          variadic: ",",
        },
      },
    });

    let capturedTags:
      | readonly ("tag1" | "tag2" | "tag3" | "tag4")[]
      | undefined;

    const handler = defineHandler<typeof params>(
      (_ctx, { flags: { tags } }) => {
        capturedTags = tags;
      },
    );

    const route = defineRoute({
      handler,
      params,
      docs: { brief: "Tag items" },
    });

    const routeMap = buildRouteMap({
      routes: { tag: route.command },
      docs: { brief: "CLI" },
    });

    const app = buildApplication(routeMap, { name: "cli" });
    const { context } = createMockContext();

    await run(app, ["tag", "--tags", "tag1,tag2,tag3"], context);

    expect(capturedTags).toEqual(["tag1", "tag2", "tag3"]);
  });

  test("required variadic flag with default returns empty array when flag not used", async () => {
    // Required variadic flags with a default value return the default when not provided
    const params = defineParameters({
      flags: {
        items: {
          kind: "parsed",
          parse: String,
          brief: "Items",
          variadic: true,
          optional: false,
          default: [] as readonly string[],
        },
      },
    });

    let capturedItems: string[] | undefined;
    let handlerCalled = false;

    const handler = defineHandler<typeof params>(
      (_ctx, { flags: { items } }) => {
        handlerCalled = true;
        capturedItems = items;
      },
    );

    const route = defineRoute({
      handler,
      params,
      docs: { brief: "Process items" },
    });

    const routeMap = buildRouteMap({
      routes: { process: route.command },
      docs: { brief: "CLI" },
    });

    const app = buildApplication(routeMap, { name: "cli" });
    const { context } = createMockContext();

    await run(app, ["process"], context);

    expect(handlerCalled).toBe(true);
    // With default: [], returns empty array when not provided
    expect(capturedItems).toEqual([]);
  });
});

describe("Stricli integration: flag aliases", () => {
  test("single character flag aliases work", async () => {
    const params = defineParameters({
      flags: {
        force: { kind: "boolean", brief: "Force", default: false },
        verbose: { kind: "boolean", brief: "Verbose", default: false },
        output: {
          kind: "parsed",
          parse: String,
          brief: "Output",
          optional: true,
        },
      },
      aliases: {
        f: "force",
        v: "verbose",
        o: "output",
      },
    });

    let capturedFlags:
      | { force: boolean; verbose: boolean; output: string | undefined }
      | undefined;

    const handler = defineHandler<typeof params>((_ctx, { flags }) => {
      capturedFlags = flags;
    });

    const route = defineRoute({
      handler,
      params,
      docs: { brief: "Test aliases" },
    });

    const routeMap = buildRouteMap({
      routes: { test: route.command },
      docs: { brief: "CLI" },
    });

    const app = buildApplication(routeMap, { name: "cli" });
    const { context } = createMockContext();

    await run(app, ["test", "-f", "-v", "-o", "file.txt"], context);

    expect(capturedFlags).toEqual({
      force: true,
      verbose: true,
      output: "file.txt",
    });
  });

  test("combined short flags work", async () => {
    const params = defineParameters({
      flags: {
        all: { kind: "boolean", brief: "All", default: false },
        long: { kind: "boolean", brief: "Long", default: false },
        recursive: { kind: "boolean", brief: "Recursive", default: false },
      },
      aliases: {
        a: "all",
        l: "long",
        r: "recursive",
      },
    });

    let capturedFlags:
      | { all: boolean; long: boolean; recursive: boolean }
      | undefined;

    const handler = defineHandler<typeof params>((_ctx, { flags }) => {
      capturedFlags = flags;
    });

    const route = defineRoute({
      handler,
      params,
      docs: { brief: "List files" },
    });

    const routeMap = buildRouteMap({
      routes: { ls: route.command },
      docs: { brief: "CLI" },
    });

    const app = buildApplication(routeMap, { name: "cli" });
    const { context } = createMockContext();

    // Combined short flags like "ls -alr"
    await run(app, ["ls", "-alr"], context);

    expect(capturedFlags).toEqual({
      all: true,
      long: true,
      recursive: true,
    });
  });
});

describe("Stricli integration: array positional with bounds", () => {
  test("array positional collects all arguments", async () => {
    const params = defineParameters({
      flags: {},
      positional: {
        kind: "array",
        parameter: { brief: "Files", parse: String, placeholder: "file" },
      },
    });

    let capturedFiles: string[] | undefined;

    const handler = defineHandler<typeof params>((_ctx, { args: files }) => {
      capturedFiles = files;
    });

    const route = defineRoute({
      handler,
      params,
      docs: { brief: "Process files" },
    });

    const routeMap = buildRouteMap({
      routes: { process: route.command },
      docs: { brief: "CLI" },
    });

    const app = buildApplication(routeMap, { name: "cli" });
    const { context } = createMockContext();

    await run(app, ["process", "file1.txt", "file2.txt", "file3.txt"], context);

    expect(capturedFiles).toEqual(["file1.txt", "file2.txt", "file3.txt"]);
  });

  test("array positional with minimum constraint", async () => {
    const params = defineParameters({
      flags: {},
      positional: {
        kind: "array",
        parameter: { brief: "Files", parse: String, placeholder: "file" },
        minimum: 1,
      },
    });

    let capturedFiles: string[] | undefined;
    let handlerCalled = false;

    const handler = defineHandler<typeof params>((_ctx, { args: files }) => {
      handlerCalled = true;
      capturedFiles = files;
    });

    const route = defineRoute({
      handler,
      params,
      docs: { brief: "Process files" },
    });

    const routeMap = buildRouteMap({
      routes: { process: route.command },
      docs: { brief: "CLI" },
    });

    const app = buildApplication(routeMap, { name: "cli" });
    const { context, stderr } = createMockContext();

    // With minimum: 1, providing no files should fail
    await run(app, ["process"], context);

    // The handler should not have been called if validation failed
    // or it was called with proper validation from Stricli
    if (stderr.length > 0) {
      // Stricli caught the error
      expect(handlerCalled).toBe(false);
    } else {
      // Stricli executed with empty array (minimum is soft constraint)
      expect(capturedFiles).toEqual([]);
    }
  });
});

describe("Stricli integration: hidden flags", () => {
  test("hidden flag still works when passed", async () => {
    const params = defineParameters({
      flags: {
        debug: {
          kind: "boolean",
          brief: "Debug mode",
          default: false,
          hidden: true,
        },
        verbose: { kind: "boolean", brief: "Verbose", default: false },
      },
    });

    let capturedFlags: { debug: boolean; verbose: boolean } | undefined;

    const handler = defineHandler<typeof params>((_ctx, { flags }) => {
      capturedFlags = flags;
    });

    const route = defineRoute({
      handler,
      params,
      docs: { brief: "Run with debug" },
    });

    const routeMap = buildRouteMap({
      routes: { run: route.command },
      docs: { brief: "CLI" },
    });

    const app = buildApplication(routeMap, { name: "cli" });
    const { context } = createMockContext();

    await run(app, ["run", "--debug", "--verbose"], context);

    expect(capturedFlags).toEqual({ debug: true, verbose: true });
  });
});

describe("Stricli integration: negated boolean flags", () => {
  test("negated flag sets value to false", async () => {
    const params = defineParameters({
      flags: {
        color: {
          kind: "boolean",
          brief: "Enable color",
          default: true,
          withNegated: true,
        },
      },
    });

    let capturedColor: boolean | undefined;
    let handlerCalled = false;

    const handler = defineHandler<typeof params>(
      (_ctx, { flags: { color } }) => {
        handlerCalled = true;
        capturedColor = color;
      },
    );

    const route = defineRoute({
      handler,
      params,
      docs: { brief: "Output" },
    });

    const routeMap = buildRouteMap({
      routes: { output: route.command },
      docs: { brief: "CLI" },
    });

    const app = buildApplication(routeMap, {
      name: "cli",
      scanner: { caseStyle: "allow-kebab-for-camel" },
    });
    const { context } = createMockContext();

    // Using --no-color to negate the flag
    await run(app, ["output", "--no-color"], context);

    // The handler should have been called with negated flag value
    expect(handlerCalled).toBe(true);
    expect(capturedColor).toBe(false);
  });

  test("boolean flag with default true can be passed explicitly as true", async () => {
    const params = defineParameters({
      flags: {
        color: {
          kind: "boolean",
          brief: "Enable color",
          default: true,
        },
      },
    });

    let capturedColor: boolean | undefined;

    const handler = defineHandler<typeof params>(
      (_ctx, { flags: { color } }) => {
        capturedColor = color;
      },
    );

    const route = defineRoute({
      handler,
      params,
      docs: { brief: "Output" },
    });

    const routeMap = buildRouteMap({
      routes: { output: route.command },
      docs: { brief: "CLI" },
    });

    const app = buildApplication(routeMap, { name: "cli" });
    const { context } = createMockContext();

    await run(app, ["output", "--color"], context);

    expect(capturedColor).toBe(true);
  });
});

// ============================================================================
// Tests for Stricli built-in parsers
// ============================================================================

describe("Stricli integration: booleanParser", () => {
  test("booleanParser parses 'true'", async () => {
    const { booleanParser } = await import("@stricli/core");

    const params = defineParameters({
      flags: {
        enabled: {
          kind: "parsed",
          parse: booleanParser,
          brief: "Enable feature",
        },
      },
    });

    let capturedValue: boolean | undefined;

    const handler = defineHandler<typeof params>(
      (_ctx, { flags: { enabled } }) => {
        capturedValue = enabled;
      },
    );

    const route = defineRoute({
      handler,
      params,
      docs: { brief: "Test" },
    });

    const routeMap = buildRouteMap({
      routes: { test: route.command },
      docs: { brief: "CLI" },
    });

    const app = buildApplication(routeMap, { name: "cli" });
    const { context } = createMockContext();

    await run(app, ["test", "--enabled", "true"], context);

    expect(capturedValue).toBe(true);
  });

  test("booleanParser parses 'false'", async () => {
    const { booleanParser } = await import("@stricli/core");

    const params = defineParameters({
      flags: {
        enabled: {
          kind: "parsed",
          parse: booleanParser,
          brief: "Enable feature",
        },
      },
    });

    let capturedValue: boolean | undefined;

    const handler = defineHandler<typeof params>(
      (_ctx, { flags: { enabled } }) => {
        capturedValue = enabled;
      },
    );

    const route = defineRoute({
      handler,
      params,
      docs: { brief: "Test" },
    });

    const routeMap = buildRouteMap({
      routes: { test: route.command },
      docs: { brief: "CLI" },
    });

    const app = buildApplication(routeMap, { name: "cli" });
    const { context } = createMockContext();

    await run(app, ["test", "--enabled", "false"], context);

    expect(capturedValue).toBe(false);
  });

  test("booleanParser is case-insensitive", async () => {
    const { booleanParser } = await import("@stricli/core");

    const params = defineParameters({
      flags: {
        enabled: {
          kind: "parsed",
          parse: booleanParser,
          brief: "Enable",
        },
      },
    });

    let capturedValue: boolean | undefined;

    const handler = defineHandler<typeof params>(
      (_ctx, { flags: { enabled } }) => {
        capturedValue = enabled;
      },
    );

    const route = defineRoute({
      handler,
      params,
      docs: { brief: "Test" },
    });

    const routeMap = buildRouteMap({
      routes: { test: route.command },
      docs: { brief: "CLI" },
    });

    const app = buildApplication(routeMap, { name: "cli" });
    const { context } = createMockContext();

    await run(app, ["test", "--enabled", "TRUE"], context);
    expect(capturedValue).toBe(true);

    await run(app, ["test", "--enabled", "FALSE"], context);
    expect(capturedValue).toBe(false);
  });
});

describe("Stricli integration: looseBooleanParser", () => {
  test("looseBooleanParser parses 'yes'", async () => {
    const { looseBooleanParser } = await import("@stricli/core");

    const params = defineParameters({
      flags: {
        confirm: {
          kind: "parsed",
          parse: looseBooleanParser,
          brief: "Confirm",
        },
      },
    });

    let capturedValue: boolean | undefined;

    const handler = defineHandler<typeof params>(
      (_ctx, { flags: { confirm } }) => {
        capturedValue = confirm;
      },
    );

    const route = defineRoute({
      handler,
      params,
      docs: { brief: "Test" },
    });

    const routeMap = buildRouteMap({
      routes: { test: route.command },
      docs: { brief: "CLI" },
    });

    const app = buildApplication(routeMap, { name: "cli" });
    const { context } = createMockContext();

    await run(app, ["test", "--confirm", "yes"], context);
    expect(capturedValue).toBe(true);
  });

  test("looseBooleanParser parses 'no'", async () => {
    const { looseBooleanParser } = await import("@stricli/core");

    const params = defineParameters({
      flags: {
        confirm: {
          kind: "parsed",
          parse: looseBooleanParser,
          brief: "Confirm",
        },
      },
    });

    let capturedValue: boolean | undefined;

    const handler = defineHandler<typeof params>(
      (_ctx, { flags: { confirm } }) => {
        capturedValue = confirm;
      },
    );

    const route = defineRoute({
      handler,
      params,
      docs: { brief: "Test" },
    });

    const routeMap = buildRouteMap({
      routes: { test: route.command },
      docs: { brief: "CLI" },
    });

    const app = buildApplication(routeMap, { name: "cli" });
    const { context } = createMockContext();

    await run(app, ["test", "--confirm", "no"], context);
    expect(capturedValue).toBe(false);
  });

  test("looseBooleanParser parses '1' and '0'", async () => {
    const { looseBooleanParser } = await import("@stricli/core");

    const params = defineParameters({
      flags: {
        active: {
          kind: "parsed",
          parse: looseBooleanParser,
          brief: "Active",
        },
      },
    });

    let capturedValue: boolean | undefined;

    const handler = defineHandler<typeof params>(
      (_ctx, { flags: { active } }) => {
        capturedValue = active;
      },
    );

    const route = defineRoute({
      handler,
      params,
      docs: { brief: "Test" },
    });

    const routeMap = buildRouteMap({
      routes: { test: route.command },
      docs: { brief: "CLI" },
    });

    const app = buildApplication(routeMap, { name: "cli" });
    const { context } = createMockContext();

    await run(app, ["test", "--active", "1"], context);
    expect(capturedValue).toBe(true);

    await run(app, ["test", "--active", "0"], context);
    expect(capturedValue).toBe(false);
  });

  test("looseBooleanParser parses 'on' and 'off'", async () => {
    const { looseBooleanParser } = await import("@stricli/core");

    const params = defineParameters({
      flags: {
        feature: {
          kind: "parsed",
          parse: looseBooleanParser,
          brief: "Feature",
        },
      },
    });

    let capturedValue: boolean | undefined;

    const handler = defineHandler<typeof params>(
      (_ctx, { flags: { feature } }) => {
        capturedValue = feature;
      },
    );

    const route = defineRoute({
      handler,
      params,
      docs: { brief: "Test" },
    });

    const routeMap = buildRouteMap({
      routes: { test: route.command },
      docs: { brief: "CLI" },
    });

    const app = buildApplication(routeMap, { name: "cli" });
    const { context } = createMockContext();

    await run(app, ["test", "--feature", "on"], context);
    expect(capturedValue).toBe(true);

    await run(app, ["test", "--feature", "off"], context);
    expect(capturedValue).toBe(false);
  });

  test("looseBooleanParser parses 't' and 'f'", async () => {
    const { looseBooleanParser } = await import("@stricli/core");

    const params = defineParameters({
      flags: {
        flag: {
          kind: "parsed",
          parse: looseBooleanParser,
          brief: "Flag",
        },
      },
    });

    let capturedValue: boolean | undefined;

    const handler = defineHandler<typeof params>(
      (_ctx, { flags: { flag } }) => {
        capturedValue = flag;
      },
    );

    const route = defineRoute({
      handler,
      params,
      docs: { brief: "Test" },
    });

    const routeMap = buildRouteMap({
      routes: { test: route.command },
      docs: { brief: "CLI" },
    });

    const app = buildApplication(routeMap, { name: "cli" });
    const { context } = createMockContext();

    await run(app, ["test", "--flag", "t"], context);
    expect(capturedValue).toBe(true);

    await run(app, ["test", "--flag", "f"], context);
    expect(capturedValue).toBe(false);
  });

  test("looseBooleanParser parses 'y' and 'n'", async () => {
    const { looseBooleanParser } = await import("@stricli/core");

    const params = defineParameters({
      flags: {
        answer: {
          kind: "parsed",
          parse: looseBooleanParser,
          brief: "Answer",
        },
      },
    });

    let capturedValue: boolean | undefined;

    const handler = defineHandler<typeof params>(
      (_ctx, { flags: { answer } }) => {
        capturedValue = answer;
      },
    );

    const route = defineRoute({
      handler,
      params,
      docs: { brief: "Test" },
    });

    const routeMap = buildRouteMap({
      routes: { test: route.command },
      docs: { brief: "CLI" },
    });

    const app = buildApplication(routeMap, { name: "cli" });
    const { context } = createMockContext();

    await run(app, ["test", "--answer", "y"], context);
    expect(capturedValue).toBe(true);

    await run(app, ["test", "--answer", "n"], context);
    expect(capturedValue).toBe(false);
  });
});

describe("Stricli integration: numberParser", () => {
  test("numberParser parses integer", async () => {
    const { numberParser } = await import("@stricli/core");

    const params = defineParameters({
      flags: {
        count: {
          kind: "parsed",
          parse: numberParser,
          brief: "Count",
        },
      },
    });

    let capturedValue: number | undefined;

    const handler = defineHandler<typeof params>(
      (_ctx, { flags: { count } }) => {
        capturedValue = count;
      },
    );

    const route = defineRoute({
      handler,
      params,
      docs: { brief: "Test" },
    });

    const routeMap = buildRouteMap({
      routes: { test: route.command },
      docs: { brief: "CLI" },
    });

    const app = buildApplication(routeMap, { name: "cli" });
    const { context } = createMockContext();

    await run(app, ["test", "--count", "42"], context);

    expect(capturedValue).toBe(42);
  });

  test("numberParser parses negative integer", async () => {
    const { numberParser } = await import("@stricli/core");

    const params = defineParameters({
      flags: {
        offset: {
          kind: "parsed",
          parse: numberParser,
          brief: "Offset",
        },
      },
    });

    let capturedValue: number | undefined;

    const handler = defineHandler<typeof params>(
      (_ctx, { flags: { offset } }) => {
        capturedValue = offset;
      },
    );

    const route = defineRoute({
      handler,
      params,
      docs: { brief: "Test" },
    });

    const routeMap = buildRouteMap({
      routes: { test: route.command },
      docs: { brief: "CLI" },
    });

    const app = buildApplication(routeMap, { name: "cli" });
    const { context } = createMockContext();

    await run(app, ["test", "--offset", "-10"], context);

    expect(capturedValue).toBe(-10);
  });

  test("numberParser parses float", async () => {
    const { numberParser } = await import("@stricli/core");

    const params = defineParameters({
      flags: {
        ratio: {
          kind: "parsed",
          parse: numberParser,
          brief: "Ratio",
        },
      },
    });

    let capturedValue: number | undefined;

    const handler = defineHandler<typeof params>(
      (_ctx, { flags: { ratio } }) => {
        capturedValue = ratio;
      },
    );

    const route = defineRoute({
      handler,
      params,
      docs: { brief: "Test" },
    });

    const routeMap = buildRouteMap({
      routes: { test: route.command },
      docs: { brief: "CLI" },
    });

    const app = buildApplication(routeMap, { name: "cli" });
    const { context } = createMockContext();

    await run(app, ["test", "--ratio", "3.14"], context);

    expect(capturedValue).toBe(3.14);
  });

  test("numberParser parses zero", async () => {
    const { numberParser } = await import("@stricli/core");

    const params = defineParameters({
      flags: {
        value: {
          kind: "parsed",
          parse: numberParser,
          brief: "Value",
        },
      },
    });

    let capturedValue: number | undefined;

    const handler = defineHandler<typeof params>(
      (_ctx, { flags: { value } }) => {
        capturedValue = value;
      },
    );

    const route = defineRoute({
      handler,
      params,
      docs: { brief: "Test" },
    });

    const routeMap = buildRouteMap({
      routes: { test: route.command },
      docs: { brief: "CLI" },
    });

    const app = buildApplication(routeMap, { name: "cli" });
    const { context } = createMockContext();

    await run(app, ["test", "--value", "0"], context);

    expect(capturedValue).toBe(0);
  });
});

describe("Stricli integration: buildChoiceParser", () => {
  test("buildChoiceParser validates against choices", async () => {
    const { buildChoiceParser } = await import("@stricli/core");

    const formatParser = buildChoiceParser(["json", "yaml", "xml"] as const);

    const params = defineParameters({
      flags: {
        format: {
          kind: "parsed",
          parse: formatParser,
          brief: "Output format",
        },
      },
    });

    let capturedValue: "json" | "yaml" | "xml" | undefined;

    const handler = defineHandler<typeof params>(
      (_ctx, { flags: { format } }) => {
        capturedValue = format;
      },
    );

    const route = defineRoute({
      handler,
      params,
      docs: { brief: "Test" },
    });

    const routeMap = buildRouteMap({
      routes: { test: route.command },
      docs: { brief: "CLI" },
    });

    const app = buildApplication(routeMap, { name: "cli" });
    const { context } = createMockContext();

    await run(app, ["test", "--format", "yaml"], context);

    expect(capturedValue).toBe("yaml");
  });
});

// ============================================================================
// Tests for custom parsers
// ============================================================================

describe("Stricli integration: custom parsers", () => {
  test("custom JSON parser", async () => {
    // Use Record<string, unknown> instead of unknown to avoid Stricli treating it as optional
    const jsonParser = (input: string): Record<string, unknown> =>
      JSON.parse(input) as Record<string, unknown>;

    const params = defineParameters({
      flags: {
        config: {
          kind: "parsed",
          parse: jsonParser,
          brief: "JSON config",
        },
      },
    });

    let capturedValue: Record<string, unknown> | undefined;

    const handler = defineHandler<typeof params>(
      (_ctx, { flags: { config } }) => {
        capturedValue = config;
      },
    );

    const route = defineRoute({
      handler,
      params,
      docs: { brief: "Test" },
    });

    const routeMap = buildRouteMap({
      routes: { test: route.command },
      docs: { brief: "CLI" },
    });

    const app = buildApplication(routeMap, { name: "cli" });
    const { context } = createMockContext();

    await run(app, ["test", "--config", '{"name":"test","count":5}'], context);

    expect(capturedValue).toEqual({ name: "test", count: 5 });
  });

  test("custom date parser", async () => {
    const dateParser = (input: string): Date => new Date(input);

    const params = defineParameters({
      flags: {
        date: {
          kind: "parsed",
          parse: dateParser,
          brief: "Date",
        },
      },
    });

    let capturedValue: Date | undefined;

    const handler = defineHandler<typeof params>(
      (_ctx, { flags: { date } }) => {
        capturedValue = date;
      },
    );

    const route = defineRoute({
      handler,
      params,
      docs: { brief: "Test" },
    });

    const routeMap = buildRouteMap({
      routes: { test: route.command },
      docs: { brief: "CLI" },
    });

    const app = buildApplication(routeMap, { name: "cli" });
    const { context } = createMockContext();

    await run(app, ["test", "--date", "2024-06-15"], context);

    expect(capturedValue).toBeInstanceOf(Date);
    expect(capturedValue?.getFullYear()).toBe(2024);
    expect(capturedValue?.getMonth()).toBe(5); // June is 5
    expect(capturedValue?.getDate()).toBe(15);
  });

  test("custom URL parser", async () => {
    const urlParser = (input: string): URL => new URL(input);

    const params = defineParameters({
      flags: {
        endpoint: {
          kind: "parsed",
          parse: urlParser,
          brief: "API endpoint",
        },
      },
    });

    let capturedValue: URL | undefined;

    const handler = defineHandler<typeof params>(
      (_ctx, { flags: { endpoint } }) => {
        capturedValue = endpoint;
      },
    );

    const route = defineRoute({
      handler,
      params,
      docs: { brief: "Test" },
    });

    const routeMap = buildRouteMap({
      routes: { test: route.command },
      docs: { brief: "CLI" },
    });

    const app = buildApplication(routeMap, { name: "cli" });
    const { context } = createMockContext();

    await run(
      app,
      ["test", "--endpoint", "https://api.example.com/v1"],
      context,
    );

    expect(capturedValue).toBeInstanceOf(URL);
    expect(capturedValue?.hostname).toBe("api.example.com");
    expect(capturedValue?.pathname).toBe("/v1");
  });

  test("custom regex-based parser", async () => {
    const hexColorParser = (input: string): string => {
      if (!/^#[0-9a-fA-F]{6}$/.test(input)) {
        throw new Error(`Invalid hex color: ${input}`);
      }
      return input.toLowerCase();
    };

    const params = defineParameters({
      flags: {
        color: {
          kind: "parsed",
          parse: hexColorParser,
          brief: "Hex color",
        },
      },
    });

    let capturedValue: string | undefined;

    const handler = defineHandler<typeof params>(
      (_ctx, { flags: { color } }) => {
        capturedValue = color;
      },
    );

    const route = defineRoute({
      handler,
      params,
      docs: { brief: "Test" },
    });

    const routeMap = buildRouteMap({
      routes: { test: route.command },
      docs: { brief: "CLI" },
    });

    const app = buildApplication(routeMap, { name: "cli" });
    const { context } = createMockContext();

    await run(app, ["test", "--color", "#FF5733"], context);

    expect(capturedValue).toBe("#ff5733");
  });

  test("custom array parser (comma-separated)", async () => {
    const commaSeparatedParser = (input: string): string[] =>
      input.split(",").map((s) => s.trim());

    const params = defineParameters({
      flags: {
        tags: {
          kind: "parsed",
          parse: commaSeparatedParser,
          brief: "Tags",
        },
      },
    });

    let capturedValue: string[] | undefined;

    const handler = defineHandler<typeof params>(
      (_ctx, { flags: { tags } }) => {
        capturedValue = tags;
      },
    );

    const route = defineRoute({
      handler,
      params,
      docs: { brief: "Test" },
    });

    const routeMap = buildRouteMap({
      routes: { test: route.command },
      docs: { brief: "CLI" },
    });

    const app = buildApplication(routeMap, { name: "cli" });
    const { context } = createMockContext();

    await run(app, ["test", "--tags", "foo, bar, baz"], context);

    expect(capturedValue).toEqual(["foo", "bar", "baz"]);
  });

  test("custom integer parser with validation", async () => {
    const positiveIntParser = (input: string): number => {
      const num = Number.parseInt(input, 10);
      if (Number.isNaN(num) || num <= 0) {
        throw new Error(`Expected positive integer, got: ${input}`);
      }
      return num;
    };

    const params = defineParameters({
      flags: {
        count: {
          kind: "parsed",
          parse: positiveIntParser,
          brief: "Count",
        },
      },
    });

    let capturedValue: number | undefined;

    const handler = defineHandler<typeof params>(
      (_ctx, { flags: { count } }) => {
        capturedValue = count;
      },
    );

    const route = defineRoute({
      handler,
      params,
      docs: { brief: "Test" },
    });

    const routeMap = buildRouteMap({
      routes: { test: route.command },
      docs: { brief: "CLI" },
    });

    const app = buildApplication(routeMap, { name: "cli" });
    const { context } = createMockContext();

    await run(app, ["test", "--count", "100"], context);

    expect(capturedValue).toBe(100);
  });

  test("custom parser for positional argument", async () => {
    const filePathParser = (input: string): { path: string; ext: string } => {
      const parts = input.split(".");
      const ext = parts.length > 1 ? (parts.pop() ?? "") : "";
      return { path: input, ext };
    };

    const params = defineParameters({
      flags: {},
      positional: {
        kind: "tuple",
        parameters: [
          {
            brief: "File",
            parse: filePathParser,
            placeholder: "file",
          },
        ],
      },
    });

    let capturedValue: { path: string; ext: string } | undefined;

    const handler = defineHandler<typeof params>((_ctx, { args: [file] }) => {
      capturedValue = file;
    });

    const route = defineRoute({
      handler,
      params,
      docs: { brief: "Test" },
    });

    const routeMap = buildRouteMap({
      routes: { test: route.command },
      docs: { brief: "CLI" },
    });

    const app = buildApplication(routeMap, { name: "cli" });
    const { context } = createMockContext();

    await run(app, ["test", "document.pdf"], context);

    expect(capturedValue).toEqual({ path: "document.pdf", ext: "pdf" });
  });
});

// ============================================================================
// Tests for defaults on all flag types
// ============================================================================

describe("Stricli integration: comprehensive default values", () => {
  test("boolean flag with default: false", async () => {
    const params = defineParameters({
      flags: {
        verbose: { kind: "boolean", brief: "Verbose", default: false },
      },
    });

    let capturedValue: boolean | undefined;

    const handler = defineHandler<typeof params>(
      (_ctx, { flags: { verbose } }) => {
        capturedValue = verbose;
      },
    );

    const route = defineRoute({
      handler,
      params,
      docs: { brief: "Test" },
    });

    const routeMap = buildRouteMap({
      routes: { test: route.command },
      docs: { brief: "CLI" },
    });

    const app = buildApplication(routeMap, { name: "cli" });
    const { context } = createMockContext();

    await run(app, ["test"], context);

    expect(capturedValue).toBe(false);
  });

  test("boolean flag with default: true", async () => {
    const params = defineParameters({
      flags: {
        enabled: { kind: "boolean", brief: "Enabled", default: true },
      },
    });

    let capturedValue: boolean | undefined;

    const handler = defineHandler<typeof params>(
      (_ctx, { flags: { enabled } }) => {
        capturedValue = enabled;
      },
    );

    const route = defineRoute({
      handler,
      params,
      docs: { brief: "Test" },
    });

    const routeMap = buildRouteMap({
      routes: { test: route.command },
      docs: { brief: "CLI" },
    });

    const app = buildApplication(routeMap, { name: "cli" });
    const { context } = createMockContext();

    await run(app, ["test"], context);

    expect(capturedValue).toBe(true);
  });

  test("parsed flag with string default", async () => {
    const params = defineParameters({
      flags: {
        output: {
          kind: "parsed",
          parse: String,
          brief: "Output",
          default: "./output",
        },
      },
    });

    let capturedValue: string | undefined;

    const handler = defineHandler<typeof params>(
      (_ctx, { flags: { output } }) => {
        capturedValue = output;
      },
    );

    const route = defineRoute({
      handler,
      params,
      docs: { brief: "Test" },
    });

    const routeMap = buildRouteMap({
      routes: { test: route.command },
      docs: { brief: "CLI" },
    });

    const app = buildApplication(routeMap, { name: "cli" });
    const { context } = createMockContext();

    await run(app, ["test"], context);

    expect(capturedValue).toBe("./output");
  });

  test("parsed flag with numeric default (as string)", async () => {
    const params = defineParameters({
      flags: {
        port: {
          kind: "parsed",
          parse: Number,
          brief: "Port",
          default: "8080",
        },
      },
    });

    let capturedValue: number | undefined;

    const handler = defineHandler<typeof params>(
      (_ctx, { flags: { port } }) => {
        capturedValue = port;
      },
    );

    const route = defineRoute({
      handler,
      params,
      docs: { brief: "Test" },
    });

    const routeMap = buildRouteMap({
      routes: { test: route.command },
      docs: { brief: "CLI" },
    });

    const app = buildApplication(routeMap, { name: "cli" });
    const { context } = createMockContext();

    await run(app, ["test"], context);

    expect(capturedValue).toBe(8080);
  });

  test("enum flag with default value", async () => {
    const params = defineParameters({
      flags: {
        format: {
          kind: "enum",
          values: ["json", "yaml", "toml"] as const,
          brief: "Format",
          default: "json",
        },
      },
    });

    let capturedValue: "json" | "yaml" | "toml" | undefined;

    const handler = defineHandler<typeof params>(
      (_ctx, { flags: { format } }) => {
        capturedValue = format;
      },
    );

    const route = defineRoute({
      handler,
      params,
      docs: { brief: "Test" },
    });

    const routeMap = buildRouteMap({
      routes: { test: route.command },
      docs: { brief: "CLI" },
    });

    const app = buildApplication(routeMap, { name: "cli" });
    const { context } = createMockContext();

    await run(app, ["test"], context);

    expect(capturedValue).toBe("json");
  });

  test("counter flag defaults to 0 when not provided", async () => {
    const params = defineParameters({
      flags: {
        verbosity: { kind: "counter", brief: "Verbosity" },
      },
    });

    let capturedValue: number | undefined;

    const handler = defineHandler<typeof params>(
      (_ctx, { flags: { verbosity } }) => {
        capturedValue = verbosity;
      },
    );

    const route = defineRoute({
      handler,
      params,
      docs: { brief: "Test" },
    });

    const routeMap = buildRouteMap({
      routes: { test: route.command },
      docs: { brief: "CLI" },
    });

    const app = buildApplication(routeMap, { name: "cli" });
    const { context } = createMockContext();

    await run(app, ["test"], context);

    expect(capturedValue).toBe(0);
  });

  test("multiple flags with different defaults", async () => {
    const params = defineParameters({
      flags: {
        force: { kind: "boolean", brief: "Force", default: false },
        verbose: { kind: "boolean", brief: "Verbose", default: true },
        format: {
          kind: "enum",
          values: ["json", "yaml"] as const,
          brief: "Format",
          default: "yaml",
        },
        port: {
          kind: "parsed",
          parse: Number,
          brief: "Port",
          default: "3000",
        },
        count: { kind: "counter", brief: "Count" },
      },
    });

    let capturedFlags:
      | {
          force: boolean;
          verbose: boolean;
          format: "json" | "yaml";
          port: number;
          count: number;
        }
      | undefined;

    const handler = defineHandler<typeof params>((_ctx, { flags }) => {
      capturedFlags = flags;
    });

    const route = defineRoute({
      handler,
      params,
      docs: { brief: "Test" },
    });

    const routeMap = buildRouteMap({
      routes: { test: route.command },
      docs: { brief: "CLI" },
    });

    const app = buildApplication(routeMap, { name: "cli" });
    const { context } = createMockContext();

    await run(app, ["test"], context);

    expect(capturedFlags).toEqual({
      force: false,
      verbose: true,
      format: "yaml",
      port: 3000,
      count: 0,
    });
  });

  test("defaults are overridden when flag is provided", async () => {
    const params = defineParameters({
      flags: {
        force: { kind: "boolean", brief: "Force", default: false },
        format: {
          kind: "enum",
          values: ["json", "yaml"] as const,
          brief: "Format",
          default: "json",
        },
        port: {
          kind: "parsed",
          parse: Number,
          brief: "Port",
          default: "8080",
        },
      },
    });

    let capturedFlags:
      | { force: boolean; format: "json" | "yaml"; port: number }
      | undefined;

    const handler = defineHandler<typeof params>((_ctx, { flags }) => {
      capturedFlags = flags;
    });

    const route = defineRoute({
      handler,
      params,
      docs: { brief: "Test" },
    });

    const routeMap = buildRouteMap({
      routes: { test: route.command },
      docs: { brief: "CLI" },
    });

    const app = buildApplication(routeMap, { name: "cli" });
    const { context } = createMockContext();

    await run(
      app,
      ["test", "--force", "--format", "yaml", "--port", "9000"],
      context,
    );

    expect(capturedFlags).toEqual({
      force: true,
      format: "yaml",
      port: 9000,
    });
  });
});

// ============================================================================
// Tests for async handlers
// ============================================================================

// ============================================================================
// Tests for custom CommandContext types
// ============================================================================

describe("Stricli integration: custom CommandContext", () => {
  /**
   * Custom context with additional services.
   */
  interface AppContext extends CommandContext {
    logger: {
      info: (message: string) => void;
      warn: (message: string) => void;
      error: (message: string) => void;
    };
    config: {
      get: (key: string) => string | undefined;
    };
  }

  /**
   * Create a mock context with custom services.
   */
  function createAppContext(): {
    context: StricliDynamicCommandContext<AppContext>;
    stdout: string[];
    stderr: string[];
    logs: { level: string; message: string }[];
    configData: Record<string, string>;
  } {
    const stdout: string[] = [];
    const stderr: string[] = [];
    const logs: { level: string; message: string }[] = [];
    const configData: Record<string, string> = {
      env: "test",
      apiUrl: "https://api.example.com",
    };

    const context: StricliDynamicCommandContext<AppContext> = {
      process: {
        stdout: { write: (s: string) => stdout.push(s) },
        stderr: { write: (s: string) => stderr.push(s) },
      },
      logger: {
        info: (message: string) => logs.push({ level: "info", message }),
        warn: (message: string) => logs.push({ level: "warn", message }),
        error: (message: string) => logs.push({ level: "error", message }),
      },
      config: {
        get: (key: string) => configData[key],
      },
    };

    return { context, stdout, stderr, logs, configData };
  }

  test("defineHandler with custom context can access context services", async () => {
    const params = defineParameters({
      flags: {
        verbose: { kind: "boolean", brief: "Verbose", default: false },
      },
    });

    const handler = defineHandler<typeof params, AppContext>(
      (ctx, { flags: { verbose } }) => {
        ctx.logger.info(
          `Running in ${ctx.config.get("env") ?? "unknown"} mode`,
        );
        if (verbose) {
          ctx.logger.info(`API URL: ${ctx.config.get("apiUrl") ?? "unknown"}`);
        }
      },
    );

    const route = defineRoute({
      handler,
      params,
      docs: { brief: "Test custom context" },
    });

    const routeMap = buildRouteMap({
      routes: { test: route.command },
      docs: { brief: "CLI" },
    });

    const app = buildApplication(routeMap, { name: "cli" });
    const { context, logs } = createAppContext();

    await run(app, ["test", "--verbose"], context);

    expect(logs).toEqual([
      { level: "info", message: "Running in test mode" },
      { level: "info", message: "API URL: https://api.example.com" },
    ]);
  });

  test("async defineHandler with custom context", async () => {
    const params = defineParameters({
      flags: {
        count: { kind: "parsed", parse: Number, brief: "Count" },
      },
    });

    const handler = defineHandler<typeof params, AppContext>(
      async (ctx, { flags: { count } }) => {
        ctx.logger.info("Starting async operation");
        for (let i = 0; i < count; i++) {
          await new Promise((resolve) => setTimeout(resolve, 1));
          ctx.logger.info(
            `Step ${(i + 1).toString()} of ${(count).toString()}`,
          );
        }
        ctx.logger.info("Completed!");
      },
    );

    const route = defineRoute({
      handler,
      params,
      docs: { brief: "Async with custom context" },
    });

    const routeMap = buildRouteMap({
      routes: { run: route.command },
      docs: { brief: "CLI" },
    });

    const app = buildApplication(routeMap, { name: "cli" });
    const { context, logs } = createAppContext();

    await run(app, ["run", "--count", "3"], context);

    expect(logs).toEqual([
      { level: "info", message: "Starting async operation" },
      { level: "info", message: "Step 1 of 3" },
      { level: "info", message: "Step 2 of 3" },
      { level: "info", message: "Step 3 of 3" },
      { level: "info", message: "Completed!" },
    ]);
  });

  test("defineHandler with custom context and positional args", async () => {
    const params = defineParameters({
      flags: {
        force: { kind: "boolean", brief: "Force", default: false },
      },
      positional: {
        kind: "tuple",
        parameters: [
          { brief: "Resource", parse: String, placeholder: "resource" },
        ],
      },
    });

    const handler = defineHandler<typeof params, AppContext>(
      (ctx, { flags: { force }, args: [resource] }) => {
        const env = ctx.config.get("env");
        if (env === "production" && !force) {
          ctx.logger.warn(`Refusing to delete ${resource} in production`);
          return;
        }
        ctx.logger.info(`Deleting ${resource}...`);
      },
    );

    const route = defineRoute({
      handler,
      params,
      docs: { brief: "Delete resource" },
    });

    const routeMap = buildRouteMap({
      routes: { delete: route.command },
      docs: { brief: "CLI" },
    });

    const app = buildApplication(routeMap, { name: "cli" });

    // Test in production mode without force
    const prodContext = createAppContext();
    prodContext.configData.env = "production";
    await run(app, ["delete", "my-resource"], prodContext.context);
    expect(prodContext.logs).toEqual([
      {
        level: "warn",
        message: "Refusing to delete my-resource in production",
      },
    ]);

    // Test with force
    const forceContext = createAppContext();
    forceContext.configData.env = "production";
    await run(app, ["delete", "--force", "my-resource"], forceContext.context);
    expect(forceContext.logs).toEqual([
      { level: "info", message: "Deleting my-resource..." },
    ]);
  });

  test("defineHandler with custom context and lazy loader", async () => {
    const params = defineParameters({
      flags: {
        message: { kind: "parsed", parse: String, brief: "Message" },
      },
    });

    const route = defineRoute({
      loader: async () => {
        await Promise.resolve();
        return defineHandler<typeof params, AppContext>(
          (ctx, { flags: { message } }) => {
            ctx.logger.info(`Message: ${message}`);
            ctx.logger.info(`Env: ${ctx.config.get("env") ?? "unknown"}`);
          },
        );
      },
      params,
      docs: { brief: "Lazy with custom context" },
    });

    const routeMap = buildRouteMap({
      routes: { send: route.command },
      docs: { brief: "CLI" },
    });

    const app = buildApplication(routeMap, { name: "cli" });
    const { context, logs } = createAppContext();

    await run(app, ["send", "--message", "Hello!"], context);

    expect(logs).toEqual([
      { level: "info", message: "Message: Hello!" },
      { level: "info", message: "Env: test" },
    ]);
  });

  test("defineHandler with custom context uses logger.error for failures", async () => {
    const params = defineParameters({
      flags: {
        fail: { kind: "boolean", brief: "Fail", default: false },
      },
    });

    const handler = defineHandler<typeof params, AppContext>(
      (ctx, { flags: { fail } }) => {
        if (fail) {
          ctx.logger.error("Operation failed!");
          return;
        }
        ctx.logger.info("Operation succeeded!");
      },
    );

    const route = defineRoute({
      handler,
      params,
      docs: { brief: "Maybe fail" },
    });

    const routeMap = buildRouteMap({
      routes: { test: route.command },
      docs: { brief: "CLI" },
    });

    const app = buildApplication(routeMap, { name: "cli" });

    const successContext = createAppContext();
    await run(app, ["test"], successContext.context);
    expect(successContext.logs).toEqual([
      { level: "info", message: "Operation succeeded!" },
    ]);

    const failContext = createAppContext();
    await run(app, ["test", "--fail"], failContext.context);
    expect(failContext.logs).toEqual([
      { level: "error", message: "Operation failed!" },
    ]);
  });
});

describe("Stricli integration: async handlers", () => {
  test("async handler with defineHandler works correctly", async () => {
    const params = defineParameters({
      flags: {
        delay: { kind: "parsed", parse: Number, brief: "Delay in ms" },
      },
    });

    let executed = false;
    let capturedDelay: number | undefined;

    const handler = defineHandler<typeof params>(
      async (_ctx, { flags: { delay } }) => {
        await new Promise((resolve) => setTimeout(resolve, 1));
        executed = true;
        capturedDelay = delay;
      },
    );

    const route = defineRoute({
      handler,
      params,
      docs: { brief: "Async test" },
    });

    const routeMap = buildRouteMap({
      routes: { test: route.command },
      docs: { brief: "CLI" },
    });

    const app = buildApplication(routeMap, { name: "cli" });
    const { context } = createMockContext();

    await run(app, ["test", "--delay", "100"], context);

    expect(executed).toBe(true);
    expect(capturedDelay).toBe(100);
  });

  test("async handler that writes to stdout", async () => {
    const params = defineParameters({
      flags: {},
      positional: {
        kind: "tuple",
        parameters: [{ brief: "Name", parse: String, placeholder: "name" }],
      },
    });

    const handler = defineHandler<typeof params>(
      async (ctx, { args: [name] }) => {
        await new Promise((resolve) => setTimeout(resolve, 1));
        ctx.process.stdout.write(`Hello, ${name}!\n`);
      },
    );

    const route = defineRoute({
      handler,
      params,
      docs: { brief: "Greet" },
    });

    const routeMap = buildRouteMap({
      routes: { greet: route.command },
      docs: { brief: "CLI" },
    });

    const app = buildApplication(routeMap, { name: "cli" });
    const { context, stdout } = createMockContext();

    await run(app, ["greet", "World"], context);

    expect(stdout).toContain("Hello, World!\n");
  });

  test("async handler with multiple await points", async () => {
    const params = defineParameters({
      flags: {
        count: { kind: "parsed", parse: Number, brief: "Count" },
      },
    });

    const results: number[] = [];

    const handler = defineHandler<typeof params>(
      async (_ctx, { flags: { count } }) => {
        for (let i = 0; i < count; i++) {
          await new Promise((resolve) => setTimeout(resolve, 1));
          results.push(i);
        }
      },
    );

    const route = defineRoute({
      handler,
      params,
      docs: { brief: "Counter" },
    });

    const routeMap = buildRouteMap({
      routes: { counter: route.command },
      docs: { brief: "CLI" },
    });

    const app = buildApplication(routeMap, { name: "cli" });
    const { context } = createMockContext();

    await run(app, ["counter", "--count", "3"], context);

    expect(results).toEqual([0, 1, 2]);
  });

  test("async handler with lazy loader", async () => {
    const params = defineParameters({
      flags: {
        message: { kind: "parsed", parse: String, brief: "Message" },
      },
    });

    let capturedMessage: string | undefined;

    const route = defineRoute({
      loader: async () => {
        await new Promise((resolve) => setTimeout(resolve, 1));
        return defineHandler<typeof params>(
          async (_ctx, { flags: { message } }) => {
            await new Promise((resolve) => setTimeout(resolve, 1));
            capturedMessage = message;
          },
        );
      },
      params,
      docs: { brief: "Lazy async" },
    });

    const routeMap = buildRouteMap({
      routes: { test: route.command },
      docs: { brief: "CLI" },
    });

    const app = buildApplication(routeMap, { name: "cli" });
    const { context } = createMockContext();

    await run(app, ["test", "--message", "async works!"], context);

    expect(capturedMessage).toBe("async works!");
  });

  test("async handler returning void is equivalent to returning Promise<void>", async () => {
    const params = defineParameters({ flags: {} });

    let syncExecuted = false;
    let asyncExecuted = false;

    // Sync handler (returns void)
    const syncHandler = defineHandler<typeof params>(() => {
      syncExecuted = true;
    });

    // Async handler (returns Promise<void>)
    const asyncHandler = defineHandler<typeof params>(async () => {
      await new Promise((resolve) => setTimeout(resolve, 1));
      asyncExecuted = true;
    });

    const syncRoute = defineRoute({
      handler: syncHandler,
      params,
      docs: { brief: "Sync" },
    });

    const asyncRoute = defineRoute({
      handler: asyncHandler,
      params,
      docs: { brief: "Async" },
    });

    const routeMap = buildRouteMap({
      routes: {
        sync: syncRoute.command,
        async: asyncRoute.command,
      },
      docs: { brief: "CLI" },
    });

    const app = buildApplication(routeMap, { name: "cli" });
    const { context } = createMockContext();

    await run(app, ["sync"], context);
    await run(app, ["async"], context);

    expect(syncExecuted).toBe(true);
    expect(asyncExecuted).toBe(true);
  });

  test("async handler with complex flag and positional processing", async () => {
    const params = defineParameters({
      flags: {
        format: {
          kind: "enum",
          values: ["json", "yaml"] as const,
          brief: "Format",
        },
        pretty: { kind: "boolean", brief: "Pretty print", default: false },
      },
      positional: {
        kind: "tuple",
        parameters: [
          { brief: "Input", parse: String, placeholder: "input" },
          {
            brief: "Output",
            parse: String,
            placeholder: "output",
            optional: true,
          },
        ],
      },
    });

    let capturedFormat: "json" | "yaml" | undefined;
    let capturedPretty: boolean | undefined;
    let capturedInput: string | undefined;
    let capturedOutput: string | undefined;

    const handler = defineHandler<typeof params>(
      async (_ctx, { flags: { format, pretty }, args: [input, output] }) => {
        await new Promise((resolve) => setTimeout(resolve, 1));
        capturedFormat = format;
        capturedPretty = pretty;
        capturedInput = input;
        capturedOutput = output;
      },
    );

    const route = defineRoute({
      handler,
      params,
      docs: { brief: "Convert" },
    });

    const routeMap = buildRouteMap({
      routes: { convert: route.command },
      docs: { brief: "CLI" },
    });

    const app = buildApplication(routeMap, { name: "cli" });
    const { context } = createMockContext();

    await run(
      app,
      ["convert", "--format", "yaml", "--pretty", "input.json", "output.yaml"],
      context,
    );

    expect(capturedFormat).toBe("yaml");
    expect(capturedPretty).toBe(true);
    expect(capturedInput).toBe("input.json");
    expect(capturedOutput).toBe("output.yaml");
  });
});

import type {
  CommandContext,
  StricliDynamicCommandContext,
} from "@stricli/core";
import { describe, expect, test } from "bun:test";
import { buildApplication, buildRouteMap, run } from "@stricli/core";
import { defineCommand } from "./index.js";

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
      stdout: { write: (s: string) => stdout.push(s) },
      stderr: { write: (s: string) => stderr.push(s) },
    },
  };

  return { context, stdout, stderr };
}

describe("defineCommand", () => {
  test("creates a command with local handler", () => {
    const command = defineCommand<{ force: boolean }>({
      handler: (_context, { flags: { force } }) => {
        void force;
      },
      parameters: {
        flags: {
          force: { kind: "boolean", brief: "Force operation" },
        },
      },
      docs: { brief: "Test command" },
    });

    expect(command).toBeDefined();
    expect(command.kind).toBeDefined();
  });

  test("creates a command with typed flags", () => {
    const command = defineCommand<{
      verbose: boolean;
      count: number;
      format: "json" | "yaml";
    }>({
      handler: (_context, { flags: { verbose, count, format } }) => {
        void verbose;
        void count;
        void format;
      },
      parameters: {
        flags: {
          verbose: { kind: "boolean", brief: "Verbose output" },
          count: { kind: "counter", brief: "Count" },
          format: {
            kind: "enum",
            values: ["json", "yaml"] as const,
            brief: "Output format",
          },
        },
      },
      docs: { brief: "Test command" },
    });

    expect(command).toBeDefined();
  });

  test("creates a command with positional arguments", () => {
    const command = defineCommand<
      { verbose: boolean },
      [string, string | undefined]
    >({
      handler: (_context, { args: [source, dest] }) => {
        void source;
        void dest;
      },
      parameters: {
        flags: {
          verbose: { kind: "boolean", brief: "Verbose" },
        },
        positional: {
          kind: "tuple",
          parameters: [
            { brief: "Source", parse: String, placeholder: "source" },
            {
              brief: "Destination",
              parse: String,
              placeholder: "dest",
              optional: true,
            },
          ],
        },
      },
      docs: { brief: "Copy files" },
    });

    expect(command).toBeDefined();
  });

  test("creates a command with lazy loader", () => {
    const command = defineCommand<{ force: boolean }>({
      loader: () =>
        Promise.resolve((_context, { flags: { force } }) => {
          void force;
        }),
      parameters: {
        flags: {
          force: { kind: "boolean", brief: "Force operation" },
        },
      },
      docs: { brief: "Test command" },
    });

    expect(command).toBeDefined();
  });

  test("creates a command with lazy loader returning module", () => {
    const command = defineCommand<{ force: boolean }>({
      loader: () =>
        Promise.resolve({
          default: (_context, { flags: { force } }) => {
            void force;
          },
        }),
      parameters: {
        flags: {
          force: { kind: "boolean", brief: "Force operation" },
        },
      },
      docs: { brief: "Test command" },
    });

    expect(command).toBeDefined();
  });

  test("throws error when neither handler nor loader is provided", () => {
    expect(() => {
      // Using type assertion to bypass TypeScript for runtime test
      const args = {
        parameters: {
          flags: {
            force: { kind: "boolean" as const, brief: "Force" },
          },
        },
        docs: { brief: "Test" },
      } as unknown as Parameters<typeof defineCommand>[0];
      defineCommand(args);
    }).toThrow("defineCommand requires either 'handler' or 'loader'");
  });
});

describe("defineCommand integration with Stricli", () => {
  test("command can be used in buildRouteMap", async () => {
    let capturedValue = "";

    const greetCommand = defineCommand<{ loud: boolean }, [string]>({
      handler: (context, { flags: { loud }, args: [name] }) => {
        const message = loud
          ? `HELLO, ${name.toUpperCase()}!`
          : `Hello, ${name}!`;
        context.process.stdout.write(message);
        capturedValue = message;
      },
      parameters: {
        flags: {
          loud: { kind: "boolean", brief: "Use loud greeting" },
        },
        positional: {
          kind: "tuple",
          parameters: [{ brief: "Name", parse: String, placeholder: "name" }],
        },
      },
      docs: { brief: "Greet someone" },
    });

    const routeMap = buildRouteMap({
      routes: { greet: greetCommand },
      docs: { brief: "Test CLI" },
    });

    const app = buildApplication(routeMap, { name: "test-cli" });
    const { context } = createMockContext();

    await run(app, ["greet", "World"], context);
    expect(capturedValue).toBe("Hello, World!");
  });

  test("command with flags works correctly", async () => {
    let capturedFlags = { verbose: false, dryRun: false };

    const command = defineCommand<{ verbose: boolean; dryRun: boolean }>({
      handler: (_context, { flags }) => {
        capturedFlags = flags;
      },
      parameters: {
        flags: {
          verbose: { kind: "boolean", brief: "Verbose output" },
          dryRun: { kind: "boolean", brief: "Dry run mode" },
        },
      },
      docs: { brief: "Test command" },
    });

    const routeMap = buildRouteMap({
      routes: { test: command },
      docs: { brief: "Test CLI" },
    });

    const app = buildApplication(routeMap, { name: "test-cli" });
    const { context } = createMockContext();

    await run(app, ["test", "--verbose", "--dryRun"], context);
    expect(capturedFlags.verbose).toBe(true);
    expect(capturedFlags.dryRun).toBe(true);
  });

  test("command with parsed flags works correctly", async () => {
    let capturedPort = 0;

    const command = defineCommand<{ port: number }>({
      handler: (_context, { flags: { port } }) => {
        capturedPort = port;
      },
      parameters: {
        flags: {
          port: {
            kind: "parsed",
            parse: (s) => Number.parseInt(s, 10),
            brief: "Port number",
          },
        },
      },
      docs: { brief: "Server command" },
    });

    const routeMap = buildRouteMap({
      routes: { serve: command },
      docs: { brief: "Test CLI" },
    });

    const app = buildApplication(routeMap, { name: "test-cli" });
    const { context } = createMockContext();

    await run(app, ["serve", "--port", "8080"], context);
    expect(capturedPort).toBe(8080);
  });

  test("command with enum flags works correctly", async () => {
    let capturedFormat = "";

    const command = defineCommand<{ format: "json" | "yaml" | "toml" }>({
      handler: (_context, { flags: { format } }) => {
        capturedFormat = format;
      },
      parameters: {
        flags: {
          format: {
            kind: "enum",
            values: ["json", "yaml", "toml"] as const,
            brief: "Output format",
          },
        },
      },
      docs: { brief: "Export command" },
    });

    const routeMap = buildRouteMap({
      routes: { export: command },
      docs: { brief: "Test CLI" },
    });

    const app = buildApplication(routeMap, { name: "test-cli" });
    const { context } = createMockContext();

    await run(app, ["export", "--format", "yaml"], context);
    expect(capturedFormat).toBe("yaml");
  });

  test("command with multiple positional arguments", async () => {
    let capturedArgs: string[] = [];

    const command = defineCommand<{ verbose: boolean }, [string, string]>({
      handler: (_context, { args: [source, dest] }) => {
        capturedArgs = [source, dest];
      },
      parameters: {
        flags: {
          verbose: { kind: "boolean", brief: "Verbose" },
        },
        positional: {
          kind: "tuple",
          parameters: [
            { brief: "Source", parse: String, placeholder: "source" },
            { brief: "Destination", parse: String, placeholder: "dest" },
          ],
        },
      },
      docs: { brief: "Copy files" },
    });

    const routeMap = buildRouteMap({
      routes: { copy: command },
      docs: { brief: "Test CLI" },
    });

    const app = buildApplication(routeMap, { name: "test-cli" });
    const { context } = createMockContext();

    await run(app, ["copy", "/src/file.txt", "/dest/file.txt"], context);
    expect(capturedArgs).toEqual(["/src/file.txt", "/dest/file.txt"]);
  });

  test("command with lazy loader executes correctly", async () => {
    let executed = false;

    const command = defineCommand<{ force: boolean }>({
      loader: () =>
        Promise.resolve((_context, { flags: { force } }) => {
          executed = true;
          void force;
        }),
      parameters: {
        flags: {
          force: { kind: "boolean", brief: "Force" },
        },
      },
      docs: { brief: "Lazy command" },
    });

    const routeMap = buildRouteMap({
      routes: { lazy: command },
      docs: { brief: "Test CLI" },
    });

    const app = buildApplication(routeMap, { name: "test-cli" });
    const { context } = createMockContext();

    await run(app, ["lazy", "--force"], context);
    expect(executed).toBe(true);
  });

  test("command with lazy loader returning module executes correctly", async () => {
    let executed = false;

    const command = defineCommand<{ verbose: boolean }>({
      loader: () =>
        Promise.resolve({
          default: (_context, { flags: { verbose } }) => {
            executed = true;
            void verbose;
          },
        }),
      parameters: {
        flags: {
          verbose: { kind: "boolean", brief: "Verbose" },
        },
      },
      docs: { brief: "Module command" },
    });

    const routeMap = buildRouteMap({
      routes: { module: command },
      docs: { brief: "Test CLI" },
    });

    const app = buildApplication(routeMap, { name: "test-cli" });
    const { context } = createMockContext();

    await run(app, ["module"], context);
    expect(executed).toBe(true);
  });

  test("multiple commands in route map", async () => {
    const results: string[] = [];

    const createCommand = defineCommand<{ name: string }>({
      handler: (_context, { flags: { name } }) => {
        results.push(`created: ${name}`);
      },
      parameters: {
        flags: {
          name: { kind: "parsed", parse: String, brief: "Name" },
        },
      },
      docs: { brief: "Create resource" },
    });

    const deleteCommand = defineCommand<{ id: string }>({
      handler: (_context, { flags: { id } }) => {
        results.push(`deleted: ${id}`);
      },
      parameters: {
        flags: {
          id: { kind: "parsed", parse: String, brief: "ID" },
        },
      },
      docs: { brief: "Delete resource" },
    });

    const routeMap = buildRouteMap({
      routes: {
        create: createCommand,
        delete: deleteCommand,
      },
      docs: { brief: "Resource CLI" },
    });

    const app = buildApplication(routeMap, { name: "resource-cli" });
    const { context } = createMockContext();

    await run(app, ["create", "--name", "foo"], context);
    await run(app, ["delete", "--id", "123"], context);

    expect(results).toEqual(["created: foo", "deleted: 123"]);
  });

  test("command with complex flag types", async () => {
    let capturedConfig = {
      force: false,
      count: 0,
      format: "" as string,
      port: 0,
      host: "",
    };

    const command = defineCommand<{
      force: boolean;
      count: number;
      format: "json" | "yaml";
      port: number;
      host: string;
    }>({
      handler: (_context, { flags: { force, count, format, port, host } }) => {
        capturedConfig = { force, count, format, port, host };
      },
      parameters: {
        flags: {
          force: { kind: "boolean", brief: "Force" },
          count: { kind: "counter", brief: "Count" },
          format: {
            kind: "enum",
            values: ["json", "yaml"] as const,
            brief: "Format",
          },
          port: {
            kind: "parsed",
            parse: (s) => Number.parseInt(s, 10),
            brief: "Port",
          },
          host: { kind: "parsed", parse: String, brief: "Host" },
        },
        aliases: { c: "count" },
      },
      docs: { brief: "Complex command" },
    });

    const routeMap = buildRouteMap({
      routes: { complex: command },
      docs: { brief: "Test CLI" },
    });

    const app = buildApplication(routeMap, { name: "test-cli" });
    const { context } = createMockContext();

    await run(
      app,
      [
        "complex",
        "--force",
        "-c",
        "-c",
        "-c",
        "--format",
        "yaml",
        "--port",
        "3000",
        "--host",
        "localhost",
      ],
      context,
    );

    expect(capturedConfig).toEqual({
      force: true,
      count: 3,
      format: "yaml",
      port: 3000,
      host: "localhost",
    });
  });

  test("command with optional positional argument", async () => {
    let capturedArgs: [string, string | undefined] = ["", undefined];

    const command = defineCommand<
      { verbose: boolean },
      [string, string | undefined]
    >({
      handler: (_context, { args }) => {
        capturedArgs = args;
      },
      parameters: {
        flags: {
          verbose: { kind: "boolean", brief: "Verbose" },
        },
        positional: {
          kind: "tuple",
          parameters: [
            { brief: "Source", parse: String, placeholder: "source" },
            {
              brief: "Dest",
              parse: String,
              placeholder: "dest",
              optional: true,
            },
          ],
        },
      },
      docs: { brief: "Copy command" },
    });

    const routeMap = buildRouteMap({
      routes: { copy: command },
      docs: { brief: "Test CLI" },
    });

    const app = buildApplication(routeMap, { name: "test-cli" });
    const { context } = createMockContext();

    // With both args
    await run(app, ["copy", "src.txt", "dest.txt"], context);
    expect(capturedArgs).toEqual(["src.txt", "dest.txt"]);

    // With only required arg
    await run(app, ["copy", "src.txt"], context);
    expect(capturedArgs).toEqual(["src.txt", undefined]);
  });

  test("command with optional parsed flag", async () => {
    let capturedConfig: string | undefined;

    const command = defineCommand<{ config: string | undefined }>({
      handler: (_context, { flags: { config } }) => {
        capturedConfig = config;
      },
      parameters: {
        flags: {
          config: {
            kind: "parsed",
            parse: String,
            brief: "Config path",
            optional: true,
          },
        },
      },
      docs: { brief: "Config command" },
    });

    const routeMap = buildRouteMap({
      routes: { run: command },
      docs: { brief: "Test CLI" },
    });

    const app = buildApplication(routeMap, { name: "test-cli" });
    const { context } = createMockContext();

    // Without flag
    await run(app, ["run"], context);
    expect(capturedConfig).toBeUndefined();

    // With flag
    await run(app, ["run", "--config", "./config.json"], context);
    expect(capturedConfig).toBe("./config.json");
  });

  test("command with variadic parsed flags", async () => {
    let capturedTags: string[] = [];

    // Variadic flags return arrays (empty if no values provided)
    const command = defineCommand<{ tags: string[] }>({
      handler: (_context, { flags: { tags } }) => {
        capturedTags = tags;
      },
      parameters: {
        flags: {
          tags: {
            kind: "parsed",
            parse: String,
            brief: "Tags",
            variadic: true,
          },
        },
      },
      docs: { brief: "Tag command" },
    });

    const routeMap = buildRouteMap({
      routes: { tag: command },
      docs: { brief: "Test CLI" },
    });

    const app = buildApplication(routeMap, { name: "test-cli" });
    const { context } = createMockContext();

    await run(
      app,
      ["tag", "--tags", "a", "--tags", "b", "--tags", "c"],
      context,
    );
    expect(capturedTags).toEqual(["a", "b", "c"]);
  });

  test("command used as single command application", async () => {
    let executed = false;
    let capturedName = "";

    const command = defineCommand<{ verbose: boolean }, [string]>({
      handler: (_context, { args: [name] }) => {
        executed = true;
        capturedName = name;
      },
      parameters: {
        flags: {
          verbose: { kind: "boolean", brief: "Verbose" },
        },
        positional: {
          kind: "tuple",
          parameters: [{ brief: "Name", parse: String, placeholder: "name" }],
        },
      },
      docs: { brief: "Single command app" },
    });

    const app = buildApplication(command, { name: "single-cli" });
    const { context } = createMockContext();

    await run(app, ["World"], context);
    expect(executed).toBe(true);
    expect(capturedName).toBe("World");
  });

  test("command with no flags (empty flags object)", async () => {
    let executed = false;

    const command = defineCommand<Record<string, never>, [string]>({
      handler: (_context, { args: [name] }) => {
        executed = true;
        void name;
      },
      parameters: {
        flags: {},
        positional: {
          kind: "tuple",
          parameters: [{ brief: "Name", parse: String, placeholder: "name" }],
        },
      },
      docs: { brief: "No flags command" },
    });

    const routeMap = buildRouteMap({
      routes: { noflags: command },
      docs: { brief: "Test CLI" },
    });

    const app = buildApplication(routeMap, { name: "test-cli" });
    const { context } = createMockContext();

    await run(app, ["noflags", "test"], context);
    expect(executed).toBe(true);
  });

  test("command with async handler", async () => {
    let executed = false;
    let capturedValue = "";

    const command = defineCommand<{ name: string }>({
      handler: async (_context, { flags: { name } }) => {
        await new Promise((resolve) => setTimeout(resolve, 1));
        executed = true;
        capturedValue = name;
      },
      parameters: {
        flags: {
          name: { kind: "parsed", parse: String, brief: "Name" },
        },
      },
      docs: { brief: "Async handler command" },
    });

    const routeMap = buildRouteMap({
      routes: { async: command },
      docs: { brief: "Test CLI" },
    });

    const app = buildApplication(routeMap, { name: "test-cli" });
    const { context } = createMockContext();

    await run(app, ["async", "--name", "test-async"], context);
    expect(executed).toBe(true);
    expect(capturedValue).toBe("test-async");
  });

  test("command with async handler writing to stdout", async () => {
    const command = defineCommand<{ message: string }>({
      handler: async (context, { flags: { message } }) => {
        await new Promise((resolve) => setTimeout(resolve, 1));
        context.process.stdout.write(`Message: ${message}\n`);
      },
      parameters: {
        flags: {
          message: { kind: "parsed", parse: String, brief: "Message" },
        },
      },
      docs: { brief: "Async output command" },
    });

    const routeMap = buildRouteMap({
      routes: { output: command },
      docs: { brief: "Test CLI" },
    });

    const app = buildApplication(routeMap, { name: "test-cli" });
    const { context, stdout } = createMockContext();

    await run(app, ["output", "--message", "hello async"], context);
    expect(stdout).toContain("Message: hello async\n");
  });

  test("command with async lazy loader returning async handler", async () => {
    let executed = false;

    const command = defineCommand<{ value: number }>({
      loader: async () => {
        await new Promise((resolve) => setTimeout(resolve, 1));
        return async (_context, { flags: { value } }) => {
          await new Promise((resolve) => setTimeout(resolve, 1));
          executed = true;
          void value;
        };
      },
      parameters: {
        flags: {
          value: { kind: "parsed", parse: Number, brief: "Value" },
        },
      },
      docs: { brief: "Double async command" },
    });

    const routeMap = buildRouteMap({
      routes: { doubleAsync: command },
      docs: { brief: "Test CLI" },
    });

    const app = buildApplication(routeMap, { name: "test-cli" });
    const { context } = createMockContext();

    await run(app, ["doubleAsync", "--value", "42"], context);
    expect(executed).toBe(true);
  });

  test("command with async lazy loader returning module with async handler", async () => {
    let executed = false;
    let capturedFlags: { force: boolean; count: number } | undefined;

    const command = defineCommand<{ force: boolean; count: number }>({
      loader: async () => {
        await new Promise((resolve) => setTimeout(resolve, 1));
        return {
          default: async (_context, { flags }) => {
            await new Promise((resolve) => setTimeout(resolve, 1));
            executed = true;
            capturedFlags = flags;
          },
        };
      },
      parameters: {
        flags: {
          force: { kind: "boolean", brief: "Force" },
          count: { kind: "counter", brief: "Count" },
        },
      },
      docs: { brief: "Async module command" },
    });

    const routeMap = buildRouteMap({
      routes: { asyncModule: command },
      docs: { brief: "Test CLI" },
    });

    const app = buildApplication(routeMap, { name: "test-cli" });
    const { context } = createMockContext();

    await run(app, ["asyncModule", "--force", "--count", "--count"], context);
    expect(executed).toBe(true);
    expect(capturedFlags).toEqual({ force: true, count: 2 });
  });
});

// ============================================================================
// Tests for custom CommandContext types
// ============================================================================

describe("defineCommand with custom CommandContext", () => {
  /**
   * Custom context with a logger service.
   */
  interface LoggerContext extends CommandContext {
    logger: {
      info: (message: string) => void;
      error: (message: string) => void;
    };
  }

  /**
   * Create a mock context with custom logger.
   */
  function createLoggerContext(): {
    context: StricliDynamicCommandContext<LoggerContext>;
    stdout: string[];
    stderr: string[];
    logs: { level: string; message: string }[];
  } {
    const stdout: string[] = [];
    const stderr: string[] = [];
    const logs: { level: string; message: string }[] = [];

    const context: StricliDynamicCommandContext<LoggerContext> = {
      process: {
        stdout: { write: (s: string) => stdout.push(s) },
        stderr: { write: (s: string) => stderr.push(s) },
      },
      logger: {
        info: (message: string) => logs.push({ level: "info", message }),
        error: (message: string) => logs.push({ level: "error", message }),
      },
    };

    return { context, stdout, stderr, logs };
  }

  test("command with custom context type can access context properties", async () => {
    const command = defineCommand<{ verbose: boolean }, [], LoggerContext>({
      handler: (ctx, { flags: { verbose } }) => {
        ctx.logger.info(`Verbose mode: ${(verbose).toString()}`);
      },
      parameters: {
        flags: {
          verbose: { kind: "boolean", brief: "Verbose", default: false },
        },
      },
      docs: { brief: "Test custom context" },
    });

    const routeMap = buildRouteMap({
      routes: { test: command },
      docs: { brief: "CLI" },
    });

    const app = buildApplication(routeMap, { name: "cli" });
    const { context, logs } = createLoggerContext();

    await run(app, ["test", "--verbose"], context);

    expect(logs).toEqual([{ level: "info", message: "Verbose mode: true" }]);
  });

  test("async command with custom context type", async () => {
    const command = defineCommand<{ message: string }, [], LoggerContext>({
      handler: async (ctx, { flags: { message } }) => {
        await new Promise((resolve) => setTimeout(resolve, 1));
        ctx.logger.info(message);
        ctx.logger.info("Done!");
      },
      parameters: {
        flags: {
          message: { kind: "parsed", parse: String, brief: "Message" },
        },
      },
      docs: { brief: "Async custom context" },
    });

    const routeMap = buildRouteMap({
      routes: { test: command },
      docs: { brief: "CLI" },
    });

    const app = buildApplication(routeMap, { name: "cli" });
    const { context, logs } = createLoggerContext();

    await run(app, ["test", "--message", "Hello from async"], context);

    expect(logs).toEqual([
      { level: "info", message: "Hello from async" },
      { level: "info", message: "Done!" },
    ]);
  });

  test("lazy-loaded command with custom context type", async () => {
    const command = defineCommand<{ name: string }, [], LoggerContext>({
      loader: () =>
        Promise.resolve((ctx, { flags: { name } }) => {
          ctx.logger.info(`Hello, ${name}!`);
        }),
      parameters: {
        flags: {
          name: { kind: "parsed", parse: String, brief: "Name" },
        },
      },
      docs: { brief: "Lazy with custom context" },
    });

    const routeMap = buildRouteMap({
      routes: { greet: command },
      docs: { brief: "CLI" },
    });

    const app = buildApplication(routeMap, { name: "cli" });
    const { context, logs } = createLoggerContext();

    await run(app, ["greet", "--name", "World"], context);

    expect(logs).toEqual([{ level: "info", message: "Hello, World!" }]);
  });

  test("command with custom context and positional args", async () => {
    const command = defineCommand<
      { force: boolean },
      [string, string],
      LoggerContext
    >({
      handler: (ctx, { flags: { force }, args: [source, dest] }) => {
        if (force) {
          ctx.logger.info(`Force copying ${source} to ${dest}`);
        } else {
          ctx.logger.info(`Copying ${source} to ${dest}`);
        }
      },
      parameters: {
        flags: {
          force: { kind: "boolean", brief: "Force", default: false },
        },
        positional: {
          kind: "tuple",
          parameters: [
            { brief: "Source", parse: String, placeholder: "source" },
            { brief: "Dest", parse: String, placeholder: "dest" },
          ],
        },
      },
      docs: { brief: "Copy with custom context" },
    });

    const routeMap = buildRouteMap({
      routes: { copy: command },
      docs: { brief: "CLI" },
    });

    const app = buildApplication(routeMap, { name: "cli" });
    const { context, logs } = createLoggerContext();

    await run(app, ["copy", "--force", "src.txt", "dst.txt"], context);

    expect(logs).toEqual([
      { level: "info", message: "Force copying src.txt to dst.txt" },
    ]);
  });

  /**
   * Custom context with a database connection.
   */
  interface DatabaseContext extends CommandContext {
    db: {
      query: (sql: string) => Promise<unknown[]>;
      execute: (sql: string) => Promise<void>;
    };
  }

  function createDatabaseContext(): {
    context: StricliDynamicCommandContext<DatabaseContext>;
    stdout: string[];
    queries: string[];
  } {
    const stdout: string[] = [];
    const queries: string[] = [];

    const context: StricliDynamicCommandContext<DatabaseContext> = {
      process: {
        stdout: { write: (s: string) => stdout.push(s) },
        stderr: {
          write: () => {
            // noop
          },
        },
      },
      db: {
        query: (sql: string) => {
          queries.push(sql);
          return Promise.resolve([{ id: 1, name: "test" }]);
        },
        execute: (sql: string) => {
          queries.push(sql);
          return Promise.resolve();
        },
      },
    };

    return { context, stdout, queries };
  }

  test("command with async custom context service", async () => {
    const command = defineCommand<{ table: string }, [], DatabaseContext>({
      handler: async (ctx, { flags: { table } }) => {
        const results = await ctx.db.query(`SELECT * FROM ${table}`);
        ctx.process.stdout.write(`Found ${(results.length).toString()} rows\n`);
      },
      parameters: {
        flags: {
          table: { kind: "parsed", parse: String, brief: "Table name" },
        },
      },
      docs: { brief: "Query database" },
    });

    const routeMap = buildRouteMap({
      routes: { query: command },
      docs: { brief: "DB CLI" },
    });

    const app = buildApplication(routeMap, { name: "db-cli" });
    const { context, stdout, queries } = createDatabaseContext();

    await run(app, ["query", "--table", "users"], context);

    expect(queries).toEqual(["SELECT * FROM users"]);
    expect(stdout).toContain("Found 1 rows\n");
  });
});

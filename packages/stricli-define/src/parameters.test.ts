import type { CommandContext } from "@stricli/core";
import type { ExtractArgs, ExtractFlags, ExtractFlagType } from "./index.js";
import { describe, expect, test } from "bun:test";
import { defineHandler, defineParameters } from "./index.js";

describe("defineParameters", () => {
  test("preserves flag structure for boolean flags", () => {
    const params = defineParameters({
      flags: {
        force: { kind: "boolean", brief: "Force operation" },
        verbose: { kind: "boolean", brief: "Verbose", default: false },
      },
    });

    expect(params.flags.force.kind).toBe("boolean");
    expect(params.flags.verbose.kind).toBe("boolean");
    expect(params.flags.verbose.default).toBe(false);
  });

  test("preserves flag structure for counter flags", () => {
    const params = defineParameters({
      flags: {
        verbosity: { kind: "counter", brief: "Increase verbosity" },
      },
    });

    expect(params.flags.verbosity.kind).toBe("counter");
  });

  test("preserves flag structure for enum flags", () => {
    const params = defineParameters({
      flags: {
        format: {
          kind: "enum",
          values: ["json", "yaml", "toml"] as const,
          brief: "Output format",
        },
      },
    });

    expect(params.flags.format.kind).toBe("enum");
    expect(params.flags.format.values).toEqual(["json", "yaml", "toml"]);
  });

  test("preserves flag structure for parsed flags", () => {
    const params = defineParameters({
      flags: {
        port: { kind: "parsed", parse: Number, brief: "Port number" },
        host: { kind: "parsed", parse: String, brief: "Host", optional: true },
      },
    });

    expect(params.flags.port.kind).toBe("parsed");
    expect(params.flags.host.optional).toBe(true);
  });

  test("preserves tuple positional parameters", () => {
    const params = defineParameters({
      flags: {},
      positional: {
        kind: "tuple",
        parameters: [
          { brief: "Source", parse: String, placeholder: "source" },
          { brief: "Dest", parse: String, placeholder: "dest", optional: true },
        ],
      },
    });

    expect(params.positional.kind).toBe("tuple");
    expect(params.positional.parameters).toHaveLength(2);
    expect(params.positional.parameters[0].placeholder).toBe("source");
    expect(params.positional.parameters[1].optional).toBe(true);
  });

  test("preserves array positional parameters", () => {
    const params = defineParameters({
      flags: {},
      positional: {
        kind: "array",
        parameter: { brief: "Files", parse: String, placeholder: "file" },
      },
    });

    expect(params.positional.kind).toBe("array");
    expect(params.positional.parameter.placeholder).toBe("file");
  });

  test("preserves parameters without positional", () => {
    const params = defineParameters({
      flags: {
        verbose: { kind: "boolean", brief: "Verbose" },
      },
    });

    expect(params.flags.verbose.kind).toBe("boolean");
    expect((params as Record<string, unknown>).positional).toBeUndefined();
  });

  test("preserves empty flags object", () => {
    const params = defineParameters({
      flags: {},
    });

    expect(Object.keys(params.flags)).toHaveLength(0);
  });
});

describe("ExtractFlags type utility", () => {
  test("extracts boolean flag type", () => {
    const params = defineParameters({
      flags: {
        force: { kind: "boolean", brief: "Force" },
      },
    });

    type Flags = ExtractFlags<typeof params>;
    const flags: Flags = { force: true };
    expect(typeof flags.force).toBe("boolean");
  });

  test("extracts counter flag type as number", () => {
    const params = defineParameters({
      flags: {
        verbosity: { kind: "counter", brief: "Verbosity" },
      },
    });

    type Flags = ExtractFlags<typeof params>;
    const flags: Flags = { verbosity: 3 };
    expect(typeof flags.verbosity).toBe("number");
  });

  test("extracts enum flag type as union", () => {
    const params = defineParameters({
      flags: {
        format: {
          kind: "enum",
          values: ["json", "yaml", "toml"] as const,
          brief: "Format",
        },
      },
    });

    type Flags = ExtractFlags<typeof params>;
    const flags: Flags = { format: "json" };
    expect(["json", "yaml", "toml"].includes(flags.format)).toBe(true);
  });

  test("extracts parsed flag type from parser return type", () => {
    const params = defineParameters({
      flags: {
        port: { kind: "parsed", parse: Number, brief: "Port" },
      },
    });

    type Flags = ExtractFlags<typeof params>;
    const flags: Flags = { port: 8080 };
    expect(typeof flags.port).toBe("number");
  });

  test("extracts optional parsed flag type as T | undefined", () => {
    const params = defineParameters({
      flags: {
        host: { kind: "parsed", parse: String, brief: "Host", optional: true },
      },
    });

    type Flags = ExtractFlags<typeof params>;
    const flagsWithValue: Flags = { host: "localhost" };
    const flagsWithUndefined: Flags = { host: undefined };
    expect(
      flagsWithValue.host === "localhost" ||
        flagsWithUndefined.host === undefined,
    ).toBe(true);
  });

  test("extracts multiple flags of different kinds", () => {
    const params = defineParameters({
      flags: {
        force: { kind: "boolean", brief: "Force" },
        verbosity: { kind: "counter", brief: "Verbosity" },
        format: {
          kind: "enum",
          values: ["json", "yaml"] as const,
          brief: "Format",
        },
        port: { kind: "parsed", parse: Number, brief: "Port" },
        host: { kind: "parsed", parse: String, brief: "Host", optional: true },
      },
    });

    type Flags = ExtractFlags<typeof params>;
    const flags: Flags = {
      force: true,
      verbosity: 2,
      format: "json",
      port: 3000,
      host: undefined,
    };

    expect(typeof flags.force).toBe("boolean");
    expect(typeof flags.verbosity).toBe("number");
    expect(["json", "yaml"].includes(flags.format)).toBe(true);
    expect(typeof flags.port).toBe("number");
  });
});

describe("ExtractFlagType type utility", () => {
  test("boolean flag returns boolean", () => {
    interface Flag {
      kind: "boolean";
      brief: string;
    }
    type Result = ExtractFlagType<Flag>;
    const value: Result = true;
    expect(typeof value).toBe("boolean");
  });

  test("counter flag returns number", () => {
    interface Flag {
      kind: "counter";
      brief: string;
    }
    type Result = ExtractFlagType<Flag>;
    const value: Result = 5;
    expect(typeof value).toBe("number");
  });

  test("enum flag returns union of values", () => {
    interface Flag {
      kind: "enum";
      values: readonly ["a", "b", "c"];
      brief: string;
    }
    type Result = ExtractFlagType<Flag>;
    const value: Result = "a";
    expect(["a", "b", "c"].includes(value)).toBe(true);
  });
});

describe("ExtractArgs type utility", () => {
  test("extracts single tuple parameter", () => {
    const params = defineParameters({
      flags: {},
      positional: {
        kind: "tuple",
        parameters: [{ brief: "Name", parse: String, placeholder: "name" }],
      },
    });

    type Args = ExtractArgs<typeof params>;
    const args: Args = ["hello"];
    expect(args[0]).toBe("hello");
    expect(args).toHaveLength(1);
  });

  test("extracts multiple tuple parameters", () => {
    const params = defineParameters({
      flags: {},
      positional: {
        kind: "tuple",
        parameters: [
          { brief: "Source", parse: String, placeholder: "source" },
          { brief: "Count", parse: Number, placeholder: "count" },
        ],
      },
    });

    type Args = ExtractArgs<typeof params>;
    const args: Args = ["file.txt", 10];
    expect(args[0]).toBe("file.txt");
    expect(args[1]).toBe(10);
  });

  test("extracts optional tuple parameters", () => {
    const params = defineParameters({
      flags: {},
      positional: {
        kind: "tuple",
        parameters: [
          { brief: "Source", parse: String, placeholder: "source" },
          { brief: "Dest", parse: String, placeholder: "dest", optional: true },
        ],
      },
    });

    type Args = ExtractArgs<typeof params>;
    const argsWithOptional: Args = ["src", "dst"];
    const argsWithoutOptional: Args = ["src", undefined];
    expect(argsWithOptional[0]).toBe("src");
    expect(argsWithoutOptional[1]).toBeUndefined();
  });

  test("extracts array positional as array type", () => {
    const params = defineParameters({
      flags: {},
      positional: {
        kind: "array",
        parameter: { brief: "Files", parse: String, placeholder: "file" },
      },
    });

    type Args = ExtractArgs<typeof params>;
    const args: Args = ["file1.txt", "file2.txt", "file3.txt"];
    expect(Array.isArray(args)).toBe(true);
    expect(args).toHaveLength(3);
  });

  test("returns empty tuple for no positional", () => {
    const params = defineParameters({
      flags: {
        verbose: { kind: "boolean", brief: "Verbose" },
      },
    });

    type Args = ExtractArgs<typeof params>;
    const args: Args = [];
    expect(args).toHaveLength(0);
  });

  test("extracts custom parser return types", () => {
    const params = defineParameters({
      flags: {},
      positional: {
        kind: "tuple",
        parameters: [
          {
            brief: "Value",
            parse: (s: string) => Number.parseInt(s, 10),
            placeholder: "value",
          },
          {
            brief: "Flag",
            parse: (s: string) => s === "true",
            placeholder: "flag",
          },
        ],
      },
    });

    type Args = ExtractArgs<typeof params>;
    const args: Args = [42, true];
    expect(typeof args[0]).toBe("number");
    expect(typeof args[1]).toBe("boolean");
  });
});

describe("defineHandler", () => {
  test("creates a handler function", () => {
    const params = defineParameters({
      flags: {},
    });

    const handler = defineHandler<typeof params>(() => {
      /* noop */
    });

    expect(typeof handler).toBe("function");
  });

  test("handler receives context as first parameter", async () => {
    const params = defineParameters({ flags: {} });

    let receivedContext: CommandContext | undefined;

    const handler = defineHandler<typeof params>((context) => {
      receivedContext = context;
    });

    const mockContext: CommandContext = {
      process: {
        stdout: { write: () => true },
        stderr: { write: () => true },
      },
    };

    await handler(mockContext, { flags: {}, args: [] });

    expect(receivedContext).toBe(mockContext);
  });

  test("handler receives flags in params object", async () => {
    const params = defineParameters({
      flags: {
        force: { kind: "boolean", brief: "Force" },
        count: { kind: "counter", brief: "Count" },
      },
    });

    let receivedFlags: { force: boolean; count: number } | undefined;

    const handler = defineHandler<typeof params>((_context, { flags }) => {
      receivedFlags = flags;
    });

    const mockContext: CommandContext = {
      process: {
        stdout: { write: () => true },
        stderr: { write: () => true },
      },
    };

    await handler(mockContext, { flags: { force: true, count: 3 }, args: [] });

    expect(receivedFlags).toEqual({ force: true, count: 3 });
  });

  test("handler receives args in params object", async () => {
    const params = defineParameters({
      flags: {},
      positional: {
        kind: "tuple",
        parameters: [
          { brief: "Source", parse: String, placeholder: "source" },
          { brief: "Dest", parse: String, placeholder: "dest" },
        ],
      },
    });

    let receivedArgs: [string, string] | undefined;

    const handler = defineHandler<typeof params>((_context, { args }) => {
      receivedArgs = args;
    });

    const mockContext: CommandContext = {
      process: {
        stdout: { write: () => true },
        stderr: { write: () => true },
      },
    };

    await handler(mockContext, { flags: {}, args: ["src.txt", "dst.txt"] });

    expect(receivedArgs).toEqual(["src.txt", "dst.txt"]);
  });

  test("supports destructuring both flags and args", async () => {
    const params = defineParameters({
      flags: {
        force: { kind: "boolean", brief: "Force" },
        verbose: { kind: "boolean", brief: "Verbose" },
      },
      positional: {
        kind: "tuple",
        parameters: [
          { brief: "Source", parse: String, placeholder: "source" },
          { brief: "Dest", parse: String, placeholder: "dest", optional: true },
        ],
      },
    });

    let capturedValues: {
      force?: boolean;
      verbose?: boolean;
      source?: string;
      dest?: string | undefined;
    } = {};

    const handler = defineHandler<typeof params>(
      (_context, { flags: { force, verbose }, args: [source, dest] }) => {
        capturedValues = {
          force,
          verbose,
          source,
          dest,
        };
      },
    );

    const mockContext: CommandContext = {
      process: {
        stdout: { write: () => true },
        stderr: { write: () => true },
      },
    };

    await handler(mockContext, {
      flags: { force: true, verbose: false },
      args: ["input.txt", undefined],
    });

    expect(capturedValues.force).toBe(true);
    expect(capturedValues.verbose).toBe(false);
    expect(capturedValues.source).toBe("input.txt");
    expect(capturedValues.dest).toBeUndefined();
  });

  test("handler can return void", () => {
    const params = defineParameters({ flags: {} });
    const handler = defineHandler<typeof params>(() => {
      // synchronous, returns void
    });

    const mockContext: CommandContext = {
      process: {
        stdout: { write: () => true },
        stderr: { write: () => true },
      },
    };

    const result = handler(mockContext, { flags: {}, args: [] });
    expect(result).toBeUndefined();
  });

  test("handler can return Promise<void>", async () => {
    const params = defineParameters({ flags: {} });
    const handler = defineHandler<typeof params>(async () => {
      await Promise.resolve();
    });

    const mockContext: CommandContext = {
      process: {
        stdout: { write: () => true },
        stderr: { write: () => true },
      },
    };

    const result = handler(mockContext, { flags: {}, args: [] });
    expect(result).toBeInstanceOf(Promise);
    await result;
  });

  test("supports all flag kinds with destructuring", async () => {
    const params = defineParameters({
      flags: {
        dryRun: { kind: "boolean", brief: "Dry run" },
        verbosity: { kind: "counter", brief: "Verbosity" },
        format: {
          kind: "enum",
          values: ["json", "yaml", "toml"] as const,
          brief: "Format",
        },
        port: { kind: "parsed", parse: Number, brief: "Port" },
        host: { kind: "parsed", parse: String, brief: "Host", optional: true },
      },
    });

    let capturedFlags: {
      dryRun?: boolean;
      verbosity?: number;
      format?: "json" | "yaml" | "toml";
      port?: number;
      host?: string | undefined;
    } = {};

    const handler = defineHandler<typeof params>(
      (_context, { flags: { dryRun, verbosity, format, port, host } }) => {
        capturedFlags = {
          dryRun,
          verbosity,
          format,
          port,
          host,
        };
      },
    );

    const mockContext: CommandContext = {
      process: {
        stdout: { write: () => true },
        stderr: { write: () => true },
      },
    };

    await handler(mockContext, {
      flags: {
        dryRun: false,
        verbosity: 2,
        format: "yaml",
        port: 8080,
        host: "localhost",
      },
      args: [],
    });

    expect(capturedFlags.dryRun).toBe(false);
    expect(capturedFlags.verbosity).toBe(2);
    expect(capturedFlags.format).toBe("yaml");
    expect(capturedFlags.port).toBe(8080);
    expect(capturedFlags.host).toBe("localhost");
  });

  test("supports multiple positional arguments with custom parsers", async () => {
    const params = defineParameters({
      flags: {},
      positional: {
        kind: "tuple",
        parameters: [
          { brief: "Name", parse: String, placeholder: "name" },
          { brief: "Age", parse: Number, placeholder: "age" },
          {
            brief: "Active",
            parse: (s: string) => s === "true",
            placeholder: "active",
            optional: true,
          },
        ],
      },
    });

    let capturedArgs: [string, number, boolean | undefined] | undefined;

    const handler = defineHandler<typeof params>((_context, { args }) => {
      capturedArgs = args;
    });

    const mockContext: CommandContext = {
      process: {
        stdout: { write: () => true },
        stderr: { write: () => true },
      },
    };

    await handler(mockContext, {
      flags: {},
      args: ["John", 30, true],
    });

    expect(capturedArgs?.[0]).toBe("John");
    expect(capturedArgs?.[1]).toBe(30);
    expect(capturedArgs?.[2]).toBe(true);
  });
});

// ============================================================================
// Tests for Stricli-specific features
// ============================================================================

describe("Variadic flags", () => {
  test("variadic enum flag extracts array type", () => {
    const params = defineParameters({
      flags: {
        formats: {
          kind: "enum",
          values: ["json", "yaml", "toml"] as const,
          brief: "Output formats",
          variadic: true,
          optional: true,
        },
      },
    });

    type Flags = ExtractFlags<typeof params>;
    const flags: Flags = { formats: ["json", "yaml"] };
    expect(Array.isArray(flags.formats)).toBe(true);
    expect(flags.formats).toEqual(["json", "yaml"]);
  });

  test("variadic enum flag with separator extracts array type", () => {
    const params = defineParameters({
      flags: {
        formats: {
          kind: "enum",
          values: ["json", "yaml", "toml"] as const,
          brief: "Output formats (comma-separated)",
          variadic: ",",
          optional: true,
        },
      },
    });

    type Flags = ExtractFlags<typeof params>;
    const flags: Flags = { formats: ["json", "toml"] };
    expect(Array.isArray(flags.formats)).toBe(true);
  });

  test("variadic parsed flag extracts array type", () => {
    const params = defineParameters({
      flags: {
        ports: {
          kind: "parsed",
          parse: Number,
          brief: "Port numbers",
          variadic: true,
          optional: true,
        },
      },
    });

    type Flags = ExtractFlags<typeof params>;
    const flags: Flags = { ports: [8080, 3000, 9000] };
    expect(Array.isArray(flags.ports)).toBe(true);
    expect(flags.ports).toEqual([8080, 3000, 9000]);
  });

  test("variadic parsed flag with separator extracts array type", () => {
    const params = defineParameters({
      flags: {
        tags: {
          kind: "parsed",
          parse: String,
          brief: "Tags (comma-separated)",
          variadic: ",",
          optional: true,
        },
      },
    });

    type Flags = ExtractFlags<typeof params>;
    const flags: Flags = { tags: ["tag1", "tag2", "tag3"] };
    expect(Array.isArray(flags.tags)).toBe(true);
  });

  test("non-variadic enum flag extracts single value type", () => {
    const params = defineParameters({
      flags: {
        format: {
          kind: "enum",
          values: ["json", "yaml"] as const,
          brief: "Format",
        },
      },
    });

    type Flags = ExtractFlags<typeof params>;
    const flags: Flags = { format: "json" };
    expect(typeof flags.format).toBe("string");
    expect(flags.format).toBe("json");
  });

  test("non-variadic parsed flag extracts single value type", () => {
    const params = defineParameters({
      flags: {
        port: {
          kind: "parsed",
          parse: Number,
          brief: "Port",
        },
      },
    });

    type Flags = ExtractFlags<typeof params>;
    const flags: Flags = { port: 8080 };
    expect(typeof flags.port).toBe("number");
  });
});

describe("Flag-level aliases", () => {
  test("preserves flag aliases", () => {
    const params = defineParameters({
      flags: {
        force: { kind: "boolean", brief: "Force" },
        verbose: { kind: "boolean", brief: "Verbose" },
      },
      aliases: {
        f: "force",
        v: "verbose",
      },
    });

    expect(params.aliases.f).toBe("force");
    expect(params.aliases.v).toBe("verbose");
  });

  test("flag aliases are typed to flag names", () => {
    const params = defineParameters({
      flags: {
        force: { kind: "boolean", brief: "Force" },
        verbose: { kind: "boolean", brief: "Verbose" },
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
      } as const,
    });

    // Type check - aliases map to valid flag names
    type AliasKeys = keyof NonNullable<typeof params.aliases>;
    type ExpectedAliases = "f" | "v" | "o";
    const _check: AliasKeys = "f" as ExpectedAliases;
    expect(_check).toBe("f");
  });
});

describe("Hidden flags", () => {
  test("preserves hidden property on boolean flags", () => {
    const params = defineParameters({
      flags: {
        debug: {
          kind: "boolean",
          brief: "Debug mode",
          default: false,
          hidden: true,
        },
      },
    });

    expect(params.flags.debug.hidden).toBe(true);
    expect(params.flags.debug.default).toBe(false);
  });

  test("preserves hidden property on optional parsed flags", () => {
    const params = defineParameters({
      flags: {
        internal: {
          kind: "parsed",
          parse: String,
          brief: "Internal option",
          optional: true,
          hidden: true,
        },
      },
    });

    expect(params.flags.internal.hidden).toBe(true);
  });
});

describe("Boolean flag with negation", () => {
  test("preserves withNegated property", () => {
    const params = defineParameters({
      flags: {
        color: {
          kind: "boolean",
          brief: "Enable color output",
          default: true,
          withNegated: true,
        },
      },
    });

    expect(params.flags.color.withNegated).toBe(true);
    expect(params.flags.color.default).toBe(true);
  });

  test("withNegated can be set to false to disable negation", () => {
    const params = defineParameters({
      flags: {
        verbose: {
          kind: "boolean",
          brief: "Verbose",
          default: true,
          withNegated: false,
        },
      },
    });

    expect(params.flags.verbose.withNegated).toBe(false);
  });
});

describe("Parsed flag with inferEmpty", () => {
  test("preserves inferEmpty property", () => {
    const params = defineParameters({
      flags: {
        config: {
          kind: "parsed",
          parse: String,
          brief: "Config file",
          inferEmpty: true,
        },
      },
    });

    expect(params.flags.config.inferEmpty).toBe(true);
  });
});

describe("proposeCompletions", () => {
  test("preserves proposeCompletions on parsed flags", () => {
    const completionFn = () => ["option1", "option2"];
    const params = defineParameters({
      flags: {
        file: {
          kind: "parsed",
          parse: String,
          brief: "File path",
          proposeCompletions: completionFn,
        },
      },
    });

    expect(params.flags.file.proposeCompletions).toBe(completionFn);
  });

  test("preserves proposeCompletions on positional parameters", () => {
    const completionFn = () => ["file1.txt", "file2.txt"];
    const params = defineParameters({
      flags: {},
      positional: {
        kind: "tuple",
        parameters: [
          {
            brief: "File",
            parse: String,
            placeholder: "file",
            proposeCompletions: completionFn,
          },
        ],
      },
    });

    expect(params.positional.parameters[0].proposeCompletions).toBe(
      completionFn,
    );
  });
});

describe("Array positional bounds", () => {
  test("preserves minimum constraint", () => {
    const params = defineParameters({
      flags: {},
      positional: {
        kind: "array",
        parameter: { brief: "Files", parse: String, placeholder: "file" },
        minimum: 1,
      },
    });

    expect(params.positional.minimum).toBe(1);
  });

  test("preserves maximum constraint", () => {
    const params = defineParameters({
      flags: {},
      positional: {
        kind: "array",
        parameter: { brief: "Files", parse: String, placeholder: "file" },
        maximum: 5,
      },
    });

    expect(params.positional.maximum).toBe(5);
  });

  test("preserves both minimum and maximum constraints", () => {
    const params = defineParameters({
      flags: {},
      positional: {
        kind: "array",
        parameter: { brief: "Files", parse: String, placeholder: "file" },
        minimum: 2,
        maximum: 10,
      },
    });

    expect(params.positional.minimum).toBe(2);
    expect(params.positional.maximum).toBe(10);
  });
});

describe("Positional default values", () => {
  test("preserves default value on tuple parameter", () => {
    const params = defineParameters({
      flags: {},
      positional: {
        kind: "tuple",
        parameters: [
          {
            brief: "Output",
            parse: String,
            placeholder: "output",
            default: "stdout",
          },
        ],
      },
    });

    expect(params.positional.parameters[0].default).toBe("stdout");
  });

  test("positional with default extracts non-undefined type", () => {
    const params = defineParameters({
      flags: {},
      positional: {
        kind: "tuple",
        parameters: [
          {
            brief: "Format",
            parse: String,
            placeholder: "format",
            default: "json",
          },
        ],
      },
    });

    type Args = ExtractArgs<typeof params>;
    // With default, type should be string (not string | undefined)
    const args: Args = ["yaml"];
    expect(typeof args[0]).toBe("string");
  });

  test("optional positional without default extracts T | undefined", () => {
    const params = defineParameters({
      flags: {},
      positional: {
        kind: "tuple",
        parameters: [
          {
            brief: "Format",
            parse: String,
            placeholder: "format",
            optional: true,
          },
        ],
      },
    });

    type Args = ExtractArgs<typeof params>;
    const argsWithValue: Args = ["yaml"];
    const argsWithUndefined: Args = [undefined];
    expect(argsWithValue[0]).toBe("yaml");
    expect(argsWithUndefined[0]).toBeUndefined();
  });
});

describe("Flag default values", () => {
  test("preserves default value on parsed flag", () => {
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

    expect(params.flags.port.default).toBe("8080");
  });

  test("preserves default value on enum flag", () => {
    const params = defineParameters({
      flags: {
        format: {
          kind: "enum",
          values: ["json", "yaml"] as const,
          brief: "Format",
          default: "json",
        },
      },
    });

    expect(params.flags.format.default).toBe("json");
  });

  test("preserves array default on variadic enum flag", () => {
    const params = defineParameters({
      flags: {
        formats: {
          kind: "enum",
          values: ["json", "yaml", "toml"] as const,
          brief: "Formats",
          variadic: true,
          optional: true,
          default: ["json", "yaml"] as const,
        },
      },
    });

    expect(params.flags.formats.default).toEqual(["json", "yaml"]);
  });

  test("preserves array default on variadic parsed flag", () => {
    const params = defineParameters({
      flags: {
        ports: {
          kind: "parsed",
          parse: Number,
          brief: "Ports",
          variadic: true,
          optional: true,
          default: ["8080", "3000"],
        },
      },
    });

    expect(params.flags.ports.default).toEqual(["8080", "3000"]);
  });
});

describe("Placeholder property", () => {
  test("preserves placeholder on flags", () => {
    const params = defineParameters({
      flags: {
        config: {
          kind: "parsed",
          parse: String,
          brief: "Config file",
          placeholder: "path",
        },
      },
    });

    expect(params.flags.config.placeholder).toBe("path");
  });

  test("preserves placeholder on positional parameters", () => {
    const params = defineParameters({
      flags: {},
      positional: {
        kind: "tuple",
        parameters: [
          { brief: "Source", parse: String, placeholder: "src" },
          { brief: "Destination", parse: String, placeholder: "dst" },
        ],
      },
    });

    expect(params.positional.parameters[0].placeholder).toBe("src");
    expect(params.positional.parameters[1].placeholder).toBe("dst");
  });
});

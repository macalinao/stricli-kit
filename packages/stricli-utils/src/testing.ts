import type { CommandContext } from "@stricli/core";

/**
 * Captured output from a test context.
 */
export interface CapturedOutput {
  /** Lines written to stdout */
  stdout: string[];
  /** Lines written to stderr */
  stderr: string[];
}

/**
 * A mock writable stream that captures output.
 */
interface MockWritable {
  write(data: string | Uint8Array): boolean;
}

/**
 * Test context with captured output.
 */
export interface TestContext extends CommandContext {
  /** Get captured stdout and stderr */
  getOutput(): CapturedOutput;
  /** Clear captured output */
  clearOutput(): void;
  /** Get all stdout as a single string */
  getStdout(): string;
  /** Get all stderr as a single string */
  getStderr(): string;
}

/**
 * Options for creating a test context.
 */
export interface TestContextOptions<
  T extends Record<string, unknown> = Record<string, never>,
> {
  /** Custom properties to add to the context */
  props?: T;
  /** Environment variables (defaults to process.env) */
  env?: Record<string, string>;
  /** Current working directory (defaults to process.cwd()) */
  cwd?: string;
}

/**
 * Create a mock writable stream that captures output to an array.
 */
function createMockWritable(lines: string[]): MockWritable {
  return {
    write(data: string | Uint8Array): boolean {
      const str =
        typeof data === "string" ? data : new TextDecoder().decode(data);
      // Split by newlines but preserve empty strings for blank lines
      const newLines = str.split("\n");
      // If the string ends with a newline, the last element will be empty
      // We don't want to add that as a line
      if (newLines[newLines.length - 1] === "") {
        newLines.pop();
      }
      lines.push(...newLines);
      return true;
    },
  };
}

/**
 * Create a test context for testing CLI commands.
 * Captures stdout and stderr for assertions.
 *
 * @example Basic usage
 * ```typescript
 * import { createTestContext } from "@macalinao/stricli-utils";
 *
 * test("greet command outputs greeting", async () => {
 *   const ctx = createTestContext();
 *
 *   await route.command.run(ctx, {}, "World");
 *
 *   expect(ctx.getStdout()).toContain("Hello, World!");
 * });
 * ```
 *
 * @example With custom context properties
 * ```typescript
 * import { createTestContext } from "@macalinao/stricli-utils";
 *
 * interface AppContext extends CommandContext {
 *   config: { apiUrl: string };
 * }
 *
 * test("command uses config", async () => {
 *   const ctx = createTestContext<{ config: { apiUrl: string } }>({
 *     props: {
 *       config: { apiUrl: "https://api.example.com" },
 *     },
 *   });
 *
 *   await route.command.run(ctx, {}, "test");
 *
 *   expect(ctx.getStdout()).toContain("api.example.com");
 * });
 * ```
 *
 * @example Testing error output
 * ```typescript
 * import { createTestContext } from "@macalinao/stricli-utils";
 *
 * test("command logs error on failure", async () => {
 *   const ctx = createTestContext();
 *
 *   await route.command.run(ctx, { invalid: true }, "test");
 *
 *   expect(ctx.getStderr()).toContain("Error:");
 * });
 * ```
 */
export function createTestContext<
  T extends Record<string, unknown> = Record<string, never>,
>(options?: TestContextOptions<T>): TestContext & T {
  const stdoutLines: string[] = [];
  const stderrLines: string[] = [];

  const base: TestContext = {
    process: {
      stdout: createMockWritable(stdoutLines) as unknown as NodeJS.WriteStream,
      stderr: createMockWritable(stderrLines) as unknown as NodeJS.WriteStream,
    },
    getOutput(): CapturedOutput {
      return {
        stdout: [...stdoutLines],
        stderr: [...stderrLines],
      };
    },
    clearOutput(): void {
      stdoutLines.length = 0;
      stderrLines.length = 0;
    },
    getStdout(): string {
      return stdoutLines.join("\n");
    },
    getStderr(): string {
      return stderrLines.join("\n");
    },
  };

  return { ...base, ...options?.props } as TestContext & T;
}

/**
 * Assert helper for testing command output.
 * Provides fluent assertions for stdout and stderr.
 *
 * @example
 * ```typescript
 * import { createTestContext, assertOutput } from "@macalinao/stricli-utils";
 *
 * test("command output", async () => {
 *   const ctx = createTestContext();
 *   await route.command.run(ctx, {}, "test");
 *
 *   assertOutput(ctx)
 *     .stdoutContains("Success")
 *     .stdoutNotContains("Error")
 *     .stderrIsEmpty();
 * });
 * ```
 */
export function assertOutput(ctx: TestContext): OutputAssertions {
  return new OutputAssertions(ctx);
}

/**
 * Fluent assertions for command output.
 */
export class OutputAssertions {
  private readonly _ctx: TestContext;

  constructor(ctx: TestContext) {
    this._ctx = ctx;
  }

  /** Assert stdout contains the given text */
  stdoutContains(text: string): this {
    const stdout = this._ctx.getStdout();
    if (!stdout.includes(text)) {
      throw new Error(
        `Expected stdout to contain "${text}" but got:\n${stdout || "(empty)"}`,
      );
    }
    return this;
  }

  /** Assert stdout does not contain the given text */
  stdoutNotContains(text: string): this {
    const stdout = this._ctx.getStdout();
    if (stdout.includes(text)) {
      throw new Error(
        `Expected stdout NOT to contain "${text}" but got:\n${stdout}`,
      );
    }
    return this;
  }

  /** Assert stdout is empty */
  stdoutIsEmpty(): this {
    const stdout = this._ctx.getStdout();
    if (stdout.length > 0) {
      throw new Error(`Expected stdout to be empty but got:\n${stdout}`);
    }
    return this;
  }

  /** Assert stdout matches the given regex */
  stdoutMatches(pattern: RegExp): this {
    const stdout = this._ctx.getStdout();
    if (!pattern.test(stdout)) {
      throw new Error(
        `Expected stdout to match ${pattern.toString()} but got:\n${stdout || "(empty)"}`,
      );
    }
    return this;
  }

  /** Assert stderr contains the given text */
  stderrContains(text: string): this {
    const stderr = this._ctx.getStderr();
    if (!stderr.includes(text)) {
      throw new Error(
        `Expected stderr to contain "${text}" but got:\n${stderr || "(empty)"}`,
      );
    }
    return this;
  }

  /** Assert stderr does not contain the given text */
  stderrNotContains(text: string): this {
    const stderr = this._ctx.getStderr();
    if (stderr.includes(text)) {
      throw new Error(
        `Expected stderr NOT to contain "${text}" but got:\n${stderr}`,
      );
    }
    return this;
  }

  /** Assert stderr is empty */
  stderrIsEmpty(): this {
    const stderr = this._ctx.getStderr();
    if (stderr.length > 0) {
      throw new Error(`Expected stderr to be empty but got:\n${stderr}`);
    }
    return this;
  }

  /** Assert stderr matches the given regex */
  stderrMatches(pattern: RegExp): this {
    const stderr = this._ctx.getStderr();
    if (!pattern.test(stderr)) {
      throw new Error(
        `Expected stderr to match ${pattern.toString()} but got:\n${stderr || "(empty)"}`,
      );
    }
    return this;
  }

  /** Assert a specific line in stdout */
  stdoutLine(index: number, expected: string): this {
    const lines = this._ctx.getOutput().stdout;
    if (index >= lines.length) {
      throw new Error(
        `Expected stdout to have at least ${(index + 1).toString()} lines but got ${lines.length.toString()}`,
      );
    }
    const actualLine = lines[index] ?? "";
    if (actualLine !== expected) {
      throw new Error(
        `Expected stdout line ${index.toString()} to be "${expected}" but got "${actualLine}"`,
      );
    }
    return this;
  }

  /** Assert the number of lines in stdout */
  stdoutLineCount(expected: number): this {
    const lines = this._ctx.getOutput().stdout;
    if (lines.length !== expected) {
      throw new Error(
        `Expected stdout to have ${expected.toString()} lines but got ${lines.length.toString()}`,
      );
    }
    return this;
  }
}

/**
 * Run a command handler for testing.
 * This is a convenience wrapper that handles the async execution.
 *
 * @example
 * ```typescript
 * import { createTestContext, runCommand } from "@macalinao/stricli-utils";
 * import { route } from "./greet";
 *
 * test("greet command", async () => {
 *   const ctx = createTestContext();
 *   const result = await runCommand(route.command, ctx, { verbose: true }, "World");
 *
 *   expect(ctx.getStdout()).toContain("Hello, World!");
 * });
 * ```
 */
export async function runCommand<TFlags, TArgs extends unknown[]>(
  command: {
    func: (
      ctx: CommandContext,
      flags: TFlags,
      ...args: TArgs
    ) => void | Promise<void>;
  },
  ctx: CommandContext,
  flags: TFlags,
  ...args: TArgs
): Promise<void> {
  await command.func(ctx, flags, ...args);
}

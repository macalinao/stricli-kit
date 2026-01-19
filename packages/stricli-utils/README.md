# @macalinao/stricli-utils

> Shared utilities for building Stricli CLIs

## Installation

```bash
bun add @macalinao/stricli-utils
```

## Features

- **Parsers** - Pre-built argument parsers for common types
- **Output Helpers** - Formatted console output (success, error, warn, info, json)
- **Extended Context** - Enhanced command context with cwd and env

## Parsers

Ready-to-use parsers for common CLI argument patterns:

### pathParser

Validates file and directory paths with existence checks.

```typescript
import { pathParser } from "@macalinao/stricli-utils";
import { defineRoute, flag } from "@macalinao/stricli-define";

export const route = defineRoute({
  handler: (ctx, { flags }) => {
    console.log(`Processing file: ${flags.input}`);
  },
  params: {
    flags: {
      // Basic path (no validation)
      input: flag.parsed({
        parse: pathParser(),
        brief: "Input file path",
        placeholder: "path",
      }),

      // Must exist and be a file
      config: flag.parsed({
        parse: pathParser({ mustExist: true, type: "file" }),
        brief: "Config file",
        placeholder: "path",
      }),

      // Must exist and be a directory
      output: flag.parsed({
        parse: pathParser({ mustExist: true, type: "directory" }),
        brief: "Output directory",
        placeholder: "dir",
      }),
    },
    positional: { kind: "tuple", parameters: [] },
  },
  docs: { brief: "Process files" },
});
```

**Options:**

| Option      | Type                    | Description                |
| ----------- | ----------------------- | -------------------------- |
| `mustExist` | `boolean`               | Require the path to exist  |
| `type`      | `"file" \| "directory"` | Require specific path type |

**Errors:**

- `Path does not exist: /some/path` - when `mustExist: true` and path missing
- `Path is not a file: /some/dir` - when `type: "file"` and path is directory
- `Path is not a directory: /some/file` - when `type: "directory"` and path is file

### choiceParser

Validates input against a fixed set of allowed values. Use this when you need custom error messages or behavior beyond what `flag.enum()` provides.

```typescript
import { choiceParser } from "@macalinao/stricli-utils";
import { defineRoute, flag } from "@macalinao/stricli-define";

const FORMATS = ["json", "yaml", "toml"] as const;

export const route = defineRoute({
  handler: (ctx, { flags }) => {
    // flags.format is typed as "json" | "yaml" | "toml"
    console.log(`Using format: ${flags.format}`);
  },
  params: {
    flags: {
      format: flag.parsed({
        parse: choiceParser(FORMATS),
        brief: "Output format",
        placeholder: "format",
      }),
    },
    positional: { kind: "tuple", parameters: [] },
  },
  docs: { brief: "Export data" },
});
```

**Errors:**

- `Invalid choice: xml. Valid choices: json, yaml, toml`

### jsonParser

Parses JSON strings into objects. Useful for complex configuration passed as a flag.

```typescript
import { jsonParser } from "@macalinao/stricli-utils";
import { defineRoute, flag } from "@macalinao/stricli-define";

interface Config {
  host: string;
  port: number;
}

export const route = defineRoute({
  handler: (ctx, { flags }) => {
    // flags.config is typed as unknown, cast as needed
    const config = flags.config as Config;
    console.log(`Connecting to ${config.host}:${config.port}`);
  },
  params: {
    flags: {
      config: flag.parsed({
        parse: jsonParser(),
        brief: "JSON configuration",
        placeholder: "json",
      }),
    },
    positional: { kind: "tuple", parameters: [] },
  },
  docs: { brief: "Run with config" },
});
```

**Usage:**

```bash
cli run --config '{"host": "localhost", "port": 3000}'
```

**Errors:**

- `Invalid JSON: not-valid-json`

### globParser

Validates glob patterns (ensures non-empty string).

```typescript
import { globParser } from "@macalinao/stricli-utils";
import { defineRoute, flag } from "@macalinao/stricli-define";

export const route = defineRoute({
  handler: (ctx, { flags }) => {
    console.log(`Matching pattern: ${flags.pattern}`);
  },
  params: {
    flags: {
      pattern: flag.parsed({
        parse: globParser(),
        brief: "Glob pattern",
        placeholder: "pattern",
      }),
    },
    positional: { kind: "tuple", parameters: [] },
  },
  docs: { brief: "Match files" },
});
```

**Usage:**

```bash
cli match --pattern "**/*.ts"
```

**Errors:**

- `Glob pattern cannot be empty`

### zodParser

Parses JSON and validates with a Zod schema. Requires `zod` as a peer dependency.

```typescript
import { z } from "zod";
import { zodParser } from "@macalinao/stricli-utils";
import { defineRoute, flag } from "@macalinao/stricli-define";

const configSchema = z.object({
  host: z.string(),
  port: z.number().int().min(0).max(65535),
  ssl: z.boolean().default(false),
});

export const route = defineRoute({
  handler: (ctx, { flags }) => {
    // flags.config is fully typed based on the Zod schema
    console.log(`Connecting to ${flags.config.host}:${flags.config.port}`);
  },
  params: {
    flags: {
      config: flag.parsed({
        parse: zodParser(configSchema),
        brief: "JSON configuration",
        placeholder: "json",
      }),
    },
    positional: { kind: "tuple", parameters: [] },
  },
  docs: { brief: "Connect with config" },
});
```

**Usage:**

```bash
cli connect --config '{"host": "localhost", "port": 3000}'
```

**Errors:**

- `Invalid JSON: ...` - when input is not valid JSON
- `Validation failed: port: Expected number, received string` - when validation fails

### zodStringParser

Validates raw string input (not JSON) with a Zod schema. Useful for email validation, URL validation, or number coercion.

```typescript
import { z } from "zod";
import { zodStringParser } from "@macalinao/stricli-utils";
import { defineRoute, flag } from "@macalinao/stricli-define";

export const route = defineRoute({
  handler: (ctx, { flags }) => {
    console.log(`Email: ${flags.email}`);
    console.log(`Port: ${flags.port}`);
  },
  params: {
    flags: {
      // String validation
      email: flag.parsed({
        parse: zodStringParser(z.string().email()),
        brief: "Email address",
        placeholder: "email",
      }),
      // Number coercion with validation
      port: flag.parsed({
        parse: zodStringParser(z.coerce.number().int().min(0).max(65535)),
        brief: "Port number",
        placeholder: "port",
      }),
    },
    positional: { kind: "tuple", parameters: [] },
  },
  docs: { brief: "Run server" },
});
```

**Usage:**

```bash
cli server --email user@example.com --port 8080
```

**Errors:**

- `Validation failed: Invalid email` - when email format is invalid
- `Validation failed: Number must be less than or equal to 65535` - when port is out of range

## Output Helpers

Formatted console output with consistent styling:

```typescript
import { createOutput } from "@macalinao/stricli-utils";
import { defineRoute } from "@macalinao/stricli-define";

export const route = defineRoute({
  handler: (ctx, params) => {
    const output = createOutput(ctx);

    output.success("Operation completed!"); // Green checkmark
    output.error("Something went wrong"); // Red X
    output.warn("Proceed with caution"); // Yellow warning
    output.info("Processing..."); // Blue info
    output.json({ key: "value" }); // Formatted JSON
  },
  params: {
    flags: {},
    positional: { kind: "tuple", parameters: [] },
  },
  docs: { brief: "Demo output" },
});
```

**Output Methods:**

| Method    | Color  | Icon | Use Case               |
| --------- | ------ | ---- | ---------------------- |
| `success` | Green  | ✔    | Successful operations  |
| `error`   | Red    | ✖    | Errors and failures    |
| `warn`    | Yellow | ⚠    | Warnings and cautions  |
| `info`    | Blue   | ℹ    | Informational messages |
| `json`    | -      | -    | Structured data output |

## Extended Context

Enhance the command context with commonly-needed properties:

```typescript
import { extendContext } from "@macalinao/stricli-utils";
import { defineRoute } from "@macalinao/stricli-define";

export const route = defineRoute({
  handler: (ctx, params) => {
    const extended = extendContext(ctx);

    console.log(extended.cwd); // Current working directory
    console.log(extended.env.HOME); // Environment variables
    extended.output.success("Done!");
  },
  params: {
    flags: {},
    positional: { kind: "tuple", parameters: [] },
  },
  docs: { brief: "Use extended context" },
});
```

**Extended Properties:**

| Property | Type                     | Description               |
| -------- | ------------------------ | ------------------------- |
| `cwd`    | `string`                 | Current working directory |
| `env`    | `Record<string, string>` | Environment variables     |
| `output` | `Output`                 | Output helpers instance   |

## Writing Custom Parsers

Create your own parsers for domain-specific validation:

```typescript
// Integer parser with range validation
function intParser(min?: number, max?: number) {
  return (value: string): number => {
    const n = parseInt(value, 10);
    if (isNaN(n)) throw new Error(`Not a valid integer: ${value}`);
    if (min !== undefined && n < min) throw new Error(`Must be >= ${min}`);
    if (max !== undefined && n > max) throw new Error(`Must be <= ${max}`);
    return n;
  };
}

// URL parser
function urlParser() {
  return (value: string): URL => {
    try {
      return new URL(value);
    } catch {
      throw new Error(`Invalid URL: ${value}`);
    }
  };
}

// Regex parser
function regexParser() {
  return (value: string): RegExp => {
    try {
      return new RegExp(value);
    } catch {
      throw new Error(`Invalid regex: ${value}`);
    }
  };
}
```

## Testing Utilities

Helpers for testing CLI commands.

### createTestContext

Create a mock context that captures stdout and stderr for testing.

```typescript
import { createTestContext } from "@macalinao/stricli-utils";
import { route } from "./greet";

test("greet command outputs greeting", async () => {
  const ctx = createTestContext();

  // Run the command handler directly
  await route.command.func.call(ctx, { verbose: false }, "World");

  expect(ctx.getStdout()).toContain("Hello, World!");
});
```

### With custom context properties

```typescript
import { createTestContext } from "@macalinao/stricli-utils";
import { route } from "./api-call";

interface AppContext {
  config: { apiUrl: string };
}

test("command uses config", async () => {
  const ctx = createTestContext<{ config: { apiUrl: string } }>({
    props: {
      config: { apiUrl: "https://api.example.com" },
    },
  });

  await route.command.func.call(ctx, {}, "test");

  expect(ctx.getStdout()).toContain("api.example.com");
});
```

### assertOutput

Fluent assertions for command output.

```typescript
import { createTestContext, assertOutput } from "@macalinao/stricli-utils";

test("command output", async () => {
  const ctx = createTestContext();
  await route.command.func.call(ctx, {}, "test");

  assertOutput(ctx)
    .stdoutContains("Success")
    .stdoutNotContains("Error")
    .stderrIsEmpty();
});
```

### Available assertions

| Method              | Description                        |
| ------------------- | ---------------------------------- |
| `stdoutContains`    | Assert stdout contains text        |
| `stdoutNotContains` | Assert stdout doesn't contain text |
| `stdoutIsEmpty`     | Assert stdout is empty             |
| `stdoutMatches`     | Assert stdout matches regex        |
| `stdoutLine`        | Assert specific line content       |
| `stdoutLineCount`   | Assert number of lines             |
| `stderrContains`    | Assert stderr contains text        |
| `stderrNotContains` | Assert stderr doesn't contain text |
| `stderrIsEmpty`     | Assert stderr is empty             |
| `stderrMatches`     | Assert stderr matches regex        |

## License

MIT

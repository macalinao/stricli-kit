# @macalinao/stricli-define

Type-safe helper functions for defining [Stricli](https://stricli.io/) CLI commands with a cleaner API.

## Features

- **Nicer handler signature** - Use `(context, { flags, args })` instead of Stricli's `this`-based approach
- **Full type safety** - TypeScript verifies your handler matches your parameter definitions
- **No type assertions** - Uses Stricli's generic approach for complete type safety
- **Code splitting support** - Lazy load handlers with dynamic imports
- **Minimal wrapper** - Thin layer over Stricli with no runtime overhead

## Installation

```bash
npm install @macalinao/stricli-define @stricli/core
# or
bun add @macalinao/stricli-define @stricli/core
```

## Quick Start

```typescript
import { defineCommand } from "@macalinao/stricli-define";
import { buildApplication, buildRouteMap, run } from "@stricli/core";

// Define a command with typed flags and args
const greetCommand = defineCommand<
  CommandContext,
  { loud: boolean; times: number },
  [string]
>({
  handler: async (context, { flags: { loud, times }, args: [name] }) => {
    for (let i = 0; i < times; i++) {
      const message = loud
        ? `HELLO, ${name.toUpperCase()}!`
        : `Hello, ${name}!`;
      context.process.stdout.write(message + "\n");
    }
  },
  parameters: {
    flags: {
      loud: { kind: "boolean", brief: "Use loud greeting" },
      times: {
        kind: "parsed",
        parse: Number,
        brief: "Times to greet",
        default: "1",
      },
    },
    positional: {
      kind: "tuple",
      parameters: [
        { brief: "Name to greet", parse: String, placeholder: "name" },
      ],
    },
  },
  docs: { brief: "Greet someone" },
});

// Use with Stricli
const app = buildApplication(
  buildRouteMap({
    routes: { greet: greetCommand },
    docs: { brief: "My CLI" },
  }),
  { name: "my-cli" },
);

await run(app, process.argv.slice(2), { process });
```

## API Reference

### `defineCommand`

Creates a Stricli `Command` directly. Use this when working with Stricli's `buildRouteMap` or `buildApplication`.

```typescript
function defineCommand<
  TContext extends CommandContext = CommandContext,
  TFlags extends BaseFlags = Record<string, never>,
  TArgs extends BaseArgs = [],
>(args: DefineCommandArgs<TContext, TFlags, TArgs>): Command<TContext>;
```

**Example with local handler:**

```typescript
const command = defineCommand<CommandContext, { verbose: boolean }, [string]>({
  handler: async (context, { flags: { verbose }, args: [file] }) => {
    if (verbose) console.log(`Processing ${file}...`);
    // ... implementation
  },
  parameters: {
    flags: {
      verbose: { kind: "boolean", brief: "Enable verbose output" },
    },
    positional: {
      kind: "tuple",
      parameters: [
        { brief: "File to process", parse: String, placeholder: "file" },
      ],
    },
  },
  docs: { brief: "Process a file" },
});
```

**Example with lazy loading (code splitting):**

```typescript
const command = defineCommand<CommandContext, { verbose: boolean }, [string]>({
  loader: () => import("./process-handler.js"),
  parameters: {
    flags: {
      verbose: { kind: "boolean", brief: "Enable verbose output" },
    },
    positional: {
      kind: "tuple",
      parameters: [
        { brief: "File to process", parse: String, placeholder: "file" },
      ],
    },
  },
  docs: { brief: "Process a file" },
});

// process-handler.ts
export default async function (context, { flags: { verbose }, args: [file] }) {
  // ... implementation
}
```

### `defineRoute`

Creates a `Route` object containing a command plus routing metadata (aliases, hidden, deprecated). Use this with file-system based routing.

```typescript
function defineRoute<
  TContext extends CommandContext = CommandContext,
  TFlags extends BaseFlags = Record<string, never>,
  TArgs extends BaseArgs = [],
>(args: DefineRouteArgs<TContext, TFlags, TArgs>): Route<TContext>;
```

**Example:**

```typescript
export const route = defineRoute<CommandContext, { force: boolean }, [string]>({
  handler: async (context, { flags: { force }, args: [name] }) => {
    // ... implementation
  },
  parameters: {
    flags: {
      force: { kind: "boolean", brief: "Force operation" },
    },
    positional: {
      kind: "tuple",
      parameters: [
        { brief: "Resource name", parse: String, placeholder: "name" },
      ],
    },
  },
  docs: { brief: "Create a resource" },
  aliases: ["c", "new"], // Route aliases
  hidden: false, // Show in help
  deprecated: undefined, // Not deprecated
});
```

### `defineRouteGroup`

Defines configuration for a route group (used in `__route.ts` files for file-system routing).

```typescript
function defineRouteGroup<const T extends RouteGroupMeta>(config: T): T;
```

**Example:**

```typescript
// commands/users/__route.ts
import { defineRouteGroup } from "@macalinao/stricli-define";

export default defineRouteGroup({
  docs: { brief: "User management commands" },
  aliases: { u: "users" },
});
```

### `defineParameters`

Defines command parameters with full type preservation. Useful for separating parameter definitions.

```typescript
function defineParameters<const TParams>(params: TParams): TParams;
```

**Example:**

```typescript
const parameters = defineParameters({
  flags: {
    force: { kind: "boolean", brief: "Force operation" },
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
      { brief: "Source", parse: String, placeholder: "source" },
      {
        brief: "Destination",
        parse: String,
        placeholder: "dest",
        optional: true,
      },
    ],
  },
});
```

### `defineHandler`

Creates a typed handler function from parameters. Use with `defineParameters` for type inference.

```typescript
function defineHandler<TContext extends CommandContext, const TParams>(
  parameters: TParams,
  handler: CommandHandler<
    TContext,
    ExtractFlags<TParams>,
    ExtractArgs<TParams>
  >,
): CommandHandler<TContext, ExtractFlags<TParams>, ExtractArgs<TParams>>;
```

**Example:**

```typescript
const parameters = defineParameters({
  flags: {
    force: { kind: "boolean", brief: "Force" },
  },
  positional: {
    kind: "tuple",
    parameters: [{ brief: "Name", parse: String, placeholder: "name" }],
  },
});

const handler = defineHandler(
  parameters,
  async (context, { flags: { force }, args: [name] }) => {
    // TypeScript knows: force is boolean, name is string
  },
);
```

## Flag Types

Stricli supports several flag types:

### Boolean Flags

```typescript
{ kind: "boolean", brief: "Enable feature" }
{ kind: "boolean", brief: "Enable feature", default: true }
```

### Counter Flags

```typescript
{ kind: "counter", brief: "Verbosity level" }  // -v -v -v => 3
```

### Enum Flags

```typescript
{
  kind: "enum",
  values: ["json", "yaml", "toml"] as const,
  brief: "Output format",
}
```

### Parsed Flags

```typescript
// Required
{ kind: "parsed", parse: Number, brief: "Port number" }

// Optional
{ kind: "parsed", parse: String, brief: "Config path", optional: true }

// With default (raw string value)
{ kind: "parsed", parse: Number, brief: "Port", default: "3000" }
```

### Variadic Flags

```typescript
// Collects multiple values: --tag a --tag b --tag c => ["a", "b", "c"]
{ kind: "parsed", parse: String, brief: "Tags", variadic: true }

// With separator: --tags a,b,c => ["a", "b", "c"]
{ kind: "parsed", parse: String, brief: "Tags", variadic: "," }
```

## Positional Arguments

### Tuple (fixed arguments)

```typescript
positional: {
  kind: "tuple",
  parameters: [
    { brief: "Source file", parse: String, placeholder: "source" },
    { brief: "Destination", parse: String, placeholder: "dest", optional: true },
  ],
}
```

### Array (variable arguments)

```typescript
positional: {
  kind: "array",
  parameter: { brief: "Files", parse: String, placeholder: "file" },
  minimum: 1,  // At least one file required
}
```

## Handler Signature

All handlers receive two arguments:

1. **`context`** - The command context (extends `CommandContext`)
2. **`params`** - Object containing `{ flags, args }`

```typescript
async (context, { flags, args }) => {
  // context.process.stdout.write("output");
  // flags.myFlag
  // args[0], args[1], etc.
};
```

This is cleaner than Stricli's native `this`-based approach:

```typescript
// Stricli native (this-based)
function(this: Context, flags, ...args) { }

// stricli-define (explicit context)
async (context, { flags, args }) => { }
```

## Type Inference

The package uses Stricli's forward generic approach for type safety. You specify the types explicitly:

```typescript
defineCommand<
  TContext,  // Your context type
  TFlags,    // { flagName: flagType, ... }
  TArgs,     // [arg1Type, arg2Type, ...]
>({ ... })
```

TypeScript verifies that your `parameters` definition matches the declared types.

## Re-exported Types

For convenience, these types are re-exported from `@stricli/core`:

- `BaseArgs`
- `BaseFlags`
- `CommandContext`
- `TypedCommandParameters`

## License

MIT

# Stricli-Kit

A toolkit for building file-based CLIs with [Stricli](https://github.com/bloomberg/stricli), featuring codegen capabilities similar to TanStack Router.

## Features

- **File-Based Routing** - Organize commands in a directory structure that maps directly to CLI routes
- **Automatic Code Generation** - Generate route maps from your command files
- **Watch Mode** - Regenerate routes automatically during development
- **Type Safety** - Full TypeScript support with type inference
- **Modular Packages** - Use only what you need

## Packages

| Package                                          | Description                          |
| ------------------------------------------------ | ------------------------------------ |
| [@macalinao/stricli-kit](./packages/stricli-kit) | Main CLI tool for code generation    |
| [@macalinao/stricli-codegen](./packages/codegen) | Route map code generation library    |
| [@macalinao/stricli-utils](./packages/core)      | Shared utilities for CLI development |
| [@macalinao/stricli-config](./packages/config)   | YAML config and env var management   |
| [@macalinao/progenitor](./packages/progenitor)   | Package and workspace scaffolding    |

## Quick Start

```bash
# Install stricli-kit
bun add @macalinao/stricli-kit

# Generate route map
stricli-kit generate

# Watch mode for development
stricli-kit dev
```

## File-Based Routing

Organize your commands like this:

```
src/commands/
├── index.ts        # Default command
├── new.ts          # `cli new`
├── config/
│   ├── get.ts      # `cli config get`
│   └── set.ts      # `cli config set`
└── __root.ts       # Root route configuration
```

Each file exports a `command` and optional `meta`:

```typescript
import { buildCommand } from "@stricli/core";

export const command = buildCommand({
  func(this, flags, ...args) {
    // Implementation
  },
  parameters: {
    /* ... */
  },
  docs: { brief: "Command description" },
});

export const meta = {
  aliases: ["n", "create"],
};
```

## Development

```bash
bun install
bun run build
bun run lint
bun run test
```

## License

MIT

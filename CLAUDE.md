# Stricli-Kit

A toolkit for building file-based CLIs with Stricli, featuring codegen capabilities similar to TanStack Router.

## Project Structure

```
stricli-kit/
├── apps/
│   └── docs/                   # Fumadocs documentation site
├── packages/
│   ├── config/                 # YAML/env config management
│   ├── codegen/                # Route map code generation
│   ├── core/                   # Shared CLI utilities
│   ├── progenitor/             # Demo CLI - scaffold packages/workspaces
│   └── stricli-kit/            # Main CLI toolkit
├── biome.jsonc                 # Extends @macalinao/biome-config/base
├── eslint.config.js            # Uses @macalinao/eslint-config
├── turbo.json                  # Turborepo configuration
└── package.json                # Bun workspaces
```

## Development

```bash
bun install       # Install dependencies
bun run build     # Build all packages
bun run lint      # Run linting
bun run test      # Run tests
```

## Packages

| Package                    | Description                   |
| -------------------------- | ----------------------------- |
| @macalinao/stricli-kit     | Main CLI for codegen          |
| @macalinao/stricli-codegen | Route map generation library  |
| @macalinao/stricli-utils   | Shared CLI utilities          |
| @macalinao/stricli-config  | YAML + env config management  |
| @macalinao/progenitor      | Package/workspace scaffolding |

## Key Concepts

### File-Based Routing

Commands are organized in `src/commands/`:

- `foo.ts` → `cli foo`
- `foo/bar.ts` → `cli foo bar`
- `__root.ts` → Root route config
- `__route.ts` → Nested route config

### Code Generation

Run `stricli-kit generate` or `stricli-kit dev` to generate route maps from the commands directory.

## Adding Packages

Use progenitor:

```bash
progenitor package new my-package --template library
```

Or use stricli-kit:

```bash
stricli-kit new my-package --template library
```

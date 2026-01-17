# @macalinao/stricli-kit

> Toolkit for building file-based CLIs with Stricli

## Installation

```bash
bun add @macalinao/stricli-kit
```

Or use the CLI globally:

```bash
bunx @macalinao/stricli-kit --help
```

## CLI Commands

### `stricli-kit new <name>`

Create a new package in the monorepo.

```bash
stricli-kit new my-package --template library --scope @myorg
```

**Flags:**

- `--template` - Package template: `base`, `command`, or `library` (default: `library`)
- `--dir` - Output directory (default: `packages/<name>`)
- `--scope` - npm scope (default: `@macalinao`)

### `stricli-kit generate`

Generate route map from the commands directory.

```bash
stricli-kit generate --commandsDir src/commands --output src/generated/route-map.ts
```

### `stricli-kit dev`

Watch mode - regenerates route map on file changes.

```bash
stricli-kit dev --commandsDir src/commands --output src/generated/route-map.ts
```

### `stricli-kit test`

Run tests via bun test.

```bash
stricli-kit test --watch
```

### `stricli-kit lint`

Run biome + eslint linting.

```bash
stricli-kit lint --fix
```

## File-Based Routing

Organize your commands in `src/commands/`:

```
src/commands/
├── index.ts        # Default command
├── new.ts          # `cli new`
├── config/
│   ├── get.ts      # `cli config get`
│   ├── set.ts      # `cli config set`
│   └── __route.ts  # Route config for config group
└── __root.ts       # Root route config
```

## License

MIT

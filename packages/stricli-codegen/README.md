# @macalinao/stricli-codegen

> File-based routing code generation for Stricli CLIs

## Installation

```bash
bun add @macalinao/stricli-codegen
```

## Usage

### One-time Generation

```typescript
import { generateRouteMap } from "@macalinao/stricli-codegen";

await generateRouteMap({
  commandsDir: "src/commands",
  outputPath: "src/generated/route-map.ts",
});
```

### Watch Mode

```typescript
import { createRouteWatcher } from "@macalinao/stricli-codegen";

const watcher = createRouteWatcher({
  commandsDir: "src/commands",
  outputPath: "src/generated/route-map.ts",
  onRegenerate: (changedFiles) => {
    console.log(`Regenerated (${changedFiles.length} files changed)`);
  },
});

await watcher.start();

// Later...
await watcher.stop();
```

## File-Based Routing Convention

| File Pattern              | Route                        |
| ------------------------- | ---------------------------- |
| `commands/index.ts`       | Default command              |
| `commands/foo.ts`         | `cli foo`                    |
| `commands/foo/bar.ts`     | `cli foo bar`                |
| `commands/foo/__route.ts` | Route config for `foo` group |
| `commands/__root.ts`      | Root route config            |

## Command File Format

```typescript
import { buildCommand } from "@stricli/core";

// Required export
export const command = buildCommand({
  func(this, flags, ...args) {
    // Implementation
  },
  parameters: {
    flags: {},
    positional: { kind: "tuple", parameters: [] },
  },
  docs: {
    brief: "Command description",
  },
});

// Optional metadata
export const meta = {
  aliases: ["n", "create"],
  hidden: false,
};
```

## License

MIT

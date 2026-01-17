# @macalinao/stricli-config

> Configuration file management with YAML and environment variable support

## Installation

```bash
bun add @macalinao/stricli-config
```

## Usage

```typescript
import { createConfigManager } from "@macalinao/stricli-config";
import { z } from "zod";

// Define your config schema
const configSchema = z.object({
  apiUrl: z.string().default("https://api.example.com"),
  debug: z.boolean().default(false),
  timeout: z.number().default(5000),
});

type Config = z.infer<typeof configSchema>;

// Create a config manager
const config = createConfigManager<Config>({
  path: "./config.yaml",
  schema: configSchema,
  envPrefix: "MY_CLI_",
});

// Load config (merges file + env vars + defaults)
const settings = await config.load();

// Save config
await config.save({
  apiUrl: "https://new-api.example.com",
  debug: true,
  timeout: 10000,
});
```

## License

MIT

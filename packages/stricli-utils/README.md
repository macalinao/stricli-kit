# @macalinao/stricli-utils

> Shared utilities for building Stricli CLIs

## Installation

```bash
bun add @macalinao/stricli-utils
```

## Usage

### Output Helpers

```typescript
import { buildCommand } from "@stricli/core";
import { createOutput } from "@macalinao/stricli-utils";

export const command = buildCommand({
  func(this, flags) {
    const output = createOutput(this);

    output.success("Operation completed!");
    output.error("Something went wrong");
    output.warn("Proceed with caution");
    output.info("Processing...");
    output.json({ key: "value" });
  },
  // ...
});
```

### Parsers

```typescript
import { pathParser, choiceParser, jsonParser } from "@macalinao/stricli-utils";

// Path parser with validation
const parse = pathParser({ mustExist: true, type: "file" });

// Choice parser for enum-like values
const formatParser = choiceParser(["json", "yaml", "toml"] as const);

// JSON parser
const configParser = jsonParser<{ key: string }>();
```

### Extended Context

```typescript
import { extendContext } from "@macalinao/stricli-utils";

export const command = buildCommand({
  func(this, flags) {
    const ctx = extendContext(this);

    ctx.output.success("Done!");
    console.log(ctx.cwd); // Current working directory
    console.log(ctx.env); // Environment variables
  },
  // ...
});
```

## License

MIT

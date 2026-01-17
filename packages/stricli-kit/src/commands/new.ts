import type { Route } from "@macalinao/stricli-utils";
import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import {
  createOutput,
  defineHandler,
  defineParameters,
  defineRoute,
} from "@macalinao/stricli-utils";

const params = defineParameters({
  flags: {
    template: {
      kind: "enum",
      values: ["base", "command", "library"],
      brief: "Package template to use",
      default: "library",
    },
    dir: {
      kind: "parsed",
      parse: String,
      brief: "Output directory",
      optional: true,
    },
    scope: {
      kind: "parsed",
      parse: String,
      brief: "npm scope",
      default: "@macalinao",
    },
  },
  positional: {
    kind: "tuple",
    parameters: [
      {
        brief: "Package name",
        parse: String,
        placeholder: "name",
      },
    ],
  },
});

const newHandler = defineHandler<typeof params>(async function newHandler(
  ctx,
  { flags: { template, dir, scope }, args: [packageName] },
) {
  const output = createOutput(ctx);
  const targetDir = dir ?? `packages/${packageName}`;
  const fullName = `${scope}/${packageName}`;

  if (existsSync(targetDir)) {
    output.error(`Directory already exists: ${targetDir}`);
    return;
  }

  output.info(`Creating package ${fullName} at ${targetDir}...`);

  // Create directory structure
  await mkdir(join(targetDir, "src"), { recursive: true });

  // package.json
  const packageJson: Record<string, unknown> = {
    name: fullName,
    version: "0.1.0",
    type: "module",
    sideEffects: false,
    exports: {
      ".": {
        types: "./dist/index.d.ts",
        default: "./dist/index.js",
      },
    },
    main: "dist/index.js",
    types: "dist/index.d.ts",
    scripts: {
      build: "tsc",
      clean: "rm -rf dist",
      lint: "eslint .",
      test: "bun test",
    },
    devDependencies: {
      "@macalinao/tsconfig": "workspace:^",
      typescript: "catalog:",
    },
    publishConfig: {
      registry: "https://registry.npmjs.org/",
      access: "public",
    },
  };

  if (template === "command") {
    Object.assign(packageJson, {
      bin: {
        [packageName]: "./dist/bin/cli.js",
      },
      dependencies: {
        "@macalinao/stricli-codegen": "workspace:^",
        "@macalinao/stricli-utils": "workspace:^",
        "@stricli/core": "catalog:",
      },
    });
  }

  await writeFile(
    join(targetDir, "package.json"),
    JSON.stringify(packageJson, null, 2),
  );

  // tsconfig.json
  const tsconfig = {
    extends: "@macalinao/tsconfig/tsconfig.bun.json",
    compilerOptions: {
      outDir: "dist",
      rootDir: "src",
    },
    include: ["src"],
  };
  await writeFile(
    join(targetDir, "tsconfig.json"),
    JSON.stringify(tsconfig, null, 2),
  );

  // eslint.config.js
  const eslintConfig = `import { configs } from "@macalinao/eslint-config";

export default [
  ...configs.fast,
  {
    languageOptions: {
      parserOptions: {
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
];
`;
  await writeFile(join(targetDir, "eslint.config.js"), eslintConfig);

  // src/index.ts
  const indexTs = "export {};\n";
  await writeFile(join(targetDir, "src/index.ts"), indexTs);

  // README.md
  const readme = `# ${fullName}

> Package description here

## Installation

\`\`\`bash
bun add ${fullName}
\`\`\`

## Usage

\`\`\`typescript
import { } from "${fullName}";
\`\`\`

## License

MIT
`;
  await writeFile(join(targetDir, "README.md"), readme);

  output.success(`Created package ${fullName} at ${targetDir}`);
  output.info("Run `bun install` to link the new package");
});

export const route: Route = defineRoute({
  handler: newHandler,
  params,
  docs: {
    brief: "Create a new package in the monorepo",
  },
  aliases: ["n", "create"],
});

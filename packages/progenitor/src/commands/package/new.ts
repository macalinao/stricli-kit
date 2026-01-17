import type { Route } from "@macalinao/stricli-kit";
import type { AppContext } from "../../generated/create-file-route.js";
import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { createOutput } from "@macalinao/stricli-kit";
import { buildCommand } from "@stricli/core";
import { createFileRoute } from "../../generated/create-file-route.js";

interface Flags {
  template: "base" | "command" | "library";
  dir: string | undefined;
  scope: string | undefined;
  description: string | undefined;
}

async function newHandler(
  this: AppContext,
  flags: Flags,
  packageName: string,
): Promise<void> {
  const output = createOutput(this);
  const template = flags.template;
  // Use scope from flags, or derive from workspace name
  const scope = flags.scope ?? `@${this.workspace.name}`;
  const dir = flags.dir ?? `packages/${packageName}`;
  const fullName = `${scope}/${packageName}`;
  const description = flags.description ?? "Package description here";

  if (existsSync(dir)) {
    output.error(`Directory already exists: ${dir}`);
    return;
  }

  output.info(`Creating package ${fullName} at ${dir}...`);

  // Create directory structure
  await mkdir(join(dir, "src"), { recursive: true });

  // package.json
  const packageJson: Record<string, unknown> = {
    name: fullName,
    version: "0.1.0",
    description,
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
    packageJson.bin = {
      [packageName]: "./dist/bin/cli.js",
    };
    packageJson.dependencies = {
      "@macalinao/stricli-codegen": "workspace:^",
      "@macalinao/stricli-kit": "workspace:^",
      "@stricli/core": "catalog:",
    };
  }

  await writeFile(
    join(dir, "package.json"),
    `${JSON.stringify(packageJson, null, 2)}\n`,
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
    join(dir, "tsconfig.json"),
    `${JSON.stringify(tsconfig, null, 2)}\n`,
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
  await writeFile(join(dir, "eslint.config.js"), eslintConfig);

  // src/index.ts
  const indexTs = "export {};\n";
  await writeFile(join(dir, "src/index.ts"), indexTs);

  // README.md
  const readme = `# ${fullName}

> ${description}

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
  await writeFile(join(dir, "README.md"), readme);

  output.success(`Created package ${fullName} at ${dir}`);
  output.info("Run `bun install` to link the new package");
}

export const route: Route<AppContext> = createFileRoute({
  command: buildCommand({
    func: newHandler,
    parameters: {
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
          brief: "npm scope (defaults to @workspace-name)",
          optional: true,
        },
        description: {
          kind: "parsed",
          parse: String,
          brief: "Package description for README and package.json",
          optional: true,
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
    },
    docs: {
      brief: "Create a new package with @macalinao configs",
    },
  }),
});

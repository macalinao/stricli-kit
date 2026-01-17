import type { Route } from "@macalinao/stricli-kit";
import type { AppContext } from "../../generated/create-file-route.js";
import { mkdir, writeFile } from "node:fs/promises";
import { basename, join } from "node:path";
import { createOutput } from "@macalinao/stricli-kit";
import { buildCommand } from "@stricli/core";
import { createFileRoute } from "../../generated/create-file-route.js";

interface Flags {
  name: string | undefined;
  scope: string | undefined;
  noTurbo: boolean;
  noHusky: boolean;
  noDevenv: boolean;
}

async function initHandler(this: AppContext, flags: Flags): Promise<void> {
  const output = createOutput(this);
  const cwd = this.cwd;
  const name = flags.name ?? basename(cwd);
  // Use scope from flags, or derive from workspace name
  const scope = flags.scope ?? `@${this.workspace.name}`;

  output.info(`Initializing workspace "${name}"...`);

  // Create directories
  await mkdir(join(cwd, "packages"), { recursive: true });
  await mkdir(join(cwd, "apps"), { recursive: true });

  // Root package.json
  const packageJson: Record<string, unknown> = {
    name,
    private: true,
    version: "0.1.0",
    packageManager: "bun@1.3.6",
    workspaces: {
      packages: ["packages/*", "apps/*"],
      catalog: {
        typescript: "^5.9.2",
      },
    },
    scripts: {
      build: "turbo run build",
      clean: "turbo run clean",
      lint: "biome check && turbo run lint",
      "lint:fix": "biome check --write --unsafe && turbo run lint -- --fix",
      format: "biome format --write",
      test: "turbo run test",
      prepare: "husky",
    },
    devDependencies: {
      "@biomejs/biome": "^2.3.10",
      "@macalinao/biome-config": "^0.1.7",
      "@macalinao/eslint-config": "^7.0.3",
      "@macalinao/tsconfig": "^3.2.5",
      husky: "^9.1.7",
      "lint-staged": "^16.2.7",
      prettier: "^3.7.4",
      turbo: "^2.6.3",
      typescript: "catalog:",
    },
    engines: {
      node: ">=22",
      bun: ">=1.0.0",
    },
    "lint-staged": {
      "*.{js,jsx,ts,tsx,cjs,mjs,cts,mts}": [
        "biome check --write --no-errors-on-unmatched",
        "eslint --fix --cache",
      ],
      "*.{md,yml,yaml}": "prettier --write",
      "*.{json,jsonc,html}": "biome format --write --no-errors-on-unmatched",
    },
  };

  if (flags.noHusky) {
    delete packageJson.scripts;
    const scripts = { ...(packageJson.scripts as Record<string, string>) };
    delete scripts.prepare;
    packageJson.scripts = scripts;
    delete packageJson["lint-staged"];
    const devDeps = packageJson.devDependencies as Record<string, string>;
    delete devDeps.husky;
    delete devDeps["lint-staged"];
  }

  if (flags.noTurbo) {
    const devDeps = packageJson.devDependencies as Record<string, string>;
    delete devDeps.turbo;
    const scripts = packageJson.scripts as Record<string, string>;
    scripts.build = "tsc -b";
    scripts.clean = "rm -rf packages/*/dist apps/*/dist";
    scripts.lint = "biome check && eslint .";
    scripts["lint:fix"] = "biome check --write --unsafe && eslint . --fix";
    scripts.test = "bun test";
  }

  await writeFile(
    join(cwd, "package.json"),
    `${JSON.stringify(packageJson, null, 2)}\n`,
  );

  // biome.jsonc
  const biomeConfig = `{
  "extends": ["@macalinao/biome-config/base"]
}
`;
  await writeFile(join(cwd, "biome.jsonc"), biomeConfig);

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
  await writeFile(join(cwd, "eslint.config.js"), eslintConfig);

  // tsconfig.json
  const tsconfig = {
    extends: "@macalinao/tsconfig/tsconfig.bun.json",
  };
  await writeFile(
    join(cwd, "tsconfig.json"),
    `${JSON.stringify(tsconfig, null, 2)}\n`,
  );

  // turbo.json
  if (!flags.noTurbo) {
    const turboConfig = {
      $schema: "https://turbo.build/schema.json",
      tasks: {
        build: {
          outputs: ["./dist/**"],
          dependsOn: ["^build"],
        },
        clean: {
          cache: false,
        },
        test: {
          dependsOn: ["build"],
          cache: false,
        },
        lint: {
          dependsOn: ["^build"],
        },
      },
    };
    await writeFile(
      join(cwd, "turbo.json"),
      `${JSON.stringify(turboConfig, null, 2)}\n`,
    );
  }

  // .husky/pre-commit
  if (!flags.noHusky) {
    await mkdir(join(cwd, ".husky"), { recursive: true });
    await writeFile(join(cwd, ".husky/pre-commit"), "bun lint-staged\n");
  }

  // .gitignore
  const gitignore = `# Dependencies
node_modules/

# Build output
dist/
*.tsbuildinfo
.turbo/

# IDE
.idea/
.vscode/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Logs
*.log
npm-debug.log*

# Test coverage
coverage/

# Environment
.env
.env.local
.env.*.local

# Cache
.eslintcache
.cache/

# Lock files (use bun.lock)
package-lock.json
yarn.lock
pnpm-lock.yaml

# Generated
*.generated.*
`;
  await writeFile(join(cwd, ".gitignore"), gitignore);

  // devenv.nix
  if (!flags.noDevenv) {
    const devenvNix = `{ pkgs, ... }:

{
  packages = with pkgs; [
    bun
    nodejs_24
    ast-grep
  ];

  languages.typescript.enable = true;

  # Add your CLI aliases here
  # scripts.my-cli.exec = ''
  #   bun "$DEVENV_ROOT/packages/my-cli/dist/bin/cli.js" "$@"
  # '';

  enterShell = ''
    echo "Welcome to ${name}!"
  '';
}
`;
    await writeFile(join(cwd, "devenv.nix"), devenvNix);

    // devenv.yaml
    const devenvYaml = `inputs:
  nixpkgs:
    url: github:cachix/devenv-nixpkgs/rolling
`;
    await writeFile(join(cwd, "devenv.yaml"), devenvYaml);

    // devenv.lock (empty placeholder)
    await writeFile(join(cwd, "devenv.lock"), "");
  }

  // CLAUDE.md
  const claudeMd = `# ${name}

## Project Overview

This is a Bun monorepo workspace.

## Structure

- \`packages/\` - Shared packages
- \`apps/\` - Applications

## Development

\`\`\`bash
bun install       # Install dependencies
bun run build     # Build all packages
bun run lint      # Run linting
bun run test      # Run tests
\`\`\`

## Adding a new package

Use progenitor to create a new package:

\`\`\`bash
progenitor package new my-package --scope ${scope}
\`\`\`
`;
  await writeFile(join(cwd, "CLAUDE.md"), claudeMd);

  // README.md
  const readme = `# ${name}

## Getting Started

\`\`\`bash
bun install
bun run build
\`\`\`

## Development

\`\`\`bash
bun run lint      # Check linting
bun run lint:fix  # Fix linting issues
bun run test      # Run tests
\`\`\`

## License

MIT
`;
  await writeFile(join(cwd, "README.md"), readme);

  output.success(`Initialized workspace "${name}"`);
  output.info("Run `bun install` to install dependencies");
}

export const route: Route<AppContext> = createFileRoute({
  command: buildCommand({
    func: initHandler,
    parameters: {
      flags: {
        name: {
          kind: "parsed",
          parse: String,
          brief: "Workspace name (default: directory name)",
          optional: true,
        },
        scope: {
          kind: "parsed",
          parse: String,
          brief: "Default npm scope (defaults to @workspace-name)",
          optional: true,
        },
        noTurbo: {
          kind: "boolean",
          brief: "Skip turborepo setup",
        },
        noHusky: {
          kind: "boolean",
          brief: "Skip husky/lint-staged setup",
        },
        noDevenv: {
          kind: "boolean",
          brief: "Skip devenv.nix setup",
        },
      },
    },
    docs: {
      brief: "Initialize a new Bun workspace monorepo",
    },
  }),
});

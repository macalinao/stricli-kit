# @macalinao/progenitor

> Scaffold packages and workspaces with @macalinao configs

Progenitor is a CLI tool for creating new packages and initializing monorepo workspaces with standardized configuration using `@macalinao/tsconfig`, `@macalinao/eslint-config`, and `@macalinao/biome-config`.

## Installation

```bash
bun add -g @macalinao/progenitor
```

Or use directly with bunx:

```bash
bunx @macalinao/progenitor --help
```

## Commands

### `progenitor package new <name>`

Create a new package in the monorepo.

```bash
progenitor package new my-package
progenitor package new my-cli --template command
progenitor package new utils --description "Shared utilities" --scope @myorg
```

**Flags:**

- `--template` - Package template: `base`, `command`, or `library` (default: `library`)
- `--dir` - Output directory (default: `packages/<name>`)
- `--scope` - npm scope (default: `@macalinao`)
- `--description` - Package description

### `progenitor workspace init`

Initialize a new Bun workspace monorepo.

```bash
progenitor workspace init
progenitor workspace init --name my-project --scope @mycompany
progenitor workspace init --no-devenv  # Skip devenv.nix
```

**Flags:**

- `--name` - Workspace name (default: directory name)
- `--scope` - Default npm scope (default: `@macalinao`)
- `--no-turbo` - Skip turborepo setup
- `--no-husky` - Skip husky/lint-staged setup
- `--no-devenv` - Skip devenv.nix/devenv.yaml setup

## What Gets Created

### Package (`progenitor package new`)

- `package.json` - Configured with proper exports and scripts
- `tsconfig.json` - Extends `@macalinao/tsconfig/tsconfig.bun.json`
- `eslint.config.js` - Uses `@macalinao/eslint-config`
- `README.md` - Basic documentation template
- `src/index.ts` - Entry point

### Workspace (`progenitor workspace init`)

- `package.json` - Bun workspaces with catalog
- `biome.jsonc` - Extends `@macalinao/biome-config/base`
- `eslint.config.js` - Uses `@macalinao/eslint-config`
- `tsconfig.json` - Extends `@macalinao/tsconfig/tsconfig.bun.json`
- `turbo.json` - Turborepo task configuration
- `.husky/pre-commit` - Lint-staged hook
- `.gitignore` - Standard ignores
- `devenv.nix` - Nix development environment
- `devenv.yaml` - Devenv inputs configuration
- `CLAUDE.md` - Project documentation for AI assistants
- `README.md` - Project documentation
- `packages/` - Empty packages directory
- `apps/` - Empty apps directory

## Claude Code Integration

Progenitor includes Claude Code skills for AI-assisted package creation. The skills are located in `.claude/skills/` and enable Claude to:

- Create new packages with the correct configuration
- Initialize new workspaces
- Understand the project structure

## License

MIT

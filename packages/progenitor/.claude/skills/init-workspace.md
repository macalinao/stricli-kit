---
name: init-workspace
description: Initialize a new Bun monorepo workspace with @macalinao configs, turborepo, devenv, and proper tooling
invocation: progenitor workspace init
---

# Initialize Workspace Skill

This skill creates a new Bun monorepo workspace with proper configuration.

## When to use

- User asks to "create a new monorepo"
- User wants to "initialize a workspace"
- User needs a new project with Bun + TypeScript + Biome
- User says "scaffold a new project"
- User asks to "set up a new repo"

## How to invoke

```bash
progenitor workspace init --name my-project --scope @myorg
```

## Available flags

- `--name` - Workspace name (default: current directory name)
- `--scope` - Default npm scope (default: `@macalinao`)
- `--no-turbo` - Skip turborepo setup
- `--no-husky` - Skip husky/lint-staged setup
- `--no-devenv` - Skip devenv.nix setup

## Example usage

```bash
# Initialize in current directory
progenitor workspace init

# Initialize with custom name and scope
progenitor workspace init --name my-monorepo --scope @mycompany

# Initialize without devenv (for non-Nix environments)
progenitor workspace init --no-devenv

# Minimal setup (no turbo, no husky)
progenitor workspace init --no-turbo --no-husky
```

## Generated structure

```
my-project/
├── .github/
├── .husky/
│   └── pre-commit
├── apps/
├── packages/
├── biome.jsonc
├── CLAUDE.md
├── devenv.lock
├── devenv.nix
├── devenv.yaml
├── eslint.config.js
├── .gitignore
├── package.json
├── README.md
├── tsconfig.json
└── turbo.json
```

## After initialization

1. Run `bun install` to install dependencies
2. Run `bun run build` to verify everything works
3. Use `progenitor package new` to add packages to the workspace
4. Commit the initial setup to git

## What's included

- **Bun** - Fast JavaScript runtime and package manager
- **TypeScript** - Type-safe JavaScript with @macalinao/tsconfig
- **Biome** - Fast linter and formatter with @macalinao/biome-config
- **ESLint** - Additional linting with @macalinao/eslint-config
- **Turborepo** - Monorepo build orchestration (optional)
- **Husky** - Git hooks for lint-staged (optional)
- **devenv** - Nix-based development environment (optional)
- **CLAUDE.md** - Project documentation for AI assistants

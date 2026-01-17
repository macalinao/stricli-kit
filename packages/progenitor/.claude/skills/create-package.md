---
name: create-package
description: Create a new package in the monorepo with proper TypeScript, ESLint, and Biome configuration
invocation: progenitor package new
---

# Create Package Skill

This skill creates a new package in the monorepo using the progenitor CLI.

## When to use

- User asks to "create a new package"
- User wants to "add a library" to the monorepo
- User needs a new CLI tool in packages/
- User says "scaffold a package"

## How to invoke

Run the progenitor CLI with the appropriate flags:

```bash
progenitor package new <package-name> --description "Package description" --template library
```

## Available flags

- `--template` - Package template: `base`, `command`, or `library` (default: `library`)
- `--dir` - Output directory (default: `packages/<name>`)
- `--scope` - npm scope (default: `@macalinao`)
- `--description` - Package description for README and package.json

## Available templates

- `library` - Standard TypeScript library
- `cli` - CLI application with stricli-kit integration
- `base` - Minimal package

## Example usage

```bash
# Create a utility library
progenitor package new utils --description "Shared utilities"

# Create a CLI tool
progenitor package new my-cli --template command --description "My CLI tool"

# Create with custom scope
progenitor package new tools --scope @myorg --description "Internal tools"
```

## After creation

1. The package will be created in `packages/<name>/`
2. Run `bun install` to link the new package
3. Edit `src/index.ts` to add your code
4. Update the README.md with actual documentation

## Generated files

- `package.json` - Package manifest with proper exports
- `tsconfig.json` - TypeScript config extending @macalinao/tsconfig
- `eslint.config.js` - ESLint flat config
- `README.md` - Package documentation
- `src/index.ts` - Entry point

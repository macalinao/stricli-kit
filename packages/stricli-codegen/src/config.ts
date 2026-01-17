import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Configuration for stricli-kit codegen
 */
export interface StricliKitConfig {
  /**
   * Package to import utilities from.
   * Default: "@macalinao/stricli-kit"
   * Use "@macalinao/stricli-utils" for packages that can't depend on stricli-kit
   */
  utilsPackage?: string;

  /**
   * Commands directory relative to package root.
   * Default: "src/commands"
   */
  commandsDir?: string;

  /**
   * Output directory for generated files relative to package root.
   * Default: "src/generated"
   */
  outputDir?: string;
}

const DEFAULT_CONFIG: Required<StricliKitConfig> = {
  utilsPackage: "@macalinao/stricli-kit",
  commandsDir: "src/commands",
  outputDir: "src/generated",
};

const CONFIG_FILE_NAME = ".stricli-kit.jsonc";

/**
 * Strip JSON comments (simple implementation)
 */
function stripJsonComments(content: string): string {
  // Remove single-line comments
  let result = content.replace(/\/\/.*$/gm, "");
  // Remove multi-line comments
  result = result.replace(/\/\*[\s\S]*?\*\//g, "");
  return result;
}

/**
 * Read and parse stricli-kit config from a directory
 */
export function readConfig(packageRoot: string): Required<StricliKitConfig> {
  const configPath = join(packageRoot, CONFIG_FILE_NAME);

  if (!existsSync(configPath)) {
    return DEFAULT_CONFIG;
  }

  try {
    const content = readFileSync(configPath, "utf-8");
    const parsed = JSON.parse(stripJsonComments(content)) as StricliKitConfig;
    return {
      ...DEFAULT_CONFIG,
      ...parsed,
    };
  } catch {
    // If config is invalid, use defaults
    return DEFAULT_CONFIG;
  }
}

/**
 * Get the default config (for testing)
 */
export function getDefaultConfig(): Required<StricliKitConfig> {
  return { ...DEFAULT_CONFIG };
}

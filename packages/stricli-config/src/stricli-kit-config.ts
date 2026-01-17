import { existsSync, readFileSync } from "node:fs";
import { z } from "zod";

/**
 * Schema for stricli-kit.jsonc configuration file
 */
export const stricliKitConfigSchema: z.ZodObject<{
  commandsDir: z.ZodDefault<z.ZodString>;
  output: z.ZodDefault<z.ZodString>;
  importPrefix: z.ZodDefault<z.ZodString>;
}> = z.object({
  /** Directory containing command files (default: "src/commands") */
  commandsDir: z.string().default("src/commands"),
  /** Output path for generated route map (default: "src/generated/route-map.ts") */
  output: z.string().default("src/generated/route-map.ts"),
  /** Import prefix for generated imports (default: "../commands") */
  importPrefix: z.string().default("../commands"),
});

export type StricliKitConfig = z.infer<typeof stricliKitConfigSchema>;

/**
 * Default configuration values
 */
export const defaultConfig: StricliKitConfig = {
  commandsDir: "src/commands",
  output: "src/generated/route-map.ts",
  importPrefix: "../commands",
};

/**
 * Read stricli-kit.jsonc configuration file
 * @param configPath - Path to the config file (default: "stricli-kit.jsonc")
 * @returns Parsed configuration or defaults if file doesn't exist
 */
export function readStricliKitConfig(
  configPath = "stricli-kit.jsonc",
): StricliKitConfig {
  if (!existsSync(configPath)) {
    return defaultConfig;
  }

  try {
    const content = readFileSync(configPath, "utf-8");
    // Remove JSONC comments for parsing
    const jsonContent = content
      .replace(/\/\/.*$/gm, "")
      .replace(/\/\*[\s\S]*?\*\//g, "");
    const parsed: unknown = JSON.parse(jsonContent);
    return stricliKitConfigSchema.parse(parsed);
  } catch {
    // Return defaults on parse error
    return defaultConfig;
  }
}

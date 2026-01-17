import type { ConfigManager, ConfigManagerOptions } from "./types.js";
import { resolveEnvOverrides } from "./env-handler.js";
import { readYamlFile, writeYamlFile } from "./yaml-file.js";

/**
 * Create a typed config manager for reading/writing configuration files
 * @param options - Config manager options
 * @returns A config manager instance
 */
export function createConfigManager<T extends Record<string, unknown>>(
  options: ConfigManagerOptions<T>,
): ConfigManager<T> {
  const { path, schema, defaults, envPrefix } = options;

  const validate = (config: unknown): T => {
    return schema.parse(config);
  };

  const load = async (): Promise<T> => {
    // Read from file
    const fileConfig = await readYamlFile<Partial<T>>(path, {
      createIfMissing: true,
    });

    // Merge with defaults
    let merged: T = {
      ...defaults,
      ...fileConfig,
    } as T;

    // Apply environment variable overrides
    if (envPrefix) {
      merged = resolveEnvOverrides(merged, envPrefix);
    }

    // Validate and return
    return validate(merged);
  };

  const save = async (config: T): Promise<void> => {
    // Validate before saving
    validate(config);
    await writeYamlFile(path, config);
  };

  const get = async <K extends keyof T>(key: K): Promise<T[K] | undefined> => {
    const config = await load();
    return config[key];
  };

  return {
    load,
    save,
    validate,
    get,
  };
}

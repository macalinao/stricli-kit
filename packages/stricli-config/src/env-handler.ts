import type { EnvMapping } from "./types.js";

/**
 * Convert a camelCase or snake_case key to SCREAMING_SNAKE_CASE
 */
function toEnvKey(key: string, prefix: string): string {
  const snakeCase = key
    .replace(/([a-z])([A-Z])/g, "$1_$2")
    .replace(/[.-]/g, "_")
    .toUpperCase();
  return `${prefix}${snakeCase}`;
}

/**
 * Get the environment variable value for a config key
 */
function getEnvValue<T>(
  key: keyof T,
  prefix: string,
  mapping?: EnvMapping<T>,
): string | undefined {
  const envKey = mapping?.[key] ?? toEnvKey(key.toString(), prefix);
  return process.env[envKey];
}

/**
 * Parse an environment variable string into the appropriate type
 */
function parseEnvValue(value: string): unknown {
  // Try to parse as JSON first (handles booleans, numbers, arrays, objects)
  try {
    return JSON.parse(value);
  } catch {
    // Return as string if not valid JSON
    return value;
  }
}

/**
 * Resolve environment variable overrides for a config object
 * @param config - The base config object
 * @param prefix - Environment variable prefix (e.g., "MY_CLI_")
 * @param mapping - Optional custom mapping of config keys to env var names
 * @returns Config with env var overrides applied
 */
export function resolveEnvOverrides<T extends Record<string, unknown>>(
  config: T,
  prefix: string,
  mapping?: EnvMapping<T>,
): T {
  const result = { ...config };

  for (const key of Object.keys(result) as (keyof T)[]) {
    const envValue = getEnvValue(key, prefix, mapping);
    if (envValue !== undefined) {
      result[key] = parseEnvValue(envValue) as T[keyof T];
    }
  }

  return result;
}

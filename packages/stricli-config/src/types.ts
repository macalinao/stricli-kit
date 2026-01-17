import type { ZodSchema } from "zod";

/**
 * Options for creating a config manager
 */
export interface ConfigManagerOptions<T> {
  /** Path to the config file */
  path: string;
  /** Zod schema for validation */
  schema: ZodSchema<T>;
  /** Default values */
  defaults?: Partial<T>;
  /** Environment variable prefix (e.g., "MY_CLI_") */
  envPrefix?: string;
}

/**
 * Config manager interface for reading/writing typed configuration
 */
export interface ConfigManager<T> {
  /** Load config from file, merging with env vars and defaults */
  load(): Promise<T>;
  /** Save config to file */
  save(config: T): Promise<void>;
  /** Validate config against schema */
  validate(config: unknown): T;
  /** Get a single value with env override */
  get<K extends keyof T>(key: K): Promise<T[K] | undefined>;
}

/**
 * Options for YAML file operations
 */
export interface YamlFileOptions {
  /** Create file if it doesn't exist */
  createIfMissing?: boolean;
}

/**
 * Mapping of config keys to environment variable names
 */
export type EnvMapping<T> = Partial<Record<keyof T, string>>;

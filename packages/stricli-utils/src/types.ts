import type { Command, CommandContext } from "@stricli/core";

/**
 * Type helper for extracting context type from a command
 */
export type CommandContextType<T> =
  T extends Command<infer C extends CommandContext> ? C : never;

/**
 * Output helper interface for formatted console output
 */
export interface OutputHelpers {
  /** Print a success message */
  success(message: string): void;
  /** Print an error message */
  error(message: string): void;
  /** Print a warning message */
  warn(message: string): void;
  /** Print an info message */
  info(message: string): void;
  /** Print data as JSON */
  json(data: unknown): void;
}

/**
 * Extended command context with additional utilities
 */
export interface ExtendedContext {
  /** Output formatting helpers */
  output: OutputHelpers;
  /** Current working directory */
  cwd: string;
  /** Environment variables */
  env: NodeJS.ProcessEnv;
}

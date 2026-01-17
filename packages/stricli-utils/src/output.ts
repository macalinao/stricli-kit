import type { CommandContext } from "@stricli/core";
import type { OutputHelpers } from "./types.js";

/**
 * ANSI color codes for terminal output
 */
const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
} as const;

/**
 * Create output helpers for formatted console output
 * @param ctx - Stricli command context
 * @returns Output helpers instance
 */
export function createOutput(ctx: CommandContext): OutputHelpers {
  const write = (message: string) => {
    ctx.process.stdout.write(`${message}\n`);
  };

  const writeError = (message: string) => {
    ctx.process.stderr.write(`${message}\n`);
  };

  return {
    success(message: string) {
      write(`${colors.green}\u2713${colors.reset} ${message}`);
    },

    error(message: string) {
      writeError(`${colors.red}\u2717${colors.reset} ${message}`);
    },

    warn(message: string) {
      write(`${colors.yellow}\u26A0${colors.reset} ${message}`);
    },

    info(message: string) {
      write(`${colors.blue}\u2139${colors.reset} ${message}`);
    },

    json(data: unknown) {
      write(JSON.stringify(data, null, 2));
    },
  };
}

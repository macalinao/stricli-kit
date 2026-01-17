import { existsSync, statSync } from "node:fs";

/**
 * Options for the path parser
 */
export interface PathParserOptions {
  /** Whether the path must exist */
  mustExist?: boolean;
  /** Required type of the path */
  type?: "file" | "directory";
}

/**
 * Create a path parser that validates file/directory existence
 * @param options - Parser options
 * @returns A parser function for paths
 */
export function pathParser(
  options?: PathParserOptions,
): (value: string) => string {
  return (value: string) => {
    if (options?.mustExist && !existsSync(value)) {
      throw new Error(`Path does not exist: ${value}`);
    }

    if (options?.type && existsSync(value)) {
      const stats = statSync(value);
      if (options.type === "file" && !stats.isFile()) {
        throw new Error(`Path is not a file: ${value}`);
      }
      if (options.type === "directory" && !stats.isDirectory()) {
        throw new Error(`Path is not a directory: ${value}`);
      }
    }

    return value;
  };
}

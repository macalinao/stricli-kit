import type { YamlFileOptions } from "./types.js";
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { parse, stringify } from "yaml";

/**
 * Read and parse a YAML file
 * @param path - Path to the YAML file
 * @param options - Options for reading the file
 * @returns Parsed YAML content
 */
export async function readYamlFile<T>(
  path: string,
  options?: YamlFileOptions,
): Promise<T | undefined> {
  if (!existsSync(path)) {
    if (options?.createIfMissing) {
      return undefined;
    }
    throw new Error(`Config file not found: ${path}`);
  }

  const content = await readFile(path, "utf-8");
  return parse(content) as T;
}

/**
 * Write data to a YAML file
 * @param path - Path to the YAML file
 * @param data - Data to write
 */
export async function writeYamlFile(
  path: string,
  data: unknown,
): Promise<void> {
  const dir = dirname(path);
  if (!existsSync(dir)) {
    await mkdir(dir, { recursive: true });
  }

  const content = stringify(data, {
    indent: 2,
    lineWidth: 80,
  });

  await writeFile(path, content, "utf-8");
}

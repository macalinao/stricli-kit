/**
 * Create a JSON parser that parses JSON strings
 * @returns A parser function that parses JSON
 */
export function jsonParser(): (value: string) => unknown {
  return (value: string) => {
    try {
      return JSON.parse(value) as unknown;
    } catch {
      throw new Error(`Invalid JSON: ${value}`);
    }
  };
}

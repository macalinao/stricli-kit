/**
 * Parse a glob pattern (just validates it's a string)
 * @returns A parser function for glob patterns
 */
export function globParser(): (value: string) => string {
  return (value: string) => {
    if (!value || value.trim() === "") {
      throw new Error("Glob pattern cannot be empty");
    }
    return value;
  };
}

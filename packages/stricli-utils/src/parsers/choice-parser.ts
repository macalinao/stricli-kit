/**
 * Create a parser for a fixed set of choices
 * @param choices - Valid choices
 * @returns A parser function that validates against the choices
 */
export function choiceParser<T extends string>(
  choices: readonly T[],
): (value: string) => T {
  return (value: string) => {
    if (!choices.includes(value as T)) {
      throw new Error(
        `Invalid choice: ${value}. Valid choices: ${choices.join(", ")}`,
      );
    }
    return value as T;
  };
}

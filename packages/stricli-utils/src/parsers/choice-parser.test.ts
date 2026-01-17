import { describe, expect, test } from "bun:test";
import { choiceParser } from "./choice-parser.js";

describe("choiceParser", () => {
  test("returns valid choice", () => {
    const parser = choiceParser(["json", "yaml", "toml"] as const);
    expect(parser("json")).toBe("json");
    expect(parser("yaml")).toBe("yaml");
    expect(parser("toml")).toBe("toml");
  });

  test("throws for invalid choice", () => {
    const parser = choiceParser(["json", "yaml", "toml"] as const);
    expect(() => parser("xml")).toThrow(
      "Invalid choice: xml. Valid choices: json, yaml, toml",
    );
  });

  test("is case-sensitive", () => {
    const parser = choiceParser(["json", "yaml"] as const);
    expect(() => parser("JSON")).toThrow(
      "Invalid choice: JSON. Valid choices: json, yaml",
    );
  });

  test("works with single choice", () => {
    const parser = choiceParser(["only"] as const);
    expect(parser("only")).toBe("only");
    expect(() => parser("other")).toThrow(
      "Invalid choice: other. Valid choices: only",
    );
  });

  test("works with numeric string choices", () => {
    const parser = choiceParser(["1", "2", "3"] as const);
    expect(parser("1")).toBe("1");
    expect(parser("2")).toBe("2");
    expect(() => parser("4")).toThrow(
      "Invalid choice: 4. Valid choices: 1, 2, 3",
    );
  });

  test("preserves type narrowing", () => {
    const parser = choiceParser(["a", "b", "c"] as const);
    const result: "a" | "b" | "c" = parser("a");
    expect(result).toBe("a");
  });
});

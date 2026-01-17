import { describe, expect, test } from "bun:test";
import { jsonParser } from "./json-parser.js";

describe("jsonParser", () => {
  const parser = jsonParser();

  describe("valid JSON", () => {
    test("parses object", () => {
      expect(parser('{"name":"test","count":5}')).toEqual({
        name: "test",
        count: 5,
      });
    });

    test("parses array", () => {
      expect(parser("[1, 2, 3]")).toEqual([1, 2, 3]);
    });

    test("parses string", () => {
      expect(parser('"hello"')).toBe("hello");
    });

    test("parses number", () => {
      expect(parser("42")).toBe(42);
      expect(parser("3.14")).toBe(3.14);
      expect(parser("-10")).toBe(-10);
    });

    test("parses boolean", () => {
      expect(parser("true")).toBe(true);
      expect(parser("false")).toBe(false);
    });

    test("parses null", () => {
      expect(parser("null")).toBe(null);
    });

    test("parses nested objects", () => {
      expect(parser('{"a":{"b":{"c":1}}}')).toEqual({ a: { b: { c: 1 } } });
    });

    test("parses complex mixed structure", () => {
      const input =
        '{"users":[{"name":"Alice","age":30},{"name":"Bob","age":25}],"count":2}';
      expect(parser(input)).toEqual({
        users: [
          { name: "Alice", age: 30 },
          { name: "Bob", age: 25 },
        ],
        count: 2,
      });
    });
  });

  describe("invalid JSON", () => {
    test("throws for malformed object", () => {
      expect(() => parser("{name: test}")).toThrow(
        "Invalid JSON: {name: test}",
      );
    });

    test("throws for unclosed bracket", () => {
      expect(() => parser("[1, 2, 3")).toThrow("Invalid JSON: [1, 2, 3");
    });

    test("throws for unquoted string", () => {
      expect(() => parser("hello")).toThrow("Invalid JSON: hello");
    });

    test("throws for trailing comma", () => {
      expect(() => parser("[1, 2,]")).toThrow("Invalid JSON: [1, 2,]");
    });

    test("throws for empty string", () => {
      expect(() => parser("")).toThrow("Invalid JSON: ");
    });
  });
});

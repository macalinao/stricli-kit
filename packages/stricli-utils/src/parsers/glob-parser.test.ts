import { describe, expect, test } from "bun:test";
import { globParser } from "./glob-parser.js";

describe("globParser", () => {
  const parser = globParser();

  describe("valid glob patterns", () => {
    test("parses simple wildcard pattern", () => {
      expect(parser("*.ts")).toBe("*.ts");
    });

    test("parses double wildcard pattern", () => {
      expect(parser("**/*.ts")).toBe("**/*.ts");
    });

    test("parses brace expansion pattern", () => {
      expect(parser("*.{ts,tsx}")).toBe("*.{ts,tsx}");
    });

    test("parses character class pattern", () => {
      expect(parser("[a-z]*.ts")).toBe("[a-z]*.ts");
    });

    test("parses negation pattern", () => {
      expect(parser("!node_modules/**")).toBe("!node_modules/**");
    });

    test("parses path with glob", () => {
      expect(parser("src/**/*.test.ts")).toBe("src/**/*.test.ts");
    });

    test("parses plain string (no glob chars)", () => {
      expect(parser("src/index.ts")).toBe("src/index.ts");
    });

    test("parses single character pattern", () => {
      expect(parser("*")).toBe("*");
    });
  });

  describe("invalid glob patterns", () => {
    test("throws for empty string", () => {
      expect(() => parser("")).toThrow("Glob pattern cannot be empty");
    });

    test("throws for whitespace-only string", () => {
      expect(() => parser("   ")).toThrow("Glob pattern cannot be empty");
    });

    test("throws for tab-only string", () => {
      expect(() => parser("\t")).toThrow("Glob pattern cannot be empty");
    });

    test("throws for newline-only string", () => {
      expect(() => parser("\n")).toThrow("Glob pattern cannot be empty");
    });
  });
});

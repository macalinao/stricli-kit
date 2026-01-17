import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathParser } from "./path-parser.js";

describe("pathParser", () => {
  const testDir = join(tmpdir(), "path-parser-test");
  const testFile = join(testDir, "test-file.txt");

  beforeAll(() => {
    mkdirSync(testDir, { recursive: true });
    writeFileSync(testFile, "test content");
  });

  afterAll(() => {
    rmSync(testDir, { recursive: true, force: true });
  });

  describe("without options", () => {
    test("returns the path unchanged", () => {
      const parser = pathParser();
      expect(parser("/some/path")).toBe("/some/path");
    });

    test("accepts non-existent paths", () => {
      const parser = pathParser();
      expect(parser("/non/existent/path")).toBe("/non/existent/path");
    });
  });

  describe("with mustExist option", () => {
    test("returns existing path", () => {
      const parser = pathParser({ mustExist: true });
      expect(parser(testFile)).toBe(testFile);
    });

    test("throws for non-existent path", () => {
      const parser = pathParser({ mustExist: true });
      expect(() => parser("/non/existent/path")).toThrow(
        "Path does not exist: /non/existent/path",
      );
    });
  });

  describe("with type option", () => {
    test("accepts file when type is file", () => {
      const parser = pathParser({ type: "file" });
      expect(parser(testFile)).toBe(testFile);
    });

    test("throws when path is directory but type is file", () => {
      const parser = pathParser({ type: "file" });
      expect(() => parser(testDir)).toThrow(`Path is not a file: ${testDir}`);
    });

    test("accepts directory when type is directory", () => {
      const parser = pathParser({ type: "directory" });
      expect(parser(testDir)).toBe(testDir);
    });

    test("throws when path is file but type is directory", () => {
      const parser = pathParser({ type: "directory" });
      expect(() => parser(testFile)).toThrow(
        `Path is not a directory: ${testFile}`,
      );
    });

    test("skips type check for non-existent paths", () => {
      const parser = pathParser({ type: "file" });
      expect(parser("/non/existent/path")).toBe("/non/existent/path");
    });
  });

  describe("with mustExist and type options combined", () => {
    test("validates both existence and type", () => {
      const parser = pathParser({ mustExist: true, type: "file" });
      expect(parser(testFile)).toBe(testFile);
    });

    test("throws for wrong type even when exists", () => {
      const parser = pathParser({ mustExist: true, type: "file" });
      expect(() => parser(testDir)).toThrow(`Path is not a file: ${testDir}`);
    });

    test("throws for non-existent path before checking type", () => {
      const parser = pathParser({ mustExist: true, type: "file" });
      expect(() => parser("/non/existent/path")).toThrow(
        "Path does not exist: /non/existent/path",
      );
    });
  });
});

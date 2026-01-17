import { describe, expect, test } from "bun:test";
import {
  defineHandler,
  defineParameters,
  defineRoute,
  defineRouteGroup,
} from "./index.js";

/**
 * These tests verify that re-exports from @macalinao/stricli-define work correctly.
 * The full test suite is in packages/stricli-define.
 */

describe("stricli-utils re-exports from stricli-define", () => {
  test("defineParameters is re-exported and works", () => {
    const params = defineParameters({
      flags: {
        verbose: { kind: "boolean", brief: "Verbose" },
      },
    });

    expect(params.flags.verbose.kind).toBe("boolean");
  });

  test("defineHandler is re-exported and works", () => {
    const params = defineParameters({ flags: {} });
    const handler = defineHandler<typeof params>(() => {
      // noop
    });

    expect(typeof handler).toBe("function");
  });

  test("defineRoute is re-exported and works", () => {
    const params = defineParameters({ flags: {} });
    const handler = defineHandler<typeof params>(() => {
      // noop
    });

    const route = defineRoute({
      handler,
      params,
      docs: { brief: "Test" },
    });

    expect(route.command).toBeDefined();
  });

  test("defineRouteGroup is re-exported and works", () => {
    const config = defineRouteGroup({
      docs: { brief: "Test" },
      aliases: { n: "new" },
    });

    expect(config.docs.brief).toBe("Test");
    expect(config.aliases.n).toBe("new");
  });
});

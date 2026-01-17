import { describe, expect, test } from "bun:test";
import { getDefaultConfig } from "./config.js";

describe("getDefaultConfig", () => {
  test("returns default configuration", () => {
    const config = getDefaultConfig();

    expect(config.utilsPackage).toBe("@macalinao/stricli-kit");
    expect(config.commandsDir).toBe("src/commands");
    expect(config.outputDir).toBe("src/generated");
  });

  test("returns a new object each time", () => {
    const config1 = getDefaultConfig();
    const config2 = getDefaultConfig();

    expect(config1).not.toBe(config2);
    expect(config1).toEqual(config2);
  });
});

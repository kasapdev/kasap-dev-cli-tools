import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { parseEnvContent } from "../src/parseEnv.js";
import { diffEnv } from "../src/diff.js";

const fixturesDir = join(dirname(fileURLToPath(import.meta.url)), "fixtures");

describe("env-doctor against real fixture files", () => {
  it("finds the expected missing, empty, and undocumented variables", () => {
    const example = parseEnvContent(readFileSync(join(fixturesDir, ".env.example"), "utf8"));
    const actual = parseEnvContent(readFileSync(join(fixturesDir, "actual.env"), "utf8"));

    const diff = diffEnv(example, actual);

    // API_KEY and FEATURE_FLAG_X are declared in .env.example but are
    // entirely absent from actual.env.
    expect(diff.missing).toEqual(["API_KEY", "FEATURE_FLAG_X"]);
    // PORT is declared in .env.example and present in actual.env, but blank.
    expect(diff.empty).toEqual(["PORT"]);
    // UNDOCUMENTED_LEFTOVER isn't declared in .env.example at all.
    expect(diff.undocumented).toEqual(["UNDOCUMENTED_LEFTOVER"]);
    expect(diff.hasBlockingIssues).toBe(true);
  });
});

import { describe, expect, it } from "vitest";
import { parseEnvContent } from "../src/parseEnv.js";
import { diffEnv } from "../src/diff.js";

describe("diffEnv", () => {
  it("reports no issues when files match exactly", () => {
    const example = parseEnvContent("A=x\nB=y");
    const env = parseEnvContent("A=1\nB=2");
    const diff = diffEnv(example, env);
    expect(diff).toEqual({
      missing: [],
      undocumented: [],
      empty: [],
      typeMismatches: [],
      hasBlockingIssues: false,
    });
  });

  it("finds variables missing from .env", () => {
    const example = parseEnvContent("A=x\nB=y\nC=z");
    const env = parseEnvContent("A=1");
    const diff = diffEnv(example, env);
    expect(diff.missing).toEqual(["B", "C"]);
    expect(diff.hasBlockingIssues).toBe(true);
  });

  it("finds undocumented variables in .env", () => {
    const example = parseEnvContent("A=x");
    const env = parseEnvContent("A=1\nSECRET_EXTRA=2");
    const diff = diffEnv(example, env);
    expect(diff.undocumented).toEqual(["SECRET_EXTRA"]);
    // Undocumented-only is not a blocking issue.
    expect(diff.hasBlockingIssues).toBe(false);
  });

  it("finds variables present but empty in .env", () => {
    const example = parseEnvContent("A=x\nB=y");
    const env = parseEnvContent("A=\nB=2");
    const diff = diffEnv(example, env);
    expect(diff.empty).toEqual(["A"]);
    expect(diff.hasBlockingIssues).toBe(true);
  });

  it("sorts output keys alphabetically", () => {
    const example = parseEnvContent("Z=1\nA=2\nM=3");
    const env = parseEnvContent("");
    const diff = diffEnv(example, env);
    expect(diff.missing).toEqual(["A", "M", "Z"]);
  });

  it("combines missing, empty, and undocumented in one diff", () => {
    const example = parseEnvContent("A=x\nB=y\nC=z");
    const env = parseEnvContent("A=1\nB=\nD=extra");
    const diff = diffEnv(example, env);
    expect(diff.missing).toEqual(["C"]);
    expect(diff.empty).toEqual(["B"]);
    expect(diff.undocumented).toEqual(["D"]);
    expect(diff.hasBlockingIssues).toBe(true);
  });

  describe("typeMismatches", () => {
    it("flags a value that doesn't look like the example's inferred number shape", () => {
      const example = parseEnvContent("PORT=3000");
      const env = parseEnvContent("PORT=please-set-me");
      const diff = diffEnv(example, env);
      expect(diff.typeMismatches).toEqual([
        { key: "PORT", expectedType: "number", exampleValue: "3000", actualValue: "please-set-me" },
      ]);
      expect(diff.hasBlockingIssues).toBe(true);
    });

    it("flags a value that doesn't look like the example's inferred boolean shape", () => {
      const example = parseEnvContent("DEBUG=false");
      const env = parseEnvContent("DEBUG=yes");
      const diff = diffEnv(example, env);
      expect(diff.typeMismatches).toEqual([
        { key: "DEBUG", expectedType: "boolean", exampleValue: "false", actualValue: "yes" },
      ]);
    });

    it("flags a value that doesn't look like the example's inferred url shape", () => {
      const example = parseEnvContent("DATABASE_URL=postgres://user:pass@localhost:5432/app");
      const env = parseEnvContent("DATABASE_URL=not-a-url");
      const diff = diffEnv(example, env);
      expect(diff.typeMismatches).toEqual([
        {
          key: "DATABASE_URL",
          expectedType: "url",
          exampleValue: "postgres://user:pass@localhost:5432/app",
          actualValue: "not-a-url",
        },
      ]);
    });

    it("does not flag a matching shape", () => {
      const example = parseEnvContent("PORT=3000\nDEBUG=true\nURL=https://example.com");
      const env = parseEnvContent("PORT=8080\nDEBUG=false\nURL=https://other.example.com");
      const diff = diffEnv(example, env);
      expect(diff.typeMismatches).toEqual([]);
      expect(diff.hasBlockingIssues).toBe(false);
    });

    it("does not attempt a type check when the example value has no inferable shape", () => {
      const example = parseEnvContent("NAME=some-free-form-placeholder");
      const env = parseEnvContent("NAME=12345");
      const diff = diffEnv(example, env);
      expect(diff.typeMismatches).toEqual([]);
    });

    it("does not attempt a type check when the example value itself is empty", () => {
      const example = parseEnvContent("API_KEY=");
      const env = parseEnvContent("API_KEY=whatever-shape-this-is");
      const diff = diffEnv(example, env);
      expect(diff.typeMismatches).toEqual([]);
    });

    it("skips the type check for keys already reported as missing or empty", () => {
      const example = parseEnvContent("PORT=3000\nDEBUG=true");
      const env = parseEnvContent("DEBUG=");
      const diff = diffEnv(example, env);
      // PORT is missing entirely, DEBUG is present-but-empty - neither should
      // also show up as a type mismatch.
      expect(diff.missing).toEqual(["PORT"]);
      expect(diff.empty).toEqual(["DEBUG"]);
      expect(diff.typeMismatches).toEqual([]);
    });

    it("sorts multiple type mismatches by key", () => {
      const example = parseEnvContent("Z_PORT=1\nA_PORT=2");
      const env = parseEnvContent("Z_PORT=nope\nA_PORT=nope");
      const diff = diffEnv(example, env);
      expect(diff.typeMismatches.map((m) => m.key)).toEqual(["A_PORT", "Z_PORT"]);
    });
  });
});

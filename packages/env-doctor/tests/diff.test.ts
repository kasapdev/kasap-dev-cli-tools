import { describe, expect, it } from "vitest";
import { parseEnvContent } from "../src/parseEnv.js";
import { diffEnv } from "../src/diff.js";

describe("diffEnv", () => {
  it("reports no issues when files match exactly", () => {
    const example = parseEnvContent("A=x\nB=y");
    const env = parseEnvContent("A=1\nB=2");
    const diff = diffEnv(example, env);
    expect(diff).toEqual({ missing: [], undocumented: [], empty: [], hasBlockingIssues: false });
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
});

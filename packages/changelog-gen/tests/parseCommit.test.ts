import { describe, expect, it } from "vitest";
import { parseConventionalCommit } from "../src/parseCommit.js";
import type { RawCommit } from "../src/gitLog.js";

function raw(subject: string, body = "", hash = "abcdef1234"): RawCommit {
  return { hash, subject, body };
}

describe("parseConventionalCommit", () => {
  it("parses type, scope, and description", () => {
    const result = parseConventionalCommit(raw("feat(auth): add login flow"));
    expect(result.type).toBe("feat");
    expect(result.scope).toBe("auth");
    expect(result.description).toBe("add login flow");
    expect(result.breaking).toBe(false);
  });

  it("parses a commit with no scope", () => {
    const result = parseConventionalCommit(raw("fix: correct pagination bug"));
    expect(result.type).toBe("fix");
    expect(result.scope).toBeUndefined();
    expect(result.description).toBe("correct pagination bug");
  });

  it("marks a commit breaking when the header has a '!' before the colon", () => {
    const result = parseConventionalCommit(raw("feat(api)!: change response shape"));
    expect(result.breaking).toBe(true);
  });

  it("marks a commit breaking when the body contains 'BREAKING CHANGE:'", () => {
    const result = parseConventionalCommit(raw("feat: add new field", "BREAKING CHANGE: removed old field"));
    expect(result.breaking).toBe(true);
  });

  it("falls back to an untyped commit for non-conventional subjects", () => {
    const result = parseConventionalCommit(raw("updated some stuff"));
    expect(result.type).toBeUndefined();
    expect(result.description).toBe("updated some stuff");
    expect(result.breaking).toBe(false);
  });

  it("normalizes the type to lowercase", () => {
    const result = parseConventionalCommit(raw("Feat: weird casing"));
    expect(result.type).toBe("feat");
  });

  it("trims whitespace inside the scope parentheses", () => {
    const result = parseConventionalCommit(raw("feat( auth ): add login flow"));
    expect(result.scope).toBe("auth");
  });

  it("treats a scope made up only of whitespace as no scope", () => {
    const result = parseConventionalCommit(raw("feat(   ): add login flow"));
    expect(result.type).toBe("feat");
    expect(result.scope).toBeUndefined();
  });
});

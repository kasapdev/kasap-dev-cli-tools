import { describe, expect, it } from "vitest";
import { inferApparentType, matchesApparentType } from "../src/typeCheck.js";

describe("inferApparentType", () => {
  it("infers boolean for true/false, case-insensitive", () => {
    expect(inferApparentType("true")).toBe("boolean");
    expect(inferApparentType("false")).toBe("boolean");
    expect(inferApparentType("TRUE")).toBe("boolean");
    expect(inferApparentType("False")).toBe("boolean");
  });

  it("infers number for integers and decimals, including negatives", () => {
    expect(inferApparentType("3000")).toBe("number");
    expect(inferApparentType("-42")).toBe("number");
    expect(inferApparentType("3.14")).toBe("number");
    expect(inferApparentType("0")).toBe("number");
  });

  it("infers url for values with a scheme", () => {
    expect(inferApparentType("https://example.com")).toBe("url");
    expect(inferApparentType("postgres://user:pass@localhost:5432/app")).toBe("url");
    expect(inferApparentType("redis://localhost:6379")).toBe("url");
  });

  it("returns unknown for free-form strings", () => {
    expect(inferApparentType("some-placeholder-text")).toBe("unknown");
    expect(inferApparentType("changeme")).toBe("unknown");
    expect(inferApparentType("")).toBe("unknown");
  });

  it("does not classify a numeric-looking string with trailing garbage as a number", () => {
    expect(inferApparentType("3000px")).toBe("unknown");
    expect(inferApparentType("v2")).toBe("unknown");
  });

  it("does not classify 'true'/'false' as a number even though they're valid identifiers", () => {
    expect(inferApparentType("true")).not.toBe("number");
  });
});

describe("matchesApparentType", () => {
  it("always matches the 'unknown' type", () => {
    expect(matchesApparentType("anything at all", "unknown")).toBe(true);
    expect(matchesApparentType("", "unknown")).toBe(true);
  });

  it("matches when the value's own inferred type equals the target type", () => {
    expect(matchesApparentType("42", "number")).toBe(true);
    expect(matchesApparentType("true", "boolean")).toBe(true);
    expect(matchesApparentType("https://example.com", "url")).toBe(true);
  });

  it("does not match when the shapes differ", () => {
    expect(matchesApparentType("not-a-number", "number")).toBe(false);
    expect(matchesApparentType("42", "boolean")).toBe(false);
    expect(matchesApparentType("no-scheme-here", "url")).toBe(false);
  });
});

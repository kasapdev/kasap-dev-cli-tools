import { describe, expect, it } from "vitest";
import { parseEnvContent } from "../src/parseEnv.js";

describe("parseEnvContent", () => {
  it("parses basic KEY=VALUE lines", () => {
    const result = parseEnvContent("FOO=bar\nBAZ=qux");
    expect(result.get("FOO")?.value).toBe("bar");
    expect(result.get("BAZ")?.value).toBe("qux");
  });

  it("ignores comments and blank lines", () => {
    const result = parseEnvContent("# a comment\n\nFOO=bar\n  # indented comment\n");
    expect(result.size).toBe(1);
    expect(result.get("FOO")?.value).toBe("bar");
  });

  it("strips matching single or double quotes from values", () => {
    const result = parseEnvContent('A="hello world"\nB=\'single quoted\'\nC=unquoted');
    expect(result.get("A")?.value).toBe("hello world");
    expect(result.get("B")?.value).toBe("single quoted");
    expect(result.get("C")?.value).toBe("unquoted");
  });

  it("marks empty values as isEmpty", () => {
    const result = parseEnvContent("EMPTY=\nQUOTED_EMPTY=\"\"\nFILLED=x");
    expect(result.get("EMPTY")?.isEmpty).toBe(true);
    expect(result.get("QUOTED_EMPTY")?.isEmpty).toBe(true);
    expect(result.get("FILLED")?.isEmpty).toBe(false);
  });

  it("strips a leading 'export ' from keys", () => {
    const result = parseEnvContent("export FOO=bar");
    expect(result.has("FOO")).toBe(true);
    expect(result.get("FOO")?.value).toBe("bar");
  });

  it("handles values that themselves contain an '=' sign", () => {
    const result = parseEnvContent("CONN_STRING=postgres://user:pass@host/db?sslmode=require");
    expect(result.get("CONN_STRING")?.value).toBe("postgres://user:pass@host/db?sslmode=require");
  });

  it("ignores lines with no '=' separator", () => {
    const result = parseEnvContent("this is not a valid line\nFOO=bar");
    expect(result.size).toBe(1);
    expect(result.get("FOO")?.value).toBe("bar");
  });

  it("does not strip quotes when the opening and closing quote characters don't match", () => {
    const result = parseEnvContent(`A="mismatched'\nB='also mismatched"`);
    expect(result.get("A")?.value).toBe(`"mismatched'`);
    expect(result.get("B")?.value).toBe(`'also mismatched"`);
  });
});

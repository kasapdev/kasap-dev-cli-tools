import { describe, expect, it } from "vitest";
import { diffEnv } from "../src/diff.js";
import { parseEnvContent } from "../src/parseEnv.js";
import { formatReport } from "../src/report.js";

describe("formatReport", () => {
  it("reports 'all good' when there is no drift at all", () => {
    const example = parseEnvContent("A=1\nB=true");
    const env = parseEnvContent("A=2\nB=false");
    const diff = diffEnv(example, env);
    const report = formatReport(".env.example", ".env", diff);
    expect(report).toContain("env-doctor: comparing .env against .env.example");
    expect(report).toContain(
      "All good - .env matches .env.example with no missing, empty, mismatched, or undocumented variables.",
    );
    // None of the section headers should appear when there's nothing to report.
    expect(report).not.toContain("Missing (");
    expect(report).not.toContain("Empty (");
    expect(report).not.toContain("Type mismatches (");
    expect(report).not.toContain("Undocumented (");
  });

  it("reports 'no blocking issues' when only undocumented extras are found", () => {
    const example = parseEnvContent("A=1");
    const env = parseEnvContent("A=1\nEXTRA=2");
    const diff = diffEnv(example, env);
    const report = formatReport(".env.example", ".env", diff);
    expect(report).toContain("Undocumented (present in .env, missing from .env.example):");
    expect(report).toContain("  - EXTRA");
    expect(report).toContain("No blocking issues (only undocumented extras found).");
  });

  it("lists missing variables under their own section", () => {
    const example = parseEnvContent("A=1\nB=2");
    const env = parseEnvContent("A=1");
    const diff = diffEnv(example, env);
    const report = formatReport(".env.example", ".env", diff);
    expect(report).toContain("Missing (required by .env.example, absent from .env):");
    expect(report).toContain("  - B");
    expect(report).toContain("Blocking issues found: 1 missing, 0 empty, 0 type mismatch(es).");
  });

  it("lists empty variables under their own section", () => {
    const example = parseEnvContent("A=1");
    const env = parseEnvContent("A=");
    const diff = diffEnv(example, env);
    const report = formatReport(".env.example", ".env", diff);
    expect(report).toContain("Empty (required by .env.example, present but blank in .env):");
    expect(report).toContain("  - A");
  });

  it("lists type mismatches with expected type, example value, and actual value", () => {
    const example = parseEnvContent("PORT=3000");
    const env = parseEnvContent("PORT=abc");
    const diff = diffEnv(example, env);
    const report = formatReport(".env.example", ".env", diff);
    expect(report).toContain("Type mismatches (value shape doesn't match .env.example):");
    expect(report).toContain('  - PORT: expected number-like (example: "3000"), got "abc"');
  });

  it("includes every section and an accurate blocking summary when everything is wrong at once", () => {
    const example = parseEnvContent("A=1\nB=2\nPORT=3000");
    const env = parseEnvContent("B=\nPORT=abc\nEXTRA=1");
    const diff = diffEnv(example, env);
    const report = formatReport(".env.example", ".env", diff);
    expect(report).toContain("Missing (required by .env.example, absent from .env):");
    expect(report).toContain("  - A");
    expect(report).toContain("Empty (required by .env.example, present but blank in .env):");
    expect(report).toContain("  - B");
    expect(report).toContain("Type mismatches (value shape doesn't match .env.example):");
    expect(report).toContain("Undocumented (present in .env, missing from .env.example):");
    expect(report).toContain("  - EXTRA");
    expect(report).toContain("Blocking issues found: 1 missing, 1 empty, 1 type mismatch(es).");
  });

  it("uses the caller-supplied file labels verbatim, not hardcoded '.env'/'.env.example'", () => {
    const example = parseEnvContent("A=1");
    const env = parseEnvContent("");
    const diff = diffEnv(example, env);
    const report = formatReport("config/.env.example", "config/.env", diff);
    expect(report).toContain("env-doctor: comparing config/.env against config/.env.example");
    expect(report).toContain("Missing (required by config/.env.example, absent from config/.env):");
  });
});

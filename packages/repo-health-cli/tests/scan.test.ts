import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { collectRepoFacts } from "../src/scan.js";

// These tests build small, self-contained fixture directories under the OS
// temp dir - they never read this monorepo's own files or git history.
let fixtureDir: string;

beforeEach(() => {
  fixtureDir = mkdtempSync(join(tmpdir(), "repo-health-fixture-"));
});

afterEach(() => {
  rmSync(fixtureDir, { recursive: true, force: true });
});

describe("collectRepoFacts", () => {
  it("reports everything missing for a bare empty directory", () => {
    const facts = collectRepoFacts(fixtureDir);
    expect(facts.hasReadme).toBe(false);
    expect(facts.hasLicense).toBe(false);
    expect(facts.hasGitignore).toBe(false);
    expect(facts.hasCI).toBe(false);
    expect(facts.hasTestFiles).toBe(false);
    expect(facts.hasTestScript).toBe(false);
  });

  it("detects a fully healthy repo layout", () => {
    writeFileSync(join(fixtureDir, "README.md"), "x".repeat(300));
    writeFileSync(join(fixtureDir, "LICENSE"), "MIT License");
    writeFileSync(join(fixtureDir, ".gitignore"), "node_modules/\n");
    writeFileSync(
      join(fixtureDir, "package.json"),
      JSON.stringify({ name: "fixture", scripts: { test: "vitest run" } }),
    );

    mkdirSync(join(fixtureDir, ".github", "workflows"), { recursive: true });
    writeFileSync(join(fixtureDir, ".github", "workflows", "ci.yml"), "name: CI\n");

    mkdirSync(join(fixtureDir, "tests"), { recursive: true });
    writeFileSync(join(fixtureDir, "tests", "example.test.ts"), "// test");

    const facts = collectRepoFacts(fixtureDir);
    expect(facts.hasReadme).toBe(true);
    expect(facts.readmeLength).toBe(300);
    expect(facts.hasLicense).toBe(true);
    expect(facts.hasGitignore).toBe(true);
    expect(facts.hasCI).toBe(true);
    expect(facts.ciFileCount).toBe(1);
    expect(facts.hasTestFiles).toBe(true);
    expect(facts.testFileCount).toBe(1);
    expect(facts.hasTestScript).toBe(true);
  });

  it("ignores node_modules when scanning for test files", () => {
    mkdirSync(join(fixtureDir, "node_modules", "some-dep"), { recursive: true });
    writeFileSync(join(fixtureDir, "node_modules", "some-dep", "weird.test.js"), "// should be ignored");

    const facts = collectRepoFacts(fixtureDir);
    expect(facts.hasTestFiles).toBe(false);
    expect(facts.testFileCount).toBe(0);
  });

  it("does not count npm's default 'no test specified' stub as a real test script", () => {
    writeFileSync(
      join(fixtureDir, "package.json"),
      JSON.stringify({ scripts: { test: 'echo "Error: no test specified" && exit 1' } }),
    );
    const facts = collectRepoFacts(fixtureDir);
    expect(facts.hasTestScript).toBe(false);
  });
});

import { mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { computeDirSize } from "../src/sizeWalk.js";
import { resolveDependencyDir } from "../src/resolveDep.js";

let root: string;

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), "pkg-bloat-fixture-"));
});

afterEach(() => {
  rmSync(root, { recursive: true, force: true });
});

describe("computeDirSize", () => {
  it("sums file sizes recursively, including nested node_modules", () => {
    writeFileSync(join(root, "index.js"), "a".repeat(100));
    mkdirSync(join(root, "lib"));
    writeFileSync(join(root, "lib", "util.js"), "b".repeat(50));
    mkdirSync(join(root, "node_modules", "nested-dep"), { recursive: true });
    writeFileSync(join(root, "node_modules", "nested-dep", "index.js"), "c".repeat(25));

    expect(computeDirSize(root)).toBe(100 + 50 + 25);
  });

  it("returns 0 for a directory that doesn't exist", () => {
    expect(computeDirSize(join(root, "does-not-exist"))).toBe(0);
  });

  it("does not follow symlinks while recursing (avoids double counting / cycles)", () => {
    writeFileSync(join(root, "real-file.js"), "x".repeat(40));
    mkdirSync(join(root, "real-dir"));
    writeFileSync(join(root, "real-dir", "inner.js"), "y".repeat(10));

    try {
      symlinkSync(join(root, "real-dir"), join(root, "linked-dir"), "junction");
    } catch {
      // Symlink creation can require elevated privileges on some Windows
      // setups; skip the assertion in that case rather than fail the suite.
      return;
    }

    // Only real-file.js and real-dir/inner.js should be counted; the
    // symlinked copy must not add to the total.
    expect(computeDirSize(root)).toBe(40 + 10);
  });
});

describe("resolveDependencyDir", () => {
  it("resolves a plain (non-symlinked) dependency directory", () => {
    const nodeModules = join(root, "node_modules");
    mkdirSync(join(nodeModules, "some-dep"), { recursive: true });

    expect(resolveDependencyDir(nodeModules, "some-dep")).toBe(join(nodeModules, "some-dep"));
  });

  it("resolves a scoped package path", () => {
    const nodeModules = join(root, "node_modules");
    mkdirSync(join(nodeModules, "@scope", "pkg"), { recursive: true });

    expect(resolveDependencyDir(nodeModules, "@scope/pkg")).toBe(join(nodeModules, "@scope", "pkg"));
  });

  it("returns undefined when the dependency isn't installed", () => {
    const nodeModules = join(root, "node_modules");
    mkdirSync(nodeModules, { recursive: true });

    expect(resolveDependencyDir(nodeModules, "not-installed")).toBeUndefined();
  });

  it("follows a pnpm-style top-level symlink to the real package directory", () => {
    const store = join(root, ".pnpm-store", "real-pkg");
    mkdirSync(store, { recursive: true });
    writeFileSync(join(store, "index.js"), "content");

    const nodeModules = join(root, "node_modules");
    mkdirSync(nodeModules, { recursive: true });

    try {
      symlinkSync(store, join(nodeModules, "real-pkg"), "junction");
    } catch {
      return;
    }

    const resolved = resolveDependencyDir(nodeModules, "real-pkg");
    expect(resolved).toBeDefined();
    expect(computeDirSize(resolved as string)).toBe("content".length);
  });
});

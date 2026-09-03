import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { findGitDir, parseGitFilePointer } from "../src/gitDir.js";

describe("parseGitFilePointer", () => {
  it("parses a standard gitdir pointer file", () => {
    expect(parseGitFilePointer("gitdir: ../.git/worktrees/feature-x\n")).toBe(
      "../.git/worktrees/feature-x",
    );
  });

  it("returns null for content that isn't a gitdir pointer", () => {
    expect(parseGitFilePointer("not a pointer file")).toBeNull();
  });
});

describe("findGitDir", () => {
  let root: string;

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), "commitlint-tr-fixture-"));
  });

  afterEach(() => {
    rmSync(root, { recursive: true, force: true });
  });

  it("finds a .git directory at the given path", () => {
    mkdirSync(join(root, ".git"));
    expect(findGitDir(root)).toBe(join(root, ".git"));
  });

  it("finds a .git directory by walking up from a nested subdirectory", () => {
    mkdirSync(join(root, ".git"));
    const nested = join(root, "packages", "some-pkg");
    mkdirSync(nested, { recursive: true });
    expect(findGitDir(nested)).toBe(join(root, ".git"));
  });

  it("resolves a .git worktree pointer file", () => {
    const realGitDir = join(root, "main-repo", ".git", "worktrees", "wt1");
    mkdirSync(realGitDir, { recursive: true });
    const worktreeCheckout = join(root, "wt1");
    mkdirSync(worktreeCheckout, { recursive: true });
    writeFileSync(join(worktreeCheckout, ".git"), `gitdir: ${realGitDir}\n`);

    expect(findGitDir(worktreeCheckout)).toBe(resolve(realGitDir));
  });

  it("returns null when no .git is found up to the filesystem root", () => {
    const isolated = join(root, "no-git-here");
    mkdirSync(isolated, { recursive: true });
    // tmpdir() is not inside a git repo in CI/sandbox environments, so
    // walking up from an isolated fixture dir should never find one.
    expect(findGitDir(isolated)).toBeNull();
  });
});

import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import type { RepoFacts } from "./types.js";

const README_CANDIDATES = ["README.md", "Readme.md", "readme.md", "README.MD", "README"];
const LICENSE_CANDIDATES = ["LICENSE", "LICENSE.md", "LICENSE.txt", "license", "COPYING"];
const TEST_DIR_CANDIDATES = ["test", "tests", "__tests__"];
const TEST_FILE_PATTERN = /\.(test|spec)\.[cm]?[jt]sx?$/i;
const IGNORED_DIRS = new Set(["node_modules", ".git", "dist", "build", "coverage", ".pnpm-store"]);

function findFirstExisting(dir: string, candidates: string[]): string | undefined {
  for (const name of candidates) {
    const full = join(dir, name);
    if (existsSync(full) && statSync(full).isFile()) return full;
  }
  return undefined;
}

function findCiWorkflowFiles(repoRoot: string): string[] {
  const workflowsDir = join(repoRoot, ".github", "workflows");
  if (!existsSync(workflowsDir) || !statSync(workflowsDir).isDirectory()) return [];
  return readdirSync(workflowsDir).filter((f) => /\.ya?ml$/i.test(f));
}

/**
 * Recursively walks a directory (skipping common noise dirs) looking for
 * test files matching *.test.* / *.spec.*. Also reports whether a
 * conventionally-named test directory exists at any level.
 */
function scanForTests(repoRoot: string): { hasTestDir: boolean; testFileCount: number } {
  let hasTestDir = false;
  let testFileCount = 0;

  function walk(dir: string, depth: number): void {
    if (depth > 6) return; // avoid pathological deep trees
    let entries: string[];
    try {
      entries = readdirSync(dir);
    } catch {
      return;
    }
    for (const entry of entries) {
      if (IGNORED_DIRS.has(entry)) continue;
      const full = join(dir, entry);
      let st;
      try {
        st = statSync(full);
      } catch {
        continue;
      }
      if (st.isDirectory()) {
        if (TEST_DIR_CANDIDATES.includes(entry.toLowerCase())) {
          hasTestDir = true;
        }
        walk(full, depth + 1);
      } else if (st.isFile() && TEST_FILE_PATTERN.test(entry)) {
        testFileCount += 1;
      }
    }
  }

  walk(repoRoot, 0);
  return { hasTestDir, testFileCount };
}

function readPackageJsonTestScript(repoRoot: string): boolean {
  const pkgPath = join(repoRoot, "package.json");
  if (!existsSync(pkgPath)) return false;
  try {
    const pkg = JSON.parse(readFileSync(pkgPath, "utf8")) as { scripts?: Record<string, string> };
    const testScript = pkg.scripts?.test;
    if (!testScript) return false;
    // A script that just says "no test specified" (npm's default stub) doesn't count.
    return !/no test specified/i.test(testScript);
  } catch {
    return false;
  }
}

/** Scans a real repository directory on disk and collects raw facts for scoring. */
export function collectRepoFacts(repoRoot: string): RepoFacts {
  const readmePath = findFirstExisting(repoRoot, README_CANDIDATES);
  const readmeLength = readmePath ? readFileSync(readmePath, "utf8").trim().length : 0;

  const licensePath = findFirstExisting(repoRoot, LICENSE_CANDIDATES);
  const gitignorePath = join(repoRoot, ".gitignore");

  const ciFiles = findCiWorkflowFiles(repoRoot);
  const { hasTestDir, testFileCount } = scanForTests(repoRoot);
  const hasTestScript = readPackageJsonTestScript(repoRoot);

  return {
    hasReadme: Boolean(readmePath),
    readmeLength,
    hasLicense: Boolean(licensePath),
    hasGitignore: existsSync(gitignorePath),
    hasCI: ciFiles.length > 0,
    ciFileCount: ciFiles.length,
    hasTestFiles: hasTestDir || testFileCount > 0,
    testFileCount,
    hasTestScript,
  };
}

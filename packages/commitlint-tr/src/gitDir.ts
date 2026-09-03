import { existsSync, readFileSync, statSync } from "node:fs";
import { dirname, isAbsolute, join, resolve } from "node:path";

/**
 * Parses the contents of a `.git` *file* (used in worktrees and submodules,
 * as opposed to a `.git` directory) which looks like:
 *   gitdir: ../.git/worktrees/some-branch
 * Returns the referenced path, or null if the content doesn't match.
 * Pure function - easy to unit test without touching the filesystem.
 */
export function parseGitFilePointer(content: string): string | null {
  const match = /^gitdir:\s*(.+)\s*$/m.exec(content);
  if (!match) return null;
  const target = match[1]?.trim();
  return target && target.length > 0 ? target : null;
}

/**
 * Walks up from `startDir` looking for a `.git` entry (directory, or a file
 * pointer as used by worktrees/submodules) and returns the resolved git
 * directory (the one that should contain `hooks/`), or null if none found.
 */
export function findGitDir(startDir: string): string | null {
  let dir = resolve(startDir);
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const candidate = join(dir, ".git");
    if (existsSync(candidate)) {
      const st = statSync(candidate);
      if (st.isDirectory()) return candidate;
      if (st.isFile()) {
        const pointer = parseGitFilePointer(readFileSync(candidate, "utf8"));
        if (pointer) {
          return isAbsolute(pointer) ? pointer : resolve(dir, pointer);
        }
      }
    }
    const parent = dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}

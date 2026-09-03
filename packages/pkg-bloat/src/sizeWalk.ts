import { readdirSync, lstatSync } from "node:fs";
import { join } from "node:path";

/**
 * Recursively sums the size (in bytes) of all regular files under
 * `dirPath`, including nested `node_modules` directories.
 *
 * Symbolic links are intentionally NOT followed while recursing: pnpm's
 * content-addressed store (`node_modules/.pnpm/...`) links packages to each
 * other, and following those links during a recursive walk can both double
 * count content and create infinite loops. `resolveDependencyDir` (in
 * resolveDep.ts) already resolves the *top-level* dependency symlink once
 * before this function is called, so the common "pnpm hoists a symlink at
 * node_modules/<dep>" case is still measured correctly; only deeper,
 * internal symlinks are skipped.
 */
export function computeDirSize(dirPath: string): number {
  let total = 0;
  let entries;
  try {
    entries = readdirSync(dirPath, { withFileTypes: true });
  } catch {
    return 0;
  }

  for (const entry of entries) {
    if (entry.isSymbolicLink()) continue;

    const full = join(dirPath, entry.name);
    if (entry.isDirectory()) {
      total += computeDirSize(full);
    } else if (entry.isFile()) {
      try {
        total += lstatSync(full).size;
      } catch {
        // File may have vanished between readdir and stat; ignore.
      }
    }
  }

  return total;
}

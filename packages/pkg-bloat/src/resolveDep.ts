import { existsSync, lstatSync, realpathSync } from "node:fs";
import { join } from "node:path";

/**
 * Resolves a direct dependency's installed directory inside `node_modules`.
 * Handles scoped packages (`@scope/name`) and pnpm-style layouts where
 * `node_modules/<dep>` is itself a symlink into a content-addressed store -
 * in that case the real target directory is returned so its actual on-disk
 * content gets measured.
 */
export function resolveDependencyDir(nodeModulesDir: string, depName: string): string | undefined {
  const depPath = join(nodeModulesDir, ...depName.split("/"));
  if (!existsSync(depPath)) return undefined;

  try {
    const st = lstatSync(depPath);
    if (st.isSymbolicLink()) {
      return realpathSync(depPath);
    }
    return depPath;
  } catch {
    return undefined;
  }
}

export interface DepSizeEntry {
  name: string;
  sizeBytes: number;
  /** False when the dependency isn't found under node_modules at all. */
  installed: boolean;
}

export interface DepSizeOptions {
  resolveDir: (depName: string) => string | undefined;
  computeSize: (dirPath: string) => number;
}

/**
 * Pure(ish) orchestration: given a list of direct dependency names and
 * injectable resolve/measure functions, computes each dependency's size and
 * returns entries sorted largest-first. Keeping `resolveDir`/`computeSize`
 * as parameters makes this trivial to unit test without touching a real
 * filesystem.
 */
export function computeDependencySizes(depNames: string[], options: DepSizeOptions): DepSizeEntry[] {
  const entries: DepSizeEntry[] = depNames.map((name) => {
    const dir = options.resolveDir(name);
    if (!dir) {
      return { name, sizeBytes: 0, installed: false };
    }
    return { name, sizeBytes: options.computeSize(dir), installed: true };
  });

  return entries.sort((a, b) => b.sizeBytes - a.sizeBytes);
}

/** Merges "dependencies" and "devDependencies" into a deduped, sorted list of direct dependency names. */
export function collectDirectDependencyNames(pkg: {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
}): string[] {
  const names = new Set<string>([
    ...Object.keys(pkg.dependencies ?? {}),
    ...Object.keys(pkg.devDependencies ?? {}),
  ]);
  return [...names].sort();
}

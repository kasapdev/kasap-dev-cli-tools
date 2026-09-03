import { describe, expect, it } from "vitest";
import { collectDirectDependencyNames, computeDependencySizes } from "../src/depSize.js";

describe("collectDirectDependencyNames", () => {
  it("merges and dedupes dependencies and devDependencies, sorted", () => {
    const names = collectDirectDependencyNames({
      dependencies: { commander: "^15.0.0", zod: "^3.0.0" },
      devDependencies: { typescript: "^5.0.0", zod: "^3.0.0" },
    });
    expect(names).toEqual(["commander", "typescript", "zod"]);
  });

  it("returns an empty array when there are no dependencies", () => {
    expect(collectDirectDependencyNames({})).toEqual([]);
  });
});

describe("computeDependencySizes", () => {
  it("sorts entries largest-first using injected resolve/measure functions", () => {
    const fakeSizes: Record<string, number> = { a: 100, b: 5000, c: 500 };
    const fakeDirs: Record<string, string> = { a: "/nm/a", b: "/nm/b", c: "/nm/c" };

    const result = computeDependencySizes(["a", "b", "c"], {
      resolveDir: (name) => fakeDirs[name],
      computeSize: (dir) => {
        const name = dir.split("/").pop() as string;
        return fakeSizes[name] ?? 0;
      },
    });

    expect(result.map((e) => e.name)).toEqual(["b", "c", "a"]);
    expect(result.every((e) => e.installed)).toBe(true);
  });

  it("marks a dependency as not installed when resolveDir returns undefined", () => {
    const result = computeDependencySizes(["missing-pkg"], {
      resolveDir: () => undefined,
      computeSize: () => 999, // should never be called
    });

    expect(result).toEqual([{ name: "missing-pkg", sizeBytes: 0, installed: false }]);
  });
});

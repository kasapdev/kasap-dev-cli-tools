import { describe, expect, it } from "vitest";
import { formatBytes, formatTable } from "../src/format.js";
import type { DepSizeEntry } from "../src/depSize.js";

describe("formatBytes", () => {
  it("formats zero and small byte counts", () => {
    expect(formatBytes(0)).toBe("0 B");
    expect(formatBytes(512)).toBe("512 B");
  });

  it("formats kilobytes", () => {
    expect(formatBytes(2048)).toBe("2 KB");
  });

  it("formats megabytes with appropriate precision", () => {
    expect(formatBytes(5 * 1024 * 1024)).toBe("5 MB");
    expect(formatBytes(1.5 * 1024 * 1024)).toBe("1.50 MB");
  });

  it("formats gigabytes", () => {
    expect(formatBytes(2 * 1024 * 1024 * 1024)).toBe("2 GB");
  });
});

describe("formatTable", () => {
  it("reports no dependencies when the list is empty", () => {
    expect(formatTable([])).toBe("No direct dependencies found.");
  });

  it("renders a table with a total row, preserving input order", () => {
    // formatTable renders entries in the order given - sorting is the
    // caller's responsibility (computeDependencySizes already sorts).
    const entries: DepSizeEntry[] = [
      { name: "big-pkg", sizeBytes: 1024 * 1024, installed: true },
      { name: "small-pkg", sizeBytes: 1024, installed: true },
    ];
    const output = formatTable(entries);
    expect(output).toContain("big-pkg");
    expect(output).toContain("small-pkg");
    expect(output).toContain("Total");
    // big-pkg should appear before small-pkg since the caller is expected
    // to pass entries already sorted largest-first.
    expect(output.indexOf("big-pkg")).toBeLessThan(output.indexOf("small-pkg"));
  });

  it("marks not-installed dependencies distinctly", () => {
    const entries: DepSizeEntry[] = [{ name: "ghost-pkg", sizeBytes: 0, installed: false }];
    const output = formatTable(entries);
    expect(output).toContain("(not installed)");
  });
});

import { describe, expect, it } from "vitest";
import { formatChangelogEntry, prependChangelog } from "../src/changelog.js";
import { groupCommits } from "../src/group.js";
import type { ParsedCommit } from "../src/parseCommit.js";

function commit(overrides: Partial<ParsedCommit>): ParsedCommit {
  return {
    hash: "abcdef1234567",
    subject: "subject",
    description: "description",
    breaking: false,
    ...overrides,
  };
}

describe("formatChangelogEntry", () => {
  it("renders Features, Fixes, and Other sections with short hashes", () => {
    const grouped = groupCommits([
      commit({ type: "feat", scope: "auth", description: "add login", hash: "1234567890" }),
      commit({ type: "fix", description: "fix bug", hash: "abcdefabcd" }),
      commit({ type: "chore", description: "tidy up", hash: "0000000000" }),
    ]);

    const entry = formatChangelogEntry("2026-01-01 (v1.0.0..HEAD)", grouped, "minor");

    expect(entry).toContain("## 2026-01-01 (v1.0.0..HEAD) (suggested bump: minor)");
    expect(entry).toContain("### Features");
    expect(entry).toContain("**auth**: add login (1234567)");
    expect(entry).toContain("### Fixes");
    expect(entry).toContain("fix bug (abcdefa)");
    expect(entry).toContain("### Other");
    expect(entry).toContain("tidy up (0000000)");
  });

  it("renders a placeholder when there are no commits", () => {
    const grouped = groupCommits([]);
    const entry = formatChangelogEntry("2026-01-01", grouped, "patch");
    expect(entry).toContain("No commits in this range");
  });
});

describe("prependChangelog", () => {
  it("creates a fresh file with a top-level heading when there is no existing content", () => {
    const result = prependChangelog("", "## entry\n\ncontent\n");
    expect(result).toBe("# Changelog\n\n## entry\n\ncontent\n\n");
  });

  it("inserts the new entry right after an existing top-level heading", () => {
    const existing = "# Changelog\n\n## old entry\n\nold content\n";
    const result = prependChangelog(existing, "## new entry\n\nnew content\n");
    expect(result.startsWith("# Changelog\n\n## new entry\n\nnew content\n")).toBe(true);
    expect(result).toContain("## old entry");
    // New entry appears before the old one.
    expect(result.indexOf("new entry")).toBeLessThan(result.indexOf("old entry"));
  });

  it("adds a top-level heading when existing content doesn't start with one", () => {
    const existing = "Some notes that aren't a changelog heading.\n";
    const result = prependChangelog(existing, "## new entry\n");
    expect(result.startsWith("# Changelog\n\n## new entry\n")).toBe(true);
    expect(result).toContain("Some notes that aren't a changelog heading.");
  });
});

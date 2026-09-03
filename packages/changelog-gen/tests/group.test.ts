import { describe, expect, it } from "vitest";
import { groupCommits, suggestBump } from "../src/group.js";
import type { ParsedCommit } from "../src/parseCommit.js";

function commit(overrides: Partial<ParsedCommit>): ParsedCommit {
  return {
    hash: "h1234567",
    subject: "subject",
    description: "description",
    breaking: false,
    ...overrides,
  };
}

describe("groupCommits", () => {
  it("buckets feat/fix commits and puts everything else in other", () => {
    const commits = [
      commit({ type: "feat", description: "add a" }),
      commit({ type: "fix", description: "fix b" }),
      commit({ type: "chore", description: "chore c" }),
      commit({ description: "no type d" }),
    ];

    const grouped = groupCommits(commits);
    expect(grouped.features).toHaveLength(1);
    expect(grouped.fixes).toHaveLength(1);
    expect(grouped.other).toHaveLength(2);
  });
});

describe("suggestBump", () => {
  it("suggests major when any commit is breaking", () => {
    const commits = [commit({ type: "fix", breaking: true }), commit({ type: "feat" })];
    expect(suggestBump(commits)).toBe("major");
  });

  it("suggests minor when there's a feat but nothing breaking", () => {
    const commits = [commit({ type: "feat" }), commit({ type: "fix" })];
    expect(suggestBump(commits)).toBe("minor");
  });

  it("suggests patch when there's neither a feat nor a breaking change", () => {
    const commits = [commit({ type: "fix" }), commit({ type: "chore" })];
    expect(suggestBump(commits)).toBe("patch");
  });

  it("suggests patch for an empty commit list", () => {
    expect(suggestBump([])).toBe("patch");
  });
});

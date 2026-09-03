import type { ParsedCommit } from "./parseCommit.js";

export interface GroupedCommits {
  features: ParsedCommit[];
  fixes: ParsedCommit[];
  other: ParsedCommit[];
}

/** Buckets parsed commits into Features / Fixes / Other for the changelog. */
export function groupCommits(commits: ParsedCommit[]): GroupedCommits {
  const features: ParsedCommit[] = [];
  const fixes: ParsedCommit[] = [];
  const other: ParsedCommit[] = [];

  for (const commit of commits) {
    if (commit.type === "feat") {
      features.push(commit);
    } else if (commit.type === "fix") {
      fixes.push(commit);
    } else {
      other.push(commit);
    }
  }

  return { features, fixes, other };
}

export type SemverBump = "major" | "minor" | "patch";

/**
 * Suggests a semver bump from a set of commits:
 *  - "major" if any commit is marked breaking (`!` or `BREAKING CHANGE:`)
 *  - "minor" if any commit is a `feat:`
 *  - "patch" otherwise
 */
export function suggestBump(commits: ParsedCommit[]): SemverBump {
  if (commits.some((c) => c.breaking)) return "major";
  if (commits.some((c) => c.type === "feat")) return "minor";
  return "patch";
}

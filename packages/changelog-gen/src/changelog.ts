import type { GroupedCommits } from "./group.js";
import type { ParsedCommit } from "./parseCommit.js";
import type { SemverBump } from "./group.js";

function formatCommitLine(commit: ParsedCommit): string {
  const scope = commit.scope ? `**${commit.scope}**: ` : "";
  const shortHash = commit.hash ? ` (${commit.hash.slice(0, 7)})` : "";
  return `- ${scope}${commit.description}${shortHash}`;
}

/** Renders one changelog entry (a dated section with Features/Fixes/Other subsections) as Markdown. */
export function formatChangelogEntry(heading: string, grouped: GroupedCommits, bump: SemverBump): string {
  const lines: string[] = [];
  lines.push(`## ${heading} (suggested bump: ${bump})`);
  lines.push("");

  if (grouped.features.length > 0) {
    lines.push("### Features");
    lines.push("");
    for (const commit of grouped.features) lines.push(formatCommitLine(commit));
    lines.push("");
  }

  if (grouped.fixes.length > 0) {
    lines.push("### Fixes");
    lines.push("");
    for (const commit of grouped.fixes) lines.push(formatCommitLine(commit));
    lines.push("");
  }

  if (grouped.other.length > 0) {
    lines.push("### Other");
    lines.push("");
    for (const commit of grouped.other) lines.push(formatCommitLine(commit));
    lines.push("");
  }

  if (grouped.features.length === 0 && grouped.fixes.length === 0 && grouped.other.length === 0) {
    lines.push("_No commits in this range._");
    lines.push("");
  }

  return lines.join("\n").trimEnd() + "\n";
}

/**
 * Prepends a new changelog entry into existing CHANGELOG.md content.
 * If the file already starts with a top-level `# ` heading, the new entry
 * is inserted right after it; otherwise a fresh "# Changelog" heading is
 * added. Pure function - callers handle actually reading/writing the file.
 */
export function prependChangelog(existingContent: string, newEntry: string): string {
  const trimmedExisting = existingContent.trim();

  if (trimmedExisting.length === 0) {
    return `# Changelog\n\n${newEntry}\n`;
  }

  if (existingContent.startsWith("# ")) {
    const firstNewline = existingContent.indexOf("\n");
    const restStart = firstNewline === -1 ? existingContent.length : firstNewline + 1;
    const headingLine = existingContent.slice(0, restStart).trimEnd();
    const rest = existingContent.slice(restStart).replace(/^\s+/, "");
    return `${headingLine}\n\n${newEntry}\n${rest}`;
  }

  return `# Changelog\n\n${newEntry}\n${existingContent}`;
}

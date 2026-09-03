import type { ScoreResult } from "./types.js";

/** Renders a score result as a human-readable, colorless text report. */
export function formatReport(repoPath: string, result: ScoreResult): string {
  const lines: string[] = [];
  lines.push(`Repo Health Report: ${repoPath}`);
  lines.push("=".repeat(Math.min(60, 20 + repoPath.length)));
  for (const cat of result.categories) {
    lines.push(`  ${cat.name.padEnd(12)} ${String(cat.score).padStart(3)} / ${cat.max}  -  ${cat.detail}`);
  }
  lines.push("");
  lines.push(`Total score: ${result.total} / ${result.maxTotal}`);
  lines.push("");
  if (result.suggestions.length > 0) {
    lines.push("Suggestions:");
    for (const suggestion of result.suggestions) {
      lines.push(`  - ${suggestion}`);
    }
  } else {
    lines.push("No suggestions - looking good!");
  }
  return lines.join("\n");
}

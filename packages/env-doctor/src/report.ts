import type { EnvDiffResult } from "./diff.js";

export function formatReport(exampleFile: string, envFile: string, diff: EnvDiffResult): string {
  const lines: string[] = [];
  lines.push(`env-doctor: comparing ${envFile} against ${exampleFile}`);
  lines.push("");

  if (diff.missing.length > 0) {
    lines.push(`Missing (required by ${exampleFile}, absent from ${envFile}):`);
    for (const key of diff.missing) lines.push(`  - ${key}`);
    lines.push("");
  }

  if (diff.empty.length > 0) {
    lines.push(`Empty (required by ${exampleFile}, present but blank in ${envFile}):`);
    for (const key of diff.empty) lines.push(`  - ${key}`);
    lines.push("");
  }

  if (diff.typeMismatches.length > 0) {
    lines.push(`Type mismatches (value shape doesn't match ${exampleFile}):`);
    for (const m of diff.typeMismatches) {
      lines.push(
        `  - ${m.key}: expected ${m.expectedType}-like (example: "${m.exampleValue}"), got "${m.actualValue}"`,
      );
    }
    lines.push("");
  }

  if (diff.undocumented.length > 0) {
    lines.push(`Undocumented (present in ${envFile}, missing from ${exampleFile}):`);
    for (const key of diff.undocumented) lines.push(`  - ${key}`);
    lines.push("");
  }

  if (
    diff.missing.length === 0 &&
    diff.empty.length === 0 &&
    diff.typeMismatches.length === 0 &&
    diff.undocumented.length === 0
  ) {
    lines.push("All good - .env matches .env.example with no missing, empty, mismatched, or undocumented variables.");
  } else if (!diff.hasBlockingIssues) {
    lines.push("No blocking issues (only undocumented extras found).");
  } else {
    lines.push(
      `Blocking issues found: ${diff.missing.length} missing, ${diff.empty.length} empty, ${diff.typeMismatches.length} type mismatch(es).`,
    );
  }

  return lines.join("\n");
}

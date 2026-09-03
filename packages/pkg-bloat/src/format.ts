import type { DepSizeEntry } from "./depSize.js";

const UNITS = ["B", "KB", "MB", "GB", "TB"];

/** Formats a byte count as a human-readable string, e.g. "1.5 MB". */
export function formatBytes(bytes: number): string {
  if (bytes <= 0) return "0 B";
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), UNITS.length - 1);
  const value = bytes / Math.pow(1024, exponent);
  const formatted = Number.isInteger(value) ? String(value) : value.toFixed(value < 10 ? 2 : 1);
  return `${formatted} ${UNITS[exponent]}`;
}

/** Renders a sorted table of dependency sizes plus a total, for stdout. */
export function formatTable(entries: DepSizeEntry[]): string {
  if (entries.length === 0) return "No direct dependencies found.";

  const total = entries.reduce((sum, e) => sum + e.sizeBytes, 0);
  const nameWidth = Math.max(4, ...entries.map((e) => e.name.length));

  const lines: string[] = [];
  lines.push(`${"Package".padEnd(nameWidth)}  Size`);
  lines.push(`${"-".repeat(nameWidth)}  ${"-".repeat(10)}`);
  for (const entry of entries) {
    const sizeLabel = entry.installed ? formatBytes(entry.sizeBytes) : "(not installed)";
    lines.push(`${entry.name.padEnd(nameWidth)}  ${sizeLabel}`);
  }
  lines.push(`${"-".repeat(nameWidth)}  ${"-".repeat(10)}`);
  lines.push(`${"Total".padEnd(nameWidth)}  ${formatBytes(total)}`);

  return lines.join("\n");
}

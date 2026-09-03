export interface ParsedEnvVar {
  key: string;
  value: string;
  /** True if the raw value (after unquoting) is an empty string. */
  isEmpty: boolean;
}

/**
 * Parses the content of a `.env`-style file into an ordered map of
 * key -> parsed value. Rules:
 *  - Blank lines and lines starting with `#` (after trimming) are ignored.
 *  - An optional leading `export ` is stripped from the key.
 *  - `KEY=VALUE` - everything after the first `=` is the value.
 *  - A value fully wrapped in matching single or double quotes has the
 *    quotes stripped.
 *  - Lines with no `=` are ignored (not treated as errors).
 */
export function parseEnvContent(content: string): Map<string, ParsedEnvVar> {
  const result = new Map<string, ParsedEnvVar>();
  const lines = content.split(/\r?\n/);

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (line.length === 0 || line.startsWith("#")) continue;

    const eqIndex = line.indexOf("=");
    if (eqIndex === -1) continue;

    let key = line.slice(0, eqIndex).trim();
    if (key.startsWith("export ")) {
      key = key.slice("export ".length).trim();
    }
    if (key.length === 0) continue;

    let value = line.slice(eqIndex + 1).trim();
    if (value.length >= 2) {
      const first = value[0];
      const last = value[value.length - 1];
      if ((first === '"' && last === '"') || (first === "'" && last === "'")) {
        value = value.slice(1, -1);
      }
    }

    result.set(key, { key, value, isEmpty: value.length === 0 });
  }

  return result;
}

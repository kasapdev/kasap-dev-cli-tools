import type { ParsedEnvVar } from "./parseEnv.js";

export interface EnvDiffResult {
  /** In .env.example but missing entirely from .env. */
  missing: string[];
  /** In .env but not documented in .env.example. */
  undocumented: string[];
  /** In .env, documented in .env.example, but set to an empty value. */
  empty: string[];
  /** True if there is at least one required (example) variable missing or empty. */
  hasBlockingIssues: boolean;
}

/**
 * Pure diff between the example env template and the actual env file.
 * Every key comparison is exact-match (case-sensitive), matching how
 * environment variables are actually looked up at runtime.
 */
export function diffEnv(
  exampleVars: Map<string, ParsedEnvVar>,
  envVars: Map<string, ParsedEnvVar>,
): EnvDiffResult {
  const missing: string[] = [];
  const empty: string[] = [];

  for (const key of exampleVars.keys()) {
    const actual = envVars.get(key);
    if (!actual) {
      missing.push(key);
    } else if (actual.isEmpty) {
      empty.push(key);
    }
  }

  const undocumented: string[] = [];
  for (const key of envVars.keys()) {
    if (!exampleVars.has(key)) {
      undocumented.push(key);
    }
  }

  missing.sort();
  empty.sort();
  undocumented.sort();

  return {
    missing,
    undocumented,
    empty,
    hasBlockingIssues: missing.length > 0 || empty.length > 0,
  };
}

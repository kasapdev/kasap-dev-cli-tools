import type { ParsedEnvVar } from "./parseEnv.js";
import { inferApparentType, matchesApparentType, type ApparentType } from "./typeCheck.js";

export interface EnvTypeMismatch {
  key: string;
  /** Apparent type inferred from the .env.example value's shape. */
  expectedType: ApparentType;
  exampleValue: string;
  actualValue: string;
}

export interface EnvDiffResult {
  /** In .env.example but missing entirely from .env. */
  missing: string[];
  /** In .env but not documented in .env.example. */
  undocumented: string[];
  /** In .env, documented in .env.example, but set to an empty value. */
  empty: string[];
  /**
   * In .env, documented in .env.example, non-empty, but shaped differently
   * than the example value (e.g. example looks like a number, actual doesn't).
   */
  typeMismatches: EnvTypeMismatch[];
  /** True if there is at least one required (example) variable missing, empty, or type-mismatched. */
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
  const typeMismatches: EnvTypeMismatch[] = [];

  for (const key of exampleVars.keys()) {
    const example = exampleVars.get(key)!;
    const actual = envVars.get(key);
    if (!actual) {
      missing.push(key);
      continue;
    }
    if (actual.isEmpty) {
      empty.push(key);
      continue;
    }
    // Only meaningful when the example itself has an inferable shape;
    // a free-form example value (e.g. a placeholder string) gives no
    // shape to check against.
    if (example.isEmpty) continue;
    const expectedType = inferApparentType(example.value);
    if (expectedType !== "unknown" && !matchesApparentType(actual.value, expectedType)) {
      typeMismatches.push({
        key,
        expectedType,
        exampleValue: example.value,
        actualValue: actual.value,
      });
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
  typeMismatches.sort((a, b) => a.key.localeCompare(b.key));

  return {
    missing,
    undocumented,
    empty,
    typeMismatches,
    hasBlockingIssues: missing.length > 0 || empty.length > 0 || typeMismatches.length > 0,
  };
}

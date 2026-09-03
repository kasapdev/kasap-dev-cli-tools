/** Raw facts collected from scanning a repository directory. */
export interface RepoFacts {
  /** README.md (case-insensitive) exists at the repo root. */
  hasReadme: boolean;
  /** Length in characters of the README's trimmed content (0 if absent). */
  readmeLength: number;
  /** LICENSE / LICENSE.md / LICENSE.txt exists at the repo root. */
  hasLicense: boolean;
  /** .gitignore exists at the repo root. */
  hasGitignore: boolean;
  /** At least one workflow file under .github/workflows/*.yml or *.yaml. */
  hasCI: boolean;
  /** Number of CI workflow files found. */
  ciFileCount: number;
  /** A test/tests/__tests__ directory exists, or test/spec files (e.g. foo.test.ts) were found. */
  hasTestFiles: boolean;
  /** Number of matched test files (does not include a bare directory match). */
  testFileCount: number;
  /** package.json declares a non-trivial "test" script. */
  hasTestScript: boolean;
}

export interface ScoreCategory {
  name: string;
  score: number;
  max: number;
  /** Human-readable explanation of why points were or weren't awarded. */
  detail: string;
}

export interface ScoreResult {
  total: number;
  maxTotal: number;
  categories: ScoreCategory[];
  suggestions: string[];
}

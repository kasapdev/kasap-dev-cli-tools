import type { RepoFacts, ScoreCategory, ScoreResult } from "./types.js";

/** Minimum README length (in characters, after trimming) to count as "non-trivial". */
export const README_MIN_LENGTH = 200;

/**
 * Pure scoring function: turns collected repo facts into a 0-100 score
 * broken down by category, plus actionable suggestions.
 *
 * Weighting (100 points total):
 *  - README.md (non-trivial length): 25
 *  - LICENSE: 15
 *  - CI config (.github/workflows/*.yml): 20
 *  - .gitignore: 10
 *  - Tests (files/dir + package.json test script): 30
 */
export function scoreRepo(facts: RepoFacts): ScoreResult {
  const categories: ScoreCategory[] = [];
  const suggestions: string[] = [];

  // README - 25 points
  const readmeMax = 25;
  let readmeScore = 0;
  let readmeDetail: string;
  if (!facts.hasReadme) {
    readmeDetail = "README.md not found.";
    suggestions.push("Add a README.md describing what the project does and how to use it.");
  } else if (facts.readmeLength < README_MIN_LENGTH) {
    readmeScore = 10;
    readmeDetail = `README.md exists but is very short (${facts.readmeLength} chars, minimum recommended ${README_MIN_LENGTH}).`;
    suggestions.push("Expand README.md with usage examples, install steps, and project purpose.");
  } else {
    readmeScore = readmeMax;
    readmeDetail = `README.md exists with ${facts.readmeLength} chars of content.`;
  }
  categories.push({ name: "README", score: readmeScore, max: readmeMax, detail: readmeDetail });

  // LICENSE - 15 points
  const licenseMax = 15;
  const licenseScore = facts.hasLicense ? licenseMax : 0;
  categories.push({
    name: "LICENSE",
    score: licenseScore,
    max: licenseMax,
    detail: facts.hasLicense ? "LICENSE file found." : "No LICENSE file found.",
  });
  if (!facts.hasLicense) {
    suggestions.push("Add a LICENSE file (e.g. MIT) so others know how they can use the project.");
  }

  // CI - 20 points
  const ciMax = 20;
  const ciScore = facts.hasCI ? ciMax : 0;
  categories.push({
    name: "CI",
    score: ciScore,
    max: ciMax,
    detail: facts.hasCI
      ? `${facts.ciFileCount} workflow file(s) found in .github/workflows/.`
      : "No .github/workflows/*.yml CI configuration found.",
  });
  if (!facts.hasCI) {
    suggestions.push("Add a GitHub Actions workflow under .github/workflows/ to run builds and tests automatically.");
  }

  // .gitignore - 10 points
  const gitignoreMax = 10;
  const gitignoreScore = facts.hasGitignore ? gitignoreMax : 0;
  categories.push({
    name: ".gitignore",
    score: gitignoreScore,
    max: gitignoreMax,
    detail: facts.hasGitignore ? ".gitignore file found." : "No .gitignore file found.",
  });
  if (!facts.hasGitignore) {
    suggestions.push("Add a .gitignore file to avoid committing build output, node_modules, and secrets.");
  }

  // Tests - 30 points (15 for presence of test files/dir, 15 for a test script)
  const testsMax = 30;
  let testsScore = 0;
  const testDetails: string[] = [];
  if (facts.hasTestFiles) {
    testsScore += 15;
    testDetails.push(`${facts.testFileCount} test file(s)/directory detected.`);
  } else {
    testDetails.push("No test directory or *.test.*/*.spec.* files found.");
    suggestions.push("Add tests (e.g. a tests/ directory or *.test.ts files) to cover core logic.");
  }
  if (facts.hasTestScript) {
    testsScore += 15;
    testDetails.push('package.json has a "test" script.');
  } else {
    testDetails.push('No "test" script in package.json.');
    suggestions.push('Add a "test" script to package.json so `npm test` / `pnpm test` runs your test suite.');
  }
  categories.push({ name: "Tests", score: testsScore, max: testsMax, detail: testDetails.join(" ") });

  const total = categories.reduce((sum, c) => sum + c.score, 0);
  const maxTotal = categories.reduce((sum, c) => sum + c.max, 0);

  return { total, maxTotal, categories, suggestions };
}

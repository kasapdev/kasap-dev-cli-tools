import { describe, expect, it } from "vitest";
import { scoreRepo } from "../src/scorer.js";
import type { RepoFacts } from "../src/types.js";

const fullFacts: RepoFacts = {
  hasReadme: true,
  readmeLength: 500,
  hasLicense: true,
  hasGitignore: true,
  hasCI: true,
  ciFileCount: 1,
  hasTestFiles: true,
  testFileCount: 3,
  hasTestScript: true,
};

const emptyFacts: RepoFacts = {
  hasReadme: false,
  readmeLength: 0,
  hasLicense: false,
  hasGitignore: false,
  hasCI: false,
  ciFileCount: 0,
  hasTestFiles: false,
  testFileCount: 0,
  hasTestScript: false,
};

describe("scoreRepo", () => {
  it("gives a perfect score of 100 when every category is satisfied", () => {
    const result = scoreRepo(fullFacts);
    expect(result.total).toBe(100);
    expect(result.maxTotal).toBe(100);
    expect(result.suggestions).toHaveLength(0);
  });

  it("gives a score of 0 and a suggestion per category when nothing is present", () => {
    const result = scoreRepo(emptyFacts);
    expect(result.total).toBe(0);
    expect(result.suggestions.length).toBeGreaterThanOrEqual(5);
  });

  it("awards partial README credit for a too-short README", () => {
    const result = scoreRepo({ ...emptyFacts, hasReadme: true, readmeLength: 50 });
    const readme = result.categories.find((c) => c.name === "README");
    expect(readme?.score).toBe(10);
    expect(result.suggestions.some((s) => s.includes("Expand README"))).toBe(true);
  });

  it("awards full README credit once length reaches the minimum threshold", () => {
    const result = scoreRepo({ ...emptyFacts, hasReadme: true, readmeLength: 200 });
    const readme = result.categories.find((c) => c.name === "README");
    expect(readme?.score).toBe(25);
  });

  it("splits the Tests category into file-presence and script halves", () => {
    const onlyFiles = scoreRepo({ ...emptyFacts, hasTestFiles: true, testFileCount: 2 });
    const testsOnlyFiles = onlyFiles.categories.find((c) => c.name === "Tests");
    expect(testsOnlyFiles?.score).toBe(15);

    const onlyScript = scoreRepo({ ...emptyFacts, hasTestScript: true });
    const testsOnlyScript = onlyScript.categories.find((c) => c.name === "Tests");
    expect(testsOnlyScript?.score).toBe(15);

    const both = scoreRepo({ ...emptyFacts, hasTestFiles: true, hasTestScript: true });
    const testsBoth = both.categories.find((c) => c.name === "Tests");
    expect(testsBoth?.score).toBe(30);
  });

  it("sums category scores exactly to total", () => {
    const result = scoreRepo({ ...emptyFacts, hasLicense: true, hasGitignore: true });
    const sum = result.categories.reduce((acc, c) => acc + c.score, 0);
    expect(result.total).toBe(sum);
  });
});

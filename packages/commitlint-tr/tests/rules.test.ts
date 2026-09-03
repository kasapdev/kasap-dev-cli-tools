import { describe, expect, it } from "vitest";
import { extractSubjectLine, validateCommitMessage } from "../src/rules.js";

describe("extractSubjectLine", () => {
  it("returns the first non-empty, non-comment line", () => {
    const raw = "\n# a comment\n\nfeat: add thing\n\nBody text here\n# trailing comment";
    expect(extractSubjectLine(raw)).toBe("feat: add thing");
  });

  it("returns an empty string when there is no usable content", () => {
    expect(extractSubjectLine("# only comments\n\n# more comments")).toBe("");
  });
});

describe("validateCommitMessage", () => {
  it("accepts a plain English conventional commit", () => {
    const result = validateCommitMessage("fix: correct off-by-one error in pagination");
    expect(result.valid).toBe(true);
    expect(result.parsed?.type).toBe("fix");
    expect(result.parsed?.scope).toBeUndefined();
  });

  it("accepts a Turkish description", () => {
    const result = validateCommitMessage("feat(auth): kullanıcı girişi ekranı eklendi");
    expect(result.valid).toBe(true);
    expect(result.parsed?.type).toBe("feat");
    expect(result.parsed?.scope).toBe("auth");
    expect(result.parsed?.description).toBe("kullanıcı girişi ekranı eklendi");
  });

  it("accepts a breaking-change marker", () => {
    const result = validateCommitMessage("feat(api)!: response şeması değişti");
    expect(result.valid).toBe(true);
    expect(result.parsed?.breaking).toBe(true);
  });

  it("rejects an unknown commit type", () => {
    const result = validateCommitMessage("feature: yeni özellik eklendi");
    expect(result.valid).toBe(false);
    expect(result.error).toContain("Geçersiz commit mesajı formatı");
  });

  it("rejects a missing colon/description separator", () => {
    const result = validateCommitMessage("fix bir şeyi düzelttim");
    expect(result.valid).toBe(false);
  });

  it("rejects an empty message", () => {
    const result = validateCommitMessage("   \n\n  ");
    expect(result.valid).toBe(false);
    expect(result.error).toContain("boş olamaz");
  });

  it("rejects a type with no description text", () => {
    const result = validateCommitMessage("fix:");
    expect(result.valid).toBe(false);
  });

  it("ignores git comment lines when validating", () => {
    const raw = "feat: yeni özellik\n\n# Please enter the commit message for your changes.";
    const result = validateCommitMessage(raw);
    expect(result.valid).toBe(true);
  });

  it("accepts every declared commit type", () => {
    const types = ["feat", "fix", "docs", "style", "refactor", "perf", "test", "chore", "build", "ci"];
    for (const type of types) {
      const result = validateCommitMessage(`${type}: örnek açıklama`);
      expect(result.valid, `${type} should be valid`).toBe(true);
    }
  });
});

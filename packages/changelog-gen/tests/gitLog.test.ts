import { describe, expect, it } from "vitest";
import { getCommitLog, parseGitLogOutput } from "../src/gitLog.js";

const UNIT_SEP = "\x1f";
const RECORD_SEP = "\x1e";

function fakeLogLine(hash: string, subject: string, body: string): string {
  return `${hash}${UNIT_SEP}${subject}${UNIT_SEP}${body}${RECORD_SEP}`;
}

describe("parseGitLogOutput", () => {
  it("parses multiple commits separated by the record separator", () => {
    const raw =
      fakeLogLine("abc1234", "feat: add login", "") +
      "\n" +
      fakeLogLine("def5678", "fix: correct bug", "some body text");

    const commits = parseGitLogOutput(raw);
    expect(commits).toHaveLength(2);
    expect(commits[0]).toEqual({ hash: "abc1234", subject: "feat: add login", body: "" });
    expect(commits[1]).toEqual({ hash: "def5678", subject: "fix: correct bug", body: "some body text" });
  });

  it("handles multi-line bodies without breaking the split", () => {
    const raw = fakeLogLine("h1", "feat: thing", "line one\nline two\n\nBREAKING CHANGE: it broke");
    const commits = parseGitLogOutput(raw);
    expect(commits).toHaveLength(1);
    expect(commits[0]?.body).toContain("BREAKING CHANGE: it broke");
  });

  it("returns an empty array for empty output", () => {
    expect(parseGitLogOutput("")).toEqual([]);
  });
});

describe("getCommitLog", () => {
  it("builds a from..to range and passes it to the injected exec function", () => {
    let capturedArgs: string[] = [];
    const fakeExec = (args: string[]) => {
      capturedArgs = args;
      return fakeLogLine("h1", "feat: x", "");
    };

    const commits = getCommitLog({ from: "v1.0.0", to: "v1.1.0", exec: fakeExec });

    expect(capturedArgs).toContain("v1.0.0..v1.1.0");
    expect(commits).toHaveLength(1);
  });

  it("defaults to just the --to ref when --from is omitted", () => {
    let capturedArgs: string[] = [];
    const fakeExec = (args: string[]) => {
      capturedArgs = args;
      return "";
    };

    getCommitLog({ exec: fakeExec });

    expect(capturedArgs).toContain("HEAD");
    expect(capturedArgs.some((a) => a.includes(".."))).toBe(false);
  });
});

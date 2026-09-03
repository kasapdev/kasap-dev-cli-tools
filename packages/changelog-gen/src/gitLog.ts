import { spawnSync } from "node:child_process";

export interface RawCommit {
  hash: string;
  subject: string;
  body: string;
}

// Use ASCII unit/record separators as field/commit delimiters - they never
// legitimately appear in commit messages, so this survives multi-line
// bodies and subjects containing arbitrary punctuation.
const UNIT_SEP = "\x1f";
const RECORD_SEP = "\x1e";
const LOG_FORMAT = `%H${UNIT_SEP}%s${UNIT_SEP}%b${RECORD_SEP}`;

/**
 * Parses the raw stdout of `git log --pretty=format:<LOG_FORMAT>` into
 * structured commits. Pure function - no process/child_process access - so
 * it can be unit tested with hand-written fixture strings instead of a real
 * git repository.
 */
export function parseGitLogOutput(raw: string): RawCommit[] {
  return raw
    .split(RECORD_SEP)
    .map((record) => record.replace(/^\n+/, "").trim())
    .filter((record) => record.length > 0)
    .map((record) => {
      const [hash = "", subject = "", ...bodyParts] = record.split(UNIT_SEP);
      return { hash: hash.trim(), subject: subject.trim(), body: bodyParts.join(UNIT_SEP).trim() };
    });
}

export type GitExec = (args: string[], cwd?: string) => string;

function defaultGitExec(args: string[], cwd?: string): string {
  const result = spawnSync("git", args, { cwd, encoding: "utf8" });
  if (result.error) {
    throw new Error(`Failed to run git: ${result.error.message}`);
  }
  if (result.status !== 0) {
    throw new Error(`git ${args.join(" ")} exited with code ${result.status}: ${result.stderr}`);
  }
  return result.stdout;
}

export interface GetCommitLogOptions {
  from?: string;
  to?: string;
  cwd?: string;
  /** Injectable for tests; defaults to actually spawning `git`. */
  exec?: GitExec;
}

/** Runs (or, in tests, simulates) `git log` between two refs and returns parsed commits. */
export function getCommitLog(options: GetCommitLogOptions = {}): RawCommit[] {
  const to = options.to ?? "HEAD";
  const range = options.from ? `${options.from}..${to}` : to;
  const exec = options.exec ?? defaultGitExec;

  const output = exec(["log", `--pretty=format:${LOG_FORMAT}`, range], options.cwd);
  return parseGitLogOutput(output);
}

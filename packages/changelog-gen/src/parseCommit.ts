import type { RawCommit } from "./gitLog.js";

export interface ParsedCommit {
  hash: string;
  subject: string;
  type?: string;
  scope?: string;
  description: string;
  /** True if the commit's header has a `!` before the colon, or its body contains "BREAKING CHANGE:". */
  breaking: boolean;
}

const HEADER_PATTERN = /^(\w+)(\([\w./\- ]+\))?(!)?:\s*(.+)$/;
const BREAKING_CHANGE_BODY_PATTERN = /BREAKING[ -]CHANGE:/;

/**
 * Parses a single raw commit's subject/body into Conventional Commit parts.
 * Commits that don't follow the `<type>(<scope>)?: <description>` shape
 * still get a result (with `type` left undefined) so they can be bucketed
 * into an "Other" changelog section rather than dropped.
 */
export function parseConventionalCommit(raw: RawCommit): ParsedCommit {
  const subject = raw.subject.trim();
  const breakingFromBody = BREAKING_CHANGE_BODY_PATTERN.test(raw.body);

  const match = HEADER_PATTERN.exec(subject);
  if (!match) {
    return { hash: raw.hash, subject, description: subject, breaking: breakingFromBody };
  }

  const [, type, scopeWithParens, bang, description] = match;
  const scope = scopeWithParens ? scopeWithParens.slice(1, -1).trim() : undefined;

  return {
    hash: raw.hash,
    subject,
    type: type?.toLowerCase(),
    scope: scope && scope.length > 0 ? scope : undefined,
    description: (description ?? subject).trim(),
    breaking: Boolean(bang) || breakingFromBody,
  };
}

/** Conventional Commit types this linter accepts. */
export const COMMIT_TYPES = [
  "feat",
  "fix",
  "docs",
  "style",
  "refactor",
  "perf",
  "test",
  "chore",
  "build",
  "ci",
] as const;

export type CommitType = (typeof COMMIT_TYPES)[number];

// <type>(<scope>)?!?: <description>
// The description is intentionally unrestricted in character set so it can
// be written in Turkish (or any other language) - only the "<type>(<scope>): "
// prefix is enforced against the Conventional Commits shape.
const SUBJECT_PATTERN = new RegExp(
  `^(${COMMIT_TYPES.join("|")})(\\([a-zA-Z0-9/_.\\- ]+\\))?(!)?: (.+)$`,
);

export interface ParsedCommit {
  type: CommitType;
  scope?: string;
  breaking: boolean;
  description: string;
}

export interface ValidationResult {
  valid: boolean;
  subject: string;
  parsed?: ParsedCommit;
  /** Turkish, human-readable explanation of what's wrong (only set when invalid). */
  error?: string;
}

/**
 * Extracts the commit subject line from a raw commit message file's
 * contents: git comment lines (starting with `#`) are stripped, and the
 * first remaining non-empty line is treated as the subject.
 */
export function extractSubjectLine(rawMessage: string): string {
  const lines = rawMessage.split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.length === 0) continue;
    if (trimmed.startsWith("#")) continue;
    return trimmed;
  }
  return "";
}

function formatUsageError(subject: string): string {
  return [
    "Geçersiz commit mesajı formatı.",
    "",
    "Beklenen format: <tür>(<kapsam>)?: <açıklama>",
    "",
    `Geçerli türler: ${COMMIT_TYPES.join(", ")}`,
    "",
    "Açıklama Türkçe yazılabilir. Örnek:",
    "  feat(auth): kullanıcı girişi ekranına şifremi unuttum bağlantısı eklendi",
    "  fix: sepet toplamının yanlış hesaplanması düzeltildi",
    "",
    `Girdiğiniz başlık satırı: "${subject}"`,
  ].join("\n");
}

/**
 * Validates a commit message subject line against the
 * `<type>(<scope>)?: <description>` shape. Pure function - no filesystem or
 * process access - so it's trivial to unit test.
 */
export function validateCommitMessage(rawMessage: string): ValidationResult {
  const subject = extractSubjectLine(rawMessage);

  if (subject.length === 0) {
    return {
      valid: false,
      subject,
      error: "Commit mesajı boş olamaz.\n\n" + formatUsageError(subject),
    };
  }

  const match = SUBJECT_PATTERN.exec(subject);
  if (!match) {
    return { valid: false, subject, error: formatUsageError(subject) };
  }

  const [, type, scopeWithParens, breakingMark, description] = match;
  const scope = scopeWithParens ? scopeWithParens.slice(1, -1).trim() : undefined;

  if (!description || description.trim().length === 0) {
    return {
      valid: false,
      subject,
      error: "Açıklama (description) boş olamaz.\n\n" + formatUsageError(subject),
    };
  }

  return {
    valid: true,
    subject,
    parsed: {
      type: type as CommitType,
      scope: scope && scope.length > 0 ? scope : undefined,
      breaking: Boolean(breakingMark),
      description: description.trim(),
    },
  };
}

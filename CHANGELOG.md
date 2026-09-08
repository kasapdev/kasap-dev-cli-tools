# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## 2026-09-08

### Added

- `env-doctor` (0.1.0 -> 0.2.0): type mismatch detection. `env-doctor` now
  infers the "apparent type" of each `.env.example` value from its shape
  (`number`, `boolean`, or `url`) and reports any `.env` value that doesn't
  match that shape as a new `typeMismatches` finding - e.g. an example of
  `PORT=3000` catches a real `.env` with `PORT=please-set-me`. Mismatches
  are shown in their own report section, included in `--json` output, and
  count toward the CLI's blocking-issue exit code alongside missing and
  empty variables. A free-form example value (no inferable shape) is never
  checked, and a key already reported as missing or empty is not
  double-reported as a type mismatch. New module `src/typeCheck.ts` with
  `inferApparentType`/`matchesApparentType`, both exported from the package
  entrypoint.

### Tests

- `env-doctor`: added `tests/report.test.ts`, a previously-missing test
  file for `formatReport` (all-good, missing-only, empty-only,
  undocumented-only/non-blocking, type-mismatch, combined-drift, and
  custom file-label cases). No bug was found in `formatReport` - all
  existing behavior was already correct - but the function had zero direct
  test coverage before this pass.

## 2026-09-06

### Added

- `commitlint-tr`: tests covering scope-whitespace handling in
  `validateCommitMessage` - a scope like `feat( auth ): ...` is trimmed to
  `auth`, and a scope made up only of whitespace (`feat(   ): ...`) is
  normalized to "no scope" rather than an empty string. Also added a
  regression test confirming a subject where the colon isn't followed by a
  space (e.g. `fix:no space`) is correctly rejected.
- `changelog-gen`: matching tests for the same scope-whitespace trimming and
  normalization behavior in `parseConventionalCommit`.
- `env-doctor`: a test confirming `parseEnvContent` does not strip quotes
  from a value when the opening and closing quote characters don't match
  (e.g. `A="mismatched'`), locking in existing intentional behavior.
- `pkg-bloat`: a test confirming `formatBytes` clamps negative byte counts
  to `"0 B"` instead of producing `NaN` or a negative size string.

No production code changed - these tests exercise edge cases in existing
parsing/formatting logic that were previously undocumented by the test
suite, and all of them passed against the current implementation.

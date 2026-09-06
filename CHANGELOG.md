# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

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

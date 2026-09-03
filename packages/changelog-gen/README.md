# changelog-gen

Generates a `CHANGELOG.md` entry from Conventional Commit messages between
two git refs, grouped into Features / Fixes / Other, with a suggested
semver bump.

## Install

```bash
pnpm install
pnpm --filter changelog-gen build
```

## Usage

```bash
# Everything from the last tag up to HEAD
changelog-gen --from v1.2.0

# A specific range
changelog-gen --from v1.2.0 --to v1.3.0

# Print without writing to CHANGELOG.md
changelog-gen --from v1.2.0 --dry-run

# Run against a repo other than the current directory
changelog-gen --from v1.2.0 --cwd ../some-other-repo
```

Example output:

```
## 2026-09-04 (v1.2.0..HEAD) (suggested bump: minor)

### Features

- **auth**: add password reset flow (a1b2c3d)

### Fixes

- correct pagination off-by-one (e4f5a6b)

Suggested semver bump: minor
Commits: 2 (1 feat, 1 fix, 0 other)

Wrote entry to /path/to/repo/CHANGELOG.md
```

## Semver bump rule

- `major` - any commit has `!` before the colon (e.g. `feat(api)!: ...`) or
  a `BREAKING CHANGE:` footer in its body.
- `minor` - otherwise, if any commit is `feat: ...`.
- `patch` - otherwise.

## How it works

Runs `git log --pretty=format:...` (via `node:child_process`) between the
given refs, using unlikely ASCII separator characters to safely parse
multi-line commit bodies. Non-conventional commits aren't discarded - they
land in the "Other" section so nothing silently disappears from the
changelog.

## Development

```bash
pnpm --filter changelog-gen test
```

Tests inject a fake git executor, so the suite never shells out to a real
`git` process or depends on this monorepo's own commit history.

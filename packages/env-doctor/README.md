# env-doctor

Compares a `.env` file against its `.env.example` template and reports
drift: variables that are missing, undocumented, or set but empty.

## Install

```bash
pnpm install
pnpm --filter env-doctor build
```

## Usage

```bash
# Uses ./.env.example and ./.env by default
env-doctor

# Custom paths
env-doctor --example config/.env.example --env config/.env

# Machine-readable output
env-doctor --json
```

Example output:

```
env-doctor: comparing .env against .env.example

Missing (required by .env.example, absent from .env):
  - STRIPE_SECRET_KEY

Empty (required by .env.example, present but blank in .env):
  - DATABASE_URL

Undocumented (present in .env, missing from .env.example):
  - SOME_LEFTOVER_VAR

Blocking issues found: 1 missing, 1 empty.
```

Exit code is non-zero whenever a variable declared in `.env.example` is
either missing from `.env` or present with an empty value - handy as a CI
gate or a pre-deploy sanity check. Undocumented-only findings do not affect
the exit code.

## Parsing rules

- Blank lines and lines starting with `#` are ignored.
- `KEY=VALUE`; an optional leading `export ` on the key is stripped.
- A value fully wrapped in matching single or double quotes has the quotes
  removed.
- Lines without an `=` are ignored.

## Development

```bash
pnpm --filter env-doctor test
```

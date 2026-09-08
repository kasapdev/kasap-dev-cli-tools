# env-doctor

Compares a `.env` file against its `.env.example` template and reports
drift: variables that are missing, undocumented, set but empty, or set to a
value whose apparent type doesn't match the example's.

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

Blocking issues found: 1 missing, 1 empty, 0 type mismatch(es).
```

Exit code is non-zero whenever a variable declared in `.env.example` is
missing from `.env`, present with an empty value, or type-mismatched - handy
as a CI gate or a pre-deploy sanity check. Undocumented-only findings do not
affect the exit code.

## Type mismatch detection

Besides missing/empty/undocumented, `env-doctor` also infers the "apparent
type" of each `.env.example` value from its shape - `number` (e.g. `3000`),
`boolean` (`true`/`false`), or `url` (anything with a `scheme://`) - and
flags `.env` values that don't match that shape. A free-form example value
(no inferable shape, e.g. `API_KEY=sk_test_xxx`) is never checked, and a
variable already reported as missing or empty is not double-reported here.

```bash
# .env.example
# DATABASE_URL=postgres://user:pass@localhost:5432/app
# PORT=3000
# DEBUG=false
# STRIPE_SECRET_KEY=sk_test_xxx

# .env
# DATABASE_URL=postgres://real:secret@db.internal:5432/app
# PORT=not-a-port
# DEBUG=false
# SOME_LEFTOVER_VAR=1

env-doctor
```

```
env-doctor: comparing .env against .env.example

Missing (required by .env.example, absent from .env):
  - STRIPE_SECRET_KEY

Type mismatches (value shape doesn't match .env.example):
  - PORT: expected number-like (example: "3000"), got "not-a-port"

Undocumented (present in .env, missing from .env.example):
  - SOME_LEFTOVER_VAR

Blocking issues found: 1 missing, 0 empty, 1 type mismatch(es).
```

The `--json` output includes a `typeMismatches` array with `key`,
`expectedType`, `exampleValue`, and `actualValue` for each finding.

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

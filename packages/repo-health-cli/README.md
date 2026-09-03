# repo-health-cli

Scans a local git repository and scores its basic project hygiene out of 100:
README, LICENSE, CI config, `.gitignore`, and tests.

## Install

From the monorepo root:

```bash
pnpm install
pnpm --filter repo-health-cli build
```

Or link it globally for local use:

```bash
cd packages/repo-health-cli
npm link
```

## Usage

```bash
# Scan the current directory
repo-health .

# Scan another repo
repo-health ../some-other-project

# Machine-readable output
repo-health . --json
```

Example text output:

```
Repo Health Report: /home/kayra/projects/my-repo
====================================================
  README       25 / 25  -  README.md exists with 812 chars of content.
  LICENSE      15 / 15  -  LICENSE file found.
  CI           20 / 20  -  1 workflow file(s) found in .github/workflows/.
  .gitignore   10 / 10  -  .gitignore file found.
  Tests        30 / 30  -  4 test file(s)/directory detected. package.json has a "test" script.

Total score: 100 / 100

No suggestions - looking good!
```

## Scoring

| Category    | Points | How it's earned                                                            |
| ----------- | -----: | ---------------------------------------------------------------------------- |
| README      |     25 | README.md exists; full credit at >= 200 chars, partial credit if shorter    |
| LICENSE     |     15 | LICENSE / LICENSE.md / LICENSE.txt exists                                   |
| CI          |     20 | At least one `.github/workflows/*.yml` file                                 |
| .gitignore  |     10 | `.gitignore` exists at repo root                                            |
| Tests       |     30 | 15 for a `test`/`tests`/`__tests__` dir or `*.test.*`/`*.spec.*` files, 15 for a `test` script in `package.json` |

`node_modules`, `.git`, `dist`, `build`, `coverage`, and `.pnpm-store` are skipped when scanning for test files.

## Development

```bash
pnpm --filter repo-health-cli test
pnpm --filter repo-health-cli dev -- .
```

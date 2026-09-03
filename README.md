# kasap-dev-cli-tools

A small collection of real, working developer-tooling CLIs by
[Kayra Kasapoğlu](https://github.com/kasapdev). Each one is a standalone
package - install what you need, ignore the rest.

pnpm workspace monorepo, TypeScript + ESM throughout.

## Tools

| Package | Description |
| --- | --- |
| [`repo-health-cli`](packages/repo-health-cli) | Scores a local git repo out of 100 on README/LICENSE/CI/.gitignore/tests, with suggestions for what's missing. |
| [`commitlint-tr`](packages/commitlint-tr) | Enforces Conventional Commits format while allowing the commit description to be written in Turkish; installs a `commit-msg` git hook. |
| [`env-doctor`](packages/env-doctor) | Diffs `.env` against `.env.example`: missing, undocumented, and empty variables, with a CI-friendly exit code. |
| [`pkg-bloat`](packages/pkg-bloat) | Reports each direct dependency's on-disk size in `node_modules`, sorted largest-first. |
| [`changelog-gen`](packages/changelog-gen) | Generates a `CHANGELOG.md` entry from Conventional Commits between two git refs, with a suggested semver bump. |

## Getting started

```bash
pnpm install
pnpm build
pnpm test
```

Each package can also be built, tested, and run independently:

```bash
pnpm --filter repo-health-cli build
pnpm --filter repo-health-cli test
```

See each package's README for full usage and examples.

## Conventions

- Node >= 22.5.0, pnpm workspace (`pnpm-workspace.yaml`).
- TypeScript, strict mode, ESM (`"type": "module"`), compiled with `tsc`.
- Every package ships a `bin` entry point and real vitest unit tests for its
  pure logic - no real network calls, no dependency on this repo's own git
  history in tests.
- CI (`.github/workflows/ci.yml`) installs, builds, typechecks, and tests
  on every push/PR.

## License

MIT - see [LICENSE](LICENSE).

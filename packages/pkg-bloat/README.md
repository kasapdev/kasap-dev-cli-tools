# pkg-bloat

Reports the on-disk installed size of every direct dependency
(`dependencies` + `devDependencies`) in `node_modules`, sorted
largest-first, plus a total. Useful for spotting which dependency is
quietly eating your disk (or your Docker image / serverless bundle).

## Install

```bash
pnpm install
pnpm --filter pkg-bloat build
```

## Usage

```bash
# Scan the current project
pkg-bloat

# Scan another project
pkg-bloat ../some-other-project

# Machine-readable output
pkg-bloat --json
```

Example output:

```
pkg-bloat: /home/kayra/projects/my-app

Package       Size
------------  ----------
typescript    22.10 MB
commander     512 B
vitest        18.40 MB
------------  ----------
Total         40.92 MB
```

## How sizing works

- Each direct dependency's folder under `node_modules/<name>` (or
  `node_modules/@scope/name` for scoped packages) is located and its
  content is summed recursively, including any nested `node_modules` it
  ships with.
- If `node_modules/<name>` is itself a symlink (as with pnpm's
  content-addressed store), the real target directory is resolved once and
  measured, so pnpm-managed projects get accurate top-level sizes.
- Symlinks encountered *while recursing* are skipped, to avoid double
  counting or infinite loops caused by pnpm's internal
  `node_modules/.pnpm` link graph.
- A dependency not found under `node_modules` (not yet installed) is
  reported as `(not installed)` with size 0 rather than causing an error.

## Development

```bash
pnpm --filter pkg-bloat test
```

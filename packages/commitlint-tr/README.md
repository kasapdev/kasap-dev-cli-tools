# commitlint-tr

A tiny Conventional Commits linter plus a `commit-msg` git hook installer.
The `<type>(<scope>)` prefix must follow
[Conventional Commits](https://www.conventionalcommits.org/), but the
`<description>` may be written in Turkish - useful when your team writes
commit messages in Turkish but wants consistent, greppable history.

Format enforced:

```
<type>(<scope>)?: <description>
```

Allowed types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`,
`chore`, `build`, `ci` (a trailing `!` before the colon marks a breaking
change, e.g. `feat(api)!: ...`).

## Install

```bash
pnpm install
pnpm --filter commitlint-tr build
```

## Usage

### Install the git hook

Run this inside the repository you want to lint commit messages for:

```bash
commitlint-tr install
# or, from another directory:
commitlint-tr install --repo /path/to/repo
```

This writes `.git/hooks/commit-msg`, which runs `commitlint-tr check` on
every commit and rejects invalid messages before they're recorded.

### Check a message manually

```bash
commitlint-tr check ./some-commit-message.txt
```

Exits with code `1` and prints a Turkish explanation of the expected format
when the message is invalid; exits `0` and prints a short confirmation when
it's valid.

### Examples

Valid:

```
feat(auth): kullanıcı girişi ekranına şifremi unuttum bağlantısı eklendi
fix: sepet toplamının yanlış hesaplanması düzeltildi
feat(api)!: response şeması değişti
```

Invalid (wrong shape, unknown type, or no description):

```
updated stuff
feature: yeni özellik eklendi
fix:
```

## Development

```bash
pnpm --filter commitlint-tr test
```

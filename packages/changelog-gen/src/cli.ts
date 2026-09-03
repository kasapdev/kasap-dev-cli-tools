#!/usr/bin/env node
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { Command } from "commander";
import { getCommitLog } from "./gitLog.js";
import { parseConventionalCommit } from "./parseCommit.js";
import { groupCommits, suggestBump } from "./group.js";
import { formatChangelogEntry, prependChangelog } from "./changelog.js";

const program = new Command();

program
  .name("changelog-gen")
  .description("Generates a CHANGELOG.md entry from Conventional Commit messages between two git refs.")
  .version("0.1.0")
  .option("--from <ref>", "starting git ref (exclusive); omit to include full history up to --to")
  .option("--to <ref>", "ending git ref (inclusive)", "HEAD")
  .option("--cwd <path>", "path to the git repository", ".")
  .option("--out <path>", "path to the changelog file to write/prepend", "CHANGELOG.md")
  .option("--dry-run", "print the generated entry without writing to the changelog file")
  .action((options: { from?: string; to: string; cwd: string; out: string; dryRun?: boolean }) => {
    const cwd = resolve(options.cwd);

    let rawCommits;
    try {
      rawCommits = getCommitLog({ from: options.from, to: options.to, cwd });
    } catch (err) {
      console.error(`Error running git log: ${(err as Error).message}`);
      process.exitCode = 1;
      return;
    }

    if (rawCommits.length === 0) {
      console.log(`No commits found in range ${options.from ? `${options.from}..${options.to}` : options.to}.`);
      return;
    }

    const parsed = rawCommits.map(parseConventionalCommit);
    const grouped = groupCommits(parsed);
    const bump = suggestBump(parsed);

    const rangeLabel = options.from ? `${options.from}..${options.to}` : options.to;
    const heading = `${new Date().toISOString().slice(0, 10)} (${rangeLabel})`;
    const entry = formatChangelogEntry(heading, grouped, bump);

    console.log(entry);
    console.log(`Suggested semver bump: ${bump}`);
    console.log(`Commits: ${parsed.length} (${grouped.features.length} feat, ${grouped.fixes.length} fix, ${grouped.other.length} other)`);

    if (options.dryRun) {
      return;
    }

    const outPath = resolve(cwd, options.out);
    const existing = existsSync(outPath) ? readFileSync(outPath, "utf8") : "";
    const updated = prependChangelog(existing, entry);
    writeFileSync(outPath, updated, "utf8");
    console.log(`\nWrote entry to ${outPath}`);
  });

program.parse();

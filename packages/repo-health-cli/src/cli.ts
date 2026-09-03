#!/usr/bin/env node
import { existsSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { Command } from "commander";
import { collectRepoFacts } from "./scan.js";
import { scoreRepo } from "./scorer.js";
import { formatReport } from "./report.js";

const program = new Command();

program
  .name("repo-health")
  .description("Scores a local git repository's basic health (README, LICENSE, CI, .gitignore, tests) out of 100.")
  .version("0.1.0")
  .argument("[path]", "path to the repository to scan", ".")
  .option("--json", "print machine-readable JSON output instead of a text report")
  .action((path: string, options: { json?: boolean }) => {
    const repoPath = resolve(path);

    if (!existsSync(repoPath) || !statSync(repoPath).isDirectory()) {
      console.error(`Error: "${repoPath}" is not a directory.`);
      process.exitCode = 1;
      return;
    }

    const facts = collectRepoFacts(repoPath);
    const result = scoreRepo(facts);

    if (options.json) {
      console.log(JSON.stringify({ path: repoPath, ...result }, null, 2));
    } else {
      console.log(formatReport(repoPath, result));
    }
  });

program.parse();

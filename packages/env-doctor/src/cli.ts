#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { Command } from "commander";
import { parseEnvContent } from "./parseEnv.js";
import { diffEnv } from "./diff.js";
import { formatReport } from "./report.js";

const program = new Command();

program
  .name("env-doctor")
  .description("Compares .env against .env.example: missing, empty, and undocumented variables.")
  .version("0.2.0")
  .option("--example <path>", "path to the example env file", ".env.example")
  .option("--env <path>", "path to the actual env file", ".env")
  .option("--json", "print machine-readable JSON output instead of a text report")
  .action((options: { example: string; env: string; json?: boolean }) => {
    const examplePath = resolve(options.example);
    const envPath = resolve(options.env);

    if (!existsSync(examplePath)) {
      console.error(`Error: example file "${examplePath}" not found.`);
      process.exitCode = 1;
      return;
    }
    if (!existsSync(envPath)) {
      console.error(`Error: env file "${envPath}" not found.`);
      process.exitCode = 1;
      return;
    }

    const exampleVars = parseEnvContent(readFileSync(examplePath, "utf8"));
    const envVars = parseEnvContent(readFileSync(envPath, "utf8"));
    const diff = diffEnv(exampleVars, envVars);

    if (options.json) {
      console.log(JSON.stringify(diff, null, 2));
    } else {
      console.log(formatReport(options.example, options.env, diff));
    }

    if (diff.hasBlockingIssues) {
      process.exitCode = 1;
    }
  });

program.parse();

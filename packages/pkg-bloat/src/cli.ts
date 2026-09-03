#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { Command } from "commander";
import { collectDirectDependencyNames, computeDependencySizes } from "./depSize.js";
import { resolveDependencyDir } from "./resolveDep.js";
import { computeDirSize } from "./sizeWalk.js";
import { formatBytes, formatTable } from "./format.js";

const program = new Command();

program
  .name("pkg-bloat")
  .description("Reports the on-disk installed size of each direct dependency in node_modules, largest first.")
  .version("0.1.0")
  .argument("[path]", "path to the project (containing package.json and node_modules)", ".")
  .option("--json", "print machine-readable JSON output instead of a table")
  .action((path: string, options: { json?: boolean }) => {
    const projectRoot = resolve(path);
    const pkgJsonPath = join(projectRoot, "package.json");

    if (!existsSync(pkgJsonPath)) {
      console.error(`Error: no package.json found at "${pkgJsonPath}".`);
      process.exitCode = 1;
      return;
    }

    const pkg = JSON.parse(readFileSync(pkgJsonPath, "utf8")) as {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };
    const depNames = collectDirectDependencyNames(pkg);

    if (depNames.length === 0) {
      console.log("No dependencies declared in package.json.");
      return;
    }

    const nodeModulesDir = join(projectRoot, "node_modules");
    const entries = computeDependencySizes(depNames, {
      resolveDir: (name) => resolveDependencyDir(nodeModulesDir, name),
      computeSize: computeDirSize,
    });

    if (options.json) {
      const total = entries.reduce((sum, e) => sum + e.sizeBytes, 0);
      console.log(
        JSON.stringify(
          {
            path: projectRoot,
            totalBytes: total,
            totalHuman: formatBytes(total),
            dependencies: entries.map((e) => ({ ...e, sizeHuman: formatBytes(e.sizeBytes) })),
          },
          null,
          2,
        ),
      );
    } else {
      console.log(`pkg-bloat: ${projectRoot}`);
      console.log("");
      console.log(formatTable(entries));

      const missing = entries.filter((e) => !e.installed);
      if (missing.length > 0) {
        console.log("");
        console.log(`Note: ${missing.length} dependency(ies) not found in node_modules (run install?).`);
      }
    }
  });

program.parse();

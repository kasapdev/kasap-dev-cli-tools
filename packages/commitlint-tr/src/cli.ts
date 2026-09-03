#!/usr/bin/env node
import { chmodSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { Command } from "commander";
import { validateCommitMessage } from "./rules.js";
import { findGitDir } from "./gitDir.js";

const program = new Command();

program
  .name("commitlint-tr")
  .description(
    "Conventional Commits formatını doğrular; açıklama kısmının Türkçe yazılmasına izin verir.",
  )
  .version("0.1.0");

program
  .command("check")
  .description("Bir commit mesajı dosyasını doğrular (git commit-msg hook'u tarafından kullanılır).")
  .argument("<message-file>", "commit mesajını içeren dosyanın yolu")
  .action((messageFile: string) => {
    const path = resolve(messageFile);
    if (!existsSync(path)) {
      console.error(`Hata: "${path}" adlı dosya bulunamadı.`);
      process.exitCode = 1;
      return;
    }
    const content = readFileSync(path, "utf8");
    const result = validateCommitMessage(content);
    if (!result.valid) {
      console.error(result.error);
      process.exitCode = 1;
      return;
    }
    console.log(`Commit mesajı geçerli: ${result.parsed?.type}${result.parsed?.scope ? `(${result.parsed.scope})` : ""}`);
  });

program
  .command("install")
  .description("Geçerli git deposuna commit-msg hook'u kurar.")
  .option("--repo <path>", "git deposunun yolu", ".")
  .action((options: { repo: string }) => {
    const repoPath = resolve(options.repo);
    const gitDir = findGitDir(repoPath);
    if (!gitDir) {
      console.error(`Hata: "${repoPath}" içinde veya üst dizinlerinde bir git deposu (.git) bulunamadı.`);
      process.exitCode = 1;
      return;
    }

    const hooksDir = join(gitDir, "hooks");
    mkdirSync(hooksDir, { recursive: true });
    const hookPath = join(hooksDir, "commit-msg");

    // Point the hook directly at this package's compiled CLI entry so the
    // hook works without relying on a global install or network access.
    const cliEntry = fileURLToPath(import.meta.url);
    const nodeExec = process.execPath;

    const hookScript = [
      "#!/bin/sh",
      "# Installed by commitlint-tr - do not edit by hand, re-run `commitlint-tr install` instead.",
      `"${nodeExec}" "${cliEntry}" check "$1"`,
      "",
    ].join("\n");

    writeFileSync(hookPath, hookScript, { encoding: "utf8" });
    try {
      chmodSync(hookPath, 0o755);
    } catch {
      // chmod is a no-op / unnecessary on some platforms (e.g. Windows); ignore.
    }

    console.log(`commit-msg hook kuruldu: ${hookPath}`);
  });

program.parse();

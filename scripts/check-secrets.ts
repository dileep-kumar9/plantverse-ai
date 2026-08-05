import { execFile } from "node:child_process";
import { readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const root = process.cwd();

const patterns = [
  {
    name: "Private key",
    pattern: /-----BEGIN (?:RSA |EC )?PRIVATE KEY-----/,
  },
  {
    name: "Google API key",
    pattern: /AIza[0-9A-Za-z_-]{30,}/,
  },
  {
    name: "Stripe secret key",
    pattern: /sk_(?:live|test)_[0-9A-Za-z]{16,}/,
  },
  {
    name: "Stripe webhook secret",
    pattern: /whsec_[0-9A-Za-z]{16,}/,
  },
];

const allowedFiles = new Set([
  ".env.example",
  "scripts/check-secrets.ts",
  "docs/PRODUCTION_SETUP.md",
]);

async function getTrackedFiles(): Promise<string[]> {
  const { stdout } = await execFileAsync(
    "git",
    ["ls-files", "-z"],
    {
      cwd: root,
      encoding: "utf8",
      maxBuffer: 10 * 1024 * 1024,
    },
  );

  return stdout
    .split("\0")
    .map((file) => file.trim())
    .filter(Boolean);
}

async function scanFile(relativePath: string): Promise<number> {
  const normalizedPath = relativePath.replaceAll("\\", "/");

  if (allowedFiles.has(normalizedPath)) {
    return 0;
  }

  const absolutePath = resolve(root, relativePath);

  let fileInfo;

  try {
    fileInfo = await stat(absolutePath);
  } catch {
    return 0;
  }

  if (!fileInfo.isFile() || fileInfo.size > 2_000_000) {
    return 0;
  }

  const content = await readFile(absolutePath, "utf8").catch(
    () => "",
  );

  let findings = 0;

  for (const secretPattern of patterns) {
    if (secretPattern.pattern.test(content)) {
      findings += 1;

      console.error(
        `Potential ${secretPattern.name} found in tracked file: ${normalizedPath}`,
      );
    }
  }

  return findings;
}

async function main(): Promise<void> {
  const trackedFiles = await getTrackedFiles();

  let findings = 0;

  for (const file of trackedFiles) {
    findings += await scanFile(file);
  }

  if (findings > 0) {
    console.error(
      `Secret scan failed with ${findings} potential finding(s).`,
    );

    process.exitCode = 1;
    return;
  }

  console.log("No obvious secrets found in Git-tracked files.");
}

main().catch((error: unknown) => {
  console.error(
    "Secret scan failed:",
    error instanceof Error ? error.message : error,
  );

  process.exitCode = 1;
});
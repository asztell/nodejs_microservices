import dotenvx from "@dotenvx/dotenvx";
import { resolve, dirname, join, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { readFileSync } from "node:fs";
import { readdir } from "node:fs/promises";
import { closePool, getPool } from "../packages/shared/src/db/pool.ts";

dotenvx.config({ path: resolve(__dirname, "../.env") });

async function main() {
  const rootDir = __dirname;

  // 1. Statically determine this script's directory and its parent folder
  const currentScriptDir = dirname(fileURLToPath(import.meta.url));
  const fallbackSqlDir = resolve(currentScriptDir, "..", "sql");

  // 2. Capture explicit file arguments from index 2 onwards
  let filesToMigrate = process.argv.slice(2);

  // 3. Fallback: If no files were provided, read and sort all .sql files from the parent's sql folder
  if (filesToMigrate.length === 0) {
    try {
      const allFiles = await readdir(fallbackSqlDir);

      // Filter strictly for .sql files and map them back to their absolute system paths
      filesToMigrate = allFiles
        .filter((file) => file.toLowerCase().endsWith(".sql"))
        .sort() // Ensures sequential migration sorting (e.g., 001, 002, 003)
        .map((file) => join(fallbackSqlDir, file));
    } catch (error) {
      throw new Error(
        `Failed to read fallback migrations directory at "${fallbackSqlDir}": ${(error as Error).message}`,
        { cause: error },
      );
    }

    // Re-verify that the fallback folder actually contained SQL scripts
    if (filesToMigrate.length === 0) {
      throw new Error(
        `No files provided and no backup SQL scripts found in: ${fallbackSqlDir}`,
      );
    }
  }

  const pool = getPool();

  // 4. Iterate through 'n' targets sequentially using rawInput strings
  for (const rawInput of filesToMigrate) {
    // Force an explicit trailing slash so "/var/www/app" becomes "/var/www/app/"
    const secureRootDir = rootDir.endsWith(sep) ? rootDir : `${rootDir}${sep}`;
    const secureFallbackDir = fallbackSqlDir.endsWith(sep)
      ? fallbackSqlDir
      : `${fallbackSqlDir}${sep}`;

    // Resolve the input path relative to our execution directory
    const targetFilePath = resolve(secureRootDir, rawInput);

    // 5. Verification Check: Ensure the target path resides strictly inside the working folder
    // Note: If falling back to the parent folder outside `process.cwd()`, adjust this boundary condition as needed
    if (
      !targetFilePath.startsWith(secureRootDir) &&
      !targetFilePath.startsWith(secureFallbackDir)
    ) {
      throw new Error(
        `Security Exception: Path traversal attempt blocked for: ${rawInput}`,
      );
    }

    // 6. Read and execute the SQL file
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    const sql = readFileSync(targetFilePath, "utf-8");
    await pool.query(sql);

    console.log(`Migrated: ${rawInput}`);
  }

  await closePool();
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});

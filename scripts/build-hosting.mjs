#!/usr/bin/env node
/**
 * Assembles the folder that gets uploaded to Spaceship shared hosting.
 *
 * dist-upload/public_html/  -> upload into the document root
 * dist-upload/syncion-private/ -> upload one level ABOVE the document root
 *
 * Run `npm run build` first: this script copies the existing export, it does
 * not create one.
 */

import { cp, mkdir, rm, access, writeFile, readdir, chmod } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const dist = path.join(root, "dist-upload");
const docRoot = path.join(dist, "public_html");
const privateDir = path.join(dist, "syncion-private");

async function exists(target) {
  try {
    await access(target);
    return true;
  } catch {
    return false;
  }
}

if (!(await exists(path.join(root, "out", "index.html")))) {
  console.error("No export found in out/. Run `npm run build` first.");
  process.exit(1);
}

await rm(dist, { recursive: true, force: true });
await mkdir(docRoot, { recursive: true });

// The static export, then the Apache config and PHP endpoint on top of it.
await cp(path.join(root, "out"), docRoot, { recursive: true });
await cp(path.join(root, "hosting", "public"), docRoot, { recursive: true });

// Cloudflare Pages routing metadata means nothing to Apache.
await rm(path.join(docRoot, "_routes.json"), { force: true });

await cp(path.join(root, "hosting", "private"), privateDir, { recursive: true });

// macOS sprinkles these through any copied tree; they are noise on the server.
async function stripJunk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const target = path.join(dir, entry.name);
    if (entry.isDirectory()) await stripJunk(target);
    else if (entry.name === ".DS_Store") await rm(target, { force: true });
  }
}
await stripJunk(dist);

// A file the web server cannot read is a broken image or a 403. Normalise
// permissions so a restrictive local mode never reaches the host.
async function normalisePermissions(dir) {
  await chmod(dir, 0o755);
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const target = path.join(dir, entry.name);
    if (entry.isDirectory()) await normalisePermissions(target);
    else await chmod(target, 0o644);
  }
}
await normalisePermissions(docRoot);

// Ship the template only; the real secrets are filled in on the server.
const liveConfig = path.join(root, "hosting", "private", "config.php");
if (await exists(liveConfig)) {
  await rm(path.join(privateDir, "config.php"), { force: true });
  console.warn("Skipped hosting/private/config.php so secrets are not bundled.");
}

await writeFile(
  path.join(dist, "READ-ME-FIRST.txt"),
  [
    "public_html/      -> upload the CONTENTS into your document root",
    "syncion-private/  -> upload the FOLDER one level ABOVE the document root",
    "",
    "Then rename syncion-private/config.example.php to config.php and fill it in.",
    "Full instructions: hosting/README.md in the repository.",
    "",
  ].join("\n"),
);

// A single archive is far easier to upload through cPanel's File Manager.
const zip = spawnSync("zip", ["-qr", "syncion-upload.zip", "public_html", "syncion-private", "READ-ME-FIRST.txt"], {
  cwd: dist,
  stdio: "inherit",
});
const zipped = zip.status === 0;

console.log(`Bundle ready: ${path.relative(root, dist)}`);
console.log(zipped ? "Archive: dist-upload/syncion-upload.zip" : "zip not available; upload the folders directly.");

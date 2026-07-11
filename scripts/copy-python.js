/**
 * Copies src/bridge.py and src/py/* into dist/ after tsc runs, so the
 * compiled YouTube.js can locate the Python bridge via __dirname at
 * runtime, exactly mirroring the source layout.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function copyRecursive(src, dest) {
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    fs.mkdirSync(dest, { recursive: true });
    for (const entry of fs.readdirSync(src)) {
      copyRecursive(path.join(src, entry), path.join(dest, entry));
    }
  } else {
    fs.copyFileSync(src, dest);
  }
}

const srcDir = path.join(__dirname, "..", "src");
const distDir = path.join(__dirname, "..", "dist");
const distCjsDir = path.join(__dirname, "..", "dist-cjs");

const targets = [distDir];
if (fs.existsSync(distCjsDir)) {
  targets.push(distCjsDir);
}

for (const target of targets) {
  copyRecursive(path.join(srcDir, "bridge.py"), path.join(target, "bridge.py"));
  copyRecursive(path.join(srcDir, "py"), path.join(target, "py"));
}

console.log("Python files copied to dist/");

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function walk(dir, callback) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full, callback);
    } else {
      callback(full);
    }
  }
}

const cjsDir = path.join(__dirname, "..", "dist-cjs");
if (!fs.existsSync(cjsDir)) {
  throw new Error("dist-cjs directory not found");
}

const filesToRename = [];
walk(cjsDir, (file) => {
  if (file.endsWith(".js") || file.endsWith(".js.map")) {
    filesToRename.push(file);
  }
});

for (const file of filesToRename.sort((a, b) => b.length - a.length)) {
  const newPath = file.endsWith(".js.map")
    ? file.slice(0, -7) + ".cjs.map"
    : file.slice(0, -3) + ".cjs";
  fs.renameSync(file, newPath);
}

walk(cjsDir, (file) => {
  if (file.endsWith(".cjs")) {
    let content = fs.readFileSync(file, "utf8");
    content = content.replace(/require\((['"])([^'"\)]+)\.js\1\)/g, "require($1$2.cjs$1)");
    content = content.replace(/sourceMappingURL=([^\s]+?)\.js\.map/g, "sourceMappingURL=$1.cjs.map");
    // Strip import.meta to prevent SyntaxError in CommonJS parser
    content = content.replace(/import\.meta\.url/g, '""');
    fs.writeFileSync(file, content, "utf8");
  }
  if (file.endsWith(".cjs.map")) {
    const map = JSON.parse(fs.readFileSync(file, "utf8"));
    if (typeof map.file === "string" && map.file.endsWith(".js")) {
      map.file = map.file.slice(0, -3) + ".cjs";
    }
    fs.writeFileSync(file, JSON.stringify(map), "utf8");
  }
});

console.log("dist-cjs files renamed to .cjs and references updated.");

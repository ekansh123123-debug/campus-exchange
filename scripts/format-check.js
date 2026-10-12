import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const TARGET_DIRS = ['backend/src', 'frontend/src'];
const EXTENSIONS = new Set(['.js', '.jsx', '.css', '.json']);

let issues = 0;

function walk(dir) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath);
    } else if (EXTENSIONS.has(path.extname(entry.name))) {
      const content = fs.readFileSync(fullPath, 'utf8');
      if (content.includes('\t')) {
        console.error(`[format:check] Tab character found in ${path.relative(ROOT, fullPath)}`);
        issues += 1;
      }
    }
  }
}

for (const rel of TARGET_DIRS) {
  walk(path.join(ROOT, rel));
}

if (issues > 0) {
  process.exit(1);
}
console.log('Format check passed across backend/src and frontend/src.');

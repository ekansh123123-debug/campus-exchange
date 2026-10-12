import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const SRC_DIR = path.resolve(process.cwd(), 'src');

function collectJsFiles(dir, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      collectJsFiles(fullPath, acc);
    } else if (entry.name.endsWith('.js')) {
      acc.push(fullPath);
    }
  }
  return acc;
}

const files = collectJsFiles(SRC_DIR);
for (const file of files) {
  execFileSync(process.execPath, ['--check', file], { stdio: 'inherit' });
}
console.log(`Backend syntax & lint check passed (${files.length} files verified).`);

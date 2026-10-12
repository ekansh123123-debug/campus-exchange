import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const backendDir = path.join(rootDir, 'backend');
const frontendDir = path.join(rootDir, 'frontend');

const nodemonCandidates = [
  path.join(rootDir, 'node_modules/nodemon/bin/nodemon.js'),
  path.join(backendDir, 'node_modules/nodemon/bin/nodemon.js'),
];
const nodemonBin = nodemonCandidates.find((p) => fs.existsSync(p));

const viteCandidates = [
  path.join(frontendDir, 'node_modules/vite/bin/vite.js'),
  path.join(rootDir, 'node_modules/vite/bin/vite.js'),
];
const viteBin = viteCandidates.find((p) => fs.existsSync(p));

const port = Number(process.env.PORT) || 5000;
const healthUrl = `http://localhost:${port}/health/live`;

function getBackendState() {
  return new Promise((resolve) => {
    const req = http.get(healthUrl, { timeout: 1000 }, (res) => {
      let body = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => {
        if (body.length < 4096) body += chunk;
      });
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            const parsed = JSON.parse(body);
            if (parsed?.data?.service === 'campus-exchange-api') {
              resolve('alive');
              return;
            }
          } catch {
            // Non-JSON response on port
          }
        }
        resolve('occupied');
      });
    });
    req.on('error', (err) => {
      if (err?.code === 'ECONNREFUSED' || err?.code === 'ECONNRESET' || err?.code === 'ETIMEDOUT') {
        resolve('down');
      } else {
        resolve('occupied');
      }
    });
    req.on('timeout', () => {
      req.destroy();
      resolve('down');
    });
  });
}

async function waitForBackend(proc, timeoutMs = 30000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const state = await getBackendState();
    if (state === 'alive') return true;
    if (state === 'occupied') return false;
    if (proc && proc.exitCode !== null) return false;
    await new Promise((r) => setTimeout(r, 250));
  }
  return false;
}

let serverProc = null;
let clientProc = null;
let shuttingDown = false;

function killProc(proc) {
  if (!proc || proc.killed) return;
  try {
    proc.kill();
  } catch {
    // ignore
  }
}

function shutdown(exitCode = 0) {
  if (shuttingDown) return;
  shuttingDown = true;
  killProc(clientProc);
  killProc(serverProc);
  process.exit(exitCode);
}

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));

const initialState = await getBackendState();
if (initialState === 'occupied') {
  console.error(`Port ${port} is already in use by a non-CampusExchange service.`);
  shutdown(1);
}

if (initialState !== 'alive') {
  const serverArgs = nodemonBin ? [nodemonBin, 'src/server.js'] : ['src/server.js'];
  serverProc = spawn(process.execPath, serverArgs, {
    cwd: backendDir,
    stdio: ['ignore', 'inherit', 'inherit'],
    env: {
      ...process.env,
      NODE_ENV: 'development',
    },
  });
  const ready = await waitForBackend(serverProc);
  if (!ready) {
    console.error(`Backend failed to become healthy at ${healthUrl}`);
    shutdown(1);
  }
}

clientProc = spawn(process.execPath, [viteBin, ...process.argv.slice(2)], {
  cwd: frontendDir,
  stdio: ['ignore', 'inherit', 'inherit'],
  env: {
    ...process.env,
    CI: 'true',
    CAMPUS_EXCHANGE_BACKEND_MANAGED: '1',
  },
});

clientProc.on('exit', (code) => {
  shutdown(code ?? 0);
});



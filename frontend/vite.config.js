import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

if (!process.env.VITEST) {
  if (!process.stdin.isTTY) {
    process.env.CI = 'true';
  }
  const origStdinOn = process.stdin.on.bind(process.stdin);
  process.stdin.on = function (event, listener, ...args) {
    if (event === 'end') {
      return process.stdin;
    }
    return origStdinOn(event, listener, ...args);
  };
}

const apiPort = Number(process.env.PORT) || 5000;
const apiTarget = `http://localhost:${apiPort}`;

function getBackendState(port = apiPort) {
  return new Promise((resolve) => {
    const req = http.get(`http://localhost:${port}/health/live`, { timeout: 1000 }, (res) => {
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

async function waitForBackend(port = apiPort, proc = null, timeoutMs = 30000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const state = await getBackendState(port);
    if (state === 'alive') return true;
    if (state === 'occupied') return false;
    if (proc && proc.exitCode !== null) return false;
    await new Promise((r) => setTimeout(r, 250));
  }
  return false;
}

function campusExchangeBackendPlugin() {
  let backendProc = null;

  const stopBackend = () => {
    if (backendProc && !backendProc.killed) {
      try {
        backendProc.kill();
      } catch {
        // ignore
      }
      backendProc = null;
    }
  };

  const ensureBackend = async (frontendRoot, httpServer) => {
    if (process.env.VITEST || process.env.CAMPUS_EXCHANGE_BACKEND_MANAGED === '1') {
      return;
    }
    const port = Number(process.env.PORT) || 5000;
    const initialState = await getBackendState(port);
    if (initialState === 'alive') {
      return;
    }
    if (initialState === 'occupied') {
      throw new Error(`Port ${port} is already in use by a non-CampusExchange service.`);
    }
    const backendDir = path.resolve(frontendRoot, '../backend');
    const serverEntry = path.join(backendDir, 'src/server.js');
    if (!fs.existsSync(serverEntry)) {
      return;
    }
    backendProc = spawn(process.execPath, ['src/server.js'], {
      cwd: backendDir,
      stdio: ['ignore', 'inherit', 'inherit'],
      env: {
        ...process.env,
        NODE_ENV: 'development',
      },
    });
    httpServer?.once('close', stopBackend);
    process.once('exit', stopBackend);
    const ready = await waitForBackend(port, backendProc);
    if (!ready) {
      stopBackend();
      throw new Error(`Backend failed to become healthy at http://localhost:${port}/health/live`);
    }
  };

  return {
    name: 'campus-exchange-backend-autostart',
    async configureServer(server) {
      await ensureBackend(server.config.root, server.httpServer);
    },
    async configurePreviewServer(server) {
      const frontendRoot = server.config.root;
      const distIndex = path.resolve(frontendRoot, 'dist/index.html');
      if (!fs.existsSync(distIndex)) {
        const viteCandidates = [
          path.resolve(frontendRoot, 'node_modules/vite/bin/vite.js'),
          path.resolve(frontendRoot, '../node_modules/vite/bin/vite.js'),
        ];
        const viteBin = viteCandidates.find((p) => fs.existsSync(p));
        if (viteBin) {
          const buildRes = spawnSync(process.execPath, [viteBin, 'build'], {
            cwd: frontendRoot,
            stdio: 'inherit',
          });
          if (buildRes.status !== 0) {
            throw new Error(`Frontend build failed with exit code ${buildRes.status ?? 1}`);
          }
        }
      }
      await ensureBackend(frontendRoot, server.httpServer);
    },
  };
}

export default defineConfig({
  clearScreen: false,
  plugins: [react(), ...(process.env.VITEST ? [] : [campusExchangeBackendPlugin()])],
  resolve: {
    dedupe: ['react', 'react-dom'],
  },
  ...(process.env.VITEST ? { esbuild: { jsx: 'automatic' } } : {}),
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': {
        target: apiTarget,
        changeOrigin: true,
      },
      '/socket.io': {
        target: apiTarget,
        ws: true,
      },
    },
  },
  preview: {
    port: 4173,
    strictPort: true,
    proxy: {
      '/api': {
        target: apiTarget,
        changeOrigin: true,
      },
      '/socket.io': {
        target: apiTarget,
        ws: true,
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.js',
  },
});


import { execFileSync } from 'node:child_process';
import http from 'node:http';
import { createApp } from './app.js';
import { connectDatabase, disconnectDatabase } from './config/database.js';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { startReservationExpiryScheduler } from './jobs/expire-reservations.job.js';
import { ensureCategoriesSeeded } from './modules/categories/categories.service.js';
import { attachSocketServer } from './sockets/index.js';

let httpServer = null;
let ioServer = null;
let expiryTimer = null;

function probeExistingServer(port) {
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
              resolve({ status: 'alive', pid: Number(parsed?.data?.pid) || null });
              return;
            }
          } catch {
            // Non-JSON response on port
          }
        }
        resolve({ status: 'occupied', pid: null });
      });
    });
    req.on('error', (err) => {
      if (err?.code === 'ECONNREFUSED' || err?.code === 'ECONNRESET' || err?.code === 'ETIMEDOUT') {
        resolve({ status: 'down', pid: null });
      } else {
        resolve({ status: 'occupied', pid: null });
      }
    });
    req.on('timeout', () => {
      req.destroy();
      resolve({ status: 'down', pid: null });
    });
  });
}

function getListeningPids(port) {
  const pids = new Set();
  try {
    if (process.platform === 'win32') {
      const output = execFileSync('netstat', ['-ano'], {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
      });
      for (const line of output.split(/\r?\n/)) {
        const parts = line.trim().split(/\s+/);
        if (
          parts.length >= 5 &&
          parts[0].toUpperCase() === 'TCP' &&
          parts[3].toUpperCase() === 'LISTENING'
        ) {
          const localAddr = parts[1];
          const pid = Number(parts[4]);
          if (
            (localAddr.endsWith(`:${port}`) || localAddr === `${port}`) &&
            Number.isInteger(pid) &&
            pid > 0 &&
            pid !== process.pid
          ) {
            pids.add(pid);
          }
        }
      }
    } else {
      const output = execFileSync('lsof', ['-ti', `tcp:${port}`, '-sTCP:LISTEN'], {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
      });
      for (const line of output.split(/\r?\n/)) {
        const pid = Number(line.trim());
        if (Number.isInteger(pid) && pid > 0 && pid !== process.pid) {
          pids.add(pid);
        }
      }
    }
  } catch {
    // Ignore lookup errors when tools or permissions are unavailable
  }
  return [...pids];
}

async function reclaimPortIfCampusExchange(port, timeoutMs = 5000) {
  if (!port || port <= 0) return false;
  const probe = await probeExistingServer(port);
  if (probe.status !== 'alive') {
    return false;
  }

  const pids = new Set(getListeningPids(port));
  if (probe.pid && probe.pid !== process.pid) {
    pids.add(probe.pid);
  }
  if (pids.size === 0) {
    return false;
  }

  for (const pid of pids) {
    try {
      logger.info(
        { port, replacedPid: pid },
        'Stopping previous CampusExchange server instance on port'
      );
      process.kill(pid);
    } catch {
      // Process may have already exited
    }
  }

  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const nextProbe = await probeExistingServer(port);
    if (nextProbe.status === 'down' && getListeningPids(port).length === 0) {
      return true;
    }
    await new Promise((r) => setTimeout(r, 100));
  }
  return false;
}

function listenOnPort(server, port) {
  return new Promise((resolve, reject) => {
    const onError = (err) => {
      server.off('listening', onListening);
      reject(err);
    };
    const onListening = () => {
      server.off('error', onError);
      const actualPort = server.address()?.port ?? port;
      logger.info(
        { port: actualPort, env: env.nodeEnv, apiBase: `/api/v1` },
        `CampusExchange API listening on http://localhost:${actualPort}`
      );
      resolve();
    };
    server.once('error', onError);
    server.once('listening', onListening);
    server.listen(port);
  });
}

export async function startServer(options = {}) {
  const targetPort = options.port ?? env.port;

  if (!env.isTest && targetPort > 0) {
    await reclaimPortIfCampusExchange(targetPort);
  }

  await connectDatabase();
  await ensureCategoriesSeeded();

  const app = createApp();
  httpServer = http.createServer(app);
  ioServer = attachSocketServer(httpServer);
  expiryTimer = startReservationExpiryScheduler();

  try {
    try {
      await listenOnPort(httpServer, targetPort);
    } catch (err) {
      if (err?.code === 'EADDRINUSE' && !env.isTest && targetPort > 0) {
        const reclaimed = await reclaimPortIfCampusExchange(targetPort);
        if (reclaimed) {
          await listenOnPort(httpServer, targetPort);
        } else {
          throw err;
        }
      } else {
        throw err;
      }
    }
  } catch (err) {
    await stopServer();
    throw err;
  }

  return { httpServer, ioServer };
}

export async function stopServer() {
  if (expiryTimer) {
    clearInterval(expiryTimer);
    expiryTimer = null;
  }
  if (ioServer) {
    await ioServer.close();
    ioServer = null;
  }
  if (httpServer) {
    if (httpServer.listening) {
      await new Promise((resolve) => httpServer.close(resolve));
    }
    httpServer = null;
  }
  await disconnectDatabase();
}

const isDirectExecution =
  process.argv[1] &&
  (process.argv[1].endsWith('server.js') || process.argv[1].includes('src\\server.js') || process.argv[1].includes('src/server.js'));

if (isDirectExecution && !env.isTest) {
  startServer().catch(async (err) => {
    logger.fatal({ error: err.message }, 'Failed to start CampusExchange server');
    await stopServer();
    process.exit(1);
  });

  const handleSignal = async (signal) => {
    logger.info({ signal }, 'Shutting down CampusExchange server gracefully');
    await stopServer();
    process.exit(0);
  };

  process.on('SIGINT', () => handleSignal('SIGINT'));
  process.on('SIGTERM', () => handleSignal('SIGTERM'));
}

import mongoose from 'mongoose';
import { env } from './env.js';
import { logger } from './logger.js';

let memoryReplSet = null;
let transactionsSupported = true;

async function startInMemoryReplicaSet() {
  const { MongoMemoryReplSet } = await import('mongodb-memory-server');
  memoryReplSet = await MongoMemoryReplSet.create({
    replSet: { count: 1, storageEngine: 'wiredTiger' },
  });
  const memUri = memoryReplSet.getUri('campus_exchange');
  await mongoose.connect(memUri);
  transactionsSupported = true;
  logger.info({ dbState: 'connected-in-memory-replset' }, 'Connected to embedded MongoDB replica set');
  return mongoose.connection;
}

export async function connectDatabase(customUri) {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (env.isTest && !customUri) {
    return startInMemoryReplicaSet();
  }

  const targetUri = customUri || env.mongodbUri;

  try {
    await mongoose.connect(targetUri, {
      serverSelectionTimeoutMS: env.isTest ? 2000 : 3500,
      connectTimeoutMS: env.isTest ? 2000 : 3500,
    });
    await detectTransactionSupport();
    logger.info({ dbState: 'connected', replicaSet: transactionsSupported }, 'Connected to MongoDB');
    return mongoose.connection;
  } catch (err) {
    if (!customUri && env.useInMemoryDbIfUnavailable && !env.isProd) {
      logger.warn(
        { reason: err.message },
        'Local MongoDB unavailable; starting embedded MongoMemoryReplSet for development/testing'
      );
      return startInMemoryReplicaSet();
    }
    throw err;
  }
}

async function detectTransactionSupport() {
  try {
    const admin = mongoose.connection.db.admin();
    const status = await admin.command({ hello: 1 });
    transactionsSupported = Boolean(status.setName);
  } catch {
    transactionsSupported = false;
  }
}

export function isDatabaseReady() {
  return mongoose.connection.readyState === 1;
}

export function isReplicaSetSupported() {
  return transactionsSupported;
}

/**
 * Runs a callback inside a MongoDB multi-document transaction when replica-set
 * sessions are supported; otherwise executes with null session so atomic
 * conditional updates (`findOneAndUpdate` with state predicates) still enforce
 * concurrency safety.
 */
export async function withTransaction(workFn) {
  if (transactionsSupported) {
    const session = await mongoose.startSession();
    try {
      let result;
      await session.withTransaction(async () => {
        result = await workFn(session);
      });
      return result;
    } finally {
      await session.endSession();
    }
  }
  return workFn(null);
}

export async function disconnectDatabase() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  if (memoryReplSet) {
    await memoryReplSet.stop();
    memoryReplSet = null;
  }
}

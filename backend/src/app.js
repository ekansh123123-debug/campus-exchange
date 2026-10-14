import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import pinoHttp from 'pino-http';
import { getCorsOptions } from './config/cors.js';
import { isDatabaseReady } from './config/database.js';
import { logger } from './config/logger.js';
import { errorHandler } from './middleware/error-handler.js';
import { notFoundHandler } from './middleware/not-found.js';
import { requestIdMiddleware } from './middleware/request-id.js';
import adminRoutes from './modules/admin/admin.routes.js';
import authRoutes from './modules/auth/auth.routes.js';
import categoriesRoutes from './modules/categories/categories.routes.js';
import conversationsRoutes from './modules/conversations/conversations.routes.js';
import listingsRoutes from './modules/listings/listings.routes.js';
import notificationsRoutes from './modules/notifications/notifications.routes.js';
import reportsRoutes from './modules/reports/reports.routes.js';
import resourcesRoutes from './modules/resources/resources.routes.js';
import transactionsRoutes from './modules/transactions/transactions.routes.js';
import usersRoutes from './modules/users/users.routes.js';
import wishlistRoutes from './modules/wishlist/wishlist.routes.js';

export function createApp() {
  const app = express();

  app.disable('x-powered-by');
  app.set('trust proxy', 1);
  app.use(requestIdMiddleware);
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    })
  );
  app.use(cors(getCorsOptions()));
  app.use(cookieParser());
  app.use(express.json({ limit: '256kb' }));
  app.use(express.urlencoded({ extended: false, limit: '256kb' }));

  app.use(
    pinoHttp({
      logger,
      genReqId: (req) => req.requestId,
      autoLogging: {
        ignore: (req) => req.url?.startsWith('/health'),
      },
    })
  );

  const livenessHandler = (_req, res) => {
    res.status(200).json({
      success: true,
      data: {
        status: 'alive',
        service: 'campus-exchange-api',
        pid: process.pid,
        timestamp: new Date().toISOString(),
      },
    });
  };

  const readinessHandler = (_req, res) => {
    const dbReady = isDatabaseReady();
    res.status(dbReady ? 200 : 503).json({
      success: dbReady,
      data: {
        status: dbReady ? 'ready' : 'degraded',
        database: dbReady ? 'connected' : 'disconnected',
        timestamp: new Date().toISOString(),
      },
    });
  };

  app.get('/health/live', livenessHandler);
  app.get('/health/ready', readinessHandler);
  app.get('/api/v1/health/live', livenessHandler);
  app.get('/api/v1/health/ready', readinessHandler);

  app.use('/api/v1/auth', authRoutes);
  app.use('/api/v1/users', usersRoutes);
  app.use('/api/v1/categories', categoriesRoutes);
  app.use('/api/v1/listings', listingsRoutes);
  app.use('/api/v1/wishlist', wishlistRoutes);
  app.use('/api/v1/conversations', conversationsRoutes);
  app.use('/api/v1/transactions', transactionsRoutes);
  app.use('/api/v1/resources', resourcesRoutes);
  app.use('/api/v1/reports', reportsRoutes);
  app.use('/api/v1/notifications', notificationsRoutes);
  app.use('/api/v1/admin', adminRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

export const app = createApp();
export default app;

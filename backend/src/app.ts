import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { configService } from './common/config/config.service.js';
import { logger } from './common/utils/logger.util.js';
import { errorHandler } from './api/middlewares/error-handler.middleware.js';
import apiRoutes from './api/routes/index.js';
import webhookRoutes from './webhooks/telegram.webhook.js';

const app = express();

// Security middleware
// Disable helmet in development to allow frontend proxy to work properly
if (configService.isDevelopment) {
  app.use(
    helmet({
      contentSecurityPolicy: false, // Vite uses inline scripts
      crossOriginEmbedderPolicy: false,
      crossOriginResourcePolicy: false,
    })
  );
} else {
  app.use(helmet());
}
app.use(
  cors({
    origin: configService.isDevelopment
      ? '*'
      : [configService.telegram.miniAppUrl || ''],
    credentials: true,
  })
);

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  logger.debug(`${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: configService.env.NODE_ENV,
  });
});

// API routes
app.use('/api', apiRoutes);

// Webhook routes
app.use('/webhook', webhookRoutes);

// Static files for uploads and generated images
app.use('/uploads', express.static(configService.storage.uploadDir));
app.use('/generated', express.static(configService.storage.generatedDir));

// Proxy to frontend dev server (for ngrok single tunnel setup)
if (configService.isDevelopment) {
  app.use(
    '/',
    createProxyMiddleware({
      target: 'http://localhost:5173',
      changeOrigin: true,
      ws: true, // WebSocket support for HMR
      logLevel: 'silent',
      // Don't proxy API, webhook, uploads, generated, health routes
      filter: (pathname) => {
        return (
          !pathname.startsWith('/api') &&
          !pathname.startsWith('/webhook') &&
          !pathname.startsWith('/uploads') &&
          !pathname.startsWith('/generated') &&
          !pathname.startsWith('/health')
        );
      },
    })
  );
}

// 404 handler (only for non-proxied routes in production)
if (!configService.isDevelopment) {
  app.use((req, res) => {
    res.status(404).json({
      success: false,
      error: 'Not found',
    });
  });
}

// Error handler
app.use(errorHandler);

export default app;

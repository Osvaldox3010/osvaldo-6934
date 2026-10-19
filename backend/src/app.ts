import cors from 'cors';
import express from 'express';
import type { SnailPayConfig } from './types/snailpay';
import { loadConfig } from './config';
import { createSnailRouter } from './routes/snailpay.routes';
import { errorHandler } from './middlewares/error-handler';

// Crea la aplicación y registra sus rutas y middleware.
export function createApp(config: SnailPayConfig = loadConfig()) {
  const app = express();

  app.use(cors({ origin: process.env.CORS_ORIGIN ?? 'http://localhost:5173' }));
  app.use(express.json({ limit: '10kb' }));
  
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  app.use('/api/snailpay', createSnailRouter(config));

  app.use(errorHandler);

  return app;
}

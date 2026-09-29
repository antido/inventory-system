// Builds the Express app: middleware -> routes -> error handler.
import cors from 'cors';
import express from 'express';
import { env } from './config/env';
import { errorHandler } from './middleware/errorHandler';
import { router } from './routes';

export const app = express();

app.use(cors({ origin: env.clientUrl }));
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api', router);

// Unknown API route
app.use('/api', (_req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Must be registered last
app.use(errorHandler);

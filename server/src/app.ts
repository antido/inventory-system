// Builds the Express app: middleware -> routes -> error handler.
import cors from 'cors';
import express from 'express';
import { env } from './config/env';
import { errorHandler } from './middleware/errorHandler';
import { router } from './routes';
import { UPLOADS_DIR } from './services/productImages';

export const app = express();

app.use(cors({ origin: env.clientUrl }));
// 3 MB leaves room for a product photo (max 2 MB) sent inside the JSON body.
app.use(express.json({ limit: '3mb' }));

// Product photos. File names are random and never reused, so browsers may cache them for a long time.
app.use(
  '/uploads',
  express.static(UPLOADS_DIR, {
    immutable: true,
    maxAge: '30d',
    setHeaders: (res) => res.setHeader('X-Content-Type-Options', 'nosniff'),
  }),
);

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

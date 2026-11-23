import express from 'express';
import { ApiError } from './service.js';
import { createPersistentService } from './store.js';

export function createApp(service = createPersistentService()) {
  const app = express();
  const defaultOrigins = [
    'http://localhost:8080', 'http://127.0.0.1:8080',
    'http://localhost:3000', 'http://127.0.0.1:3000',
    'http://localhost:5173', 'http://127.0.0.1:5173',
  ];
  const allowedOrigins = new Set([
    ...defaultOrigins,
    ...(process.env.FRONTEND_ORIGIN || '').split(',').map((origin) => origin.trim()).filter(Boolean),
  ]);

  app.use((req, res, next) => {
    const origin = req.get('Origin');
    if (origin && allowedOrigins.has(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Vary', 'Origin');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-User-Id');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS');
    }
    if (req.method === 'OPTIONS') return res.sendStatus(204);
    return next();
  });
  app.use(express.json());

  const handle = (action, successStatus = 200) => (req, res) => {
    try {
      const data = action(req);
      res.status(successStatus).json(data);
    } catch (error) {
      if (error instanceof ApiError) {
        res.status(error.status).json({ error: error.message });
        return;
      }
      console.error(error);
      res.status(500).json({ error: 'Erreur interne du serveur.' });
    }
  };

  app.get('/health', handle(() => ({ status: 'ok' })));
  app.get('/api/users', handle(() => service.listUsers()));

  app.get('/api/tools', handle((req) => service.listTools({
    q: req.query.q,
    category: req.query.category,
    ownerId: req.query.ownerId,
  })));
  app.get('/api/tools/:id', handle((req) => service.getTool(req.params.id)));
  app.post('/api/tools', handle((req) => service.addTool(req.get('X-User-Id'), req.body), 201));
  app.get('/api/tools/:id/history', handle((req) => service.history(req.params.id)));

  app.get('/api/loans', handle((req) => service.listLoans(req.get('X-User-Id'))));
  app.post('/api/loans', handle((req) => service.requestLoan(req.get('X-User-Id'), req.body), 201));
  app.patch('/api/loans/:id', handle((req) => service.decideLoan(req.get('X-User-Id'), req.params.id, req.body)));
  app.patch('/api/loans/:id/return', handle((req) => service.returnLoan(req.get('X-User-Id'), req.params.id)));
  app.patch('/api/loans/:id/rating', handle((req) => service.rateLoan(req.get('X-User-Id'), req.params.id, req.body)));

  app.use((req, res) => res.status(404).json({ error: 'Route introuvable.' }));
  app.use((error, req, res, next) => {
    if (res.headersSent) return next(error);
    if (error?.type === 'entity.parse.failed') {
      return res.status(400).json({ error: 'Le JSON envoyé est invalide.' });
    }
    console.error(error);
    return res.status(500).json({ error: 'Erreur interne du serveur.' });
  });

  return app;
}

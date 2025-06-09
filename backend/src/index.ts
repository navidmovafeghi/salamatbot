// backend/src/index.ts
import 'dotenv/config';
import express from 'express';
import {
  registerUserHandler,
  loginUserHandler,
} from './modules/user/user.controller';
import { validate } from './middleware/validate';
import {
  registerUserSchema,
  loginUserSchema,
} from './modules/user/user.validation';

// --- Create the App ---
const createServer = () => {
  const app = express();
  app.use(express.json());

  // --- Routes ---
  app.get('/api/health', (req, res) => {
    res.send({ status: 'ok', message: 'SalamatBot backend is healthy' });
  });

  app.post(
    '/api/auth/register',
    validate(registerUserSchema),
    async (req, res, next) => {
      try {
        await registerUserHandler(req, res);
      } catch (err) {
        next(err);
      }
    },
  );

  app.post(
    '/api/auth/login',
    validate(loginUserSchema),
    async (req, res, next) => {
      try {
        await loginUserHandler(req, res);
      } catch (err) {
        next(err);
      }
    },
  );

  return app;
};

// --- Start the Server (if this file is run directly) ---
if (require.main === module) {
  const app = createServer();
  const port = process.env.PORT || 3001;
  app.listen(port, () => {
    console.log(`SalamatBot backend listening on http://localhost:${port}`);
  });
}

// --- Export the app for testing ---
export const app = createServer();

// backend/src/middleware/validate.ts

import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';

export const validate =
  (schema: AnyZodObject) =>
  (req: Request, res: Response, next: NextFunction): void => {
    try {
      schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (e) {
      if (e instanceof ZodError) {
        res.status(400).send(e.errors);
      } else {
        res.status(500).send('Internal server error');
      }
      // Always call next to satisfy Express types, but do not proceed if error
    }
  };

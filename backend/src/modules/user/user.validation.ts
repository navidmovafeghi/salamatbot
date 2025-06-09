// backend/src/modules/user/user.validation.ts
import { z } from 'zod';

export const registerUserSchema = z.object({
  body: z.object({
    email: z.string().email('A valid email is required'),
    password: z.string().min(8, 'Password must be at least 8 characters long'),
  }),
});

// --- NEW SCHEMA FOR LOGIN ---
export const loginUserSchema = z.object({
  body: z.object({
    // For login, we just need to ensure the fields exist and are strings.
    // The actual validation of their correctness is the service's job.
    email: z
      .string({
        required_error: 'Email is required',
      })
      .email('A valid email is required'),
    password: z.string({
      required_error: 'Password is required',
    }),
  }),
});

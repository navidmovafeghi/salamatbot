// backend/src/modules/user/user.controller.ts

import { Request, Response } from 'express';
// We import the types and functions from our service
import {
  CreateUserInput,
  LoginInput,
  createUser,
  loginUser,
} from './user.service';

// This is our existing handler for registration, now using the clearer input type
export const registerUserHandler = async (
  req: Request<unknown, unknown, CreateUserInput>,
  res: Response,
) => {
  try {
    const user = await createUser(req.body);
    return res.status(201).send(user);
  } catch (e: unknown) {
    console.error(e); // Log the error for debugging
    if (e instanceof Error && e.message === 'DUPLICATE_EMAIL') {
      return res.status(409).send('This email is already in use.');
    }
    return res.status(500).send('An internal server error occurred.');
  }
};

// --- NEW HANDLER FOR LOGIN ---
export const loginUserHandler = async (
  req: Request<unknown, unknown, LoginInput>,
  res: Response,
) => {
  try {
    // 1. Call the login service with the validated request body
    const token = await loginUser(req.body);

    // 2. On success, send the access token back to the client with a 200 OK status
    return res.status(200).send(token);
  } catch (e: unknown) {
    // 3. Handle the specific "invalid credentials" error from our service
    if (e instanceof Error && e.message === 'INVALID_CREDENTIALS') {
      // Send a generic, non-specific error message for security
      return res.status(401).send('Invalid email or password.');
    }
    // 4. For all other potential errors, send a generic server error
    return res.status(500).send('An internal server error occurred.');
  }
};

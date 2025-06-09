// backend/src/utils/jwt.utils.ts

import jwt from 'jsonwebtoken';

// Ensure JWT_SECRET is loaded from environment variables
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.error('FATAL ERROR: JWT_SECRET is not defined in .env file.');
  process.exit(1); // Exit the process if the secret is missing
}

// Function to sign a JWT
export const signJwt = (
  payload: Record<string, unknown>,
  options?: jwt.SignOptions,
) => {
  // We sign the token with our secret key.
  // We also set a default expiration time of 15 minutes.
  return jwt.sign(payload, JWT_SECRET, {
    ...options,
    expiresIn: '15m', // Set the token to expire in 15 minutes
  });
};

// Function to verify a JWT
// We'll need this later for protecting routes, but it's good practice to create it now.
export const verifyJwt = <T>(token: string): T | null => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as T;
    return decoded;
  } catch {
    return null; // Return null if the token is invalid or expired
  }
};

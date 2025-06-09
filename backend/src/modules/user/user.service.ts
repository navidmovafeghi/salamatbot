// backend/src/modules/user/user.service.ts

import { PrismaClient, User } from '@prisma/client';
import bcrypt from 'bcrypt';
import { signJwt } from '../../utils/jwt.utils'; // Import our new function

// --- Data Transfer Objects (DTOs) & Types ---
// Defines the shape of data for creating a user. This makes our code clearer.
export type CreateUserInput = {
  email: string;
  password: string;
};

// Defines the shape of data for logging in a user.
export type LoginInput = {
  email: string;
  password: string;
};

// --- Service Implementation ---
const prisma = new PrismaClient();
const SALT_ROUNDS = 10;

// (This is our existing createUser function, now using the clearer CreateUserInput type)
export const createUser = async (
  input: CreateUserInput,
): Promise<Omit<User, 'passwordHash'>> => {
  const { email, password } = input;

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    throw new Error('DUPLICATE_EMAIL');
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  const user = await prisma.user.create({ data: { email, passwordHash } });

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { passwordHash: _passwordHash, ...userWithoutPassword } = user;
  return userWithoutPassword;
};

// --- NEW FUNCTION FOR LOGIN ---
export const loginUser = async (
  input: LoginInput,
): Promise<{ accessToken: string }> => {
  const { email, password } = input;

  // 1. Find the user by email
  const user = await prisma.user.findUnique({
    where: { email },
  });

  // 2. If user exists, compare the provided password with the stored hash
  const isPasswordCorrect = user
    ? await bcrypt.compare(password, user.passwordHash)
    : false;

  // 3. If the user doesn't exist OR the password is wrong, throw a generic error.
  // This is a security best practice to prevent "user enumeration" attacks.
  if (!user || !isPasswordCorrect) {
    throw new Error('INVALID_CREDENTIALS');
  }

  // 4. If credentials are correct, sign a JWT containing non-sensitive info
  const accessToken = signJwt({
    userId: user.id,
    email: user.email,
  });

  // 5. Return the token
  return { accessToken };
};

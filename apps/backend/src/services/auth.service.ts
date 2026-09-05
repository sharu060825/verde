import { prisma } from '../prisma/client.js';
import { hashPassword, comparePassword } from '../utils/password.js';
import { generateToken } from '../utils/jwt.js';
import { DEFAULT_CATEGORIES } from '../utils/defaultCategories.js';

export class AuthService {
  async register(input: { name: string; email: string; password: string }) {
    const email = input.email.trim().toLowerCase();
    const name = input.name.trim();

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new Error('An account with this email already exists.');
    }

    const hashedPassword = await hashPassword(input.password);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        currency: 'INR',
        theme: 'dark',
        notifications: true,
        categories: {
          create: DEFAULT_CATEGORIES.map((cat) => ({
            name: cat.name,
            type: cat.type,
            icon: cat.icon,
            color: cat.color,
          })),
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        currency: true,
        theme: true,
        notifications: true,
        createdAt: true,
      },
    });

    const token = generateToken({
      userId: user.id,
      email: user.email,
      name: user.name,
    });

    return { user, token };
  }

  async login(input: { email: string; password: string }) {
    const email = input.email.trim().toLowerCase();

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new Error('Invalid email or password.');
    }

    const isMatch = await comparePassword(input.password, user.password);
    if (!isMatch) {
      throw new Error('Invalid email or password.');
    }

    const token = generateToken({
      userId: user.id,
      email: user.email,
      name: user.name,
    });

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        currency: user.currency,
        theme: user.theme,
        notifications: user.notifications,
        createdAt: user.createdAt,
      },
      token,
    };
  }

  async getCurrentUser(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        currency: true,
        theme: true,
        notifications: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new Error('User not found.');
    }

    return user;
  }
}

export const authService = new AuthService();

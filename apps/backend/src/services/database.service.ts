import { prisma } from '../prisma/client.js';

export class DatabaseService {
  async healthCheck() {
    await prisma.$connect();
    await prisma.$disconnect();
    return { ok: true };
  }
}

export const databaseService = new DatabaseService();

import { prisma } from '../prisma/client.js';
import { DEFAULT_CATEGORIES } from '../utils/defaultCategories.js';

export class CategoryService {
  async getCategories(userId: string) {
    let categories = await prisma.category.findMany({
      where: { userId },
      orderBy: { name: 'asc' },
    });

    if (categories.length === 0) {
      // Seed default categories if not seeded yet
      await prisma.category.createMany({
        data: DEFAULT_CATEGORIES.map((c) => ({
          name: c.name,
          type: c.type,
          icon: c.icon,
          color: c.color,
          userId,
        })),
        skipDuplicates: true,
      });

      categories = await prisma.category.findMany({
        where: { userId },
        orderBy: { name: 'asc' },
      });
    }

    return categories;
  }

  async createCategory(userId: string, input: { name: string; type?: string; icon?: string; color?: string }) {
    const name = input.name.trim();

    return prisma.category.create({
      data: {
        name,
        type: input.type || 'EXPENSE',
        icon: input.icon || 'tag',
        color: input.color || '#10b981',
        userId,
      },
    });
  }

  async deleteCategory(userId: string, id: string) {
    const existing = await prisma.category.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      return null;
    }

    await prisma.category.delete({
      where: { id },
    });

    return existing;
  }
}

export const categoryService = new CategoryService();

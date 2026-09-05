import { prisma } from '../prisma/client.js';
import { TransactionType } from '@prisma/client';

export interface CreateBudgetInput {
  category: string;
  limit: number;
  period?: string;
}

export interface UpdateBudgetInput {
  category?: string;
  limit?: number;
  period?: string;
}

export class BudgetService {
  async getBudgets(userId: string) {
    const budgets = await prisma.budget.findMany({
      where: { userId },
      orderBy: { category: 'asc' },
    });

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    // Fetch all expenses for this month for the user
    const monthExpenses = await prisma.transaction.findMany({
      where: {
        userId,
        type: TransactionType.EXPENSE,
        date: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
    });

    // Group expenses by category
    const categorySpendMap: Record<string, number> = {};
    for (const exp of monthExpenses) {
      categorySpendMap[exp.category] = (categorySpendMap[exp.category] ?? 0) + exp.amount;
    }

    return budgets.map((budget) => {
      const spent = categorySpendMap[budget.category] ?? 0;
      const remaining = Math.max(0, budget.limit - spent);
      const percentUsed = budget.limit > 0 ? Math.round((spent / budget.limit) * 100) : 0;
      const isOverBudget = spent > budget.limit;

      return {
        id: budget.id,
        category: budget.category,
        limit: budget.limit,
        spent,
        remaining,
        percentUsed,
        isOverBudget,
        period: budget.period,
        createdAt: budget.createdAt,
        updatedAt: budget.updatedAt,
      };
    });
  }

  async createOrUpdateBudget(userId: string, input: CreateBudgetInput) {
    const category = input.category.trim();
    const limit = Number(input.limit);

    return prisma.budget.upsert({
      where: {
        userId_category: {
          userId,
          category,
        },
      },
      update: {
        limit,
        period: input.period || 'MONTHLY',
      },
      create: {
        userId,
        category,
        limit,
        period: input.period || 'MONTHLY',
      },
    });
  }

  async updateBudget(userId: string, id: string, input: UpdateBudgetInput) {
    const existing = await prisma.budget.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      return null;
    }

    const updateData: Record<string, unknown> = {};
    if (input.limit !== undefined) {
      updateData.limit = Number(input.limit);
    }
    if (input.category !== undefined) {
      updateData.category = input.category.trim();
    }
    if (input.period !== undefined) {
      updateData.period = input.period;
    }

    return prisma.budget.update({
      where: { id },
      data: updateData,
    });
  }

  async deleteBudget(userId: string, id: string) {
    const existing = await prisma.budget.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      return null;
    }

    await prisma.budget.delete({
      where: { id },
    });

    return existing;
  }
}

export const budgetService = new BudgetService();

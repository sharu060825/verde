import { prisma } from '../prisma/client.js';
import { TransactionType } from '@prisma/client';

export class ExpenseService {
  async createExpense(userId: string, input: {
    title: string;
    amount: number;
    category: string;
    date: string | Date;
    paymentMethod: string;
    notes?: string;
  }) {
    const dateObj = new Date(input.date);

    return prisma.transaction.create({
      data: {
        title: input.title.trim(),
        amount: Number(input.amount),
        type: TransactionType.EXPENSE,
        category: input.category.trim(),
        date: isNaN(dateObj.getTime()) ? new Date() : dateObj,
        paymentMethod: input.paymentMethod.trim(),
        notes: input.notes ? input.notes.trim() : null,
        userId,
      },
    });
  }

  async getAllExpenses(userId: string) {
    return prisma.transaction.findMany({
      where: {
        userId,
        type: TransactionType.EXPENSE,
      },
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async getExpenseById(userId: string, id: string) {
    return prisma.transaction.findFirst({
      where: {
        id,
        userId,
        type: TransactionType.EXPENSE,
      },
    });
  }

  async updateExpense(userId: string, id: string, input: Partial<{
    title: string;
    amount: number;
    category: string;
    date: string | Date;
    paymentMethod: string;
    notes: string | null;
  }>) {
    const existingExpense = await prisma.transaction.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!existingExpense) {
      return null;
    }

    const updateData: Record<string, unknown> = {};

    if (input.title !== undefined) {
      updateData.title = input.title;
    }
    if (input.amount !== undefined) {
      updateData.amount = Number(input.amount);
    }
    if (input.category !== undefined) {
      updateData.category = input.category;
    }
    if (input.date !== undefined) {
      const dateObj = new Date(input.date);
      updateData.date = isNaN(dateObj.getTime()) ? new Date() : dateObj;
    }
    if (input.paymentMethod !== undefined) {
      updateData.paymentMethod = input.paymentMethod;
    }
    if (input.notes !== undefined) {
      updateData.notes = input.notes;
    }

    return prisma.transaction.update({
      where: { id },
      data: updateData,
    });
  }

  async deleteExpense(userId: string, id: string) {
    const existingExpense = await prisma.transaction.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!existingExpense) {
      return null;
    }

    await prisma.transaction.delete({
      where: { id },
    });

    return existingExpense;
  }
}

export const expenseService = new ExpenseService();

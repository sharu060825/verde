import { prisma } from '../prisma/client.js';
import { TransactionType } from '@prisma/client';

export interface CreateTransactionInput {
  title: string;
  amount: number;
  type?: 'INCOME' | 'EXPENSE';
  category: string;
  date: string | Date;
  paymentMethod: string;
  notes?: string | null;
}

export interface UpdateTransactionInput {
  title?: string;
  amount?: number;
  type?: 'INCOME' | 'EXPENSE';
  category?: string;
  date?: string | Date;
  paymentMethod?: string;
  notes?: string | null;
}

export interface TransactionFilterOptions {
  search?: string;
  category?: string;
  type?: 'INCOME' | 'EXPENSE' | 'ALL';
  startDate?: string;
  endDate?: string;
  sortBy?: 'date' | 'amount' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

export class TransactionService {
  async createTransaction(userId: string, input: CreateTransactionInput) {
    const type: TransactionType = input.type === 'INCOME' ? TransactionType.INCOME : TransactionType.EXPENSE;
    const dateObj = new Date(input.date);

    return prisma.transaction.create({
      data: {
        title: input.title.trim(),
        amount: Number(input.amount),
        type,
        category: input.category.trim(),
        date: isNaN(dateObj.getTime()) ? new Date() : dateObj,
        paymentMethod: input.paymentMethod.trim(),
        notes: input.notes ? input.notes.trim() : null,
        userId,
      },
    });
  }

  async getTransactions(userId: string, options: TransactionFilterOptions = {}) {
    const {
      search,
      category,
      type,
      startDate,
      endDate,
      sortBy = 'date',
      sortOrder = 'desc',
    } = options;

    const where: Record<string, unknown> = {
      userId,
    };

    if (type && type !== 'ALL') {
      where.type = type === 'INCOME' ? TransactionType.INCOME : TransactionType.EXPENSE;
    }

    if (category && category !== 'All') {
      where.category = category;
    }

    if (search && search.trim().length > 0) {
      where.OR = [
        { title: { contains: search.trim(), mode: 'insensitive' } },
        { category: { contains: search.trim(), mode: 'insensitive' } },
        { notes: { contains: search.trim(), mode: 'insensitive' } },
      ];
    }

    if (startDate || endDate) {
      const dateFilter: Record<string, Date> = {};
      if (startDate) {
        dateFilter.gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        dateFilter.lte = end;
      }
      where.date = dateFilter;
    }

    return prisma.transaction.findMany({
      where,
      orderBy: [{ [sortBy]: sortOrder }, { createdAt: 'desc' }],
    });
  }

  async getTransactionById(userId: string, id: string) {
    return prisma.transaction.findFirst({
      where: { id, userId },
    });
  }

  async updateTransaction(userId: string, id: string, input: UpdateTransactionInput) {
    const existing = await prisma.transaction.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      return null;
    }

    const updateData: Record<string, unknown> = {};

    if (input.title !== undefined) {
      updateData.title = input.title.trim();
    }
    if (input.amount !== undefined) {
      updateData.amount = Number(input.amount);
    }
    if (input.type !== undefined) {
      updateData.type = input.type === 'INCOME' ? TransactionType.INCOME : TransactionType.EXPENSE;
    }
    if (input.category !== undefined) {
      updateData.category = input.category.trim();
    }
    if (input.date !== undefined) {
      const dateObj = new Date(input.date);
      updateData.date = isNaN(dateObj.getTime()) ? new Date() : dateObj;
    }
    if (input.paymentMethod !== undefined) {
      updateData.paymentMethod = input.paymentMethod.trim();
    }
    if (input.notes !== undefined) {
      updateData.notes = input.notes ? input.notes.trim() : null;
    }

    return prisma.transaction.update({
      where: { id },
      data: updateData,
    });
  }

  async deleteTransaction(userId: string, id: string) {
    const existing = await prisma.transaction.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      return null;
    }

    await prisma.transaction.delete({
      where: { id },
    });

    return existing;
  }

  async getSummaryMetrics(userId: string) {
    const transactions = await prisma.transaction.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
    });

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    const lastMonthDate = new Date(currentYear, currentMonth - 1, 1);
    const lastMonthYear = lastMonthDate.getFullYear();
    const lastMonth = lastMonthDate.getMonth();

    let totalIncome = 0;
    let totalExpense = 0;
    let currentMonthIncome = 0;
    let currentMonthExpense = 0;
    let lastMonthIncome = 0;
    let lastMonthExpense = 0;

    const categoryExpenseTotals: Record<string, number> = {};
    const categoryIncomeTotals: Record<string, number> = {};
    const monthlyMap: Record<string, { month: string; income: number; expense: number; net: number; dateOrder: number }> = {};

    // Initialize last 6 months in monthlyMap
    for (let i = 5; i >= 0; i--) {
      const d = new Date(currentYear, currentMonth - i, 1);
      const monthKey = d.toLocaleString('en-US', { month: 'short' });
      const yearShort = d.getFullYear().toString().slice(-2);
      const label = `${monthKey} '${yearShort}`;
      const dateOrder = d.getFullYear() * 100 + d.getMonth();
      monthlyMap[label] = { month: label, income: 0, expense: 0, net: 0, dateOrder };
    }

    let highestExpense = 0;
    let highestExpenseTitle = '';

    for (const tx of transactions) {
      const txDate = new Date(tx.date);
      const isDateValid = !isNaN(txDate.getTime());
      const txYear = isDateValid ? txDate.getFullYear() : currentYear;
      const txMonth = isDateValid ? txDate.getMonth() : currentMonth;

      const isCurrentMonth = txYear === currentYear && txMonth === currentMonth;
      const isLastMonth = txYear === lastMonthYear && txMonth === lastMonth;

      if (tx.type === TransactionType.INCOME) {
        totalIncome += tx.amount;
        if (isCurrentMonth) currentMonthIncome += tx.amount;
        if (isLastMonth) lastMonthIncome += tx.amount;
        categoryIncomeTotals[tx.category] = (categoryIncomeTotals[tx.category] ?? 0) + tx.amount;
      } else {
        totalExpense += tx.amount;
        if (isCurrentMonth) currentMonthExpense += tx.amount;
        if (isLastMonth) lastMonthExpense += tx.amount;
        categoryExpenseTotals[tx.category] = (categoryExpenseTotals[tx.category] ?? 0) + tx.amount;

        if (tx.amount > highestExpense) {
          highestExpense = tx.amount;
          highestExpenseTitle = tx.title;
        }
      }

      if (isDateValid) {
        const monthKey = txDate.toLocaleString('en-US', { month: 'short' });
        const yearShort = txDate.getFullYear().toString().slice(-2);
        const label = `${monthKey} '${yearShort}`;
        if (monthlyMap[label]) {
          if (tx.type === TransactionType.INCOME) {
            monthlyMap[label].income += tx.amount;
          } else {
            monthlyMap[label].expense += tx.amount;
          }
          monthlyMap[label].net = monthlyMap[label].income - monthlyMap[label].expense;
        }
      }
    }

    const netBalance = totalIncome - totalExpense;
    const currentMonthBalance = currentMonthIncome - currentMonthExpense;
    const savingsRate = totalIncome > 0 ? Math.max(0, Math.round(((totalIncome - totalExpense) / totalIncome) * 100)) : 0;
    const currentMonthSavingsRate = currentMonthIncome > 0 ? Math.max(0, Math.round(((currentMonthIncome - currentMonthExpense) / currentMonthIncome) * 100)) : 0;

    // Sort category breakdowns
    const categoryBreakdown = Object.entries(categoryExpenseTotals)
      .map(([category, amount]) => ({
        category,
        amount,
        percentage: totalExpense > 0 ? Math.round((amount / totalExpense) * 100) : 0,
      }))
      .sort((a, b) => b.amount - a.amount);

    const topCategory = categoryBreakdown[0] ? categoryBreakdown[0].category : 'None';
    const topCategoryAmount = categoryBreakdown[0] ? categoryBreakdown[0].amount : 0;

    const monthlyTrends = Object.values(monthlyMap).sort((a, b) => a.dateOrder - b.dateOrder);

    const expenseCount = transactions.filter((t) => t.type === TransactionType.EXPENSE).length;
    const averageExpense = expenseCount > 0 ? totalExpense / expenseCount : 0;

    // Monthly change percentages
    const expenseChangePercent = lastMonthExpense > 0
      ? Math.round(((currentMonthExpense - lastMonthExpense) / lastMonthExpense) * 100)
      : 0;

    const incomeChangePercent = lastMonthIncome > 0
      ? Math.round(((currentMonthIncome - lastMonthIncome) / lastMonthIncome) * 100)
      : 0;

    return {
      totalBalance: netBalance,
      totalIncome,
      totalExpense,
      savingsRate,
      currentMonth: {
        income: currentMonthIncome,
        expense: currentMonthExpense,
        balance: currentMonthBalance,
        savingsRate: currentMonthSavingsRate,
        expenseChangePercent,
        incomeChangePercent,
      },
      topCategory,
      topCategoryAmount,
      transactionCount: transactions.length,
      averageExpense,
      highestExpense: {
        amount: highestExpense,
        title: highestExpenseTitle || 'None',
      },
      categoryBreakdown,
      monthlyTrends,
      recentTransactions: transactions.slice(0, 10),
    };
  }
}

export const transactionService = new TransactionService();

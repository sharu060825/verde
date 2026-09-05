import { transactionService } from './transaction.service.js';
import { budgetService } from './budget.service.js';
import { prisma } from '../prisma/client.js';

export interface FinancialContext {
  user: {
    name: string;
    currency: string;
  };
  summary: {
    netBalance: number;
    currentMonthIncome: number;
    currentMonthExpense: number;
    currentMonthBalance: number;
    savingsRate: number;
    topCategory: string;
    topCategoryAmount: number;
    topCategoryPercent: number;
    totalTransactionsCount: number;
  };
  categories: Array<{
    category: string;
    spent: number;
    percentage: number;
  }>;
  budgets: Array<{
    category: string;
    limit: number;
    spent: number;
    remaining: number;
    percentUsed: number;
    isOverBudget: boolean;
  }>;
  recentTransactions: Array<{
    title: string;
    amount: number;
    type: string;
    category: string;
    date: string;
  }>;
  largestRecentExpense: {
    title: string;
    amount: number;
  } | null;
  budgetHealth: {
    totalBudgetLimit: number;
    totalBudgetSpent: number;
    totalBudgetRemaining: number;
    safeWeeklySpend: number;
    overBudgetCategories: string[];
    nearLimitCategories: string[]; // > 80%
  };
  proactiveInsights: Array<{
    id: string;
    type: 'ALERT' | 'OPPORTUNITY' | 'ACHIEVEMENT' | 'INFO';
    message: string;
    actionPrompt?: string;
    actionQuery?: string;
  }>;
}

export class FinancialContextService {
  async getContext(userId: string, currentPage: string = '/dashboard'): Promise<FinancialContext> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, currency: true },
    });

    const userName = user?.name ? user.name.split(' ')[0] : 'there';
    const currency = user?.currency || 'INR';

    const [summaryMetrics, budgets] = await Promise.all([
      transactionService.getSummaryMetrics(userId),
      budgetService.getBudgets(userId),
    ]);

    const totalBudgetLimit = budgets.reduce((acc, b) => acc + b.limit, 0);
    const totalBudgetSpent = budgets.reduce((acc, b) => acc + b.spent, 0);
    const totalBudgetRemaining = Math.max(0, totalBudgetLimit - totalBudgetSpent);

    const now = new Date();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const daysRemaining = Math.max(1, daysInMonth - now.getDate());
    const safeDailySpend = totalBudgetRemaining > 0 ? totalBudgetRemaining / daysRemaining : 0;
    const safeWeeklySpend = Math.round(safeDailySpend * 7);

    const overBudgetCategories = budgets.filter((b) => b.isOverBudget).map((b) => b.category);
    const nearLimitCategories = budgets.filter((b) => !b.isOverBudget && b.percentUsed >= 80).map((b) => b.category);

    // Formulate Proactive Insights
    const proactiveInsights: FinancialContext['proactiveInsights'] = [];

    // 1. Check over-budget or near-limit
    if (overBudgetCategories.length > 0) {
      proactiveInsights.push({
        id: 'over-budget-warning',
        type: 'ALERT',
        message: `Your ${overBudgetCategories[0]} spending has passed its monthly budget limit.`,
        actionPrompt: 'See details',
        actionQuery: `How much did I exceed my ${overBudgetCategories[0]} budget by?`,
      });
    } else if (nearLimitCategories.length > 0) {
      const b = budgets.find((item) => item.category === nearLimitCategories[0]);
      proactiveInsights.push({
        id: 'near-limit-warning',
        type: 'ALERT',
        message: `Your ${nearLimitCategories[0]} budget is already at ${b?.percentUsed || 80}% of its limit.`,
        actionPrompt: 'Explore',
        actionQuery: `How much can I still spend on ${nearLimitCategories[0]} this month?`,
      });
    }

    // 2. Category Concentration
    if (summaryMetrics.categoryBreakdown.length > 0) {
      const top = summaryMetrics.categoryBreakdown[0];
      if (top.percentage >= 35 && top.category !== 'Housing & Rent') {
        proactiveInsights.push({
          id: 'high-category-spend',
          type: 'OPPORTUNITY',
          message: `${top.category} accounts for ${top.percentage}% of your total spending so far.`,
          actionPrompt: 'Help me save',
          actionQuery: `How can I reduce my ${top.category} spending?`,
        });
      }
    }

    // 3. Savings Milestone or Buffer
    if (summaryMetrics.savingsRate >= 20 && summaryMetrics.totalIncome > 0) {
      proactiveInsights.push({
        id: 'healthy-savings',
        type: 'ACHIEVEMENT',
        message: `You have saved ${summaryMetrics.savingsRate}% of your income this period. Great financial rhythm!`,
        actionPrompt: 'Plan rest of month',
        actionQuery: 'How much can I safely allocate to savings this month?',
      });
    } else if (totalBudgetRemaining > 0) {
      proactiveInsights.push({
        id: 'safe-spending',
        type: 'INFO',
        message: `You've got ${currency} ${totalBudgetRemaining.toLocaleString()} remaining in your planned budget for the month.`,
        actionPrompt: 'Plan spending',
        actionQuery: 'How much can I spend this week?',
      });
    } else if (budgets.length === 0 && summaryMetrics.transactionCount > 0) {
      proactiveInsights.push({
        id: 'create-budget',
        type: 'OPPORTUNITY',
        message: 'You haven’t set up any category budgets yet. Setting one helps prevent overspending.',
        actionPrompt: 'Create budget',
        actionQuery: 'What categories should I create budgets for?',
      });
    }

    if (proactiveInsights.length === 0) {
      proactiveInsights.push({
        id: 'welcome',
        type: 'INFO',
        message: 'I’m watching your cash flow in real-time. Ask me anything about your money!',
        actionPrompt: 'Where is my money going?',
        actionQuery: 'Where is my money going this month?',
      });
    }

    return {
      user: {
        name: userName,
        currency,
      },
      summary: {
        netBalance: summaryMetrics.totalBalance,
        currentMonthIncome: summaryMetrics.currentMonth.income,
        currentMonthExpense: summaryMetrics.currentMonth.expense,
        currentMonthBalance: summaryMetrics.currentMonth.balance,
        savingsRate: summaryMetrics.currentMonth.savingsRate,
        topCategory: summaryMetrics.topCategory,
        topCategoryAmount: summaryMetrics.topCategoryAmount,
        topCategoryPercent:
          summaryMetrics.currentMonth.expense > 0
            ? Math.round((summaryMetrics.topCategoryAmount / summaryMetrics.currentMonth.expense) * 100)
            : 0,
        totalTransactionsCount: summaryMetrics.transactionCount,
      },
      categories: summaryMetrics.categoryBreakdown.map((c) => ({
        category: c.category,
        spent: c.amount,
        percentage: c.percentage,
      })),
      budgets: budgets.map((b) => ({
        category: b.category,
        limit: b.limit,
        spent: b.spent,
        remaining: b.remaining,
        percentUsed: b.percentUsed,
        isOverBudget: b.isOverBudget,
      })),
      recentTransactions: summaryMetrics.recentTransactions.slice(0, 10).map((t) => ({
        title: t.title,
        amount: t.amount,
        type: t.type,
        category: t.category,
        date: t.date.toISOString().split('T')[0],
      })),
      largestRecentExpense: summaryMetrics.highestExpense.amount > 0
        ? {
            title: summaryMetrics.highestExpense.title,
            amount: summaryMetrics.highestExpense.amount,
          }
        : null,
      budgetHealth: {
        totalBudgetLimit,
        totalBudgetSpent,
        totalBudgetRemaining,
        safeWeeklySpend,
        overBudgetCategories,
        nearLimitCategories,
      },
      proactiveInsights,
    };
  }
}

export const financialContextService = new FinancialContextService();

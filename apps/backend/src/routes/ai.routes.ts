import { Router, type Response, type NextFunction } from 'express';
import { authMiddleware, type AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { transactionService } from '../services/transaction.service.js';
import { budgetService } from '../services/budget.service.js';

const router = Router();
router.use(authMiddleware);

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

// Fallback categorization rule engine in Node.js
function fallbackCategorize(title: string, notes?: string): { category: string; confidence: number; reasoning: string; suggested_type: 'INCOME' | 'EXPENSE' } {
  const text = `${title} ${notes || ''}`.toLowerCase();

  const rules: Array<{ keywords: string[]; category: string; type: 'INCOME' | 'EXPENSE' }> = [
    { keywords: ['salary', 'paycheck', 'payroll', 'stipend', 'wages'], category: 'Salary', type: 'INCOME' },
    { keywords: ['freelance', 'upwork', 'fiverr', 'contract', 'consulting', 'client payment'], category: 'Freelance', type: 'INCOME' },
    { keywords: ['dividend', 'stock', 'mutual fund', 'crypto', 'interest', 'shares', 'trading'], category: 'Investments', type: 'INCOME' },
    { keywords: ['gift', 'cashback', 'reward', 'refund', 'bonus'], category: 'Gifts & Grants', type: 'INCOME' },
    { keywords: ['swiggy', 'zomato', 'restaurant', 'mcdonald', 'starbucks', 'kfc', 'burger', 'pizza', 'cafe', 'coffee', 'dinner', 'lunch', 'breakfast'], category: 'Food & Dining', type: 'EXPENSE' },
    { keywords: ['grocery', 'supermarket', 'blinkit', 'zepto', 'instamart', 'milk', 'vegetables', 'fruits', 'walmart', 'costco'], category: 'Groceries', type: 'EXPENSE' },
    { keywords: ['uber', 'ola', 'rapido', 'metro', 'bus', 'train', 'flight', 'ticket', 'petrol', 'fuel', 'diesel', 'cab', 'taxi', 'parking', 'toll'], category: 'Transportation', type: 'EXPENSE' },
    { keywords: ['rent', 'landlord', 'apartment', 'housing', 'mortgage', 'maintenance'], category: 'Housing & Rent', type: 'EXPENSE' },
    { keywords: ['electricity', 'water', 'gas', 'broadband', 'wifi', 'internet', 'recharge', 'mobile bill', 'power'], category: 'Utilities', type: 'EXPENSE' },
    { keywords: ['amazon', 'flipkart', 'myntra', 'clothes', 'shoes', 'electronics', 'shopping', 'mall', 'zara', 'h&m'], category: 'Shopping', type: 'EXPENSE' },
    { keywords: ['netflix', 'spotify', 'prime', 'cinema', 'movie', 'game', 'playstation', 'steam', 'youtube', 'theatre', 'party', 'club'], category: 'Entertainment', type: 'EXPENSE' },
    { keywords: ['doctor', 'hospital', 'pharmacy', 'medicine', 'dental', 'clinic', 'gym', 'fitness', 'health', 'yoga', 'supplements'], category: 'Healthcare', type: 'EXPENSE' },
    { keywords: ['hotel', 'airbnb', 'vacation', 'resort', 'trip', 'booking.com', 'makemytrip', 'expedia'], category: 'Travel', type: 'EXPENSE' },
    { keywords: ['tuition', 'course', 'udemy', 'coursera', 'books', 'school', 'college', 'exam', 'class'], category: 'Education', type: 'EXPENSE' },
    { keywords: ['salon', 'haircut', 'spa', 'cosmetics', 'grooming', 'skincare'], category: 'Personal Care', type: 'EXPENSE' },
  ];

  for (const rule of rules) {
    for (const kw of rule.keywords) {
      if (text.includes(kw)) {
        return {
          category: rule.category,
          confidence: 0.92,
          reasoning: `Matched financial keyword "${kw}" associated with ${rule.category}.`,
          suggested_type: rule.type,
        };
      }
    }
  }

  return {
    category: 'Other Expense',
    confidence: 0.5,
    reasoning: 'Classified based on standard general transaction characteristics.',
    suggested_type: 'EXPENSE',
  };
}

router.post('/categorize', async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { title, notes, amount, type } = req.body ?? {};

    if (!title || typeof title !== 'string') {
      res.status(400).json({ error: 'Title is required for categorization.' });
      return;
    }

    try {
      const response = await fetch(`${AI_SERVICE_URL}/ai/categorize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, notes, amount, type }),
      });

      if (response.ok) {
        const data = await response.json();
        res.json(data);
        return;
      }
    } catch {
      // AI Service offline / fallback
    }

    // Use reliable fallback classifier
    const fallbackResult = fallbackCategorize(title, notes);
    res.json(fallbackResult);
  } catch (error) {
    next(error);
  }
});

router.post('/insights', async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    // Fetch user's real transactions and budgets
    const transactions = await transactionService.getTransactions(userId, {});
    const budgets = await budgetService.getBudgets(userId);

    const payload = {
      transactions: transactions.map((t) => ({
        id: t.id,
        title: t.title,
        amount: t.amount,
        type: t.type,
        category: t.category,
        date: t.date.toISOString(),
      })),
      budgets: budgets.map((b) => ({
        category: b.category,
        limit: b.limit,
        spent: b.spent,
      })),
    };

    try {
      const response = await fetch(`${AI_SERVICE_URL}/ai/insights`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const data = await response.json();
        res.json(data);
        return;
      }
    } catch {
      // AI service offline / fallback
    }

    // Fallback real calculation insights
    const summary = await transactionService.getSummaryMetrics(userId);
    const keyInsights: string[] = [];

    if (summary.totalIncome > 0 && summary.totalExpense > 0) {
      keyInsights.push(`Your overall savings rate is ${summary.savingsRate}%.`);
    }

    if (summary.topCategory !== 'None') {
      keyInsights.push(`Your highest spending category is ${summary.topCategory} at ₹${summary.topCategoryAmount.toLocaleString('en-IN')}.`);
    }

    if (summary.highestExpense.amount > 0) {
      keyInsights.push(`Largest single transaction was "${summary.highestExpense.title}" (₹${summary.highestExpense.amount.toLocaleString('en-IN')}).`);
    }

    const overBudgets = budgets.filter((b) => b.isOverBudget);
    if (overBudgets.length > 0) {
      keyInsights.push(`Alert: You have exceeded budget limits in ${overBudgets.map((b) => b.category).join(', ')}.`);
    } else if (budgets.length > 0) {
      keyInsights.push('All configured budget categories are currently within healthy limits.');
    }

    if (keyInsights.length === 0) {
      keyInsights.push('Add transactions and budgets to generate AI-powered financial patterns and metrics.');
    }

    res.json({
      summary: summary.totalExpense > 0
        ? `You have recorded ${summary.transactionCount} transactions with total spending of ₹${summary.totalExpense.toLocaleString('en-IN')}.`
        : 'Welcome! Start adding income and expenses to unlock AI insights.',
      key_insights: keyInsights,
      top_expense_category: summary.topCategory,
      spending_anomaly: overBudgets.length > 0 ? `Over-budget detected in ${overBudgets[0].category}` : null,
      savings_rate_comment: summary.savingsRate >= 20 ? 'Strong savings rate! You are meeting the 20% savings rule.' : 'Consider reducing discretionary expenses to boost your monthly savings.',
      health_score: Math.min(100, Math.max(30, summary.savingsRate * 1.2 + (budgets.length > 0 && overBudgets.length === 0 ? 30 : 10))),
    });
  } catch (error) {
    next(error);
  }
});

router.post('/recommendations', async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const transactions = await transactionService.getTransactions(userId, {});
    const budgets = await budgetService.getBudgets(userId);

    const payload = {
      transactions: transactions.map((t) => ({
        id: t.id,
        title: t.title,
        amount: t.amount,
        type: t.type,
        category: t.category,
        date: t.date.toISOString(),
      })),
      budgets: budgets.map((b) => ({
        category: b.category,
        limit: b.limit,
        spent: b.spent,
      })),
    };

    try {
      const response = await fetch(`${AI_SERVICE_URL}/ai/recommendations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const data = await response.json();
        res.json(data);
        return;
      }
    } catch {
      // Fallback
    }

    // Dynamic heuristic recommendations based on user's real transactions
    const summary = await transactionService.getSummaryMetrics(userId);
    const recommendations = [];

    const overBudgets = budgets.filter((b) => b.isOverBudget);
    for (const ob of overBudgets) {
      recommendations.push({
        title: `Trim ${ob.category} spending`,
        description: `You have spent ₹${ob.spent} against a limit of ₹${ob.limit} (${ob.percentUsed}% used). Pause non-essential purchases in this category for the rest of the month.`,
        potential_savings: ob.spent - ob.limit,
        priority: 'HIGH',
        category: ob.category,
      });
    }

    if (summary.categoryBreakdown.length > 0) {
      const topCat = summary.categoryBreakdown[0];
      if (topCat.percentage > 35) {
        recommendations.push({
          title: `Diversify away from high ${topCat.category} concentration`,
          description: `${topCat.category} accounts for ${topCat.percentage}% of your total expenses. Aim to reduce this by 10% next month.`,
          potential_savings: Math.round(topCat.amount * 0.1),
          priority: 'MEDIUM',
          category: topCat.category,
        });
      }
    }

    if (budgets.length === 0 && summary.categoryBreakdown.length > 0) {
      recommendations.push({
        title: 'Set Monthly Category Budgets',
        description: 'You haven’t set up any budget targets yet. Setting budgets for your top categories helps prevent overspending.',
        potential_savings: Math.round(summary.totalExpense * 0.15),
        priority: 'MEDIUM',
        category: 'General',
      });
    }

    if (recommendations.length === 0) {
      recommendations.push({
        title: 'Maintain 50/30/20 Budgeting Balance',
        description: 'Allocate 50% of income to needs, 30% to wants, and 20% to savings and investments for optimal long-term wealth.',
        potential_savings: Math.round(summary.totalIncome * 0.2),
        priority: 'LOW',
        category: 'Savings',
      });
    }

    res.json({ recommendations });
  } catch (error) {
    next(error);
  }
});

export default router;

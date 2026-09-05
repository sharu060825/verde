import type { Response, NextFunction } from 'express';
import type { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { financialContextService, type FinancialContext } from '../services/financialContext.service.js';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

function generateFallbackFinancialReply(
  query: string,
  context: FinancialContext,
  currentPage: string
): { reply: string; suggested_followups: string[] } {
  const q = query.toLowerCase();
  const curr = context.user.currency === 'INR' ? '₹' : '$';
  const name = context.user.name;

  // 1. Where is my money going? / Category breakdown
  if (q.includes('where is my money going') || q.includes('spending breakdown') || q.includes('categories') || q.includes('where am i spending')) {
    if (context.categories.length === 0) {
      return {
        reply: `Hey ${name}! You don’t have any recorded expenses yet this month. Once you start tracking, I’ll show you exactly where every coin goes!`,
        suggested_followups: ['How do I set up a budget?', 'What categories can I track?'],
      };
    }

    const topList = context.categories
      .slice(0, 3)
      .map((c) => `• **${c.category}**: ${curr}${c.spent.toLocaleString()} (${c.percentage}% of total)`)
      .join('\n');

    return {
      reply: `Here is where your money is heading this month, ${name}:\n\n${topList}\n\nYour highest concentration is in **${context.summary.topCategory}**. Would you like to set a spending cap on it?`,
      suggested_followups: [
        `Help me reduce ${context.summary.topCategory} spending`,
        'Am I overspending?',
        'How much can I spend this week?',
      ],
    };
  }

  // 2. Affordability question: "Can I afford to spend X?"
  const affordMatch = query.match(/(?:afford|spend|buy|purchase).*?(\d[\d,]*)/i) || query.match(/(\d[\d,]*).*?(?:afford|spend)/i);
  if (affordMatch && (q.includes('afford') || q.includes('can i spend'))) {
    const rawVal = affordMatch[1].replace(/,/g, '');
    const targetAmount = parseFloat(rawVal);

    if (Number.isFinite(targetAmount) && targetAmount > 0) {
      const remaining = context.budgetHealth.totalBudgetRemaining;
      const netMonthlyBalance = context.summary.currentMonthBalance;
      const safeWeekly = context.budgetHealth.safeWeeklySpend;

      if (context.summary.totalTransactionsCount === 0) {
        return {
          reply: `I don't have enough spending history yet to make a reliable comparison. But generally, as long as ${curr}${targetAmount.toLocaleString()} fits within your expected income after rent and bills, it's manageable!`,
          suggested_followups: ['Where is my money going?', 'How do I set a budget?'],
        };
      }

      if (targetAmount <= safeWeekly && safeWeekly > 0) {
        return {
          reply: `Yes, you can afford ${curr}${targetAmount.toLocaleString()}! 👍\n\nYour safe weekly spending allowance is about **${curr}${safeWeekly.toLocaleString()}** (with ${curr}${remaining.toLocaleString()} left in your planned monthly budget). Just keep an eye on discretionary outings for the rest of the week.`,
          suggested_followups: ['How much is left in my budgets?', 'What changed this month?'],
        };
      } else if (targetAmount <= netMonthlyBalance && netMonthlyBalance > 0) {
        return {
          reply: `You have the cash buffer for ${curr}${targetAmount.toLocaleString()} (current monthly net balance is **${curr}${netMonthlyBalance.toLocaleString()}**), but it exceeds your ideal weekly pace of ${curr}${safeWeekly.toLocaleString()}.\n\nIf you make this purchase, consider pacing other discretionary expenses for the next 7-10 days.`,
          suggested_followups: ['Am I overspending?', 'Help me save money'],
        };
      } else {
        return {
          reply: `Spending ${curr}${targetAmount.toLocaleString()} right now might strain your cash flow. ⚠️\n\nYour remaining safe budget for the month is **${curr}${remaining.toLocaleString()}**, and you've already spent ${curr}${context.summary.currentMonthExpense.toLocaleString()} this month. If it's not essential, consider holding off or splitting the cost.`,
          suggested_followups: ['What should I cut back on?', 'Where is my money going?'],
        };
      }
    }
  }

  // 3. How much did I spend this month?
  if (q.includes('how much') && (q.includes('spend') || q.includes('spent') || q.includes('expenses'))) {
    const spent = context.summary.currentMonthExpense;
    const income = context.summary.currentMonthIncome;
    const count = context.summary.totalTransactionsCount;

    return {
      reply: `You've spent **${curr}${spent.toLocaleString()}** across ${count} entries this month. For comparison, your total recorded income is **${curr}${income.toLocaleString()}**, giving you an active savings rate of **${context.summary.savingsRate}%**.`,
      suggested_followups: [
        'Where is my money going?',
        'Am I overspending?',
        'Show me my biggest expenses',
      ],
    };
  }

  // 4. Am I overspending? / Budget Check
  if (q.includes('overspending') || q.includes('over budget') || q.includes('budget')) {
    const over = context.budgetHealth.overBudgetCategories;
    const near = context.budgetHealth.nearLimitCategories;

    if (over.length > 0) {
      return {
        reply: `⚠️ Heads up: You have passed the limit in **${over.join(', ')}** this month.\n\n` +
          `Your overall remaining safe budget across all other categories is **${curr}${context.budgetHealth.totalBudgetRemaining.toLocaleString()}**. Want me to help you find areas to balance this out?`,
        suggested_followups: [`Help me cut back on ${over[0]}`, 'How much can I spend this week?'],
      };
    }

    if (near.length > 0) {
      return {
        reply: `You're mostly on track, but **${near.join(', ')}** is getting close (over 80% used). Pacing your purchases in those areas will keep you comfortably green!`,
        suggested_followups: ['How much can I spend this week?', 'Show me my biggest expenses'],
      };
    }

    if (context.budgets.length === 0) {
      return {
        reply: `You haven't configured category budgets yet, so I don't have hard limits to benchmark against. Based on your income and spending, your net cash flow is **${curr}${context.summary.currentMonthBalance.toLocaleString()}**. Would you like suggestions for budget limits?`,
        suggested_followups: ['What categories should I budget for?', 'Where is my money going?'],
      };
    }

    return {
      reply: `You are in great shape! 🎉 All ${context.budgets.length} of your active category budgets are within safe thresholds, and you still have **${curr}${context.budgetHealth.totalBudgetRemaining.toLocaleString()}** remaining for the month.`,
      suggested_followups: ['How much can I spend this week?', 'Help me save money'],
    };
  }

  // 5. Biggest / Largest expenses
  if (q.includes('biggest') || q.includes('largest') || q.includes('highest')) {
    if (context.recentTransactions.length === 0) {
      return {
        reply: 'No transactions recorded yet to check! Add a few expenses and I will track your largest outlays.',
        suggested_followups: ['Where is my money going?'],
      };
    }

    const expensesOnly = context.recentTransactions
      .filter((t) => t.type === 'EXPENSE')
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 3);

    const list = expensesOnly
      .map((t) => `• **${t.title}** (${t.category}): ${curr}${t.amount.toLocaleString()} on ${t.date}`)
      .join('\n');

    return {
      reply: `Here are your largest recent expenses:\n\n${list}\n\nNotice any recurring patterns you'd like to optimize?`,
      suggested_followups: ['Help me save money', 'Am I overspending?'],
    };
  }

  // 6. Help me save / What should I cut back on?
  if (q.includes('save') || q.includes('cut back') || q.includes('tips') || q.includes('reduce')) {
    const topCat = context.summary.topCategory;
    const topAmt = context.summary.topCategoryAmount;

    return {
      reply: `Here are three practical ideas tailored to your spending pattern:\n\n` +
        `1. **Focus on ${topCat !== 'None' ? topCat : 'discretionary items'}**: It currently makes up ${context.summary.topCategoryPercent}% of your spend (${curr}${topAmt.toLocaleString()}). Shaving just 10% saves ${curr}${Math.round(topAmt * 0.1).toLocaleString()}.\n` +
        `2. **Aim for the 50/30/20 benchmark**: Direct 50% of income to essential needs, 30% to wants, and reserve 20% directly for savings or debt repayment.\n` +
        `3. **Weekly Micro-Budgets**: Try setting a weekly safe cap of **${curr}${context.budgetHealth.safeWeeklySpend.toLocaleString()}** rather than waiting until month-end.`,
      suggested_followups: ['How much can I spend this week?', 'Where is my money going?', 'Am I overspending?'],
    };
  }

  // 7. General friendly conversational greeting / fallback
  return {
    reply: `Hey ${name}! I’m keeping track of your finances in the background. Right now, your net monthly balance is **${curr}${context.summary.currentMonthBalance.toLocaleString()}** with a **${context.summary.savingsRate}%** savings rate.\n\nWhat would you like to explore?`,
    suggested_followups: [
      'Where is my money going?',
      'Am I overspending?',
      'How much can I spend this week?',
      'Show me my biggest expenses',
    ],
  };
}

export const chat = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { message, history = [], currentPage = '/dashboard' } = req.body ?? {};

    if (!message || typeof message !== 'string') {
      res.status(400).json({ error: 'Message is required.' });
      return;
    }

    // Assemble real structured financial context
    const financialContext = await financialContextService.getContext(userId, currentPage);

    // Try calling FastAPI AI Service first
    try {
      const response = await fetch(`${AI_SERVICE_URL}/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          history,
          context: financialContext,
          current_page: currentPage,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        res.json(data);
        return;
      }
    } catch {
      // AI Service offline or starting up -> Use local financial intelligence generator
    }

    // Built-in intelligent financial fallback
    const fallback = generateFallbackFinancialReply(message, financialContext, currentPage);

    res.json({
      reply: fallback.reply,
      proactive_insights: financialContext.proactiveInsights,
      suggested_followups: fallback.suggested_followups,
      context_summary: {
        balance: financialContext.summary.netBalance,
        spentThisMonth: financialContext.summary.currentMonthExpense,
        savingsRate: financialContext.summary.savingsRate,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getProactiveInsights = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const currentPage = (req.query.page as string) || '/dashboard';
    const financialContext = await financialContextService.getContext(userId, currentPage);

    res.json({
      insights: financialContext.proactiveInsights,
      quick_actions: [
        'Where is my money going?',
        'Am I overspending?',
        'How much can I spend this week?',
        'Help me save money',
      ],
    });
  } catch (error) {
    next(error);
  }
};

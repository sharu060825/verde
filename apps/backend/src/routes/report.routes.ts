import { Router, type Response, type NextFunction } from 'express';
import { authMiddleware, type AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { transactionService } from '../services/transaction.service.js';

const router = Router();
router.use(authMiddleware);

router.get('/csv', async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const {
      search,
      category,
      type,
      startDate,
      endDate,
    } = req.query as Record<string, string | undefined>;

    const transactions = await transactionService.getTransactions(userId, {
      search,
      category,
      type: (type as 'INCOME' | 'EXPENSE' | 'ALL') || 'ALL',
      startDate,
      endDate,
      sortBy: 'date',
      sortOrder: 'desc',
    });

    const headers = ['Date', 'Title', 'Type', 'Category', 'Amount', 'Payment Method', 'Notes'];
    const rows = transactions.map((t) => [
      t.date.toISOString().split('T')[0],
      `"${t.title.replace(/"/g, '""')}"`,
      t.type,
      `"${t.category.replace(/"/g, '""')}"`,
      t.amount.toFixed(2),
      `"${t.paymentMethod.replace(/"/g, '""')}"`,
      `"${(t.notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="transactions_${new Date().toISOString().split('T')[0]}.csv"`);
    res.status(200).send(csvContent);
  } catch (error) {
    next(error);
  }
});

export default router;

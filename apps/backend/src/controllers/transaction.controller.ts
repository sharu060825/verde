import type { Response, NextFunction } from 'express';
import { transactionService } from '../services/transaction.service.js';
import type { AuthenticatedRequest } from '../middleware/auth.middleware.js';

export const createTransaction = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { title, amount, type, category, date, paymentMethod, notes } = req.body ?? {};

    if (!title || typeof title !== 'string' || title.trim().length < 1) {
      res.status(400).json({ error: 'Title is required' });
      return;
    }

    const parsedAmount = typeof amount === 'number' ? amount : Number(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      res.status(400).json({ error: 'Amount must be a positive number' });
      return;
    }

    if (!category || typeof category !== 'string' || category.trim().length < 1) {
      res.status(400).json({ error: 'Category is required' });
      return;
    }

    if (!paymentMethod || typeof paymentMethod !== 'string' || paymentMethod.trim().length < 1) {
      res.status(400).json({ error: 'Payment method is required' });
      return;
    }

    const transaction = await transactionService.createTransaction(userId, {
      title,
      amount: parsedAmount,
      type: type === 'INCOME' ? 'INCOME' : 'EXPENSE',
      category,
      date: date || new Date().toISOString(),
      paymentMethod,
      notes,
    });

    res.status(201).json(transaction);
  } catch (error) {
    next(error);
  }
};

export const getTransactions = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
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
      sortBy,
      sortOrder,
    } = req.query as Record<string, string | undefined>;

    const transactions = await transactionService.getTransactions(userId, {
      search,
      category,
      type: (type as 'INCOME' | 'EXPENSE' | 'ALL') || 'ALL',
      startDate,
      endDate,
      sortBy: (sortBy as 'date' | 'amount' | 'createdAt') || 'date',
      sortOrder: (sortOrder as 'asc' | 'desc') || 'desc',
    });

    res.json(transactions);
  } catch (error) {
    next(error);
  }
};

export const getTransactionSummary = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const summary = await transactionService.getSummaryMetrics(userId);
    res.json(summary);
  } catch (error) {
    next(error);
  }
};

export const getTransactionById = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const transaction = await transactionService.getTransactionById(userId, id);

    if (!transaction) {
      res.status(404).json({ error: 'Transaction not found' });
      return;
    }

    res.json(transaction);
  } catch (error) {
    next(error);
  }
};

export const updateTransaction = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const transaction = await transactionService.updateTransaction(userId, id, req.body);

    if (!transaction) {
      res.status(404).json({ error: 'Transaction not found' });
      return;
    }

    res.json(transaction);
  } catch (error) {
    next(error);
  }
};

export const deleteTransaction = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const transaction = await transactionService.deleteTransaction(userId, id);

    if (!transaction) {
      res.status(404).json({ error: 'Transaction not found' });
      return;
    }

    res.json({ message: 'Transaction deleted successfully', transaction });
  } catch (error) {
    next(error);
  }
};

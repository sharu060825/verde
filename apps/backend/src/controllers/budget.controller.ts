import type { Response, NextFunction } from 'express';
import { budgetService } from '../services/budget.service.js';
import type { AuthenticatedRequest } from '../middleware/auth.middleware.js';

export const getBudgets = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const budgets = await budgetService.getBudgets(userId);
    res.json(budgets);
  } catch (error) {
    next(error);
  }
};

export const createBudget = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { category, limit, period } = req.body ?? {};

    if (!category || typeof category !== 'string' || category.trim().length < 1) {
      res.status(400).json({ error: 'Category is required.' });
      return;
    }

    const parsedLimit = typeof limit === 'number' ? limit : Number(limit);
    if (!Number.isFinite(parsedLimit) || parsedLimit <= 0) {
      res.status(400).json({ error: 'Budget limit must be a positive number.' });
      return;
    }

    const budget = await budgetService.createOrUpdateBudget(userId, {
      category,
      limit: parsedLimit,
      period,
    });

    res.status(201).json(budget);
  } catch (error) {
    next(error);
  }
};

export const updateBudget = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { category, limit, period } = req.body ?? {};

    const updateData: { category?: string; limit?: number; period?: string } = {};

    if (category !== undefined) {
      if (typeof category !== 'string' || category.trim().length < 1) {
        res.status(400).json({ error: 'Category must be a non-empty string.' });
        return;
      }
      updateData.category = category;
    }

    if (limit !== undefined) {
      const parsedLimit = typeof limit === 'number' ? limit : Number(limit);
      if (!Number.isFinite(parsedLimit) || parsedLimit <= 0) {
        res.status(400).json({ error: 'Budget limit must be a positive number.' });
        return;
      }
      updateData.limit = parsedLimit;
    }

    if (period !== undefined) {
      updateData.period = period;
    }

    const budget = await budgetService.updateBudget(userId, id, updateData);
    if (!budget) {
      res.status(404).json({ error: 'Budget not found.' });
      return;
    }

    res.json(budget);
  } catch (error) {
    next(error);
  }
};

export const deleteBudget = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const budget = await budgetService.deleteBudget(userId, id);

    if (!budget) {
      res.status(404).json({ error: 'Budget not found.' });
      return;
    }

    res.json({ message: 'Budget deleted successfully', budget });
  } catch (error) {
    next(error);
  }
};

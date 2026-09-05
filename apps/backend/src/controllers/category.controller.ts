import type { Response, NextFunction } from 'express';
import { categoryService } from '../services/category.service.js';
import type { AuthenticatedRequest } from '../middleware/auth.middleware.js';

export const getCategories = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const categories = await categoryService.getCategories(userId);
    res.json(categories);
  } catch (error) {
    next(error);
  }
};

export const createCategory = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { name, type, icon, color } = req.body ?? {};

    if (!name || typeof name !== 'string' || name.trim().length < 1) {
      res.status(400).json({ error: 'Category name is required.' });
      return;
    }

    const category = await categoryService.createCategory(userId, {
      name,
      type,
      icon,
      color,
    });

    res.status(201).json(category);
  } catch (error) {
    if (error instanceof Error && error.message.includes('Unique constraint failed')) {
      res.status(409).json({ error: 'A category with this name already exists.' });
      return;
    }
    next(error);
  }
};

export const deleteCategory = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const category = await categoryService.deleteCategory(userId, id);

    if (!category) {
      res.status(404).json({ error: 'Category not found.' });
      return;
    }

    res.json({ message: 'Category deleted successfully', category });
  } catch (error) {
    next(error);
  }
};

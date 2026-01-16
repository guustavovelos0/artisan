import { Router, Response } from 'express';
import prisma from '../lib/prisma';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';
import { CategoryType } from '@prisma/client';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// GET /api/categories - Get all user's categories
router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const categories = await prisma.category.findMany({
      where: { userId },
      orderBy: { name: 'asc' },
    });

    res.json({ categories });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

interface CreateCategoryBody {
  name: string;
  type: CategoryType;
}

// POST /api/categories - Create a new category
router.post('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { name, type } = req.body as CreateCategoryBody;

    // Validate required fields
    if (!name || !type) {
      res.status(400).json({ error: 'Name and type are required' });
      return;
    }

    // Validate type is a valid CategoryType
    if (!Object.values(CategoryType).includes(type)) {
      res.status(400).json({ error: 'Type must be PRODUCT or MATERIAL' });
      return;
    }

    const category = await prisma.category.create({
      data: {
        name,
        type,
        userId,
      },
    });

    res.status(201).json({ category });
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

interface UpdateCategoryBody {
  name?: string;
  type?: CategoryType;
}

// PUT /api/categories/:id - Update a category
router.put('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId;
    const id = req.params.id as string;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    // First check if category exists and belongs to user
    const existingCategory = await prisma.category.findFirst({
      where: { id, userId },
    });

    if (!existingCategory) {
      res.status(404).json({ error: 'Category not found' });
      return;
    }

    const { name, type } = req.body as UpdateCategoryBody;

    // Validate at least one field is provided
    if (!name && !type) {
      res.status(400).json({ error: 'At least one field (name or type) must be provided' });
      return;
    }

    // Validate type if provided
    if (type && !Object.values(CategoryType).includes(type)) {
      res.status(400).json({ error: 'Type must be PRODUCT or MATERIAL' });
      return;
    }

    // Build update data
    const updateData: UpdateCategoryBody = {};
    if (name) updateData.name = name;
    if (type) updateData.type = type;

    const category = await prisma.category.update({
      where: { id },
      data: updateData,
    });

    res.json({ category });
  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/categories/:id - Delete a category
router.delete('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId;
    const id = req.params.id as string;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    // First check if category exists and belongs to user
    const existingCategory = await prisma.category.findFirst({
      where: { id, userId },
    });

    if (!existingCategory) {
      res.status(404).json({ error: 'Category not found' });
      return;
    }

    await prisma.category.delete({
      where: { id },
    });

    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

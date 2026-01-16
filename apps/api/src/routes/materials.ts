import { Router, Response } from 'express';
import prisma from '../lib/prisma';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// GET /api/materials - Get all user's materials with pagination
router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    // Pagination parameters
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    // Get total count for pagination
    const total = await prisma.material.count({
      where: { userId },
    });

    const materials = await prisma.material.findMany({
      where: { userId },
      include: {
        category: true,
      },
      orderBy: { name: 'asc' },
      skip,
      take: limit,
    });

    res.json({
      materials,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get materials error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/materials/:id - Get a single material
router.get('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId;
    const id = req.params.id as string;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const material = await prisma.material.findFirst({
      where: { id, userId },
      include: {
        category: true,
      },
    });

    if (!material) {
      res.status(404).json({ error: 'Material not found' });
      return;
    }

    res.json({ material });
  } catch (error) {
    console.error('Get material error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

interface CreateMaterialBody {
  name: string;
  description?: string;
  unit: string;
  unitPrice: number;
  quantity?: number;
  minStock?: number;
  supplier?: string;
  categoryId?: string;
}

// POST /api/materials - Create a new material
router.post('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { name, description, unit, unitPrice, quantity, minStock, supplier, categoryId } = req.body as CreateMaterialBody;

    // Validate required fields
    if (!name || !unit || unitPrice === undefined) {
      res.status(400).json({ error: 'Name, unit, and unitPrice are required' });
      return;
    }

    // Validate category belongs to user if provided
    if (categoryId) {
      const category = await prisma.category.findFirst({
        where: { id: categoryId, userId },
      });
      if (!category) {
        res.status(400).json({ error: 'Category not found' });
        return;
      }
    }

    const material = await prisma.material.create({
      data: {
        name,
        description,
        unit,
        unitPrice,
        quantity: quantity || 0,
        minStock: minStock || 0,
        supplier,
        categoryId,
        userId,
      },
      include: {
        category: true,
      },
    });

    res.status(201).json({ material });
  } catch (error) {
    console.error('Create material error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

interface UpdateMaterialBody {
  name?: string;
  description?: string;
  unit?: string;
  unitPrice?: number;
  quantity?: number;
  minStock?: number;
  supplier?: string;
  categoryId?: string | null;
}

// PUT /api/materials/:id - Update a material
router.put('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId;
    const id = req.params.id as string;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    // First check if material exists and belongs to user
    const existingMaterial = await prisma.material.findFirst({
      where: { id, userId },
    });

    if (!existingMaterial) {
      res.status(404).json({ error: 'Material not found' });
      return;
    }

    const { name, description, unit, unitPrice, quantity, minStock, supplier, categoryId } = req.body as UpdateMaterialBody;

    // Validate category belongs to user if provided
    if (categoryId) {
      const category = await prisma.category.findFirst({
        where: { id: categoryId, userId },
      });
      if (!category) {
        res.status(400).json({ error: 'Category not found' });
        return;
      }
    }

    const material = await prisma.material.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(unit !== undefined && { unit }),
        ...(unitPrice !== undefined && { unitPrice }),
        ...(quantity !== undefined && { quantity }),
        ...(minStock !== undefined && { minStock }),
        ...(supplier !== undefined && { supplier }),
        ...(categoryId !== undefined && { categoryId }),
      },
      include: {
        category: true,
      },
    });

    res.json({ material });
  } catch (error) {
    console.error('Update material error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

interface AdjustStockBody {
  quantity: number;
}

// PUT /api/materials/:id/stock - Adjust stock quantity
router.put('/:id/stock', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId;
    const id = req.params.id as string;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    // First check if material exists and belongs to user
    const existingMaterial = await prisma.material.findFirst({
      where: { id, userId },
    });

    if (!existingMaterial) {
      res.status(404).json({ error: 'Material not found' });
      return;
    }

    const { quantity } = req.body as AdjustStockBody;

    if (quantity === undefined) {
      res.status(400).json({ error: 'Quantity is required' });
      return;
    }

    const material = await prisma.material.update({
      where: { id },
      data: {
        quantity,
      },
      include: {
        category: true,
      },
    });

    res.json({ material });
  } catch (error) {
    console.error('Adjust stock error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/materials/:id - Delete a material
router.delete('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId;
    const id = req.params.id as string;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    // First check if material exists and belongs to user
    const existingMaterial = await prisma.material.findFirst({
      where: { id, userId },
    });

    if (!existingMaterial) {
      res.status(404).json({ error: 'Material not found' });
      return;
    }

    await prisma.material.delete({
      where: { id },
    });

    res.json({ message: 'Material deleted successfully' });
  } catch (error) {
    console.error('Delete material error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

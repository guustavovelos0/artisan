import { Router, Response } from 'express';
import prisma from '../lib/prisma';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// GET /api/products - Get all user's products with pagination
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
    const total = await prisma.product.count({
      where: { userId },
    });

    const products = await prisma.product.findMany({
      where: { userId },
      include: {
        category: true,
      },
      orderBy: { name: 'asc' },
      skip,
      take: limit,
    });

    res.json({
      products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/products/:id - Get a single product with materials (technical sheet)
router.get('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId;
    const id = req.params.id as string;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const product = await prisma.product.findFirst({
      where: { id, userId },
      include: {
        category: true,
        materials: {
          include: {
            material: true,
          },
        },
      },
    });

    if (!product) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }

    res.json({ product });
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

interface CreateProductBody {
  name: string;
  description?: string;
  price: number;
  laborCost?: number;
  quantity?: number;
  minStock?: number;
  categoryId?: string;
}

// POST /api/products - Create a new product
router.post('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { name, description, price, laborCost, quantity, minStock, categoryId } = req.body as CreateProductBody;

    // Validate required fields
    if (!name || price === undefined) {
      res.status(400).json({ error: 'Name and price are required' });
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

    const product = await prisma.product.create({
      data: {
        name,
        description,
        price,
        laborCost: laborCost || 0,
        quantity: quantity || 0,
        minStock: minStock || 0,
        categoryId,
        userId,
      },
      include: {
        category: true,
      },
    });

    res.status(201).json({ product });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

interface UpdateProductBody {
  name?: string;
  description?: string;
  price?: number;
  laborCost?: number;
  quantity?: number;
  minStock?: number;
  categoryId?: string | null;
}

// PUT /api/products/:id - Update a product
router.put('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId;
    const id = req.params.id as string;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    // First check if product exists and belongs to user
    const existingProduct = await prisma.product.findFirst({
      where: { id, userId },
    });

    if (!existingProduct) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }

    const { name, description, price, laborCost, quantity, minStock, categoryId } = req.body as UpdateProductBody;

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

    const product = await prisma.product.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(price !== undefined && { price }),
        ...(laborCost !== undefined && { laborCost }),
        ...(quantity !== undefined && { quantity }),
        ...(minStock !== undefined && { minStock }),
        ...(categoryId !== undefined && { categoryId }),
      },
      include: {
        category: true,
      },
    });

    res.json({ product });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

interface AdjustStockBody {
  quantity: number;
}

// PUT /api/products/:id/stock - Adjust stock quantity
router.put('/:id/stock', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId;
    const id = req.params.id as string;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    // First check if product exists and belongs to user
    const existingProduct = await prisma.product.findFirst({
      where: { id, userId },
    });

    if (!existingProduct) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }

    const { quantity } = req.body as AdjustStockBody;

    if (quantity === undefined) {
      res.status(400).json({ error: 'Quantity is required' });
      return;
    }

    const product = await prisma.product.update({
      where: { id },
      data: {
        quantity,
      },
      include: {
        category: true,
      },
    });

    res.json({ product });
  } catch (error) {
    console.error('Adjust stock error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/products/:id - Delete a product
router.delete('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId;
    const id = req.params.id as string;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    // First check if product exists and belongs to user
    const existingProduct = await prisma.product.findFirst({
      where: { id, userId },
    });

    if (!existingProduct) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }

    await prisma.product.delete({
      where: { id },
    });

    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

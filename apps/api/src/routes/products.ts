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

// ==================== Technical Sheet Endpoints ====================

// GET /api/products/:id/materials - Get product's materials (technical sheet)
router.get('/:id/materials', async (req: AuthenticatedRequest, res: Response) => {
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

    const productMaterials = await prisma.productMaterial.findMany({
      where: { productId: id },
      include: {
        material: true,
      },
      orderBy: { material: { name: 'asc' } },
    });

    res.json({ materials: productMaterials });
  } catch (error) {
    console.error('Get product materials error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

interface AddMaterialBody {
  materialId: string;
  quantity: number;
}

// POST /api/products/:id/materials - Add material to product
router.post('/:id/materials', async (req: AuthenticatedRequest, res: Response) => {
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

    const { materialId, quantity } = req.body as AddMaterialBody;

    if (!materialId || quantity === undefined) {
      res.status(400).json({ error: 'materialId and quantity are required' });
      return;
    }

    // Check if material exists and belongs to user
    const material = await prisma.material.findFirst({
      where: { id: materialId, userId },
    });

    if (!material) {
      res.status(400).json({ error: 'Material not found' });
      return;
    }

    // Check if material is already added to this product
    const existingProductMaterial = await prisma.productMaterial.findUnique({
      where: {
        productId_materialId: {
          productId: id,
          materialId,
        },
      },
    });

    if (existingProductMaterial) {
      res.status(400).json({ error: 'Material already added to this product' });
      return;
    }

    const productMaterial = await prisma.productMaterial.create({
      data: {
        productId: id,
        materialId,
        quantity,
      },
      include: {
        material: true,
      },
    });

    res.status(201).json({ productMaterial });
  } catch (error) {
    console.error('Add product material error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

interface UpdateMaterialQuantityBody {
  quantity: number;
}

// PUT /api/products/:id/materials/:materialId - Update material quantity
router.put('/:id/materials/:materialId', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId;
    const id = req.params.id as string;
    const materialId = req.params.materialId as string;

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

    // Check if material relationship exists
    const existingProductMaterial = await prisma.productMaterial.findUnique({
      where: {
        productId_materialId: {
          productId: id,
          materialId,
        },
      },
    });

    if (!existingProductMaterial) {
      res.status(404).json({ error: 'Material not found in this product' });
      return;
    }

    const { quantity } = req.body as UpdateMaterialQuantityBody;

    if (quantity === undefined) {
      res.status(400).json({ error: 'Quantity is required' });
      return;
    }

    const productMaterial = await prisma.productMaterial.update({
      where: {
        productId_materialId: {
          productId: id,
          materialId,
        },
      },
      data: {
        quantity,
      },
      include: {
        material: true,
      },
    });

    res.json({ productMaterial });
  } catch (error) {
    console.error('Update product material error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/products/:id/materials/:materialId - Remove material from product
router.delete('/:id/materials/:materialId', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId;
    const id = req.params.id as string;
    const materialId = req.params.materialId as string;

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

    // Check if material relationship exists
    const existingProductMaterial = await prisma.productMaterial.findUnique({
      where: {
        productId_materialId: {
          productId: id,
          materialId,
        },
      },
    });

    if (!existingProductMaterial) {
      res.status(404).json({ error: 'Material not found in this product' });
      return;
    }

    await prisma.productMaterial.delete({
      where: {
        productId_materialId: {
          productId: id,
          materialId,
        },
      },
    });

    res.json({ message: 'Material removed from product successfully' });
  } catch (error) {
    console.error('Remove product material error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/products/:id/cost - Calculate total cost based on materials + laborCost
router.get('/:id/cost', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId;
    const id = req.params.id as string;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    // Get product with materials
    const product = await prisma.product.findFirst({
      where: { id, userId },
      include: {
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

    // Calculate material cost
    let materialCost = 0;
    const materialBreakdown = product.materials.map((pm) => {
      const cost = pm.quantity * pm.material.unitPrice;
      materialCost += cost;
      return {
        materialId: pm.materialId,
        materialName: pm.material.name,
        quantity: pm.quantity,
        unit: pm.material.unit,
        unitPrice: pm.material.unitPrice,
        cost,
      };
    });

    const totalCost = materialCost + product.laborCost;

    res.json({
      productId: product.id,
      productName: product.name,
      materialCost,
      laborCost: product.laborCost,
      totalCost,
      materialBreakdown,
    });
  } catch (error) {
    console.error('Calculate product cost error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ==================== Manufacture Endpoint ====================

interface ManufactureBody {
  quantity: number;
}

interface InsufficientMaterial {
  materialId: string;
  materialName: string;
  required: number;
  available: number;
  shortage: number;
  unit: string;
}

interface LowStockWarning {
  materialId: string;
  materialName: string;
  currentStock: number;
  minStock: number;
  unit: string;
}

// POST /api/products/:id/manufacture - Manufacture products and consume materials
router.post('/:id/manufacture', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId;
    const id = req.params.id as string;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { quantity } = req.body as ManufactureBody;

    // Validate quantity
    if (quantity === undefined || quantity <= 0) {
      res.status(400).json({ error: 'Quantity must be a positive number' });
      return;
    }

    // Get product with materials
    const product = await prisma.product.findFirst({
      where: { id, userId },
      include: {
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

    // Check if product has any materials defined
    if (product.materials.length === 0) {
      res.status(400).json({ error: 'Product has no materials defined in technical sheet' });
      return;
    }

    // Check for insufficient materials
    const insufficientMaterials: InsufficientMaterial[] = [];
    const materialsToConsume: { materialId: string; requiredQuantity: number; material: typeof product.materials[0]['material'] }[] = [];

    for (const pm of product.materials) {
      const requiredQuantity = pm.quantity * quantity;

      if (pm.material.quantity < requiredQuantity) {
        insufficientMaterials.push({
          materialId: pm.materialId,
          materialName: pm.material.name,
          required: requiredQuantity,
          available: pm.material.quantity,
          shortage: requiredQuantity - pm.material.quantity,
          unit: pm.material.unit,
        });
      }

      materialsToConsume.push({
        materialId: pm.materialId,
        requiredQuantity,
        material: pm.material,
      });
    }

    // Return error if any materials are insufficient
    if (insufficientMaterials.length > 0) {
      res.status(400).json({
        error: 'Insufficient materials',
        insufficientMaterials,
      });
      return;
    }

    // Check for low stock warnings (after deduction)
    const lowStockWarnings: LowStockWarning[] = [];
    for (const item of materialsToConsume) {
      const newQuantity = item.material.quantity - item.requiredQuantity;
      if (newQuantity < item.material.minStock) {
        lowStockWarnings.push({
          materialId: item.materialId,
          materialName: item.material.name,
          currentStock: newQuantity,
          minStock: item.material.minStock,
          unit: item.material.unit,
        });
      }
    }

    // Perform the manufacture operation in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Deduct materials from stock
      for (const item of materialsToConsume) {
        await tx.material.update({
          where: { id: item.materialId },
          data: {
            quantity: {
              decrement: item.requiredQuantity,
            },
          },
        });
      }

      // Increment product quantity
      const updatedProduct = await tx.product.update({
        where: { id },
        data: {
          quantity: {
            increment: quantity,
          },
        },
        include: {
          category: true,
        },
      });

      return updatedProduct;
    });

    // Build response
    const response: {
      message: string;
      product: typeof result;
      manufactured: number;
      warnings?: LowStockWarning[];
    } = {
      message: `Successfully manufactured ${quantity} unit(s) of ${product.name}`,
      product: result,
      manufactured: quantity,
    };

    if (lowStockWarnings.length > 0) {
      response.warnings = lowStockWarnings;
    }

    res.json(response);
  } catch (error) {
    console.error('Manufacture product error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

import { Router, Response } from 'express';
import prisma from '../lib/prisma';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// GET /api/dashboard/metrics - Get dashboard metrics
router.get('/metrics', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    // Get all counts in parallel
    const [
      totalClients,
      totalProducts,
      totalMaterials,
      pendingQuotes,
      approvedQuotes,
    ] = await Promise.all([
      prisma.client.count({ where: { userId } }),
      prisma.product.count({ where: { userId } }),
      prisma.material.count({ where: { userId } }),
      prisma.quote.count({ where: { userId, status: 'DRAFT' } }),
      prisma.quote.count({ where: { userId, status: 'APPROVED' } }),
    ]);

    res.json({
      metrics: {
        totalClients,
        totalProducts,
        totalMaterials,
        pendingQuotes,
        approvedQuotes,
      },
    });
  } catch (error) {
    console.error('Get dashboard metrics error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/dashboard/recent-quotes - Get recent quotes (last 5)
router.get('/recent-quotes', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const recentQuotes = await prisma.quote.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        client: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    res.json({
      quotes: recentQuotes,
    });
  } catch (error) {
    console.error('Get recent quotes error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/dashboard/low-stock - Get low stock products and materials
router.get('/low-stock', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    // Get all products and materials, then filter in code
    // Prisma doesn't support comparing fields directly in where clause
    const [allProducts, allMaterials] = await Promise.all([
      prisma.product.findMany({
        where: { userId },
        select: { id: true, name: true, quantity: true, minStock: true },
        orderBy: { name: 'asc' },
      }),
      prisma.material.findMany({
        where: { userId },
        select: { id: true, name: true, quantity: true, minStock: true, unit: true },
        orderBy: { name: 'asc' },
      }),
    ]);

    const lowStockProducts = allProducts.filter((p) => p.quantity < p.minStock);
    const lowStockMaterials = allMaterials.filter((m) => m.quantity < m.minStock);

    res.json({
      products: lowStockProducts,
      materials: lowStockMaterials,
      hasLowStock: lowStockProducts.length > 0 || lowStockMaterials.length > 0,
    });
  } catch (error) {
    console.error('Get low stock error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

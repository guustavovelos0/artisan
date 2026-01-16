import { Router, Response } from 'express';
import prisma from '../lib/prisma';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';
import { QuoteStatus } from '@prisma/client';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// GET /api/quotes - Get all user's quotes with pagination
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

    // Optional status filter
    const statusFilter = req.query.status as QuoteStatus | undefined;

    // Build where clause
    const where: { userId: string; status?: QuoteStatus } = { userId };
    if (statusFilter && Object.values(QuoteStatus).includes(statusFilter)) {
      where.status = statusFilter;
    }

    // Get total count for pagination
    const total = await prisma.quote.count({ where });

    const quotes = await prisma.quote.findMany({
      where,
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        _count: {
          select: { items: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    });

    res.json({
      quotes,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get quotes error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/quotes/:id - Get a single quote with items
router.get('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId;
    const id = req.params.id as string;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const quote = await prisma.quote.findFirst({
      where: { id, userId },
      include: {
        client: true,
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                price: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!quote) {
      res.status(404).json({ error: 'Quote not found' });
      return;
    }

    res.json({ quote });
  } catch (error) {
    console.error('Get quote error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

interface QuoteItemInput {
  description: string;
  quantity: number;
  unitPrice: number;
  productId?: string;
}

interface CreateQuoteBody {
  clientId: string;
  title?: string;
  description?: string;
  validUntil?: string;
  notes?: string;
  laborCost?: number;
  discount?: number;
  manualTotal?: number;
  items: QuoteItemInput[];
}

// Helper function to calculate quote totals
function calculateTotals(items: QuoteItemInput[], laborCost: number, discount: number, manualTotal?: number | null) {
  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const total = manualTotal ?? subtotal + laborCost - discount;
  return { subtotal, total };
}

// Helper function to get next quote number for user
async function getNextQuoteNumber(userId: string): Promise<number> {
  const lastQuote = await prisma.quote.findFirst({
    where: { userId },
    orderBy: { number: 'desc' },
    select: { number: true },
  });
  return (lastQuote?.number ?? 0) + 1;
}

// POST /api/quotes - Create a new quote with items
router.post('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { clientId, title, description, validUntil, notes, laborCost, discount, manualTotal, items } = req.body as CreateQuoteBody;

    // Validate required fields
    if (!clientId) {
      res.status(400).json({ error: 'Client is required' });
      return;
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      res.status(400).json({ error: 'At least one item is required' });
      return;
    }

    // Validate client belongs to user
    const client = await prisma.client.findFirst({
      where: { id: clientId, userId },
    });

    if (!client) {
      res.status(400).json({ error: 'Client not found' });
      return;
    }

    // Validate items
    for (const item of items) {
      if (!item.description || item.quantity === undefined || item.unitPrice === undefined) {
        res.status(400).json({ error: 'Each item must have description, quantity, and unitPrice' });
        return;
      }
      if (item.quantity <= 0) {
        res.status(400).json({ error: 'Item quantity must be positive' });
        return;
      }
    }

    // Validate productIds if provided
    const productIds = items.filter((item) => item.productId).map((item) => item.productId as string);
    if (productIds.length > 0) {
      const products = await prisma.product.findMany({
        where: { id: { in: productIds }, userId },
        select: { id: true },
      });
      const validProductIds = new Set(products.map((p) => p.id));
      for (const productId of productIds) {
        if (!validProductIds.has(productId)) {
          res.status(400).json({ error: `Product ${productId} not found` });
          return;
        }
      }
    }

    // Get next quote number
    const number = await getNextQuoteNumber(userId);

    // Calculate totals
    const laborCostValue = laborCost ?? 0;
    const discountValue = discount ?? 0;
    const { subtotal, total } = calculateTotals(items, laborCostValue, discountValue, manualTotal);

    // Create quote with items in a transaction
    const quote = await prisma.quote.create({
      data: {
        number,
        title,
        description,
        validUntil: validUntil ? new Date(validUntil) : null,
        notes,
        subtotal,
        laborCost: laborCostValue,
        discount: discountValue,
        total,
        manualTotal: manualTotal ?? null,
        userId,
        clientId,
        items: {
          create: items.map((item) => ({
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            total: item.quantity * item.unitPrice,
            productId: item.productId || null,
          })),
        },
      },
      include: {
        client: true,
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                price: true,
              },
            },
          },
        },
      },
    });

    res.status(201).json({ quote });
  } catch (error) {
    console.error('Create quote error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

interface UpdateQuoteBody {
  clientId?: string;
  title?: string;
  description?: string;
  validUntil?: string | null;
  notes?: string;
  laborCost?: number;
  discount?: number;
  manualTotal?: number | null;
  items?: QuoteItemInput[];
}

// PUT /api/quotes/:id - Update a quote
router.put('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId;
    const id = req.params.id as string;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    // First check if quote exists and belongs to user
    const existingQuote = await prisma.quote.findFirst({
      where: { id, userId },
      include: { items: true },
    });

    if (!existingQuote) {
      res.status(404).json({ error: 'Quote not found' });
      return;
    }

    const { clientId, title, description, validUntil, notes, laborCost, discount, manualTotal, items } = req.body as UpdateQuoteBody;

    // Validate client if provided
    if (clientId !== undefined) {
      const client = await prisma.client.findFirst({
        where: { id: clientId, userId },
      });
      if (!client) {
        res.status(400).json({ error: 'Client not found' });
        return;
      }
    }

    // Validate items if provided
    if (items !== undefined) {
      if (!Array.isArray(items) || items.length === 0) {
        res.status(400).json({ error: 'At least one item is required' });
        return;
      }

      for (const item of items) {
        if (!item.description || item.quantity === undefined || item.unitPrice === undefined) {
          res.status(400).json({ error: 'Each item must have description, quantity, and unitPrice' });
          return;
        }
        if (item.quantity <= 0) {
          res.status(400).json({ error: 'Item quantity must be positive' });
          return;
        }
      }

      // Validate productIds if provided
      const productIds = items.filter((item) => item.productId).map((item) => item.productId as string);
      if (productIds.length > 0) {
        const products = await prisma.product.findMany({
          where: { id: { in: productIds }, userId },
          select: { id: true },
        });
        const validProductIds = new Set(products.map((p) => p.id));
        for (const productId of productIds) {
          if (!validProductIds.has(productId)) {
            res.status(400).json({ error: `Product ${productId} not found` });
            return;
          }
        }
      }
    }

    // Prepare update data
    const laborCostValue = laborCost ?? existingQuote.laborCost;
    const discountValue = discount ?? existingQuote.discount;
    const itemsForCalc = items ?? existingQuote.items.map((i) => ({
      description: i.description,
      quantity: i.quantity,
      unitPrice: i.unitPrice,
    }));
    const manualTotalValue = manualTotal !== undefined ? manualTotal : existingQuote.manualTotal;
    const { subtotal, total } = calculateTotals(itemsForCalc, laborCostValue, discountValue, manualTotalValue);

    // Update quote in a transaction
    const quote = await prisma.$transaction(async (tx) => {
      // Delete existing items if new items are provided
      if (items !== undefined) {
        await tx.quoteItem.deleteMany({
          where: { quoteId: id },
        });
      }

      // Update quote and create new items
      return tx.quote.update({
        where: { id },
        data: {
          ...(clientId !== undefined && { clientId }),
          ...(title !== undefined && { title }),
          ...(description !== undefined && { description }),
          ...(validUntil !== undefined && { validUntil: validUntil ? new Date(validUntil) : null }),
          ...(notes !== undefined && { notes }),
          ...(laborCost !== undefined && { laborCost: laborCostValue }),
          ...(discount !== undefined && { discount: discountValue }),
          ...(manualTotal !== undefined && { manualTotal: manualTotalValue }),
          subtotal,
          total,
          ...(items !== undefined && {
            items: {
              create: items.map((item) => ({
                description: item.description,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                total: item.quantity * item.unitPrice,
                productId: item.productId || null,
              })),
            },
          }),
        },
        include: {
          client: true,
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  price: true,
                },
              },
            },
          },
        },
      });
    });

    res.json({ quote });
  } catch (error) {
    console.error('Update quote error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

interface UpdateStatusBody {
  status: QuoteStatus;
}

// PUT /api/quotes/:id/status - Update quote status
router.put('/:id/status', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId;
    const id = req.params.id as string;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    // First check if quote exists and belongs to user
    const existingQuote = await prisma.quote.findFirst({
      where: { id, userId },
    });

    if (!existingQuote) {
      res.status(404).json({ error: 'Quote not found' });
      return;
    }

    const { status } = req.body as UpdateStatusBody;

    // Validate status
    if (!status || !Object.values(QuoteStatus).includes(status)) {
      res.status(400).json({
        error: 'Invalid status. Must be one of: DRAFT, SENT, APPROVED, REJECTED, COMPLETED',
      });
      return;
    }

    const quote = await prisma.quote.update({
      where: { id },
      data: { status },
      include: {
        client: true,
        items: true,
      },
    });

    res.json({ quote });
  } catch (error) {
    console.error('Update quote status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/quotes/:id - Delete a quote
router.delete('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId;
    const id = req.params.id as string;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    // First check if quote exists and belongs to user
    const existingQuote = await prisma.quote.findFirst({
      where: { id, userId },
    });

    if (!existingQuote) {
      res.status(404).json({ error: 'Quote not found' });
      return;
    }

    // Delete quote (items cascade delete automatically)
    await prisma.quote.delete({
      where: { id },
    });

    res.json({ message: 'Quote deleted successfully' });
  } catch (error) {
    console.error('Delete quote error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

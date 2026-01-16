import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth';
import categoriesRoutes from './routes/categories';
import clientsRoutes from './routes/clients';
import materialsRoutes from './routes/materials';
import productsRoutes from './routes/products';
import quotesRoutes from './routes/quotes';
import dashboardRoutes from './routes/dashboard';

const app = express();
const PORT = 3001;

// Middleware
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175',
    'http://localhost:5176',
    'http://localhost:5177',
  ],
  credentials: true,
}));
app.use(express.json());

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/clients', clientsRoutes);
app.use('/api/materials', materialsRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/quotes', quotesRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Start server
app.listen(PORT, () => {
  console.log(`Artisan API Server running on http://localhost:${PORT}`);
});

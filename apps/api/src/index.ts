import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth';
import categoriesRoutes from './routes/categories';
import clientsRoutes from './routes/clients';
import materialsRoutes from './routes/materials';
import productsRoutes from './routes/products';

const app = express();
const PORT = 3001;

// Middleware
app.use(cors({
  origin: 'http://localhost:5173',
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

// Start server
app.listen(PORT, () => {
  console.log(`Artisan API Server running on http://localhost:${PORT}`);
});

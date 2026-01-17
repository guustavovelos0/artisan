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
const PORT = parseInt(process.env.PORT || '3001', 10);

// Middleware
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://localhost:5176',
  'http://localhost:5177',
  'http://localhost:5178',
  'http://localhost:5179',
];

// Add production frontend URL if configured
if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL);
}

app.use(cors({
  origin: allowedOrigins,
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
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Artisan API Server running on port ${PORT}`);
});

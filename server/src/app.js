import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dataRoutes from './routes/dataRoutes.js';

const app = express();

// Middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable CSP for easier dev if needed, or configure properly
}));
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// Routes
app.use('/api', dataRoutes);

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

export default app;

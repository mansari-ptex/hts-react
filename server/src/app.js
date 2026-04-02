import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dataRoutes from './routes/dataRoutes.js';
import { dataController } from './controllers/dataController.js';

const app = express();

// Middleware
app.use(helmet({
  contentSecurityPolicy: false, 
}));
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// Initialize Data
dataController.init();

// Routes
app.use('/api', dataRoutes);

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

export default app;

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// API Routes
app.get('/api/status', (req, res) => {
  res.json({ message: 'HTS Backend is running', timestamp: new Date() });
});

app.get('/api/data/:filename', async (req, res) => {
  try {
    const filename = req.params.filename;
    // Basic validation to prevent path traversal
    if (!filename.endsWith('.json') || filename.includes('..')) {
      return res.status(400).json({ error: 'Invalid filename' });
    }
    
    const filePath = join(__dirname, 'data', filename);
    const data = await fs.readFile(filePath, 'utf8');
    res.json(JSON.parse(data));
  } catch (error) {
    console.error(`Error reading ${req.params.filename}:`, error);
    res.status(404).json({ error: 'File not found' });
  }
});

// Serve frontend in production (optional, usually handled by Vite/separate deploy)
// if (process.env.NODE_ENV === 'production') {
//   app.use(express.static(join(__dirname, '../client/dist')));
// }

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

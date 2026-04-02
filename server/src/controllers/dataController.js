import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CLEAN_DATA_PATH = path.join(__dirname, '../../data/clean_hts.json');

// --- In-Memory Data Store ---
let htsRecords = [];

// Load cleaned data once at startup
const loadCleanData = () => {
    try {
        if (fs.existsSync(CLEAN_DATA_PATH)) {
            const data = fs.readFileSync(CLEAN_DATA_PATH, 'utf8');
            htsRecords = JSON.parse(data);
            console.log(`[Backend] API initialized: ${htsRecords.length} HTS records loaded into memory.`);
        } else {
            console.warn(`[Backend] WARN: Clean data file not found at ${CLEAN_DATA_PATH}. Please run "npm run generate:data" first.`);
        }
    } catch (error) {
        console.error('[Backend] CRITICAL: Failed to load HTS records:', error);
    }
};

loadCleanData();

export const dataController = {
  getStatus: (req, res) => {
    res.json({ 
        message: 'HTS Backend is healthy', 
        recordsLoaded: htsRecords.length,
        timestamp: new Date() 
    });
  },

  /**
   * GET /api/search?q=...
   * Filter by code (exact or partial) or description
   */
  searchHTS: (req, res) => {
    try {
      const { q } = req.query;
      
      if (!q) {
        return res.json([]);
      }

      const query = q.toLowerCase();
      
      const filtered = htsRecords.filter(item => 
        item.code.toLowerCase().includes(query) || 
        item.description.toLowerCase().includes(query)
      );

      res.json(filtered.slice(0, 100)); // Limit to first 100 for safety
    } catch (error) {
      console.error(`Search Error:`, error);
      res.status(500).json({ error: 'Search failed' });
    }
  },

  /**
   * GET /api/code/:code
   * Find exact match
   */
  getByCode: (req, res) => {
    try {
      const { code } = req.params;
      const record = htsRecords.find(r => r.code === code);

      if (!record) {
        return res.status(404).json({ error: 'HTS Code not found' });
      }

      res.json(record);
    } catch (error) {
      console.error(`Lookup Error:`, error);
      res.status(500).json({ error: 'Lookup failed' });
    }
  }
};

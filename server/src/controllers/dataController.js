import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { sanitizeHTS, buildChapter99Map } from '../services/htsProcessor.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RAW_DIR = path.join(__dirname, '../../data/raw');
const CH99_DIR = path.join(RAW_DIR, 'schedule99');
const HTS_DIR = path.join(RAW_DIR, 'schedule6162');
const CLEAN_DATA_PATH = path.join(__dirname, '../../data/clean_hts.json');

// --- In-Memory Data Store ---
let htsRecords = [];

/**
 * AUTOMATIC DATA SYNC
 * This function runs on startup. It reads structured folders in /data/raw,
 * processes them through our smart engine, and updates the clean dataset.
 */
const loadAndSyncData = () => {
    try {
        console.log('[Backend] Starting data synchronization...');

        // Create directories if they don't exist
        [RAW_DIR, CH99_DIR, HTS_DIR].forEach(dir => {
          if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        });

        // 1. Build Chapter 99 Map (LATEST ONLY)
        const ch99Files = fs.readdirSync(CH99_DIR)
          .filter(f => f.endsWith('.json'))
          .sort((a, b) => b.localeCompare(a)); // Sort Z to A (latest timestamp first)

        let ch99Map = {};
        if (ch99Files.length > 0) {
          const latestFile = ch99Files[0];
          console.log(`[Backend] Using latest Schedule 99 update: ${latestFile}`);
          const ch99Raw = JSON.parse(fs.readFileSync(path.join(CH99_DIR, latestFile), 'utf8'));
          ch99Map = buildChapter99Map(ch99Raw);
        } else {
          console.warn('[Backend] No Schedule 99 files found. Please check USITC connection.');
        }
        console.log(`[Backend] Chapter 99 Map ready with ${Object.keys(ch99Map).length} entries.`);

        // 2. Gather main HTS data (Chapters 61 & 62)
        const htsFiles = fs.readdirSync(HTS_DIR).filter(f => f.endsWith('.json'));
        let htsRaw = [];
        htsFiles.forEach(file => {
          const data = JSON.parse(fs.readFileSync(path.join(HTS_DIR, file), 'utf8'));
          if (Array.isArray(data)) htsRaw = htsRaw.concat(data);
        });

        if (htsRaw.length > 0) {
            // 3. Process through engine
            console.log(`[Backend] Processing ${htsRaw.length} HTS records...`);
            htsRecords = sanitizeHTS(htsRaw, ch99Map);
            
            // 4. Save clean snapshot
            fs.writeFileSync(CLEAN_DATA_PATH, JSON.stringify(htsRecords, null, 2));
            console.log(`[Backend] Sync Complete: ${htsRecords.length} clean records ready.`);
        } else if (fs.existsSync(CLEAN_DATA_PATH)) {
            // Fallback to existing clean data if raw folder is empty
            const data = fs.readFileSync(CLEAN_DATA_PATH, 'utf8');
            htsRecords = JSON.parse(data);
            console.log(`[Backend] No raw data found. Loaded existing cache: ${htsRecords.length} records.`);
        } else {
            console.warn('[Backend] No data found (Raw or Clean). Please add JSON files to /server/data/raw/');
        }
    } catch (error) {
        console.error('[Backend] CRITICAL: Synchronization failed:', error);
    }
};

loadAndSyncData();

export const dataController = {
  getStatus: (req, res) => {
    res.json({ 
        message: 'HTS Backend is healthy', 
        recordsLoaded: htsRecords.length,
        timestamp: new Date() 
    });
  },

  /**
   * GET /api/search?q=...&gender=...&material=...&fabric=...
   * Filter by code, description, and specific categories
   */
  searchHTS: (req, res) => {
    try {
      const { gender, material, fabric, feature } = req.query;
      
      // Determine active categorical filters
      const activeFilters = [];
      if (gender && gender !== 'All') activeFilters.push({ field: 'gender', value: gender });
      if (material && material !== 'All') activeFilters.push({ field: 'material', value: material });
      if (fabric && fabric !== 'All') activeFilters.push({ field: 'fabric', value: fabric });
      if (feature && feature !== 'All') activeFilters.push({ field: 'feature', value: feature });

      const allTenDigits = htsRecords.filter(item => item.code.replace(/\./g, "").length === 10);

      const primary = [];
      const related = [];

      allTenDigits.forEach(item => {
        let matchCount = 0;
        activeFilters.forEach(f => {
          if (item[f.field] === f.value) matchCount++;
        });

        if (activeFilters.length > 0) {
          if (matchCount === activeFilters.length) {
            primary.push(item);
          } else if (matchCount > 0) {
            // Partial match goes to related
            related.push(item);
          }
        } else {
          // If no filters, everything is primary (default list)
          primary.push(item);
        }
      });

      // Strict Sorting: Lowest Indents (highest .level values) first
      const sortBySearchRelevance = (a, b) => {
          // Level/Hierarchy depth is the highest priority
          const levelDiff = (b.level || 0) - (a.level || 0);
          if (levelDiff !== 0) return levelDiff;
          
          // Secondary: Alfabetical for stability
          return a.code.localeCompare(b.code);
      };

      res.json({
        primary: primary.sort(sortBySearchRelevance).slice(0, 500),
        related: related.sort(sortBySearchRelevance).slice(0, 100)
      });
    } catch (error) {
      console.error(`Search Error:`, error);
      res.status(500).json({ error: 'Search failed' });
    }
  },

  /**
   * GET /api/metadata
   * Returns list of unique values for filters
   */
  getMetadata: (req, res) => {
    try {
      const getUnique = (field) => {
        const values = htsRecords
          .map(item => item[field])
          .filter(val => val && val !== '');
        return [...new Set(values)].sort();
      };

      res.json({
        genders: getUnique('gender'),
        materials: getUnique('material'),
        fabrics: getUnique('fabric'),
        features: getUnique('feature')
      });
    } catch (error) {
      console.error('Metadata Error:', error);
      res.status(500).json({ error: 'Failed to fetch metadata' });
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
  },

  /**
   * GET /api/hierarchy/:code
   * Returns ancestors and siblings for each level to build a tree view
   */
  getHierarchy: (req, res) => {
    try {
      const { code } = req.params;
      const target = htsRecords.find(r => r.code === code);
      if (!target) return res.status(404).json({ error: 'Code not found' });

      const hierarchy = [];
      
      // We'll traverse using the 'parent' field
      let currentCode = code;
      while (currentCode) {
        const currentRecord = htsRecords.find(r => r.code === currentCode);
        if (!currentRecord) break;

        const siblings = htsRecords.filter(r => r.parent === currentRecord.parent);

        hierarchy.unshift({
          level: currentRecord.level,
          selectedCode: currentRecord.code,
          siblings: siblings.map(s => ({ 
              code: s.code, 
              description: s.description,
              isDirectAncestor: code.startsWith(s.code) || s.code === code
          }))
        });

        currentCode = currentRecord.parent;
      }

      res.json({
        target,
        tree: hierarchy
      });
    } catch (error) {
      console.error('Hierarchy Error:', error);
      res.status(500).json({ error: 'Failed to fetch hierarchy' });
    }
  }
};

